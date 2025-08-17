#!/bin/bash

# Air-Gapped Bundle Creation Script
# Creates a complete offline installation package for air-gapped environments
# Run this script on a system with internet access

set -e

BUNDLE_VERSION="1.0.0"
BUNDLE_DIR="agentic-airgapped-bundle-${BUNDLE_VERSION}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

echo "🚀 Creating Air-Gapped Bundle for Agentic Case Management System"
echo "Bundle Version: ${BUNDLE_VERSION}"
echo "Bundle Directory: ${BUNDLE_DIR}"

# Create bundle directory structure
mkdir -p "${BUNDLE_DIR}"/{containers,os,kubernetes,models,configs,scripts,docs}

echo "📁 Creating directory structure..."

# Function to log progress
log_progress() {
    echo "✅ $1"
}

# Download container images
echo "📦 Downloading container images..."

IMAGES=(
    "postgres:15-alpine"
    "redis:7-alpine"
    "localai/localai:latest"
    "nginx:alpine"
    "prom/prometheus:latest"
    "grafana/grafana:latest"
    "elastic/filebeat:8.10.0"
    "andyshinn/dnsmasq:latest"
    "agentic/case-management:latest"
    "agentic/document-processor:latest"
    "agentic/backup-service:latest"
    "agentic/health-monitor:latest"
)

for image in "${IMAGES[@]}"; do
    echo "Pulling ${image}..."
    docker pull "${image}"
    
    # Save image to tar file
    image_name=$(echo "${image}" | tr '/:' '_')
    docker save "${image}" > "${BUNDLE_DIR}/containers/${image_name}.tar"
    log_progress "Saved ${image}"
done

# Download Kubernetes binaries
echo "☸️ Downloading Kubernetes binaries..."

K8S_VERSION="v1.28.4"
KUBECTL_URL="https://dl.k8s.io/release/${K8S_VERSION}/bin/linux/amd64/kubectl"
KUBEADM_URL="https://dl.k8s.io/release/${K8S_VERSION}/bin/linux/amd64/kubeadm"
KUBELET_URL="https://dl.k8s.io/release/${K8S_VERSION}/bin/linux/amd64/kubelet"

wget -O "${BUNDLE_DIR}/kubernetes/kubectl" "${KUBECTL_URL}"
wget -O "${BUNDLE_DIR}/kubernetes/kubeadm" "${KUBEADM_URL}"
wget -O "${BUNDLE_DIR}/kubernetes/kubelet" "${KUBELET_URL}"

chmod +x "${BUNDLE_DIR}/kubernetes/"*
log_progress "Downloaded Kubernetes binaries"

# Download OS packages (Rocky Linux 9)
echo "🐧 Downloading OS packages..."

# Create repository mirror script
cat > "${BUNDLE_DIR}/scripts/create-local-repo.sh" << 'EOF'
#!/bin/bash
# Creates local package repository for air-gapped installation

set -e

REPO_DIR="/var/lib/agentic/repo"
mkdir -p "$REPO_DIR"

# Download essential packages
PACKAGES=(
    "podman"
    "podman-compose"
    "container-selinux"
    "containernetworking-plugins"
    "runc"
    "crun"
    "slirp4netns"
    "fuse-overlayfs"
    "openssl"
    "firewalld"
    "rsync"
    "htop"
    "vim"
    "curl"
    "wget"
    "git"
)

echo "Downloading packages to ${REPO_DIR}..."
dnf download --downloaddir="$REPO_DIR" --resolve "${PACKAGES[@]}"

# Create repository metadata
createrepo "$REPO_DIR"

echo "Local repository created at $REPO_DIR"
EOF

chmod +x "${BUNDLE_DIR}/scripts/create-local-repo.sh"
log_progress "Created local repository setup script"

# Download AI Models
echo "🤖 Downloading AI models..."

MODEL_DIR="${BUNDLE_DIR}/models"
mkdir -p "$MODEL_DIR"

# Download legal-specific models (these would be actual model files in production)
cat > "${MODEL_DIR}/download-models.sh" << 'EOF'
#!/bin/bash
# Download AI models for legal document processing
# Note: In production, download actual model files

set -e

MODEL_DIR="/var/lib/agentic/models"
mkdir -p "$MODEL_DIR"

echo "Downloading legal AI models..."

# Legal document classification model (7B parameters)
# wget -O "$MODEL_DIR/legal-llama-7b.gguf" "https://huggingface.co/legal-models/llama-7b-legal/resolve/main/legal-llama-7b.gguf"

# Legal BERT model for entity extraction
# wget -O "$MODEL_DIR/legal-bert-base.bin" "https://huggingface.co/legal-models/bert-base-legal/resolve/main/pytorch_model.bin"

