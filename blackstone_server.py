#!/usr/bin/env python3
"""
BlackstoneNLP Server - Real Legal Entity Recognition
Runs on port 5004 with CORS enabled for browser access
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Load NLP model
try:
    nlp = spacy.load("en_blackstone_proto")
    logger.info("✅ BlackstoneNLP model loaded successfully")
    using_blackstone = True
except:
    try:
        nlp = spacy.load("en_core_web_sm")
        logger.warning("⚠️ Using basic spaCy model (BlackstoneNLP not available)")
        using_blackstone = False
    except:
        logger.error("❌ No spaCy models available")
        nlp = None
        using_blackstone = False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if nlp else 'unhealthy',
        'service': 'blackstone',
        'model': 'en_blackstone_proto' if using_blackstone else 'en_core_web_sm',
        'available': nlp is not None
    })

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    """Analyze text for legal entities"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    if not nlp:
        return jsonify({'error': 'NLP model not available'}), 503
    
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Process text with NLP
        doc = nlp(text)
        entities = []
        
        for ent in doc.ents:
            entities.append({
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start_char,
                'end': ent.end_char,
                'confidence': 0.9 if using_blackstone else 0.7
            })
        
        # Add custom legal patterns if using basic model
        if not using_blackstone:
            import re
            # Case numbers
            for match in re.finditer(r'\b[A-Z]{2,4}\d{4}/\d+\b', text):
                entities.append({
                    'text': match.group(),
                    'label': 'CASE_NUMBER',
                    'start': match.start(),
                    'end': match.end(),
                    'confidence': 0.8
                })
            
            # Legal roles
            for match in re.finditer(r'\b(?:QC|KC|Solicitor|Barrister|Judge)\b', text):
                entities.append({
                    'text': match.group(),
                    'label': 'LEGAL_ROLE',
                    'start': match.start(),
                    'end': match.end(),
                    'confidence': 0.85
                })
        
        logger.info(f"Analyzed text, found {len(entities)} entities")
        return jsonify({'entities': entities})
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    """Get service information"""
    return jsonify({
        'service': 'BlackstoneNLP Legal Entity Recognition',
        'version': '1.0.0',
        'model': 'en_blackstone_proto' if using_blackstone else 'en_core_web_sm',
        'capabilities': [
            'PERSON', 'ORG', 'COURT', 'CASE_NUMBER', 
            'LEGISLATION', 'LEGAL_ROLE', 'PROVISION'
        ] if using_blackstone else [
            'PERSON', 'ORG', 'DATE', 'GPE', 'CASE_NUMBER', 'LEGAL_ROLE'
        ],
        'port': 5004
    })

if __name__ == '__main__':
    logger.info("🚀 Starting BlackstoneNLP server on port 5004")
    app.run(host='localhost', port=5004, debug=True)