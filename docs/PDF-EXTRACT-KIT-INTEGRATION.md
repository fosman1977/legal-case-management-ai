# PDF-Extract-Kit Integration Plan

## Executive Summary
Integrate PDF-Extract-Kit to enhance our document processing pipeline with advanced PDF extraction capabilities including layout analysis, table extraction, formula recognition, and robust OCR.

## Current State Analysis

### Existing System
- **PDF Processing**: Basic text extraction via pdf.js
- **OCR**: Simple OCR worker pool for scanned pages
- **Entity Extraction**: 8-engine system for names, dates, issues
- **Storage**: localStorage/IndexedDB for extracted entities

### Limitations
- Poor handling of complex layouts (multi-column, footnotes)
- Tables extracted as unstructured text
- No image/diagram extraction
- Limited OCR quality on watermarked/blurred documents
- No formula/calculation extraction

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Document Upload                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              PDF-Extract-Kit Service                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Layout Detection (DocLayout-YOLO)                │  │
│  │  2. Text Extraction (with structure)                 │  │
│  │  3. Table Detection & Extraction                     │  │
│  │  4. Formula Recognition (UniMERNet)                  │  │
│  │  5. Image/Figure Extraction                          │  │
│  │  6. Enhanced OCR (PaddleOCR)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│            Structured Document Output                        │
│  • Text blocks with layout metadata                         │
│  • Tables (HTML/Markdown format)                            │
│  • Formulas (LaTeX format)                                  │
│  • Images/Figures (base64/URLs)                             │
│  • Document structure tree                                  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│         8-Engine Entity Extraction System                    │
│  Enhanced input → Better entity extraction                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Enhanced Storage System                         │
│  • Entities (existing)                                      │
│  • Tables (new)                                             │
│  • Images (new)                                             │
│  • Formulas (new)                                           │
│  • Document structure (new)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Week 1)

#### 1.1 Docker Container Setup
```dockerfile
# Dockerfile for PDF-Extract-Kit
FROM python:3.9-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    gcc \
    g++

# Clone PDF-Extract-Kit
RUN git clone https://github.com/opendatalab/PDF-Extract-Kit.git /app
WORKDIR /app

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install torch torchvision paddlepaddle paddleocr
RUN pip install -r requirements.txt

# Download models
RUN python scripts/download_models.py

EXPOSE 8001
CMD ["python", "api_server.py"]
```

#### 1.2 Service Wrapper
```typescript
// src/services/pdfExtractKitService.ts
export class PDFExtractKitService {
  private apiUrl = process.env.PDF_EXTRACT_KIT_URL || 'http://localhost:8001';
  
  async extractDocument(pdfBuffer: ArrayBuffer): Promise<ExtractedDocument> {
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }));
    formData.append('extract_text', 'true');
    formData.append('extract_tables', 'true');
    formData.append('extract_images', 'true');
    formData.append('extract_formulas', 'true');
    formData.append('output_format', 'json');
    
    const response = await fetch(`${this.apiUrl}/extract`, {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
}
```

### Phase 2: Data Models & Storage (Week 1)

#### 2.1 Enhanced Data Types
```typescript
// src/types/extractedDocument.ts
export interface ExtractedDocument {
  // Existing
  text: string;
  entities: EntityExtractionResult;
  
  // New from PDF-Extract-Kit
  layout: DocumentLayout;
  tables: ExtractedTable[];
  images: ExtractedImage[];
  formulas: ExtractedFormula[];
  metadata: DocumentMetadata;
}

export interface DocumentLayout {
  pages: PageLayout[];
  structure: DocumentNode[];
}

export interface PageLayout {
  pageNumber: number;
  width: number;
  height: number;
  elements: LayoutElement[];
}

export interface LayoutElement {
  type: 'text' | 'title' | 'header' | 'footer' | 'table' | 'image' | 'formula';
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  content: string | object;
  confidence: number;
}

export interface ExtractedTable {
  id: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  html: string;
  markdown: string;
  data: any[][];
  headers: string[];
  confidence: number;
}

export interface ExtractedImage {
  id: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  base64: string;
  caption?: string;
  type: 'photo' | 'diagram' | 'chart' | 'signature';
}

export interface ExtractedFormula {
  id: string;
  pageNumber: number;
  type: 'inline' | 'block';
  latex: string;
  rendered?: string;
  context: string;
}
```