# Case law similarity model
# wget -O "$MODEL_DIR/case-similarity.gguf" "https://huggingface.co/legal-models/case-similarity/resolve/main/model.gguf"

# Create placeholder files for demo
echo "# Legal LLaMA 7B Model Placeholder" > "$MODEL_DIR/legal-llama-7b.gguf"
echo "# Legal BERT Model Placeholder" > "$MODEL_DIR/legal-bert-base.bin"
echo "# Case Similarity Model Placeholder" > "$MODEL_DIR/case-similarity.gguf"

echo "AI models downloaded to $MODEL_DIR"
EOF

chmod +x "${MODEL_DIR}/download-models.sh"
log_progress "Created AI model download script"

# Copy configuration files
echo "⚙️ Copying configuration files..."

cp -r "${PROJECT_ROOT}/deployment/enterprise/airgapped/configs" "${BUNDLE_DIR}/"
cp -r "${PROJECT_ROOT}/deployment/enterprise/airgapped/kubernetes" "${BUNDLE_DIR}/"
cp "${PROJECT_ROOT}/deployment/enterprise/airgapped/docker-compose.yml" "${BUNDLE_DIR}/"

log_progress "Copied configuration files"

# Create installation scripts
echo "📜 Creating installation scripts..."

# Main installation script
cat > "${BUNDLE_DIR}/install.sh" << 'EOF'
#!/bin/bash

# Air-Gapped Installation Script for Agentic Case Management System
set -e

INSTALL_DIR="/opt/agentic"
DATA_DIR="/var/lib/agentic"
LOG_DIR="/var/log/agentic"

echo "🚀 Installing Agentic Case Management System (Air-Gapped)"
echo "Installation Directory: $INSTALL_DIR"
echo "Data Directory: $DATA_DIR"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Create directories
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$LOG_DIR"
mkdir -p "$DATA_DIR"/{postgres,redis,models,app_data,backups,prometheus,grafana}

echo "✅ Created directory structure"

