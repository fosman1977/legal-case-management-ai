#!/bin/bash

# Secure Update Collection Script for Air-Gapped Systems
# This script runs on a CONNECTED system to collect updates
# The collected updates are then transferred via secure media to air-gapped environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_DIR="${UPDATE_DIR:-/var/lib/update-collection}"
OUTPUT_DIR="${UPDATE_DIR}/packages"
TEMP_DIR="${UPDATE_DIR}/temp"
LOG_FILE="${UPDATE_DIR}/collection.log"

# Configuration
ORGANIZATION_KEY="${ORGANIZATION_KEY:-/etc/ssl/private/org-signing.key}"
ORGANIZATION_CERT="${ORGANIZATION_CERT:-/etc/ssl/certs/org-signing.crt}"
TRUSTED_CA="${TRUSTED_CA:-/etc/ssl/certs/trusted-ca.pem}"

# Compliance sources
COMPLIANCE_SOURCES=(
    "https://api.legal-database.com/v1/regulations"
    "https://court-decisions.judicial.gov/api/v1/decisions"
    "https://regulatory-updates.gov/api/compliance"
)

# Model repositories (internal/vetted only)
MODEL_SOURCES=(
    "https://models.internal.company.com/legal-ai"
    "https://vetted-models.legal-tech.com/releases"
)

# Security feeds
SECURITY_SOURCES=(
    "https://security-updates.vendor.com/patches"
    "https://cve-database.mitre.org/feeds"
    "https://internal-security.company.com/patches"
)

# Threat intelligence feeds
THREAT_INTEL_SOURCES=(
    "https://threat-intel.internal.com/indicators"
    "https://security-feeds.company.com/iocs"
)

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log_message "ERROR: $1"
    exit 1
}

# Verify prerequisites
check_prerequisites() {
    log_message "Checking prerequisites..."
    
    # Check required tools
    for tool in curl jq openssl gpg; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' not found"
        fi
    done
    
    # Check signing key
    if [[ ! -f "$ORGANIZATION_KEY" ]]; then
        error_exit "Organization signing key not found: $ORGANIZATION_KEY"
    fi
    
    if [[ ! -f "$ORGANIZATION_CERT" ]]; then
        error_exit "Organization certificate not found: $ORGANIZATION_CERT"
    fi
    
    # Create directories
    mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"
    
    log_message "Prerequisites check passed"
}

# Generate update package ID
generate_package_id() {
    local type="$1"
    local version="$2"
    echo "${type}-$(date +%Y%m%d)-${version}-$(openssl rand -hex 4)"
}

# Sign data with organization key
sign_data() {
    local data_file="$1"
    local signature_file="$2"
    
    openssl dgst -sha256 -sign "$ORGANIZATION_KEY" -out "$signature_file" "$data_file"
    
    # Create signature metadata
    local key_id
    key_id=$(openssl x509 -in "$ORGANIZATION_CERT" -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':')
    
    local sig_b64
    sig_b64=$(base64 -w 0 < "$signature_file")
    
    echo "{\"keyId\":\"$key_id\",\"signature\":\"$sig_b64\"}" | base64 -w 0
}

