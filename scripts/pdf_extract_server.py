#!/usr/bin/env python3
"""
Local PDF-Extract-Kit HTTP Server
Simple Flask server to run PDF-Extract-Kit locally without Docker
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import base64
import tempfile
import traceback
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for lazy loading
models_loaded = False
layout_detector = None
table_extractor = None
ocr_engine = None

def load_models():
    """Load PDF-Extract-Kit models"""
    global models_loaded, layout_detector, table_extractor, ocr_engine
    
    if models_loaded:
        return True
    
    try:
        logger.info("Loading PDF-Extract-Kit models...")
        
        # Import after ensuring environment is set up
        try:
            from doclayout_yolo import YOLOv10
            layout_detector = YOLOv10("path/to/doclayout_yolo.pt")
            logger.info("✅ Layout detector loaded")
        except ImportError as e:
            logger.warning(f"Layout detector not available: {e}")
        
        try:
            import paddleocr
            ocr_engine = paddleocr.PaddleOCR(use_angle_cls=True, lang='en')
            logger.info("✅ OCR engine loaded")
        except ImportError as e:
            logger.warning(f"OCR engine not available: {e}")
        
        # Note: Table and formula extractors would be loaded here
        # For now, we'll use simplified extraction
        
        models_loaded = True
        logger.info("✅ All available models loaded")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        return False

def extract_with_basic_tools(pdf_path):
    """
    Extract PDF content using basic tools as fallback
    This works even without full PDF-Extract-Kit installation
    """
    result = {
        'text': '',
        'layout': {'pages': []},
        'tables': [],
        'images': [],
        'formulas': [],
        'metadata': {}
    }
    
    try:
        # Use PyMuPDF for basic extraction (more reliable)
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Extract text
            text = page.get_text()
            result['text'] += text + '\n'
            
            # Extract basic layout
            blocks = page.get_text("dict")
            elements = []
            
            for block in blocks['blocks']:
                if 'lines' in block:  # Text block
                    for line in block['lines']:
                        bbox = block['bbox']
                        line_text = ' '.join([span['text'] for span in line['spans']])
                        
                        if line_text.strip():
                            elements.append({
                                'type': 'text',
                                'bbox': list(bbox),
                                'content': line_text.strip(),
                                'confidence': 0.9
                            })
            
            # Extract images
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                
                if pix.n - pix.alpha < 4:  # Not CMYK
                    img_data = pix.tobytes("png")
                    img_base64 = base64.b64encode(img_data).decode('utf-8')
                    
                    result['images'].append({
                        'id': f'img_{page_num}_{img_index}',
                        'pageNumber': page_num + 1,
                        'bbox': [0, 0, pix.width, pix.height],
                        'base64': img_base64,
                        'type': 'photo',
                        'confidence': 0.8,
                        'width': pix.width,
                        'height': pix.height
                    })
                    
                    elements.append({
                        'type': 'image',
                        'bbox': [0, 0, pix.width, pix.height],
                        'content': 'Image',
                        'confidence': 0.8
                    })
                
                pix = None
            
            # Extract tables (basic detection)
            tables = page.find_tables()
            for table_index, table in enumerate(tables):
                try:
                    table_data = table.extract()
                    headers = table_data[0] if table_data else []
                    data = table_data[1:] if len(table_data) > 1 else []
                    
                    result['tables'].append({
                        'id': f'table_{page_num}_{table_index}',
                        'pageNumber': page_num + 1,
                        'bbox': list(table.bbox),
                        'html': table.to_pandas().to_html() if hasattr(table, 'to_pandas') else '',
                        'markdown': '',
                        'data': data,
                        'headers': headers,
                        'confidence': 0.8,
                        'rows': len(data),
                        'columns': len(headers)
                    })
                    
                    elements.append({
                        'type': 'table',
                        'bbox': list(table.bbox),
                        'content': f'Table with {len(data)} rows',
                        'confidence': 0.8
                    })
                except Exception as e:
                    logger.warning(f"Failed to extract table: {e}")
            
            # Add page layout
            result['layout']['pages'].append({
                'pageNumber': page_num + 1,
                'width': page.rect.width,
                'height': page.rect.height,
                'elements': elements
            })
        
        doc.close()
        
        # Add metadata
        result['metadata'] = {
            'totalPages': len(result['layout']['pages']),
            'totalTables': len(result['tables']),
            'totalImages': len(result['images']),
            'totalFormulas': len(result['formulas']),
            'textLength': len(result['text']),
            'extractionMethod': 'PyMuPDF-basic'
        }
        
    except Exception as e:
        logger.error(f"Basic extraction failed: {e}")
        # Return minimal result
        result = {
            'text': 'Extraction failed',
            'layout': {'pages': []},
            'tables': [],
            'images': [],
            'formulas': [],
            'metadata': {'error': str(e)}
        }
    
    return result

def extract_with_pdf_extract_kit(pdf_path):
    """
    Extract using full PDF-Extract-Kit models (when available)
    """
    # This would use the full PDF-Extract-Kit pipeline
    # For now, fall back to basic extraction
    logger.info("Using PDF-Extract-Kit models...")
    
    # TODO: Implement full pipeline when models are loaded
    # For now, use basic extraction
    return extract_with_basic_tools(pdf_path)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'pdf-extract-kit-local',
        'models_loaded': models_loaded,
        'version': '1.0.0'
    })

@app.route('/extract', methods=['POST'])
def extract_document():
    """Extract content from PDF document"""
    try:
        # Check for uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        pdf_file = request.files['file']
        if pdf_file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Get extraction options
        extract_text = request.form.get('extract_text', 'true').lower() == 'true'
        extract_tables = request.form.get('extract_tables', 'true').lower() == 'true'
        extract_images = request.form.get('extract_images', 'true').lower() == 'true'
        extract_formulas = request.form.get('extract_formulas', 'false').lower() == 'true'
        
        logger.info(f"Processing PDF: {pdf_file.filename}")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            pdf_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Choose extraction method
            if models_loaded:
                result = extract_with_pdf_extract_kit(temp_path)
            else:
                result = extract_with_basic_tools(temp_path)
            
            logger.info(f"Extraction completed: {result['metadata']}")
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
    
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/models/load', methods=['POST'])
def load_models_endpoint():
    """Load models endpoint"""
    success = load_models()
    return jsonify({
        'success': success,
        'models_loaded': models_loaded
    })

@app.route('/models/status', methods=['GET'])
def models_status():
    """Get model loading status"""
    return jsonify({
        'models_loaded': models_loaded,
        'available_models': {
            'layout_detector': layout_detector is not None,
            'table_extractor': table_extractor is not None,
            'ocr_engine': ocr_engine is not None
        }
    })

if __name__ == '__main__':
    # Check for required dependencies
    try:
        import fitz  # PyMuPDF
        logger.info("✅ PyMuPDF available - basic extraction supported")
    except ImportError:
        logger.error("❌ PyMuPDF not available - install with: pip install PyMuPDF")
        sys.exit(1)
    
    # Try to load models on startup (optional)
    logger.info("Starting PDF Extract Server...")
    logger.info("Models will be loaded on first request")
    
    # Start server
    port = int(os.environ.get('PORT', 8001))
    host = os.environ.get('HOST', '127.0.0.1')
    
    logger.info(f"🚀 Server starting on http://{host}:{port}")
    logger.info("📋 Endpoints:")
    logger.info("   GET  /health - Health check")
    logger.info("   POST /extract - Extract PDF content")
    logger.info("   POST /models/load - Load extraction models")
    logger.info("   GET  /models/status - Check model status")
    
    app.run(host=host, port=port, debug=False)