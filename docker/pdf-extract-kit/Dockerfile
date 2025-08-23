# PDF-Extract-Kit Docker Container
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone PDF-Extract-Kit repository
RUN git clone https://github.com/opendatalab/PDF-Extract-Kit.git .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir \
    torch==2.0.1 \
    torchvision==0.15.2 \
    paddlepaddle==2.5.1 \
    paddleocr==2.7.0.3 \
    transformers==4.35.0 \
    opencv-python==4.8.1.78 \
    Pillow==10.1.0 \
    numpy==1.24.3 \
    pandas==2.0.3

# Install PDF-Extract-Kit requirements
COPY requirements.txt requirements-custom.txt
RUN pip install --no-cache-dir -r requirements-custom.txt || true

# Create API server wrapper
COPY api_server.py /app/api_server.py

# Download models (this will be done at runtime to reduce image size)
# RUN python scripts/download_models.py

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run API server
CMD ["python", "api_server.py"]