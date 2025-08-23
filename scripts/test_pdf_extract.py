#!/usr/bin/env python3
"""
Test script for PDF-Extract-Kit local installation
"""

import requests
import json
import os
import sys
import time
from pathlib import Path

def test_server_health():
    """Test if the server is running and healthy"""
    try:
        response = requests.get('http://localhost:8001/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Server is healthy")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Models loaded: {data.get('models_loaded')}")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server - is it running?")
        print("💡 Start the server with: cd PDF-Extract-Kit && ./start_server.sh")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def create_test_pdf():
    """Create a simple test PDF for testing"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        test_pdf = '/tmp/test_document.pdf'
        c = canvas.Canvas(test_pdf, pagesize=letter)
        
        # Add some test content
        c.drawString(100, 750, "Test Legal Document")
        c.drawString(100, 720, "Case: Smith v. Jones")
        c.drawString(100, 690, "Date: March 15, 2024")
        c.drawString(100, 660, "")
        c.drawString(100, 630, "Parties:")
        c.drawString(120, 610, "• Mr. John Smith (Claimant)")
        c.drawString(120, 590, "• Ms. Jane Jones (Defendant)")
        c.drawString(100, 560, "")
        c.drawString(100, 530, "Issues:")
        c.drawString(120, 510, "1. Whether the contract was breached")
        c.drawString(120, 490, "2. The amount of damages suffered")
        c.drawString(100, 460, "")
        c.drawString(100, 430, "Meeting held on April 3, 2024 with both parties.")
        
        c.save()
        print(f"✅ Test PDF created: {test_pdf}")
        return test_pdf
        
    except ImportError:
        print("⚠️  ReportLab not installed, creating minimal PDF...")
        # Create a very basic PDF using PyMuPDF
        try:
            import fitz
            doc = fitz.open()  # new document
            page = doc.new_page()  # new page
            
            text = """Test Legal Document
            
Case: Smith v. Jones
Date: March 15, 2024

Parties:
• Mr. John Smith (Claimant)  
• Ms. Jane Jones (Defendant)

Issues:
1. Whether the contract was breached
2. The amount of damages suffered

Meeting held on April 3, 2024 with both parties."""
            
            page.insert_text((72, 72), text)
            
            test_pdf = '/tmp/test_document.pdf'
            doc.save(test_pdf)
            doc.close()
            print(f"✅ Test PDF created: {test_pdf}")
            return test_pdf
            
        except ImportError:
            print("❌ Cannot create test PDF - PyMuPDF not available")
            return None
    except Exception as e:
        print(f"❌ Failed to create test PDF: {e}")
        return None

def test_extraction(pdf_path):
    """Test PDF extraction"""
    if not pdf_path or not os.path.exists(pdf_path):
        print("❌ No test PDF available")
        return False
    
    try:
        print(f"🔄 Testing extraction with: {pdf_path}")
        
        with open(pdf_path, 'rb') as f:
            files = {'file': f}
            data = {
                'extract_text': 'true',
                'extract_tables': 'true', 
                'extract_images': 'true',
                'output_format': 'json'
            }
            
            response = requests.post(
                'http://localhost:8001/extract',
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Extraction successful!")
            print(f"   Text length: {len(result.get('text', ''))}")
            print(f"   Pages: {result.get('metadata', {}).get('totalPages', 0)}")
            print(f"   Tables: {result.get('metadata', {}).get('totalTables', 0)}")
            print(f"   Images: {result.get('metadata', {}).get('totalImages', 0)}")
            
            # Show extracted entities that our system would pick up
            text = result.get('text', '')
            persons = []
            dates = []
            
            # Simple entity detection for demo
            if 'Smith' in text:
                persons.append('John Smith')
            if 'Jones' in text:
                persons.append('Jane Jones')
            if 'March 15, 2024' in text:
                dates.append('March 15, 2024')
            if 'April 3, 2024' in text:
                dates.append('April 3, 2024')
            
            if persons:
                print(f"   📝 Detected persons: {', '.join(persons)}")
            if dates:
                print(f"   📅 Detected dates: {', '.join(dates)}")
            
            # Save result for inspection
            with open('/tmp/extraction_result.json', 'w') as f:
                json.dump(result, f, indent=2)
            print("   💾 Full result saved to: /tmp/extraction_result.json")
            
            return True
            
        else:
            print(f"❌ Extraction failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Extraction test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing PDF-Extract-Kit Local Installation")
    print("=" * 50)
    
    # Test 1: Server health
    print("\n1. Testing server health...")
    if not test_server_health():
        print("\n❌ Cannot proceed without healthy server")
        sys.exit(1)
    
    # Test 2: Create test PDF
    print("\n2. Creating test PDF...")
    test_pdf = create_test_pdf()
    
    # Test 3: Test extraction
    print("\n3. Testing PDF extraction...")
    if test_extraction(test_pdf):
        print("\n✅ All tests passed!")
        print("\n🎉 PDF-Extract-Kit integration is working correctly!")
        print("\n💡 Your legal document system can now use enhanced PDF extraction")
        print("   Add PDF_EXTRACT_KIT_URL=http://localhost:8001 to your .env file")
    else:
        print("\n❌ Extraction test failed")
        sys.exit(1)
    
    # Cleanup
    if test_pdf and os.path.exists(test_pdf):
        try:
            os.remove(test_pdf)
            print(f"\n🧹 Cleaned up test file: {test_pdf}")
        except:
            pass

if __name__ == '__main__':
    main()