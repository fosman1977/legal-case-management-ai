#!/bin/bash

# LocalAI Model Download Script
# Downloads AI models to local directory when needed

MODEL_DIR="./models"
CACHE_DIR="$HOME/.cache/localai-models"

# Create directories if they don't exist
mkdir -p "$MODEL_DIR"
mkdir -p "$CACHE_DIR"

# Model URLs
MISTRAL_URL="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
TINYLLAMA_URL="https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}LocalAI Model Manager${NC}"
echo "========================"
echo ""

# Function to download model
download_model() {
    local url=$1
    local filename=$2
    local cache_path="$CACHE_DIR/$filename"
    local model_path="$MODEL_DIR/$filename"
    
    # Check if model exists in cache
    if [ -f "$cache_path" ]; then
        echo -e "${YELLOW}Model found in cache: $filename${NC}"
        echo "Linking from cache to project..."
        ln -sf "$cache_path" "$model_path"
        echo -e "${GREEN}✓ Model ready: $model_path${NC}"
    else
        echo -e "${YELLOW}Downloading $filename...${NC}"
        echo "This may take a while depending on your connection speed."
        
        # Download to cache first
        if curl -L --progress-bar -o "$cache_path" "$url"; then
            echo -e "${GREEN}✓ Downloaded to cache${NC}"
            # Link to project
            ln -sf "$cache_path" "$model_path"
            echo -e "${GREEN}✓ Model ready: $model_path${NC}"
        else
            echo -e "${RED}✗ Failed to download $filename${NC}"
            return 1
        fi
    fi
}

# Function to check model status
check_model() {
    local filename=$1
    local model_path="$MODEL_DIR/$filename"
    local cache_path="$CACHE_DIR/$filename"
    
    if [ -f "$model_path" ] || [ -L "$model_path" ]; then
        echo -e "${GREEN}✓ Installed${NC}"
    elif [ -f "$cache_path" ]; then
        echo -e "${YELLOW}⊙ In cache (not linked)${NC}"
    else
        echo -e "${RED}✗ Not installed${NC}"
    fi
}

# Function to get file size
get_size() {
    local file=$1
    if [ -f "$file" ] || [ -L "$file" ]; then
        du -h "$file" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

# Main menu
show_menu() {
    echo "Model Status:"
    echo "-------------"
    echo -n "1. Mistral 7B Instruct (3.4GB): "
    check_model "mistral-7b-instruct.gguf"
    
    echo -n "2. TinyLlama 1.1B (638MB): "
    check_model "tinyllama.gguf"
    
    echo ""
    echo "Cache location: $CACHE_DIR"
    echo "Project location: $MODEL_DIR"
    echo ""
    echo "Options:"
    echo "1) Download/Link Mistral 7B"
    echo "2) Download/Link TinyLlama"
    echo "3) Download/Link All Models"
    echo "4) Remove from Project (keep cache)"
    echo "5) Clear Cache (remove downloads)"
    echo "6) Show Disk Usage"
    echo "0) Exit"
    echo ""
}

# Remove models from project (keep cache)
remove_from_project() {
    echo "Removing model links from project..."
    rm -f "$MODEL_DIR/mistral-7b-instruct.gguf"
    rm -f "$MODEL_DIR/tinyllama.gguf"
    echo -e "${GREEN}✓ Models removed from project (cache preserved)${NC}"
}

# Clear cache
clear_cache() {
    echo -e "${YELLOW}Warning: This will delete downloaded models from cache.${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        rm -f "$CACHE_DIR"/*.gguf
        echo -e "${GREEN}✓ Cache cleared${NC}"
    else
        echo "Cancelled"
    fi
}

# Show disk usage
show_disk_usage() {
    echo ""
    echo "Disk Usage:"
    echo "-----------"
    echo "Project models: $(du -sh "$MODEL_DIR" 2>/dev/null | cut -f1)"
    echo "Cache: $(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)"
    echo ""
    
    if [ -d "$CACHE_DIR" ]; then
        echo "Cached files:"
        ls -lah "$CACHE_DIR"/*.gguf 2>/dev/null || echo "  No model files in cache"
    fi
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    
    case $choice in
        1)
            download_model "$MISTRAL_URL" "mistral-7b-instruct.gguf"
            ;;
        2)
            download_model "$TINYLLAMA_URL" "tinyllama.gguf"
            ;;
        3)
            echo "Downloading all models..."
            download_model "$MISTRAL_URL" "mistral-7b-instruct.gguf"
            download_model "$TINYLLAMA_URL" "tinyllama.gguf"
            ;;
        4)
            remove_from_project
            ;;
        5)
            clear_cache
            ;;
        6)
            show_disk_usage
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done