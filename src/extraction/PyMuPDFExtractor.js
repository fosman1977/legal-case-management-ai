/**
 * PyMuPDF Extractor - Exact implementation from roadmap
 * Week 3: Day 1-2 PyMuPDF Integration
 */

import PythonBridge from './PythonBridge.js';

class PyMuPDFExtractor {
  constructor() {
    this.pythonBridge = new PythonBridge();
  }

  async extractFromPDF(filepath) {
    const pythonScript = `
import fitz  # PyMuPDF
import json
import sys

def extract_pdf_text(filepath):
    try:
        doc = fitz.open(filepath)
        text = ""
        metadata = {
            "pages": doc.page_count,
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "subject": doc.metadata.get("subject", "")
        }
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text += page.get_text()
        
        doc.close()
        return {"text": text, "metadata": metadata, "confidence": 0.99}
    except Exception as e:
        return {"error": str(e), "confidence": 0.0}

result = extract_pdf_text("${filepath}")
print(json.dumps(result))
    `;

    try {
      const result = await this.pythonBridge.execute(pythonScript);
      const parsed = JSON.parse(result);
      
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      return {
        text: parsed.text,
        metadata: parsed.metadata,
        confidence: parsed.confidence,
        method: 'pymupdf',
        extractionTime: 0 // Will be calculated by caller
      };
    } catch (error) {
      console.error('PyMuPDF extraction failed:', error);
      throw error;
    }
  }

  async extractWithMetadata(file) {
    try {
      // Convert File to temporary path for Python processing
      const filepath = await this.uploadFileForProcessing(file);
      
      const result = await this.extractFromPDF(filepath);
      
      // Clean up temporary file
      await this.cleanupFile(filepath);
      
      return result;
    } catch (error) {
      console.error('PyMuPDF extraction with metadata failed:', error);
      throw error;
    }
  }

  async uploadFileForProcessing(file) {
    // Upload file to Python server for processing
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.pythonBridge.pythonServerUrl}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload for PyMuPDF processing failed');
    }

    const result = await response.json();
    return result.filepath;
  }

  async cleanupFile(filepath) {
    try {
      await fetch(`${this.pythonBridge.pythonServerUrl}/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath })
      });
    } catch (error) {
      console.warn('File cleanup failed:', error);
    }
  }

  // Utility methods
  isElectronicPDF(file) {
    // Heuristics for electronic PDF detection
    return file.type === 'application/pdf' && 
           file.size < 10 * 1024 * 1024 && // Less than 10MB
           !file.name.toLowerCase().includes('scan');
  }

  getExtractorInfo() {
    return {
      name: 'PyMuPDF Extractor',
      version: '1.23.0',
      accuracy: '99%+',
      bestFor: 'Electronic PDFs',
      features: ['Text extraction', 'Metadata extraction', 'Fast processing']
    };
  }
}

export default PyMuPDFExtractor;