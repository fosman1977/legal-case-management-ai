# PDF Extraction Models

## Tesseract OCR Models

These models enable offline OCR (Optical Character Recognition) for scanned PDF documents:

### Essential Models:
- **eng.traineddata** - English (primary language for legal documents)  
- **osd.traineddata** - Orientation & Script Detection (auto-detects text direction)

### Manual Download Required:
Due to network restrictions, download manually from:
- https://github.com/tesseract-ocr/tessdata_best

### Installation:
1. Download the .traineddata files
2. Place them in: models/tessdata/
3. Replace any placeholder files

### Air-Gapped Deployment:
After downloading, your system can process PDFs completely offline.

### Model Quality:
These are the "best" quality models from Tesseract, providing higher accuracy than "fast" models.

Generated on: 2025-08-10T20:17:38.723Z
