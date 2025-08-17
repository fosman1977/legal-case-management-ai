# Enterprise Deployment Configuration

This directory contains comprehensive enterprise deployment configurations for the Agentic Case Management system, designed for production-scale deployments with high availability, security, and compliance requirements.

## 🔒 Deployment Architectures

### Data-Isolated Deployment (Recommended for Legal Environments)
**Complete client data isolation with no external data transmission - our core differential**

- **Zero Data Transmission**: Client data never leaves your premises
- **LocalAI Processing**: On-premises AI with no cloud dependencies
- **Client Confidentiality**: Absolute protection of attorney-client privilege
- **Secure Updates**: Software updates without exposing case data
- **Compliance Ready**: GDPR, HIPAA, SOX compliant by design

See [README-DATA-ISOLATED.md](./README-DATA-ISOLATED.md) for complete data-isolated deployment guide.

### Hybrid Cloud Deployment (Optional)
**For organizations requiring some cloud integration**

- **Container Orchestration**: Kubernetes (EKS) with multi-node groups
- **Database**: Amazon Aurora PostgreSQL with Multi-AZ
- **Cache**: Amazon ElastiCache Redis with clustering
- **Storage**: S3 buckets with encryption and lifecycle policies
- **Load Balancing**: AWS Application Load Balancer with SSL termination
- **Monitoring**: Prometheus, Grafana, and CloudWatch integration
- **Security**: KMS encryption, IAM roles, and security groups
- **Backup**: Automated encrypted backups with retention policies

### Node Groups

1. **Compute Nodes**: Application workloads (m5.xlarge, auto-scaling 3-20)
2. **Storage Nodes**: Database and persistent storage (r5.large, dedicated)
3. **Cache Nodes**: Redis and caching workloads (m5.large, spot instances)

## 🚀 Deployment Options

### 1. Data-Isolated Docker Compose (Recommended)

```bash
# Deploy data-isolated environment
docker-compose -f deployment/enterprise/data-isolated/docker-compose.yml up -d

# Verify data isolation
./scripts/verify-data-isolation.sh

# Check services
docker-compose -f deployment/enterprise/data-isolated/docker-compose.yml ps
```

### 2. Data-Isolated Kubernetes (Production)

```bash
# Deploy to data-isolated Kubernetes cluster
kubectl apply -f deployment/enterprise/data-isolated/kubernetes/

# Check deployment
kubectl get pods -n agentic-data-isolated
kubectl get services -n agentic-data-isolated
```

### 3. Hybrid Cloud Docker Compose (Development/Testing)

```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Deploy the stack
docker-compose -f deployment/enterprise/docker-compose.yml up -d

# Check services
docker-compose -f deployment/enterprise/docker-compose.yml ps
```

### 4. Hybrid Cloud Kubernetes Deployment

```bash
# Create namespace and resources
kubectl apply -f deployment/enterprise/kubernetes/namespace.yaml

# Deploy secrets and config maps
kubectl apply -f deployment/enterprise/kubernetes/secrets.yaml
kubectl apply -f deployment/enterprise/kubernetes/configmaps.yaml

# Deploy databases
kubectl apply -f deployment/enterprise/kubernetes/database.yaml

# Deploy application
kubectl apply -f deployment/enterprise/kubernetes/deployment.yaml

# Deploy monitoring stack
kubectl apply -f deployment/enterprise/kubernetes/monitoring.yaml
```

### 5. Terraform Infrastructure (AWS - Hybrid Cloud Only)

```bash
# Initialize Terraform
cd deployment/enterprise/terraform
terraform init

# Plan infrastructure
terraform plan -var-file="production.tfvars"

# Apply infrastructure
terraform apply -var-file="production.tfvars"

# Get kubeconfig
aws eks update-kubeconfig --region us-west-2 --name agentic-case-management
```

## 🔧 Configuration

### Environment Variables

Required environment variables for production deployment:

```bash
# Database
POSTGRES_PASSWORD=<secure-password>
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/agentic_case_management

# Cache
REDIS_URL=redis://<host>:6379
REDIS_PASSWORD=<secure-password>

# Security
JWT_SECRET=<64-char-random-string>
ENCRYPTION_KEY=<32-char-random-string>

# Storage
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
S3_BACKUP_BUCKET=<backup-bucket-name>

# SSL/TLS
ACME_EMAIL=admin@company.com

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<secure-password>

# AWS (for Terraform)
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_REGION=us-west-2
```

### Storage Configuration

#### Persistent Volumes

```yaml
# Fast SSD for databases
storageClassName: "fast-ssd"
parameters:
  type: "gp3"
  iops: "3000"
  throughput: "125"
  encrypted: "true"

# Standard SSD for application data
storageClassName: "standard-ssd"
parameters:
  type: "gp3"
  encrypted: "true"
```

#### Backup Strategy

- **Database Backups**: Automated daily backups with 90-day retention
- **Application Data**: Real-time replication to S3 with versioning
- **Disaster Recovery**: Cross-region replication for critical data
- **Encryption**: All backups encrypted with KMS keys

### Security Configuration

#### Network Security

- **VPC**: Isolated network with private/public subnets
- **Security Groups**: Restrictive rules for each service
- **WAF**: Web Application Firewall for public endpoints
- **TLS**: End-to-end encryption with certificate management