# Create update package
create_update_package() {
    local type="$1"
    local version="$2" 
    local data_file="$3"
    local metadata_file="$4"
    
    local package_id
    package_id=$(generate_package_id "$type" "$version")
    
    local package_file="${OUTPUT_DIR}/${package_id}.update"
    local temp_payload="${TEMP_DIR}/${package_id}.payload"
    
    log_message "Creating update package: $package_id"
    
    # Calculate checksum
    local checksum
    checksum=$(sha256sum "$data_file" | cut -d' ' -f1)
    
    # Sign data
    local signature
    signature=$(sign_data "$data_file" "${TEMP_DIR}/${package_id}.sig")
    
    # Read metadata
    local metadata
    metadata=$(cat "$metadata_file")
    
    # Create package header
    local header
    header=$(jq -n \
        --arg id "$package_id" \
        --arg type "$type" \
        --arg version "$version" \
        --arg timestamp "$(date +%s)" \
        --arg signature "$signature" \
        --arg checksum "$checksum" \
        --argjson metadata "$metadata" \
        '{
            id: $id,
            type: $type,
            version: $version,
            timestamp: ($timestamp | tonumber),
            signature: $signature,
            checksum: $checksum,
            metadata: $metadata
        }')
    
    # Create package file
    local header_size=${#header}
    
    # Write header size (4 bytes, big endian)
    printf "%08x" "$header_size" | xxd -r -p > "$package_file"
    
    # Write header
    echo -n "$header" >> "$package_file"
    
    # Write payload
    cat "$data_file" >> "$package_file"
    
    log_message "Package created: $package_file"
    echo "$package_file"
}

# Collect compliance updates
collect_compliance_updates() {
    local date_filter="${1:-$(date +%Y-%m)}"
    
    log_message "Collecting compliance updates for: $date_filter"
    
    local temp_data="${TEMP_DIR}/compliance-${date_filter}.json"
    local temp_metadata="${TEMP_DIR}/compliance-${date_filter}-meta.json"
    
    # Collect from all sources
    local all_regulations=()
    
    for source in "${COMPLIANCE_SOURCES[@]}"; do
        log_message "Fetching from: $source"
        
        local response
        response=$(curl -s -H "Accept: application/json" \
                       -H "User-Agent: AgenticUpdateCollector/1.0" \
                       "${source}?date=${date_filter}" || echo '{}')
        
        if echo "$response" | jq -e '.regulations' > /dev/null 2>&1; then
            local regulations
            regulations=$(echo "$response" | jq -r '.regulations[]')
            all_regulations+=("$regulations")
        fi
    done
    
    # Create consolidated data
    jq -n \
        --arg version "$date_filter" \
        --arg jurisdiction "multi" \
        --argjson regulations "$(printf '%s\n' "${all_regulations[@]}" | jq -s '.')" \
        '{
            version: $version,
            jurisdiction: $jurisdiction,
            regulations: $regulations,
            collected_at: now
        }' > "$temp_data"
    
    # Create metadata
    jq -n \
        --arg source "multiple-compliance-sources" \
        --arg jurisdiction "multi" \
        --arg classification "confidential" \
        --arg expiry "$(date -d '+90 days' +%s)" \
        '{
            source: $source,
            jurisdiction: $jurisdiction,
            classification: $classification,
            expiryDate: ($expiry | tonumber)
        }' > "$temp_metadata"
    
    # Create package
    create_update_package "compliance" "$date_filter" "$temp_data" "$temp_metadata"
}

# Collect model updates
collect_model_updates() {
    local version="${1:-quarterly}"
    
    log_message "Collecting model updates for: $version"
    
    local temp_data="${TEMP_DIR}/models-${version}.tar.gz"
    local temp_metadata="${TEMP_DIR}/models-${version}-meta.json"
    
    # Create temporary directory for models
    local model_dir="${TEMP_DIR}/models-${version}"
    mkdir -p "$model_dir"
    
    # Download models from vetted sources
    for source in "${MODEL_SOURCES[@]}"; do
        log_message "Fetching models from: $source"
        
        # This would download actual model files
        # For now, create placeholder files
        echo "Legal AI Model v${version}" > "${model_dir}/legal-llama-${version}.gguf"
        echo "Legal BERT Model v${version}" > "${model_dir}/legal-bert-${version}.bin"
        echo "Case Similarity Model v${version}" > "${model_dir}/case-similarity-${version}.gguf"
    done
    
    # Create model archive
    tar -czf "$temp_data" -C "$model_dir" .
    
    # Create metadata
    jq -n \
        --arg source "vetted-model-repositories" \
        --arg classification "restricted" \
        --arg version "$version" \
        '{
            source: $source,
            classification: $classification,
            version: $version,
            models: [
                "legal-llama",
                "legal-bert", 
                "case-similarity"
            ]
        }' > "$temp_metadata"
    
    # Create package
    create_update_package "model" "$version" "$temp_data" "$temp_metadata"
    
    # Cleanup
    rm -rf "$model_dir"
}

