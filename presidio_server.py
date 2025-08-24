#!/usr/bin/env python3
"""
Presidio Server - Real PII Detection and Anonymization
Runs on port 5002 with CORS enabled for browser access
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Initialize Presidio engines
try:
    analyzer = AnalyzerEngine()
    anonymizer = AnonymizerEngine()
    logger.info("✅ Presidio engines initialized successfully")
    engines_available = True
except Exception as e:
    logger.error(f"❌ Failed to initialize Presidio: {str(e)}")
    analyzer = None
    anonymizer = None
    engines_available = False

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if engines_available else 'unhealthy',
        'service': 'presidio',
        'analyzer': analyzer is not None,
        'anonymizer': anonymizer is not None
    })

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    """Analyze text for PII entities"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    if not analyzer:
        return jsonify({'error': 'Analyzer not available'}), 503
    
    try:
        data = request.json
        text = data.get('text', '')
        language = data.get('language', 'en')
        entities = data.get('entities', [
            'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD',
            'IBAN_CODE', 'IP_ADDRESS', 'DATE_TIME', 'LOCATION',
            'UK_NHS', 'UK_NINO', 'US_SSN', 'US_DRIVER_LICENSE'
        ])
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Analyze text
        results = analyzer.analyze(
            text=text,
            language=language,
            entities=entities
        )
        
        # Convert to JSON-serializable format
        entities_found = []
        for result in results:
            entities_found.append({
                'entity_type': result.entity_type,
                'start': result.start,
                'end': result.end,
                'score': result.score
            })
        
        logger.info(f"Analyzed text, found {len(entities_found)} PII entities")
        return jsonify(entities_found)
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/anonymize', methods=['POST', 'OPTIONS'])
def anonymize():
    """Anonymize detected PII entities"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    if not anonymizer:
        return jsonify({'error': 'Anonymizer not available'}), 503
    
    try:
        data = request.json
        text = data.get('text', '')
        analyzer_results = data.get('analyzer_results', [])
        anonymizers = data.get('anonymizers', {
            'DEFAULT': {'type': 'replace', 'new_value': '<REDACTED>'},
            'PERSON': {'type': 'replace', 'new_value': '<PERSON>'},
            'EMAIL_ADDRESS': {'type': 'replace', 'new_value': '<EMAIL>'},
            'PHONE_NUMBER': {'type': 'replace', 'new_value': '<PHONE>'},
            'CREDIT_CARD': {'type': 'replace', 'new_value': '<CARD>'}
        })
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Convert analyzer results to proper format
        from presidio_analyzer import RecognizerResult
        recognizer_results = []
        for result in analyzer_results:
            recognizer_results.append(RecognizerResult(
                entity_type=result['entity_type'],
                start=result['start'],
                end=result['end'],
                score=result.get('score', 0.85)
            ))
        
        # Anonymize text
        anonymized = anonymizer.anonymize(
            text=text,
            analyzer_results=recognizer_results,
            operators=anonymizers
        )
        
        logger.info(f"Anonymized {len(analyzer_results)} entities")
        return jsonify({
            'text': anonymized.text,
            'items': [
                {
                    'entity_type': item.entity_type,
                    'start': item.start,
                    'end': item.end,
                    'operator': item.operator
                } for item in anonymized.items
            ]
        })
        
    except Exception as e:
        logger.error(f"Anonymization error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/info', methods=['GET'])
def info():
    """Get service information"""
    return jsonify({
        'service': 'Microsoft Presidio PII Detection',
        'version': '2.2.0',
        'capabilities': {
            'analyzer': [
                'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD',
                'IBAN_CODE', 'IP_ADDRESS', 'DATE_TIME', 'LOCATION',
                'UK_NHS', 'UK_NINO', 'US_SSN', 'MEDICAL_LICENSE'
            ],
            'anonymizer': [
                'replace', 'redact', 'hash', 'mask', 'encrypt'
            ]
        },
        'port': 5002
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Presidio server on port 5002")
    app.run(host='localhost', port=5002, debug=True)