#### Access Control

- **RBAC**: Kubernetes Role-Based Access Control
- **IAM**: AWS Identity and Access Management integration
- **MFA**: Multi-factor authentication for admin access
- **Audit Logging**: Comprehensive access and change tracking

#### Data Protection

- **Encryption at Rest**: All data encrypted with KMS
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Management**: Automated key rotation and secure storage
- **Data Classification**: Support for multiple sensitivity levels

## 📊 Monitoring and Observability

### Metrics Collection

- **Application Metrics**: Custom metrics via Prometheus
- **Infrastructure Metrics**: Node and container metrics
- **Database Metrics**: Performance and health monitoring
- **Business Metrics**: User activity and system usage

### Log Management

- **Centralized Logging**: All logs aggregated in Elasticsearch
- **Log Analysis**: Kibana dashboards for log exploration
- **Alerting**: Automated alerts for critical events
- **Retention**: Configurable log retention policies

### Health Checks

- **Liveness Probes**: Container health monitoring
- **Readiness Probes**: Service availability checks
- **Startup Probes**: Application initialization monitoring
- **External Monitoring**: Third-party uptime monitoring

## 🔄 CI/CD Integration

### GitOps Workflow

```yaml
# Example GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name agentic-case-management
        kubectl apply -k deployment/enterprise/kubernetes/
```

### Rolling Updates

- **Zero-downtime deployments** with rolling update strategy
- **Blue-green deployments** for major releases
- **Canary deployments** for gradual rollouts
- **Automated rollback** on deployment failures

## 🛠️ Maintenance and Operations

### Scaling

#### Horizontal Pod Autoscaler

```yaml
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### Cluster Autoscaler

- **Automatic node scaling** based on resource demands
- **Multiple node groups** for different workload types
- **Spot instance integration** for cost optimization
- **Scheduled scaling** for predictable load patterns

### Backup and Recovery

#### Automated Backups

```bash
# Database backup (daily at 3 AM)
0 3 * * * /usr/local/bin/backup-postgres.sh

# Application data backup (hourly)
0 * * * * /usr/local/bin/backup-app-data.sh

# Configuration backup (weekly)
0 0 * * 0 /usr/local/bin/backup-configs.sh
```

#### Disaster Recovery

- **RTO**: Recovery Time Objective < 4 hours
- **RPO**: Recovery Point Objective < 15 minutes
- **Multi-region setup** for catastrophic failure recovery
- **Regular DR testing** and validation procedures

### Updates and Patching

#### Security Updates

- **Automated security patches** for base images
- **Vulnerability scanning** with Trivy
- **CVE monitoring** and alerting
- **Emergency patching** procedures

#### Application Updates

- **Staged rollouts** through multiple environments
- **Feature flags** for controlled feature releases
- **A/B testing** capabilities
- **Performance regression testing**

## 🔒 Compliance and Governance

### Regulatory Compliance

- **GDPR**: Data protection and privacy controls
- **HIPAA**: Healthcare data security requirements
- **SOX**: Financial data compliance and audit trails
- **ISO 27001**: Information security management

### Audit and Logging

- **Comprehensive audit trails** for all system access
- **Immutable log storage** for forensic analysis
- **Compliance reporting** automation
- **Data retention policies** aligned with regulations

### Data Governance

- **Data classification** and handling procedures
- **Access controls** based on data sensitivity
- **Data lifecycle management** and retention
- **Privacy by design** principles implementation

## 📞 Support and Troubleshooting

### Common Issues

#### Pod Startup Failures

```bash
# Check pod status
kubectl get pods -n agentic-case-management

# View pod logs
kubectl logs <pod-name> -n agentic-case-management

# Describe pod for events
kubectl describe pod <pod-name> -n agentic-case-management
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it <app-pod> -n agentic-case-management -- psql $DATABASE_URL

# Check database logs
kubectl logs <postgres-pod> -n agentic-case-management
```

#### Performance Issues

```bash
# Check resource usage
kubectl top pods -n agentic-case-management
kubectl top nodes

# View metrics in Grafana
open http://grafana.company.com
```

### Emergency Procedures

#### Security Incident Response

1. **Immediate isolation** of affected components
2. **Incident documentation** and stakeholder notification
3. **Forensic analysis** and evidence preservation
4. **Recovery planning** and execution
5. **Post-incident review** and improvement

#### Service Recovery

1. **Service health assessment** and impact analysis
2. **Rollback procedures** if recent deployment
3. **Database recovery** from latest backup if needed
4. **Traffic rerouting** to healthy instances
5. **Root cause analysis** and prevention measures

## 📚 Additional Resources

### Documentation

- [Kubernetes Operations Guide](./docs/kubernetes-operations.md)
- [Database Administration Guide](./docs/database-admin.md)
- [Security Hardening Guide](./docs/security-hardening.md)
- [Monitoring and Alerting Guide](./docs/monitoring-guide.md)

### External References

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/high-availability.html)
- [Prometheus Monitoring Best Practices](https://prometheus.io/docs/practices/)

---

**Note**: This enterprise deployment configuration is designed for production use with high availability, security, and compliance requirements. Ensure all security configurations are properly reviewed and tested before deployment to production environments.