# Collect security updates
collect_security_updates() {
    local severity="${1:-all}"
    
    log_message "Collecting security updates with severity: $severity"
    
    local temp_data="${TEMP_DIR}/security-$(date +%Y%m%d).json"
    local temp_metadata="${TEMP_DIR}/security-$(date +%Y%m%d)-meta.json"
    
    # Collect security patches
    local all_patches=()
    local all_cves=()
    
    for source in "${SECURITY_SOURCES[@]}"; do
        log_message "Fetching security updates from: $source"
        
        local response
        response=$(curl -s -H "Accept: application/json" \
                       "${source}?severity=${severity}&since=$(date -d '7 days ago' +%Y-%m-%d)" || echo '{}')
        
        if echo "$response" | jq -e '.patches' > /dev/null 2>&1; then
            local patches
            patches=$(echo "$response" | jq -r '.patches[]')
            all_patches+=("$patches")
        fi
        
        if echo "$response" | jq -e '.cves' > /dev/null 2>&1; then
            local cves
            cves=$(echo "$response" | jq -r '.cves[]')
            all_cves+=("$cves")
        fi
    done
    
    # Create consolidated security data
    jq -n \
        --arg severity "$severity" \
        --arg version "$(date +%Y%m%d)" \
        --argjson patches "$(printf '%s\n' "${all_patches[@]}" | jq -s '.')" \
        --argjson cves "$(printf '%s\n' "${all_cves[@]}" | jq -s '.')" \
        '{
            severity: $severity,
            version: $version,
            patches: $patches,
            cveIds: $cves,
            collected_at: now
        }' > "$temp_data"
    
    # Create metadata
    jq -n \
        --arg source "security-vendors" \
        --arg classification "public" \
        --arg severity "$severity" \
        '{
            source: $source,
            classification: $classification,
            severity: $severity,
            auto_apply: true
        }' > "$temp_metadata"
    
    # Create package
    create_update_package "security" "$(date +%Y%m%d)" "$temp_data" "$temp_metadata"
}

# Collect threat intelligence
collect_threat_intel() {
    local feed="${1:-all}"
    
    log_message "Collecting threat intelligence from: $feed"
    
    local temp_data="${TEMP_DIR}/threat-intel-$(date +%Y%m%d).json"
    local temp_metadata="${TEMP_DIR}/threat-intel-$(date +%Y%m%d)-meta.json"
    
    # Collect threat indicators
    local all_indicators=()
    
    for source in "${THREAT_INTEL_SOURCES[@]}"; do
        log_message "Fetching threat intel from: $source"
        
        local response
        response=$(curl -s -H "Accept: application/json" \
                       "${source}?feed=${feed}&since=$(date -d '1 day ago' +%Y-%m-%d)" || echo '{}')
        
        if echo "$response" | jq -e '.indicators' > /dev/null 2>&1; then
            local indicators
            indicators=$(echo "$response" | jq -r '.indicators[]')
            all_indicators+=("$indicators")
        fi
    done
    
    # Create threat intel data
    jq -n \
        --arg feed "$feed" \
        --arg version "$(date +%Y%m%d)" \
        --argjson indicators "$(printf '%s\n' "${all_indicators[@]}" | jq -s '.')" \
        '{
            feed: $feed,
            version: $version,
            indicators: $indicators,
            source: "internal-threat-intel",
            timestamp: now
        }' > "$temp_data"
    
    # Create metadata
    jq -n \
        --arg source "threat-intelligence-feeds" \
        --arg classification "restricted" \
        --arg feed "$feed" \
        '{
            source: $source,
            classification: $classification,
            feed: $feed,
            auto_apply: true
        }' > "$temp_metadata"
    
    # Create package
    create_update_package "threat-intel" "$(date +%Y%m%d)" "$temp_data" "$temp_metadata"
}

