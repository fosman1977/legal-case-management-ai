# Data-Isolated Enterprise Deployment

This configuration provides a data-isolated deployment of the Agentic Case Management system where client data never leaves your premises. This is the core differential for secure legal environments.

## 🔒 Data-Isolated Architecture Overview

### Complete Client Data Protection
- **Zero Data Transmission**: Client case data never leaves your network
- **Local-Only Processing**: All AI analysis happens on your hardware
- **LocalAI Integration**: On-premises AI processing without cloud dependencies
- **Secure Update Channel**: Software updates isolated from case data

### Infrastructure Components

#### Hardware Requirements (Bare Metal)
- **Control Plane**: 3x servers (16 cores, 64GB RAM, 500GB SSD)
- **Compute Nodes**: 5x servers (32 cores, 128GB RAM, 1TB NVMe)
- **Storage Nodes**: 3x servers (16 cores, 64GB RAM, 4TB SSD + 10TB HDD)
- **Network**: 10Gb switched network with VLAN isolation
- **Power**: Redundant UPS and power distribution

#### Software Stack
- **OS**: Rocky Linux 9 (or RHEL 9) - hardened configuration
- **Container Runtime**: Podman/Docker with air-gapped registry
- **Orchestration**: Kubernetes (K3s for simplicity)
- **Database**: PostgreSQL 15 with streaming replication
- **Cache**: Redis 7 with clustering
- **AI Engine**: LocalAI with Ollama backend
- **Monitoring**: Prometheus, Grafana (no external exporters)

## 🚀 Deployment Options

### 1. Single-Node Development (Minimum Viable)

```bash
# Hardware: 1x server (32 cores, 128GB RAM, 2TB NVMe)
# Install Rocky Linux 9
sudo dnf update -y
sudo dnf install -y podman podman-compose

# Deploy air-gapped stack
podman-compose -f deployment/enterprise/airgapped/docker-compose.yml up -d
```

### 2. High-Availability Production Cluster

```bash
# Multi-node Kubernetes cluster
# Copy installation media to air-gapped environment
./scripts/airgapped-install.sh

# Deploy to cluster
kubectl apply -f deployment/enterprise/airgapped/kubernetes/
```

### 3. Distributed Campus Deployment

```bash
# Multiple sites with local replication
# Site-to-site VPN for data synchronization
./scripts/multi-site-deploy.sh
```

## 🏗️ Air-Gapped Installation Process

### Pre-Installation Requirements

#### 1. Offline Installation Media
```bash
# Create installation bundle (on connected system)
./scripts/create-airgapped-bundle.sh

# Contents:
# - OS installation media
# - Container images (saved as tar files)
# - Kubernetes binaries
# - Application packages
# - Security certificates
# - Documentation
```

#### 2. Network Configuration
```bash
# Internal network ranges
MANAGEMENT_NETWORK="10.10.0.0/24"
APPLICATION_NETWORK="10.20.0.0/24" 
STORAGE_NETWORK="10.30.0.0/24"
BACKUP_NETWORK="10.40.0.0/24"

# No default gateway to internet
# DNS servers point to internal resolvers only
```

#### 3. Security Hardening
```bash
# Disable all external interfaces
nmcli connection modify external-interface autoconnect no

# Configure host-based firewall
firewall-cmd --permanent --zone=trusted --add-source=10.10.0.0/24
firewall-cmd --permanent --zone=drop --change-interface=external-interface
firewall-cmd --reload

# Enable SELinux in enforcing mode
setenforce 1
```

### Installation Steps

#### 1. Base System Setup
```bash
# Install from offline media
sudo ./scripts/install-base-system.sh

# Configure internal repositories
sudo ./scripts/setup-internal-repos.sh

# Install container runtime
sudo ./scripts/install-podman.sh
```

#### 2. Kubernetes Cluster Setup
```bash
# Initialize control plane (on master node)
sudo ./scripts/init-k8s-master.sh

# Join worker nodes
sudo ./scripts/join-k8s-worker.sh

# Verify cluster
kubectl get nodes
```

#### 3. Application Deployment
```bash
# Load container images from bundle
sudo ./scripts/load-container-images.sh

# Deploy database layer
kubectl apply -f airgapped/kubernetes/database/

# Deploy application layer
kubectl apply -f airgapped/kubernetes/application/

# Deploy monitoring
kubectl apply -f airgapped/kubernetes/monitoring/
```

## 📁 Air-Gapped Directory Structure

```
deployment/enterprise/airgapped/
├── docker-compose.yml           # Single-node deployment
├── kubernetes/
│   ├── namespace.yaml          # Isolated namespace
│   ├── database/
│   │   ├── postgres.yaml       # PostgreSQL StatefulSet
│   │   └── redis.yaml          # Redis cluster
│   ├── application/
│   │   ├── deployment.yaml     # Main application
│   │   ├── localai.yaml        # LocalAI service
│   │   └── services.yaml       # Internal services
│   ├── storage/
│   │   ├── pv.yaml             # Persistent volumes
│   │   └── storage-class.yaml  # Local storage classes
│   └── monitoring/
│       ├── prometheus.yaml     # Metrics collection
│       └── grafana.yaml        # Dashboards
├── scripts/
│   ├── create-airgapped-bundle.sh
│   ├── install-base-system.sh
│   ├── setup-internal-repos.sh
│   └── deploy-airgapped.sh
└── configs/
    ├── localai/
    │   └── models.yaml         # AI model configuration
    ├── security/
    │   └── hardening.yaml      # Security policies
    └── backup/
        └── backup-config.yaml  # Internal backup strategy
```

