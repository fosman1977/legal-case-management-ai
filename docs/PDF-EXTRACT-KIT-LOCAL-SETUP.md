# PDF-Extract-Kit Local Installation Guide

## Alternative to Docker: Local Python Installation

PDF-Extract-Kit can run locally without Docker, making integration much simpler!

## Local Installation Steps

### 1. Python Environment Setup
```bash
# Create conda environment (recommended)
conda create -n pdf-extract-kit python=3.10
conda activate pdf-extract-kit

# OR use venv if conda not available
python -m venv pdf-extract-kit-env
source pdf-extract-kit-env/bin/activate  # Linux/Mac
# pdf-extract-kit-env\Scripts\activate  # Windows
```

### 2. Install PDF-Extract-Kit
```bash
# Clone repository
git clone https://github.com/opendatalab/PDF-Extract-Kit.git
cd PDF-Extract-Kit

# Install dependencies
pip install -r requirements.txt

# Install DocLayout-YOLO
pip install doclayout-yolo==0.0.2
```

### 3. Download Models
```bash
# Download required models (run Python script)
python scripts/download_models.py

# Or manually download from HuggingFace/ModelScope
# Models will be cached in ~/.cache/huggingface/
```

### 4. Test Installation
```bash
# Test layout detection
python demo/demo_layout.py --pdf sample.pdf

# Test table extraction  
python demo/demo_table.py --pdf sample.pdf

# Test OCR
python demo/demo_ocr.py --pdf sample.pdf
```

## Integration Options

### Option A: Python Subprocess (Simplest)
Run PDF-Extract-Kit as subprocess from Node.js/TypeScript:

```typescript
// src/services/localPDFExtractService.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export class LocalPDFExtractService {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    this.pythonPath = process.env.PDF_EXTRACT_PYTHON_PATH || 'python';
    this.scriptPath = process.env.PDF_EXTRACT_SCRIPT_PATH || '../PDF-Extract-Kit';
  }

  async extractDocument(pdfBuffer: ArrayBuffer): Promise<any> {
    // Save PDF to temp file
    const tempPdfPath = `/tmp/extract_${Date.now()}.pdf`;
    await fs.writeFile(tempPdfPath, new Uint8Array(pdfBuffer));

    // Run extraction script
    const result = await this.runPythonScript('extract_all.py', [tempPdfPath]);
    
    // Clean up
    await fs.unlink(tempPdfPath);
    
    return JSON.parse(result);
  }

  private runPythonScript(script: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptPath, 'scripts', script);
      const process = spawn(this.pythonPath, [scriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data.toString());
      process.stderr.on('data', (data) => stderr += data.toString());
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });
    });
  }
}
```

### Option B: Direct Python Integration (Node.js + Python)
Use python-shell npm package:

```bash
npm install python-shell
```

```typescript
// More robust Python integration
import { PythonShell } from 'python-shell';

export class PythonPDFExtractService {
  async extractDocument(pdfPath: string): Promise<any> {
    const options = {
      mode: 'text' as const,
      pythonPath: process.env.PDF_EXTRACT_PYTHON_PATH || 'python',
      scriptPath: process.env.PDF_EXTRACT_SCRIPT_PATH || '../PDF-Extract-Kit/scripts',
      args: [pdfPath, '--output-json']
    };

    return new Promise((resolve, reject) => {
      PythonShell.run('extract_document.py', options, (err, results) => {
        if (err) reject(err);
        else resolve(JSON.parse(results?.[0] || '{}'));
      });
    });
  }
}
```

### Option C: HTTP Server (Recommended)
Run local Python HTTP server:

```python
# scripts/local_server.py
from flask import Flask, request, jsonify
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from pdf_extract_kit import extract_layout, extract_tables, extract_ocr

app = Flask(__name__)

@app.route('/extract', methods=['POST'])
def extract_pdf():
    pdf_file = request.files['file']
    
    # Save temporarily
    temp_path = f'/tmp/{pdf_file.filename}'
    pdf_file.save(temp_path)
    
    try:
        # Extract using PDF-Extract-Kit
        layout = extract_layout(temp_path)
        tables = extract_tables(temp_path)
        text = extract_ocr(temp_path)
        
        result = {
            'layout': layout,
            'tables': tables,
            'text': text,
            'metadata': {
                'pages': len(layout.get('pages', [])),
                'tables_count': len(tables)
            }
        }
        
        return jsonify(result)
        
    finally:
        os.remove(temp_path)

if __name__ == '__main__':
    app.run(host='localhost', port=8001)
```

Start server:
```bash
cd PDF-Extract-Kit
conda activate pdf-extract-kit
python scripts/local_server.py
```

Then use our existing TypeScript service unchanged!

## Recommended Approach: Local HTTP Server

### Advantages:
✅ **No Docker complexity**  
✅ **Faster startup** (no container overhead)  
✅ **Easier development** (direct Python debugging)  
✅ **Lower resource usage**  
✅ **Same API interface** (our TypeScript service works unchanged)  

### Setup Steps:
1. **Install PDF-Extract-Kit locally** (10 minutes)
2. **Create simple Python HTTP server** (5 minutes)  
3. **Start server on localhost:8001** (1 command)
4. **Use existing TypeScript service** (no changes needed)

### Performance Comparison:
- **Docker**: Container startup + overhead + networking
- **Local**: Direct Python execution (2-3x faster startup)

### Development Workflow:
```bash
# Terminal 1: Start PDF extraction server
cd PDF-Extract-Kit
conda activate pdf-extract-kit
python scripts/local_server.py

# Terminal 2: Start your React app
cd your-legal-system
npm run dev
```

## Model Storage
- Models download to `~/.cache/huggingface/` (3-5GB total)
- One-time download, then cached locally
- No internet required after initial setup

## Environment Variables
```bash
# .env file
PDF_EXTRACT_KIT_URL=http://localhost:8001
PDF_EXTRACT_PYTHON_PATH=/path/to/conda/envs/pdf-extract-kit/bin/python
PDF_EXTRACT_SCRIPT_PATH=/path/to/PDF-Extract-Kit
```

This approach is **much simpler than Docker** and gives us the same capabilities!