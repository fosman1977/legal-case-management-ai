# Provider Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }

  backend "s3" {
    bucket         = "agentic-terraform-state"
    key            = "agentic-case-management/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "agentic-case-management"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    min_size      = number
    max_size      = number
    desired_size  = number
    disk_size     = number
    labels        = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    compute = {
      instance_types = ["m5.xlarge", "m5.2xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size      = 3
      max_size      = 20
      desired_size  = 5
      disk_size     = 100
      labels = {
        node-type = "compute"
        workload  = "application"
      }
      taints = []
    }
    storage = {
      instance_types = ["r5.large", "r5.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size      = 2
      max_size      = 10
      desired_size  = 3
      disk_size     = 200
      labels = {
        node-type = "storage"
        workload  = "database"
      }
      taints = [{
        key    = "node-type"
        value  = "storage"
        effect = "NO_SCHEDULE"
      }]
    }
    cache = {
      instance_types = ["m5.large"]
      capacity_type  = "SPOT"
      min_size      = 1
      max_size      = 5
      desired_size  = 2
      disk_size     = 50
      labels = {
        node-type = "cache"
        workload  = "cache"
      }
      taints = []
    }
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "case-management.company.com"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 90
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable logging stack"
  type        = bool
  default     = true
}

variable "enable_backup_encryption" {
  description = "Enable backup encryption"
  type        = bool
  default     = true
}

# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Random password generation
resource "random_password" "database_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.4"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i)]
  public_subnets  = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 100)]
  database_subnets = [for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 200)]

  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Kubernetes tags
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "agentic-case-management"
  }
}

# Security Groups
resource "aws_security_group" "rds" {
  name_prefix = "${var.cluster_name}-rds"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-rds-sg"
  }
}

resource "aws_security_group" "elasticache" {
  name_prefix = "${var.cluster_name}-elasticache"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "${var.cluster_name}-elasticache-sg"
  }
}

# RDS Database
resource "aws_db_subnet_group" "main" {
  name       = "${var.cluster_name}-db-subnet-group"
  subnet_ids = module.vpc.database_subnets

  tags = {
    Name = "${var.cluster_name}-db-subnet-group"
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier     = "${var.cluster_name}-aurora"
  engine                = "aurora-postgresql"
  engine_version        = "15.4"
  database_name         = "agentic_case_management"
  master_username       = "postgres"
  master_password       = random_password.database_password.result
  
  backup_retention_period = var.backup_retention_days
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name  = aws_db_subnet_group.main.name
  
  storage_encrypted = true
  kms_key_id       = aws_kms_key.main.arn
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.cluster_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Name        = "${var.cluster_name}-aurora"
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.cluster_name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.r5.large"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_enhanced_monitoring.arn
  
  tags = {
    Name = "${var.cluster_name}-aurora-${count.index}"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_name}-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.cluster_name}-redis"
  description                = "Redis cluster for ${var.cluster_name}"
  
  node_type                  = "cache.r6g.large"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.jwt_secret.result
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }
  
  tags = {
    Name        = "${var.cluster_name}-redis"
    Environment = var.environment
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.21"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # EKS Managed Node Groups
  eks_managed_node_groups = {
    for name, config in var.node_groups : name => {
      instance_types = config.instance_types
      capacity_type  = config.capacity_type
      
      min_size     = config.min_size
      max_size     = config.max_size
      desired_size = config.desired_size
      
      disk_size = config.disk_size
      
      labels = config.labels
      taints = config.taints
      
      vpc_security_group_ids = [aws_security_group.worker_nodes.id]
      
      iam_role_additional_policies = {
        AmazonEBSCSIDriverPolicy = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
      }
    }
  }

  # aws-auth configmap
  manage_aws_auth_configmap = true

  aws_auth_roles = [
    {
      rolearn  = aws_iam_role.admin.arn
      username = "admin"
      groups   = ["system:masters"]
    },
  ]

  tags = {
    Environment = var.environment
    Terraform   = "true"
    Project     = "agentic-case-management"
  }
}

# Additional Security Group for Worker Nodes
resource "aws_security_group" "worker_nodes" {
  name_prefix = "${var.cluster_name}-worker-nodes"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    from_port = 80
    to_port   = 80
    protocol  = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-worker-nodes-sg"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "backups" {
  bucket = "${var.cluster_name}-backups-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name        = "${var.cluster_name}-backups"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "documents" {
  bucket = "${var.cluster_name}-documents-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name        = "${var.cluster_name}-documents"
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# S3 Bucket Configuration
resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.backup_retention_days * 3  # Keep backups 3x longer than DB backups
    }
  }
}

# KMS Key
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.cluster_name}-kms-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.cluster_name}"
  target_key_id = aws_kms_key.main.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "${var.cluster_name}-cluster-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${var.cluster_name}/application"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "${var.cluster_name}-application-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "elasticache" {
  name              = "/aws/elasticache/${var.cluster_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "${var.cluster_name}-elasticache-logs"
    Environment = var.environment
  }
}

# IAM Roles
resource "aws_iam_role" "admin" {
  name = "${var.cluster_name}-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      },
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-admin-role"
    Environment = var.environment
  }
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.cluster_name}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-rds-enhanced-monitoring"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Kubernetes Provider Configuration
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

# Kubernetes Secrets
resource "kubernetes_secret" "agentic_secrets" {
  metadata {
    name      = "agentic-secrets"
    namespace = "agentic-case-management"
  }

  data = {
    database-url    = "postgresql://postgres:${random_password.database_password.result}@${aws_rds_cluster.main.endpoint}:5432/agentic_case_management"
    redis-url       = "redis://:${random_password.jwt_secret.result}@${aws_elasticache_replication_group.main.configuration_endpoint_address}:6379"
    jwt-secret      = random_password.jwt_secret.result
    encryption-key  = random_password.encryption_key.result
    postgres-password = random_password.database_password.result
  }

  type = "Opaque"

  depends_on = [module.eks]
}

# Storage Classes
resource "kubernetes_storage_class" "fast_ssd" {
  metadata {
    name = "fast-ssd"
  }

  storage_provisioner    = "ebs.csi.aws.com"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type      = "gp3"
    iops      = "3000"
    throughput = "125"
    encrypted = "true"
  }

  depends_on = [module.eks]
}

resource "kubernetes_storage_class" "standard_ssd" {
  metadata {
    name = "standard-ssd"
  }

  storage_provisioner    = "ebs.csi.aws.com"
  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true

  parameters = {
    type      = "gp3"
    encrypted = "true"
  }

  depends_on = [module.eks]
}

# Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "node_groups" {
  description = "EKS node groups"
  value       = module.eks.eks_managed_node_groups
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
  sensitive   = true
}

output "s3_backup_bucket" {
  description = "S3 bucket for backups"
  value       = aws_s3_bucket.backups.bucket
}

output "s3_documents_bucket" {
  description = "S3 bucket for documents"
  value       = aws_s3_bucket.documents.bucket
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}