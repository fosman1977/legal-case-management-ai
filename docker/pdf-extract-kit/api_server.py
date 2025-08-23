"""
PDF-Extract-Kit API Server
Provides REST API for PDF extraction services
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import base64
import traceback
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add PDF-Extract-Kit to path
sys.path.append('/app')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for models (lazy loading)
layout_model = None
table_model = None
formula_model = None
ocr_model = None

def initialize_models():
    """Initialize all extraction models"""
    global layout_model, table_model, formula_model, ocr_model
    
    try:
        logger.info("Initializing PDF-Extract-Kit models...")
        
        # Import required modules
        from pdf_extract_kit import (
            DocLayoutYOLO,
            TableExtractor,
            FormulaExtractor,
            OCRExtractor
        )
        
        # Initialize models
        layout_model = DocLayoutYOLO()
        table_model = TableExtractor()
        formula_model = FormulaExtractor()
        ocr_model = OCRExtractor()
        
        logger.info("All models initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize models: {str(e)}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'pdf-extract-kit',
        'models_loaded': all([layout_model, table_model, formula_model, ocr_model])
    })

@app.route('/extract', methods=['POST'])
def extract_document():
    """
    Extract content from PDF document
    
    Request:
        - file: PDF file (multipart/form-data)
        - extract_text: boolean (default: true)
        - extract_tables: boolean (default: true)
        - extract_images: boolean (default: true)
        - extract_formulas: boolean (default: true)
        - output_format: 'json' | 'html' | 'markdown' (default: 'json')
    
    Response:
        Extracted document content in requested format
    """
    try:
        # Get uploaded file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        pdf_file = request.files['file']
        if pdf_file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        # Get extraction options
        extract_text = request.form.get('extract_text', 'true').lower() == 'true'
        extract_tables = request.form.get('extract_tables', 'true').lower() == 'true'
        extract_images = request.form.get('extract_images', 'true').lower() == 'true'
        extract_formulas = request.form.get('extract_formulas', 'true').lower() == 'true'
        output_format = request.form.get('output_format', 'json')
        
        # Save uploaded file temporarily
        temp_path = f'/tmp/{pdf_file.filename}'
        pdf_file.save(temp_path)
        
        # Initialize models if not already done
        if not all([layout_model, table_model, formula_model, ocr_model]):
            if not initialize_models():
                return jsonify({'error': 'Failed to initialize models'}), 500
        
        # Process PDF
        result = process_pdf(
            temp_path,
            extract_text=extract_text,
            extract_tables=extract_tables,
            extract_images=extract_images,
            extract_formulas=extract_formulas
        )
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Format output
        if output_format == 'html':
            return format_as_html(result)
        elif output_format == 'markdown':
            return format_as_markdown(result)
        else:
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

def process_pdf(
    pdf_path: str,
    extract_text: bool = True,
    extract_tables: bool = True,
    extract_images: bool = True,
    extract_formulas: bool = True
) -> Dict[str, Any]:
    """
    Process PDF and extract requested content
    """
    result = {
        'text': '',
        'layout': {
            'pages': []
        },
        'tables': [],
        'images': [],
        'formulas': [],
        'metadata': {}
    }
    
    try:
        # Step 1: Layout detection
        logger.info("Detecting document layout...")
        layout_results = layout_model.detect(pdf_path)
        
        # Process each page
        for page_num, page_layout in enumerate(layout_results['pages'], 1):
            page_data = {
                'pageNumber': page_num,
                'width': page_layout['width'],
                'height': page_layout['height'],
                'elements': []
            }
            
            # Process layout elements
            for element in page_layout['elements']:
                elem_data = {
                    'type': element['type'],
                    'bbox': element['bbox'],
                    'confidence': element.get('confidence', 1.0)
                }
                
                # Extract text content
                if extract_text and element['type'] in ['text', 'title', 'header']:
                    if ocr_model:
                        text_content = ocr_model.extract_text(
                            pdf_path,
                            page_num,
                            element['bbox']
                        )
                        elem_data['content'] = text_content
                        result['text'] += text_content + ' '
                
                # Extract table
                if extract_tables and element['type'] == 'table':
                    table_data = extract_table(pdf_path, page_num, element['bbox'])
                    table_data['pageNumber'] = page_num
                    result['tables'].append(table_data)
                    elem_data['content'] = f"Table with {len(table_data['data'])} rows"
                
                # Extract formula
                if extract_formulas and element['type'] == 'formula':
                    formula_data = extract_formula(pdf_path, page_num, element['bbox'])
                    formula_data['pageNumber'] = page_num
                    result['formulas'].append(formula_data)
                    elem_data['content'] = formula_data['latex']
                
                # Extract image
                if extract_images and element['type'] in ['image', 'figure']:
                    image_data = extract_image(pdf_path, page_num, element['bbox'])
                    image_data['pageNumber'] = page_num
                    result['images'].append(image_data)
                    elem_data['content'] = 'Image'
                
                page_data['elements'].append(elem_data)
            
            result['layout']['pages'].append(page_data)
        
        # Add metadata
        result['metadata'] = {
            'totalPages': len(result['layout']['pages']),
            'totalTables': len(result['tables']),
            'totalImages': len(result['images']),
            'totalFormulas': len(result['formulas']),
            'textLength': len(result['text'])
        }
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise
    
    return result

def extract_table(pdf_path: str, page_num: int, bbox: List[float]) -> Dict[str, Any]:
    """Extract and structure table content"""
    try:
        table_result = table_model.extract(pdf_path, page_num, bbox)
        
        return {
            'id': f"table_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'html': table_result.get('html', ''),
            'markdown': table_result.get('markdown', ''),
            'data': table_result.get('data', []),
            'headers': table_result.get('headers', []),
            'confidence': table_result.get('confidence', 0.9)
        }
    except Exception as e:
        logger.error(f"Table extraction error: {str(e)}")
        return {
            'id': f"table_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'html': '',
            'markdown': '',
            'data': [],
            'headers': [],
            'confidence': 0.0
        }

def extract_formula(pdf_path: str, page_num: int, bbox: List[float]) -> Dict[str, Any]:
    """Extract formula and convert to LaTeX"""
    try:
        formula_result = formula_model.extract(pdf_path, page_num, bbox)
        
        return {
            'id': f"formula_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'type': 'block' if bbox[3] - bbox[1] > 50 else 'inline',
            'latex': formula_result.get('latex', ''),
            'confidence': formula_result.get('confidence', 0.9)
        }
    except Exception as e:
        logger.error(f"Formula extraction error: {str(e)}")
        return {
            'id': f"formula_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'type': 'unknown',
            'latex': '',
            'confidence': 0.0
        }

def extract_image(pdf_path: str, page_num: int, bbox: List[float]) -> Dict[str, Any]:
    """Extract image from PDF"""
    try:
        # Extract image region
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page = doc[page_num - 1]
        
        # Get image from bbox region
        mat = fitz.Matrix(2, 2)  # Zoom factor
        pix = page.get_pixmap(matrix=mat, clip=fitz.Rect(bbox))
        img_data = pix.tobytes("png")
        img_base64 = base64.b64encode(img_data).decode('utf-8')
        
        doc.close()
        
        return {
            'id': f"image_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'base64': img_base64,
            'type': 'figure',
            'confidence': 0.95
        }
    except Exception as e:
        logger.error(f"Image extraction error: {str(e)}")
        return {
            'id': f"image_{page_num}_{int(bbox[0])}_{int(bbox[1])}",
            'bbox': bbox,
            'base64': '',
            'type': 'unknown',
            'confidence': 0.0
        }

def format_as_html(data: Dict[str, Any]) -> str:
    """Format extraction results as HTML"""
    html = "<html><body>"
    html += f"<h1>Extracted Document</h1>"
    html += f"<p>Pages: {data['metadata']['totalPages']}</p>"
    
    # Add text
    if data['text']:
        html += f"<h2>Text Content</h2>"
        html += f"<p>{data['text']}</p>"
    
    # Add tables
    if data['tables']:
        html += f"<h2>Tables ({len(data['tables'])})</h2>"
        for table in data['tables']:
            html += table['html']
    
    html += "</body></html>"
    return html

def format_as_markdown(data: Dict[str, Any]) -> str:
    """Format extraction results as Markdown"""
    md = "# Extracted Document\n\n"
    md += f"**Pages:** {data['metadata']['totalPages']}\n\n"
    
    # Add text
    if data['text']:
        md += "## Text Content\n\n"
        md += data['text'] + "\n\n"
    
    # Add tables
    if data['tables']:
        md += f"## Tables ({len(data['tables'])})\n\n"
        for table in data['tables']:
            md += table['markdown'] + "\n\n"
    
    return md

if __name__ == '__main__':
    # Initialize models on startup (optional)
    # initialize_models()
    
    # Run Flask app
    port = int(os.environ.get('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=False)