# Install Kubernetes binaries
cp kubernetes/* /usr/local/bin/
chmod +x /usr/local/bin/{kubectl,kubeadm,kubelet}

echo "✅ Installed Kubernetes binaries"

# Load container images
echo "📦 Loading container images..."
for image_file in containers/*.tar; do
    echo "Loading $(basename "$image_file")..."
    docker load -i "$image_file"
done

echo "✅ Loaded all container images"

# Copy configuration files
cp -r configs/* "$INSTALL_DIR/"
cp docker-compose.yml "$INSTALL_DIR/"

echo "✅ Copied configuration files"

# Set up models
echo "🤖 Setting up AI models..."
models/download-models.sh

echo "✅ AI models configured"

# Configure firewall
echo "🔥 Configuring firewall..."
systemctl enable firewalld
systemctl start firewalld

# Allow internal networks only
firewall-cmd --permanent --zone=trusted --add-source=172.20.0.0/24
firewall-cmd --permanent --zone=trusted --add-source=172.21.0.0/24
firewall-cmd --permanent --zone=trusted --add-port=80/tcp
firewall-cmd --permanent --zone=trusted --add-port=443/tcp
firewall-cmd --reload

echo "✅ Firewall configured"

# Set ownership and permissions
chown -R 1001:1001 "$DATA_DIR"/{app_data,backups}
chown -R 999:999 "$DATA_DIR"/{postgres,redis}
chown -R 65534:65534 "$DATA_DIR"/prometheus
chown -R 472:472 "$DATA_DIR"/grafana

chmod 700 "$DATA_DIR"/postgres
chmod 755 "$DATA_DIR"/{redis,models,app_data,backups,prometheus,grafana}

echo "✅ Set permissions"

# Create systemd service
cat > /etc/systemd/system/agentic.service << 'EOL'
[Unit]
Description=Agentic Case Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/agentic
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable agentic.service

echo "✅ Created systemd service"

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "To start the system:"
echo "  systemctl start agentic"
echo ""
echo "To check status:"
echo "  systemctl status agentic"
echo "  docker-compose -f /opt/agentic/docker-compose.yml ps"
echo ""
echo "Web interface will be available at:"
echo "  http://localhost (after starting)"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: (check /opt/agentic/.env file)"
echo ""
EOF

chmod +x "${BUNDLE_DIR}/install.sh"

# Create uninstall script
cat > "${BUNDLE_DIR}/uninstall.sh" << 'EOF'
#!/bin/bash

# Uninstall script for Agentic Case Management System
set -e

echo "🗑️ Uninstalling Agentic Case Management System"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

# Stop and disable service
systemctl stop agentic || true
systemctl disable agentic || true
rm -f /etc/systemd/system/agentic.service
systemctl daemon-reload

# Stop containers
cd /opt/agentic
docker-compose down -v || true

# Remove installation directory
rm -rf /opt/agentic

# Remove data directory (optional)
read -p "Remove all data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf /var/lib/agentic
    rm -rf /var/log/agentic
    echo "✅ Data removed"
fi

echo "✅ Uninstallation completed"
EOF

chmod +x "${BUNDLE_DIR}/uninstall.sh"

log_progress "Created installation scripts"

# Create documentation
echo "📚 Creating documentation..."

cp "${PROJECT_ROOT}/deployment/enterprise/README-AIRGAPPED.md" "${BUNDLE_DIR}/docs/"

# Create quick start guide
cat > "${BUNDLE_DIR}/docs/QUICKSTART.md" << 'EOF'
# Quick Start Guide - Air-Gapped Installation

## Prerequisites
- Rocky Linux 9 or RHEL 9
- Minimum 32GB RAM, 16 CPU cores, 2TB storage
- No internet connection required

## Installation Steps

1. Copy bundle to target system
2. Extract bundle: `tar -xzf agentic-airgapped-bundle-*.tar.gz`
3. Run installation: `sudo ./install.sh`
4. Start system: `sudo systemctl start agentic`

## Verification

Check system status:
```bash
sudo systemctl status agentic
sudo docker-compose -f /opt/agentic/docker-compose.yml ps
```

Access web interface:
- URL: http://localhost
- Username: admin
- Password: (check /opt/agentic/.env)

## Support
For support with air-gapped deployment, contact your system administrator.
EOF

log_progress "Created documentation"

# Create environment file template
cat > "${BUNDLE_DIR}/.env.template" << 'EOF'
# Agentic Case Management System - Air-Gapped Configuration
# Copy this file to .env and customize values

# Database Configuration
POSTGRES_PASSWORD=change_this_secure_password_123

# Security Keys (generate new ones for production)
JWT_SECRET=your_jwt_secret_key_here_64_characters_minimum_length_required
ENCRYPTION_KEY=your_32_character_encryption_key
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key_32_chars

# Monitoring
GRAFANA_ADMIN_PASSWORD=admin_password_change_me

# Application Settings
LOG_LEVEL=info
DEBUG=false
AIRGAPPED_MODE=true
DISABLE_TELEMETRY=true
DISABLE_ANALYTICS=true
EOF

log_progress "Created environment template"

# Create bundle archive
echo "📦 Creating bundle archive..."

tar -czf "${BUNDLE_DIR}.tar.gz" "${BUNDLE_DIR}"
log_progress "Created bundle archive: ${BUNDLE_DIR}.tar.gz"

# Calculate checksums
echo "🔍 Calculating checksums..."
sha256sum "${BUNDLE_DIR}.tar.gz" > "${BUNDLE_DIR}.tar.gz.sha256"
log_progress "Created checksum file"

# Create verification script
cat > "verify-bundle.sh" << 'EOF'
#!/bin/bash
# Verify bundle integrity

BUNDLE_FILE="$1"

if [[ -z "$BUNDLE_FILE" ]]; then
    echo "Usage: $0 <bundle-file.tar.gz>"
    exit 1
fi

if [[ ! -f "$BUNDLE_FILE" ]]; then
    echo "Bundle file not found: $BUNDLE_FILE"
    exit 1
fi

if [[ ! -f "$BUNDLE_FILE.sha256" ]]; then
    echo "Checksum file not found: $BUNDLE_FILE.sha256"
    exit 1
fi

echo "Verifying bundle integrity..."
if sha256sum -c "$BUNDLE_FILE.sha256"; then
    echo "✅ Bundle verification successful"
    exit 0
else
    echo "❌ Bundle verification failed"
    exit 1
fi
EOF

chmod +x verify-bundle.sh
log_progress "Created verification script"

# Cleanup
rm -rf "${BUNDLE_DIR}"

echo ""
echo "🎉 Air-gapped bundle creation completed!"
echo ""
echo "Bundle file: ${BUNDLE_DIR}.tar.gz"
echo "Checksum: ${BUNDLE_DIR}.tar.gz.sha256"
echo "Verification: ./verify-bundle.sh ${BUNDLE_DIR}.tar.gz"
echo ""
echo "Bundle size: $(du -h "${BUNDLE_DIR}.tar.gz" | cut -f1)"
echo ""
echo "Transfer this bundle to your air-gapped environment and run:"
echo "  tar -xzf ${BUNDLE_DIR}.tar.gz"
echo "  cd ${BUNDLE_DIR}"
echo "  sudo ./install.sh"
echo ""
log_progress "Bundle ready for air-gapped deployment"