## 🔧 Configuration

### LocalAI Configuration
```yaml
# configs/localai/models.yaml
models:
  - name: legal-analyzer
    backend: llama
    model: /models/legal-llama-7b.gguf
    context_size: 4096
    threads: 8
    gpu_layers: 0  # CPU-only for security
    
  - name: document-classifier
    backend: bert
    model: /models/legal-bert-base
    max_length: 512
```

### Storage Configuration
```yaml
# Local storage only - no cloud dependencies
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-fast-ssd
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

### Network Policies
```yaml
# Deny all external traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-external
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: agentic-case-management
    - podSelector: {}
```

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: All data encrypted with LUKS
- **Encryption in Transit**: TLS 1.3 for all internal communications
- **Key Management**: Hardware Security Module (HSM) integration
- **Access Control**: Certificate-based authentication

### Audit and Compliance
- **Complete Audit Trail**: All actions logged internally
- **Immutable Logs**: Write-once storage for forensic analysis
- **Compliance Reports**: GDPR, HIPAA, SOX reporting without external dependencies
- **Data Residency**: All data remains within controlled environment

### Physical Security
- **Tamper Detection**: Hardware monitoring for physical access
- **Secure Boot**: UEFI Secure Boot with custom keys
- **Hardware Attestation**: TPM-based integrity verification

## 📊 Monitoring (Internal Only)

### Metrics Collection
```yaml
# Internal Prometheus configuration
global:
  external_labels:
    environment: airgapped
    location: on-premises
    
scrape_configs:
- job_name: kubernetes-pods
  kubernetes_sd_configs:
  - role: pod
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
    action: keep
    regex: true
```

### Dashboard Access
- **Internal Grafana**: http://monitoring.internal.local
- **Alerting**: Email via internal SMTP relay
- **No External Dependencies**: All monitoring self-contained

## 🔄 Data Management

### Backup Strategy
```bash
# Internal backup to dedicated storage nodes
# Daily full backups
0 2 * * * /opt/agentic/scripts/backup-full.sh

# Hourly incremental backups
0 * * * * /opt/agentic/scripts/backup-incremental.sh

# Weekly backup verification
0 4 * * 0 /opt/agentic/scripts/verify-backups.sh
```

### Data Synchronization
```bash
# Site-to-site replication (if multiple locations)
# Encrypted tunnel between sites
# Scheduled data sync

# Master site to DR site
rsync -avz --delete \
  -e "ssh -i /etc/ssl/private/site-sync.key" \
  /var/lib/agentic/data/ \
  backup-site:/var/lib/agentic/data/
```

## 🛠️ Maintenance

### Updates and Patching
```bash
# Security updates via internal repository
sudo dnf update --security

# Application updates via container refresh
kubectl set image deployment/agentic-app \
  agentic-app=internal-registry:5000/agentic:v1.1.0

# Rolling update with zero downtime
kubectl rollout status deployment/agentic-app
```

### Health Monitoring
```bash
# System health check
./scripts/health-check.sh

# Database integrity check
./scripts/db-integrity-check.sh

# Application performance test
./scripts/performance-test.sh
```

## 📞 Support and Troubleshooting

### Common Air-Gapped Issues

#### Container Image Issues
```bash
# Load images from backup
sudo podman load -i /opt/agentic/images/agentic-app-v1.0.tar

# Verify image availability
sudo podman images | grep agentic
```

#### Network Connectivity
```bash
# Test internal networking
ping monitoring.internal.local
curl -k https://app.internal.local/health

# Check DNS resolution
nslookup postgres.agentic-case-management.svc.cluster.local
```

#### Storage Issues
```bash
# Check local storage
df -h /var/lib/agentic
lsblk

# Verify PV availability
kubectl get pv
kubectl get pvc -n agentic-case-management
```

### Emergency Procedures

#### Disaster Recovery
1. **Boot from backup media**
2. **Restore from encrypted backups**
3. **Verify data integrity**
4. **Resume operations**

#### Security Incident
1. **Isolate affected systems**
2. **Preserve forensic evidence**
3. **Activate incident response team**
4. **Document all actions**

## 🎯 Performance Optimization

### Hardware Tuning
```bash
# Optimize for legal document processing
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'vm.dirty_ratio=5' >> /etc/sysctl.conf

# Optimize storage for large files
echo 'deadline' > /sys/block/sda/queue/scheduler

# CPU governor for consistent performance
cpupower frequency-set -g performance
```

### Application Tuning
```yaml
# Kubernetes resource optimization
resources:
  requests:
    cpu: "4"
    memory: "8Gi"
  limits:
    cpu: "8"
    memory: "16Gi"

# LocalAI optimization for legal workloads
env:
- name: LLAMACPP_PARALLEL
  value: "4"
- name: LLAMACPP_THREADS
  value: "16"
```

---

**Note**: This air-gapped deployment ensures complete isolation from external networks while maintaining enterprise-grade functionality for legal case management. All components are designed to operate without internet connectivity, providing the ultimate in data security and compliance.