#### 2.2 Storage Extensions
```typescript
// src/utils/enhancedStorage.ts
export const enhancedStorage = {
  ...storage, // existing storage functions
  
  // Table storage
  saveTables(docId: string, tables: ExtractedTable[]): void {
    localStorage.setItem(`doc_tables_${docId}`, JSON.stringify(tables));
  },
  
  getTables(docId: string): ExtractedTable[] {
    const data = localStorage.getItem(`doc_tables_${docId}`);
    return data ? JSON.parse(data) : [];
  },
  
  // Image storage (using IndexedDB for large data)
  async saveImages(docId: string, images: ExtractedImage[]): Promise<void> {
    await indexedDBManager.storeImages(docId, images);
  },
  
  async getImages(docId: string): Promise<ExtractedImage[]> {
    return indexedDBManager.getImages(docId);
  },
  
  // Formula storage
  saveFormulas(docId: string, formulas: ExtractedFormula[]): void {
    localStorage.setItem(`doc_formulas_${docId}`, JSON.stringify(formulas));
  },
  
  getFormulas(docId: string): ExtractedFormula[] {
    const data = localStorage.getItem(`doc_formulas_${docId}`);
    return data ? JSON.parse(data) : [];
  },
  
  // Layout storage
  saveLayout(docId: string, layout: DocumentLayout): void {
    localStorage.setItem(`doc_layout_${docId}`, JSON.stringify(layout));
  },
  
  getLayout(docId: string): DocumentLayout | null {
    const data = localStorage.getItem(`doc_layout_${docId}`);
    return data ? JSON.parse(data) : null;
  }
};
```

### Phase 3: Pipeline Integration (Week 2)

