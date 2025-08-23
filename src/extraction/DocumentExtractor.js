/**
 * Document Extractor - Exact implementation from roadmap
 * Week 3: Day 3-4 Multi-Pass Extraction Strategy
 */

import PyMuPDFExtractor from './PyMuPDFExtractor.js';
import PDFPlumberExtractor from './PDFPlumberExtractor.js';
import TesseractExtractor from './TesseractExtractor.js';
import TextractExtractor from './TextractExtractor.js';

class DocumentExtractor {
  constructor() {
    this.pymupdf = new PyMuPDFExtractor();
    this.pdfplumber = new PDFPlumberExtractor();
    this.tesseract = new TesseractExtractor();
    this.textract = new TextractExtractor(); // Optional
  }

  async extractDocument(file) {
    const startTime = performance.now();
    
    try {
      const fileType = this.detectFileType(file);
      const complexity = await this.assessComplexity(file);

      console.log(`📄 Document Analysis:`, {
        type: fileType,
        isElectronic: complexity.isElectronic,
        hasTables: complexity.hasTables,
        isScanned: complexity.isScanned,
        hasImages: complexity.hasImages
      });

      let extractor = this.selectOptimalExtractor(fileType, complexity);
      let result = await extractor.extract(file);

      // Confidence check and fallback
      if (result.confidence < 0.95) {
        console.log(`⚠️ Low confidence (${Math.round(result.confidence * 100)}%), attempting fallback`);
        result = await this.fallbackExtraction(file, result);
      }

      const finalResult = this.enhanceResult(result);
      finalResult.extractionTime = performance.now() - startTime;

      console.log(`✅ Extraction complete: ${finalResult.method}, ${Math.round(finalResult.confidence * 100)}% confidence`);
      
      return finalResult;
    } catch (error) {
      console.error('❌ Document extraction failed:', error);
      
      return {
        text: '',
        confidence: 0,
        method: 'failed',
        error: error.message,
        extractionTime: performance.now() - startTime
      };
    }
  }

  selectOptimalExtractor(fileType, complexity) {
    if (fileType === 'pdf') {
      if (complexity.isElectronic) {
        console.log('🚀 Selected: PyMuPDF (fastest for electronic PDFs)');
        return {
          extract: (file) => this.pymupdf.extractWithMetadata(file)
        };
      } else if (complexity.hasTables) {
        console.log('📊 Selected: pdfplumber (best for tables)');
        return {
          extract: (file) => this.pdfplumber.extractWithTables(file)
        };
      } else if (complexity.isScanned) {
        console.log('🖼️ Selected: Tesseract (OCR for scanned)');
        return {
          extract: (file) => this.tesseract.extractFromScanned(file)
        };
      }
    }
    
    console.log('📄 Selected: PyMuPDF (default)');
    return {
      extract: (file) => this.pymupdf.extractWithMetadata(file)
    };
  }

  async assessComplexity(file) {
    // Quick analysis to determine extraction strategy
    const filename = file.name.toLowerCase();
    const fileSize = file.size;
    
    const analysis = {
      isElectronic: await this.isElectronicPDF(file),
      hasTables: await this.detectTables(file),
      isScanned: await this.isScannedDocument(file),
      hasImages: await this.detectImages(file)
    };

    console.log('📊 Complexity Assessment:', analysis);
    return analysis;
  }

  async isElectronicPDF(file) {
    const filename = file.name.toLowerCase();
    
    // Heuristics for electronic PDF detection
    return file.type === 'application/pdf' &&
           !filename.includes('scan') &&
           !filename.includes('photo') &&
           file.size < 10 * 1024 * 1024; // Less than 10MB typically electronic
  }

  async detectTables(file) {
    const filename = file.name.toLowerCase();
    
    // Filename-based table detection heuristics
    const tableKeywords = [
      'schedule', 'financial', 'contract', 'invoice', 
      'statement', 'report', 'analysis', 'summary'
    ];
    
    return tableKeywords.some(keyword => filename.includes(keyword));
  }

  async isScannedDocument(file) {
    const filename = file.name.toLowerCase();
    
    // Heuristics for scanned document detection
    return filename.includes('scan') ||
           filename.includes('photo') ||
           filename.includes('image') ||
           file.size > 50 * 1024 * 1024; // Large files often scanned
  }

  async detectImages(file) {
    // Simple heuristic based on file size and name
    const filename = file.name.toLowerCase();
    
    return filename.includes('image') ||
           filename.includes('photo') ||
           file.size > 20 * 1024 * 1024; // Larger files may contain images
  }

  detectFileType(file) {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('word') || file.type.includes('document')) return 'word';
    if (file.type === 'text/plain') return 'text';
    return 'unknown';
  }

  async fallbackExtraction(file, previousResult) {
    console.log('🔄 Attempting fallback extraction');
    
    try {
      // Try different extractor based on what failed
      if (previousResult.method === 'pymupdf') {
        return await this.pdfplumber.extractWithTables(file);
      } else if (previousResult.method === 'pdfplumber') {
        return await this.tesseract.extractFromScanned(file);
      } else {
        return await this.pymupdf.extractWithMetadata(file);
      }
    } catch (error) {
      console.error('Fallback extraction also failed:', error);
      return {
        ...previousResult,
        fallbackAttempted: true,
        fallbackError: error.message
      };
    }
  }

  enhanceResult(result) {
    return {
      ...result,
      enhanced: true,
      enhancedAt: new Date().toISOString(),
      quality: this.assessExtractionQuality(result),
      recommendations: this.generateRecommendations(result)
    };
  }

  assessExtractionQuality(result) {
    const textLength = result.text?.length || 0;
    const confidence = result.confidence || 0;
    
    if (confidence > 0.95 && textLength > 1000) {
      return 'excellent';
    } else if (confidence > 0.85 && textLength > 500) {
      return 'good';
    } else if (confidence > 0.75) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }

  generateRecommendations(result) {
    const recommendations = [];
    
    if (result.confidence < 0.85) {
      recommendations.push('Consider manual review due to low confidence');
    }
    
    if (result.method === 'tesseract' && result.confidence > 0.9) {
      recommendations.push('High quality OCR result - suitable for automated processing');
    }
    
    if (result.tables && result.tables.length > 0) {
      recommendations.push(`Found ${result.tables.length} tables - review table extraction quality`);
    }
    
    if (!result.text || result.text.length < 100) {
      recommendations.push('Very short text extracted - verify document processing');
    }
    
    return recommendations;
  }

  // Utility methods
  getExtractorInfo() {
    return {
      name: 'Multi-Pass Document Extractor',
      version: '3.0.0',
      extractors: [
        this.pymupdf.getExtractorInfo(),
        this.pdfplumber.getExtractorInfo(),
        // this.tesseract.getExtractorInfo(),
        // this.textract.getExtractorInfo()
      ],
      features: [
        'Automatic extractor selection',
        'Confidence-based fallback',
        'Quality assessment',
        'Performance optimization'
      ]
    };
  }
}

export default DocumentExtractor;