# Create secure transport bundle
create_transport_bundle() {
    local bundle_name="update-bundle-$(date +%Y%m%d)-$(openssl rand -hex 4)"
    local bundle_dir="${OUTPUT_DIR}/${bundle_name}"
    local bundle_archive="${OUTPUT_DIR}/${bundle_name}.tar.gz.enc"
    
    log_message "Creating transport bundle: $bundle_name"
    
    # Create bundle directory
    mkdir -p "$bundle_dir"
    
    # Copy all update packages
    cp "${OUTPUT_DIR}"/*.update "$bundle_dir/" 2>/dev/null || true
    
    # Create bundle manifest
    local manifest="${bundle_dir}/manifest.json"
    jq -n \
        --arg bundle_id "$bundle_name" \
        --arg created "$(date -Iseconds)" \
        --arg packages "$(ls "${bundle_dir}"/*.update 2>/dev/null | wc -l)" \
        '{
            bundle_id: $bundle_id,
            created: $created,
            package_count: ($packages | tonumber),
            packages: [.[] | split("/")[-1]]
        }' > "$manifest"
    
    # Add package list to manifest
    jq --argjson packages "$(ls "${bundle_dir}"/*.update 2>/dev/null | xargs -n1 basename | jq -R . | jq -s .)" \
       '.packages = $packages' "$manifest" > "${manifest}.tmp" && mv "${manifest}.tmp" "$manifest"
    
    # Create archive
    tar -czf "${bundle_dir}.tar.gz" -C "$OUTPUT_DIR" "$bundle_name"
    
    # Encrypt bundle
    local encryption_key
    encryption_key=$(openssl rand -hex 32)
    
    openssl enc -aes-256-cbc -salt -in "${bundle_dir}.tar.gz" -out "$bundle_archive" -k "$encryption_key"
    
    # Save encryption key securely
    echo "$encryption_key" > "${OUTPUT_DIR}/${bundle_name}.key"
    chmod 600 "${OUTPUT_DIR}/${bundle_name}.key"
    
    # Create transfer instructions
    cat > "${OUTPUT_DIR}/${bundle_name}-instructions.txt" << EOF
Air-Gapped Update Bundle Transfer Instructions

Bundle: ${bundle_name}
Created: $(date -Iseconds)
Packages: $(ls "${bundle_dir}"/*.update 2>/dev/null | wc -l)

Transfer Files:
- ${bundle_name}.tar.gz.enc (encrypted bundle)
- ${bundle_name}.key (encryption key - transfer separately)

Decryption Command:
openssl enc -aes-256-cbc -d -in ${bundle_name}.tar.gz.enc -out ${bundle_name}.tar.gz -k \$(cat ${bundle_name}.key)

Verification:
1. Decrypt the bundle
2. Extract: tar -xzf ${bundle_name}.tar.gz
3. Verify manifest.json
4. Copy *.update files to air-gapped system incoming directory
5. Run air-gapped validation process

Security Notes:
- Transfer encryption key via separate secure channel
- Verify bundle integrity after transfer
- Destroy transport media after successful verification
EOF

    # Cleanup
    rm -rf "$bundle_dir" "${bundle_dir}.tar.gz"
    
    log_message "Transport bundle created: $bundle_archive"
    log_message "Encryption key: ${OUTPUT_DIR}/${bundle_name}.key"
    log_message "Instructions: ${OUTPUT_DIR}/${bundle_name}-instructions.txt"
}

# Main execution
main() {
    local type="${1:-all}"
    local param="${2:-}"
    
    log_message "Starting update collection process..."
    log_message "Type: $type, Parameter: $param"
    
    check_prerequisites
    
    case "$type" in
        "compliance")
            collect_compliance_updates "$param"
            ;;
        "models")
            collect_model_updates "$param"
            ;;
        "security")
            collect_security_updates "$param"
            ;;
        "threat-intel")
            collect_threat_intel "$param"
            ;;
        "all")
            collect_compliance_updates "$(date +%Y-%m)"
            collect_model_updates "quarterly"
            collect_security_updates "all"
            collect_threat_intel "all"
            ;;
        *)
            error_exit "Unknown update type: $type"
            ;;
    esac
    
    # Create transport bundle
    create_transport_bundle
    
    # Cleanup temp files
    rm -rf "$TEMP_DIR"
    
    log_message "Update collection completed successfully"
    log_message "Bundle ready for secure transport to air-gapped environment"
}

# Script usage
usage() {
    cat << EOF
Usage: $0 <type> [parameter]

Types:
  compliance [YYYY-MM]     - Collect compliance updates (default: current month)
  models [version]         - Collect AI model updates (default: quarterly)
  security [severity]      - Collect security updates (default: all)
  threat-intel [feed]      - Collect threat intelligence (default: all)
  all                      - Collect all update types

Examples:
  $0 compliance 2024-01
  $0 models v2.1
  $0 security critical
  $0 threat-intel malware
  $0 all

Environment Variables:
  UPDATE_DIR              - Base directory for updates (default: /var/lib/update-collection)
  ORGANIZATION_KEY        - Organization signing key (default: /etc/ssl/private/org-signing.key)
  ORGANIZATION_CERT       - Organization certificate (default: /etc/ssl/certs/org-signing.crt)
EOF
}

# Handle command line arguments
if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@"