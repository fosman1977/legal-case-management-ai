class PDFExtractor {
  constructor() {
    this.pdfjsLib = null;
  }

  async init() {
    if (!this.pdfjsLib) {
      this.pdfjsLib = await import('pdfjs-dist');
    }
    return this.pdfjsLib;
  }
  async extractMetadata(pdfInput) {
    try {
      const pdfjsLib = await this.init();
      
      // Handle both File objects and paths
      let pdfData;
      if (typeof pdfInput === 'string') {
        const fs = require('fs');
        pdfData = fs.readFileSync(pdfInput);
      } else if (pdfInput instanceof File) {
        pdfData = await pdfInput.arrayBuffer();
      } else {
        pdfData = pdfInput;
      }

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const metadata = await pdf.getMetadata();
      
      return {
        pages: pdf.numPages,
        title: metadata.info?.Title || '',
        author: metadata.info?.Author || '',
        subject: metadata.info?.Subject || '',
        keywords: metadata.info?.Keywords || '',
        creator: metadata.info?.Creator || '',
        producer: metadata.info?.Producer || '',
        creationDate: metadata.info?.CreationDate || '',
        modificationDate: metadata.info?.ModDate || ''
      };
    } catch (error) {
      console.warn('PDF metadata extraction failed:', error);
      return {
        pages: 0,
        title: '',
        author: '',
        subject: '',
        keywords: '',
        creator: '',
        producer: '',
        creationDate: '',
        modificationDate: ''
      };
    }
  }
  
  async extractNativeText(pdfInput) {
    try {
      const pdfjsLib = await this.init();
      
      // Handle both File objects and paths
      let pdfData;
      if (typeof pdfInput === 'string') {
        const fs = require('fs');
        pdfData = fs.readFileSync(pdfInput);
      } else if (pdfInput instanceof File) {
        pdfData = await pdfInput.arrayBuffer();
      } else {
        pdfData = pdfInput;
      }

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const pages = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        pages.push({
          pageNumber: i,
          text: textContent.items.map(item => item.str).join(' '),
          hasText: textContent.items.length > 0
        });
      }
      
      return { pages };
    } catch (error) {
      console.warn('PDF native text extraction failed:', error);
      return { pages: [] };
    }
  }
  
  async extractPageText(pdfInput, pageNum) {
    try {
      const pdfjsLib = await this.init();
      
      // Handle both File objects and paths
      let pdfData;
      if (typeof pdfInput === 'string') {
        const fs = require('fs');
        pdfData = fs.readFileSync(pdfInput);
      } else if (pdfInput instanceof File) {
        pdfData = await pdfInput.arrayBuffer();
      } else {
        pdfData = pdfInput;
      }

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      return textContent.items.map(item => item.str).join(' ');
    } catch (error) {
      console.warn(`PDF page ${pageNum} text extraction failed:`, error);
      return '';
    }
  }
}

module.exports = { PDFExtractor };