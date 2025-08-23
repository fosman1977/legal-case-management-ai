#!/bin/bash
# Setup script for PDF-Extract-Kit local installation

set -e  # Exit on any error

echo "🚀 Setting up PDF-Extract-Kit locally..."

# Check if conda is available
if command -v conda &> /dev/null; then
    echo "✅ Conda found"
    USE_CONDA=true
else
    echo "⚠️  Conda not found, using venv"
    USE_CONDA=false
fi

# Set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PDF_EXTRACT_DIR="$PROJECT_ROOT/PDF-Extract-Kit"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 PDF-Extract-Kit will be installed to: $PDF_EXTRACT_DIR"

# Create Python environment
if [ "$USE_CONDA" = true ]; then
    echo "🐍 Creating conda environment..."
    conda create -n pdf-extract-kit python=3.10 -y
    echo "✅ Conda environment created"
    
    echo "📦 Activating environment and installing dependencies..."
    eval "$(conda shell.bash hook)"
    conda activate pdf-extract-kit
else
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv "$PROJECT_ROOT/pdf-extract-kit-env"
    source "$PROJECT_ROOT/pdf-extract-kit-env/bin/activate"
    echo "✅ Virtual environment created"
fi

# Clone PDF-Extract-Kit if not exists
if [ ! -d "$PDF_EXTRACT_DIR" ]; then
    echo "📥 Cloning PDF-Extract-Kit..."
    cd "$PROJECT_ROOT"
    git clone https://github.com/opendatalab/PDF-Extract-Kit.git
    echo "✅ PDF-Extract-Kit cloned"
else
    echo "✅ PDF-Extract-Kit already exists"
fi

cd "$PDF_EXTRACT_DIR"

# Install basic dependencies first
echo "📦 Installing basic dependencies..."
pip install --upgrade pip setuptools wheel

# Install PyMuPDF for basic PDF processing
pip install PyMuPDF

# Install Flask for local server
pip install Flask flask-cors

# Try to install PDF-Extract-Kit requirements
echo "📦 Installing PDF-Extract-Kit requirements..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt || echo "⚠️  Some requirements failed, continuing..."
else
    echo "⚠️  requirements.txt not found, installing essential packages..."
    pip install torch torchvision paddlepaddle paddleocr pillow opencv-python numpy pandas
fi

# Install DocLayout-YOLO
echo "📦 Installing DocLayout-YOLO..."
pip install doclayout-yolo==0.0.2 || echo "⚠️  DocLayout-YOLO installation failed, continuing..."

# Copy our server script
echo "📋 Setting up local server..."
cp "$SCRIPT_DIR/pdf_extract_server.py" "$PDF_EXTRACT_DIR/local_server.py"

# Create startup script
cat > "$PDF_EXTRACT_DIR/start_server.sh" << 'EOF'
#!/bin/bash
# Startup script for PDF extraction server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate environment
if command -v conda &> /dev/null && conda env list | grep -q pdf-extract-kit; then
    echo "🐍 Activating conda environment..."
    eval "$(conda shell.bash hook)"
    conda activate pdf-extract-kit
elif [ -d "../pdf-extract-kit-env" ]; then
    echo "🐍 Activating virtual environment..."
    source "../pdf-extract-kit-env/bin/activate"
else
    echo "⚠️  No Python environment found, using system Python"
fi

echo "🚀 Starting PDF extraction server..."
echo "📍 Server will be available at: http://localhost:8001"
echo "🛑 Press Ctrl+C to stop"

python local_server.py
EOF

chmod +x "$PDF_EXTRACT_DIR/start_server.sh"

# Create environment file template
cat > "$PROJECT_ROOT/.env.pdf-extract" << EOF
# PDF-Extract-Kit Configuration
PDF_EXTRACT_KIT_URL=http://localhost:8001
PDF_EXTRACT_PYTHON_PATH=$(which python)
PDF_EXTRACT_SCRIPT_PATH=$PDF_EXTRACT_DIR
PDF_EXTRACT_MODELS_PATH=$HOME/.cache/huggingface
EOF

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add these variables to your .env file:"
echo "   PDF_EXTRACT_KIT_URL=http://localhost:8001"
echo ""
echo "2. Start the PDF extraction server:"
echo "   cd $PDF_EXTRACT_DIR"
echo "   ./start_server.sh"
echo ""
echo "3. Test the server:"
echo "   curl http://localhost:8001/health"
echo ""
echo "4. Optional: Download models for better extraction:"
if [ "$USE_CONDA" = true ]; then
    echo "   conda activate pdf-extract-kit"
else
    echo "   source $PROJECT_ROOT/pdf-extract-kit-env/bin/activate"
fi
echo "   cd $PDF_EXTRACT_DIR"
echo "   python scripts/download_models.py  # If available"
echo ""
echo "💡 The server will work with basic PyMuPDF extraction even without the full models"