#### 3.1 Enhanced Document Processor
```typescript
// src/utils/enhancedDocumentProcessor.ts
export class EnhancedDocumentProcessor {
  private pdfExtractKit: PDFExtractKitService;
  private multiEngineProcessor: MultiEngineProcessor;
  
  async processDocument(
    file: File,
    options: ProcessingOptions
  ): Promise<ExtractedDocument> {
    // Step 1: PDF-Extract-Kit processing
    console.log('📄 Starting PDF-Extract-Kit processing...');
    const pdfBuffer = await file.arrayBuffer();
    const extractedContent = await this.pdfExtractKit.extractDocument(pdfBuffer);
    
    // Step 2: Prepare enhanced text for entity extraction
    const enhancedText = this.buildEnhancedText(extractedContent);
    
    // Step 3: Run 8-engine entity extraction on enhanced text
    console.log('🎯 Running 8-engine entity extraction...');
    const entities = await this.multiEngineProcessor.processDocument(
      enhancedText,
      options
    );
    
    // Step 4: Extract additional entities from tables
    const tableEntities = this.extractEntitiesFromTables(extractedContent.tables);
    
    // Step 5: Merge all results
    const mergedEntities = this.mergeEntityResults(entities, tableEntities);
    
    // Step 6: Build final document
    return {
      text: enhancedText,
      entities: mergedEntities,
      layout: extractedContent.layout,
      tables: extractedContent.tables,
      images: extractedContent.images,
      formulas: extractedContent.formulas,
      metadata: extractedContent.metadata
    };
  }
  
  private buildEnhancedText(extracted: any): string {
    // Combine text with structure preservation
    let enhancedText = '';
    
    for (const page of extracted.layout.pages) {
      enhancedText += `\n--- Page ${page.pageNumber} ---\n`;
      
      // Sort elements by position (top to bottom, left to right)
      const sortedElements = page.elements.sort((a, b) => {
        if (Math.abs(a.bbox[1] - b.bbox[1]) < 10) {
          return a.bbox[0] - b.bbox[0]; // Same line, sort by x
        }
        return a.bbox[1] - b.bbox[1]; // Sort by y
      });
      
      for (const element of sortedElements) {
        switch (element.type) {
          case 'title':
            enhancedText += `\n# ${element.content}\n`;
            break;
          case 'header':
            enhancedText += `\n## ${element.content}\n`;
            break;
          case 'text':
            enhancedText += `${element.content} `;
            break;
          case 'table':
            enhancedText += `\n[TABLE: ${element.content}]\n`;
            break;
          case 'formula':
            enhancedText += ` [FORMULA: ${element.content}] `;
            break;
        }
      }
    }
    
    return enhancedText;
  }
  
  private extractEntitiesFromTables(tables: ExtractedTable[]): EntityExtractionResult {
    const entities: EntityExtractionResult = {
      persons: [],
      issues: [],
      chronologyEvents: [],
      authorities: []
    };
    
    for (const table of tables) {
      // Look for date columns and event descriptions
      const dateColumnIndex = table.headers.findIndex(h => 
        /date|time|when/i.test(h)
      );
      
      if (dateColumnIndex >= 0) {
        // Extract chronology from table
        for (const row of table.data) {
          if (row[dateColumnIndex]) {
            entities.chronologyEvents.push({
              date: row[dateColumnIndex],
              event: row.join(' '),
              confidence: 0.85
            });
          }
        }
      }
      
      // Look for person names in tables
      const nameColumnIndex = table.headers.findIndex(h =>
        /name|person|party|witness/i.test(h)
      );
      
      if (nameColumnIndex >= 0) {
        for (const row of table.data) {
          if (row[nameColumnIndex]) {
            entities.persons.push({
              name: row[nameColumnIndex],
              role: 'From Table',
              confidence: 0.80
            });
          }
        }
      }
    }
    
    return entities;
  }
  
  private mergeEntityResults(...results: EntityExtractionResult[]): EntityExtractionResult {
    const merged: EntityExtractionResult = {
      persons: [],
      issues: [],
      chronologyEvents: [],
      authorities: []
    };
    
    for (const result of results) {
      merged.persons.push(...result.persons);
      merged.issues.push(...result.issues);
      merged.chronologyEvents.push(...result.chronologyEvents);
      merged.authorities.push(...result.authorities);
    }
    
    // Deduplicate
    merged.persons = this.deduplicateEntities(merged.persons, 'name');
    merged.issues = this.deduplicateEntities(merged.issues, 'issue');
    merged.chronologyEvents = this.deduplicateEntities(merged.chronologyEvents, 'date');
    merged.authorities = this.deduplicateEntities(merged.authorities, 'citation');
    
    return merged;
  }
}
```

### Phase 4: UI Components (Week 2)

#### 4.1 Table Viewer Component
```typescript
// src/components/ExtractedTableViewer.tsx
export const ExtractedTableViewer: React.FC<{ docId: string }> = ({ docId }) => {
  const [tables, setTables] = useState<ExtractedTable[]>([]);
  
  useEffect(() => {
    const loadedTables = enhancedStorage.getTables(docId);
    setTables(loadedTables);
  }, [docId]);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Extracted Tables ({tables.length})</h3>
      {tables.map((table, index) => (
        <div key={table.id} className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">
            Table {index + 1} - Page {table.pageNumber}
          </h4>
          <div 
            className="overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: table.html }}
          />
          <div className="mt-2 flex gap-2">
            <button className="text-sm text-blue-600">
              Export as CSV
            </button>
            <button className="text-sm text-blue-600">
              Add to Chronology
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### 4.2 Image Gallery Component
```typescript
// src/components/ExtractedImageGallery.tsx
export const ExtractedImageGallery: React.FC<{ docId: string }> = ({ docId }) => {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  
  useEffect(() => {
    enhancedStorage.getImages(docId).then(setImages);
  }, [docId]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map(image => (
        <div key={image.id} className="border rounded-lg p-2">
          <img 
            src={`data:image/png;base64,${image.base64}`}
            alt={image.caption || 'Extracted image'}
            className="w-full h-auto"
          />
          <p className="text-xs mt-1">
            Page {image.pageNumber} - {image.type}
          </p>
          {image.caption && (
            <p className="text-sm text-gray-600">{image.caption}</p>
          )}
          <button className="text-xs text-blue-600 mt-1">
            Add as Evidence
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Phase 5: Testing & Optimization (Week 3)

#### 5.1 Test Suite
```typescript
// tests/pdfExtractKit.test.ts
describe('PDF-Extract-Kit Integration', () => {
  test('Extract complex legal document', async () => {
    const testPDF = await loadTestPDF('complex-legal-document.pdf');
    const result = await enhancedProcessor.processDocument(testPDF);
    
    expect(result.tables.length).toBeGreaterThan(0);
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.layout.pages.length).toBeGreaterThan(0);
    expect(result.entities.persons.length).toBeGreaterThan(10);
  });
  
  test('Extract financial tables', async () => {
    const testPDF = await loadTestPDF('financial-schedule.pdf');
    const result = await enhancedProcessor.processDocument(testPDF);
    
    const financialTable = result.tables.find(t => 
      t.headers.some(h => /amount|cost|fee/i.test(h))
    );
    
    expect(financialTable).toBeDefined();
    expect(financialTable.data.length).toBeGreaterThan(0);
  });
  
  test('Handle watermarked documents', async () => {
    const testPDF = await loadTestPDF('watermarked-contract.pdf');
    const result = await enhancedProcessor.processDocument(testPDF);
    
    // Should still extract text despite watermarks
    expect(result.text.length).toBeGreaterThan(1000);
    expect(result.entities.persons.length).toBeGreaterThan(0);
  });
});
```

#### 5.2 Performance Optimization
```typescript
// src/utils/pdfProcessingQueue.ts
export class PDFProcessingQueue {
  private queue: Array<{ file: File; resolve: Function; reject: Function }> = [];
  private processing = false;
  private maxConcurrent = 2;
  private activeJobs = 0;
  
  async addToQueue(file: File): Promise<ExtractedDocument> {
    return new Promise((resolve, reject) => {
      this.queue.push({ file, resolve, reject });
      this.processNext();
    });
  }
  
  private async processNext() {
    if (this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const job = this.queue.shift();
    if (!job) return;
    
    this.activeJobs++;
    
    try {
      // Process with timeout
      const result = await Promise.race([
        enhancedProcessor.processDocument(job.file),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), 60000)
        )
      ]);
      
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    } finally {
      this.activeJobs--;
      this.processNext();
    }
  }
}
```

## Deployment Strategy

### Local Development
1. Run PDF-Extract-Kit in Docker container
2. Configure API endpoint in .env
3. Test with sample documents

### Production Deployment
1. Deploy PDF-Extract-Kit as microservice (AWS ECS/Google Cloud Run)
2. Use queue system for async processing (SQS/Pub-Sub)
3. Cache extracted results in Redis
4. Store images in S3/Cloud Storage

## Performance Expectations

### Before Integration
- Basic text extraction: 2-3 seconds
- Entity extraction: 1-2 seconds
- Total: 3-5 seconds per document

### After Integration
- PDF-Extract-Kit processing: 5-10 seconds
- Enhanced entity extraction: 2-3 seconds
- Total: 7-13 seconds per document
- But with significantly better quality and completeness

## Risk Mitigation

### Risks
1. **Performance Impact**: Slower processing
   - Mitigation: Async processing, caching, queue system

2. **Resource Usage**: Higher memory/CPU requirements
   - Mitigation: Microservice architecture, auto-scaling

3. **Model Size**: Large ML models (several GB)
   - Mitigation: Cloud deployment, model optimization

4. **Compatibility**: PDF format variations
   - Mitigation: Fallback to original extraction

## Success Metrics

1. **Extraction Quality**
   - Table extraction accuracy: >90%
   - OCR accuracy improvement: >30%
   - Entity extraction improvement: >40%

2. **Performance**
   - P95 processing time: <15 seconds
   - Queue throughput: >100 documents/hour

3. **User Satisfaction**
   - Reduced manual data entry: >50%
   - Improved chronology building: >60%

## Timeline

- **Week 1**: Infrastructure setup, Docker configuration
- **Week 2**: Pipeline integration, storage implementation
- **Week 3**: UI components, testing
- **Week 4**: Optimization, production deployment

## Conclusion

PDF-Extract-Kit integration will transform our document processing capabilities, providing:
- Complete extraction of all document elements
- Better quality entity extraction from enhanced text
- Structured data from tables
- Evidence preservation through image extraction
- Robust handling of poor quality PDFs

This positions our legal system as state-of-the-art in document intelligence.