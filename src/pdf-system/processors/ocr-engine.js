
/**
 * Advanced OCR Engine with multiple backends
 */

const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;

// Optional sharp dependency - gracefully handle if missing
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('Sharp not available - image preprocessing disabled');
  sharp = null;
}

class OCREngine {
  constructor(config = {}) {
    this.config = {
      workers: 4,
      languages: ['eng'],
      cacheDir: path.join(__dirname, '../../../cache/pdf-system'),
      ...config
    };
    
    this.workers = [];
    this.currentWorker = 0;
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing OCR workers...');
    
    // Create cache directory
    await fs.mkdir(this.config.cacheDir, { recursive: true });
    
    // Create worker pool
    for (let i = 0; i < this.config.workers; i++) {
      const worker = await this.createWorker();
      this.workers.push(worker);
    }
    
    this.initialized = true;
    console.log(`✓ Created ${this.workers.length} OCR workers`);
  }
  
  async createWorker() {
    const worker = await Tesseract.createWorker({
      workerPath: '/tesseract/worker.min.js',
      langPath: path.join(__dirname, '../../../models/tessdata'),
      cachePath: this.config.cacheDir,
      gzip: false,
      cacheMethod: 'readOnly',
      workerBlobURL: false
    });
    
    // Load languages
    await worker.loadLanguage(this.config.languages.join('+'));
    await worker.initialize(this.config.languages.join('+'));
    
    // Configure for legal documents
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
      tessedit_create_pdf: '0',
      tessedit_create_hocr: '1',
      tessjs_create_box: '1'
    });
    
    return worker;
  }
  
  async recognizePage(pdfPath, pageNum) {
    await this.initialize();
    
    // Convert PDF page to image using existing PDF.js setup
    const imagePath = await this.convertPageToImage(pdfPath, pageNum);
    
    // Preprocess image
    const processedImage = await this.preprocessImage(imagePath);
    
    // Get next available worker
    const worker = this.getNextWorker();
    
    // Perform OCR
    const result = await worker.recognize(processedImage);
    
    return {
      text: result.data.text,
      confidence: result.data.confidence / 100, // Normalize to 0-1
      words: result.data.words,
      lines: result.data.lines,
      paragraphs: result.data.paragraphs,
      bbox: result.data.bbox
    };
  }
  
  async preprocessImage(imagePath) {
    // Image enhancement for better OCR
    if (!sharp) {
      console.log('Image preprocessing disabled - Sharp not available');
      return imagePath;
    }
    
    const outputPath = imagePath.replace('.png', '_processed.png');
    
    try {
      await sharp(imagePath)
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(128)
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error.message);
      return imagePath;
    }
  }
  
  async convertPageToImage(pdfPath, pageNum) {
    // Simplified implementation - in browser environment, this would be different
    const outputPath = path.join(
      this.config.cacheDir,
      `${path.basename(pdfPath || 'document')}_page_${pageNum}.png`
    );
    
    try {
      // For now, return a placeholder path
      // In a full implementation, this would render PDF pages to images
      console.log(`Would convert page ${pageNum} to ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('PDF to image conversion failed:', error);
      throw error;
    }
  }
  
  getNextWorker() {
    const worker = this.workers[this.currentWorker];
    this.currentWorker = (this.currentWorker + 1) % this.workers.length;
    return worker;
  }
  
  async terminate() {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
    this.initialized = false;
  }
}

module.exports = { OCREngine };
