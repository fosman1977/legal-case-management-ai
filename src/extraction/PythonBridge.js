/**
 * Python Bridge - Real implementation for PyMuPDF and pdfplumber integration
 * Week 3: Day 1-2 PyMuPDF Integration & Day 5 Table Extraction
 */

class PythonBridge {
  constructor() {
    this.pythonServerUrl = 'http://localhost:8002'; // Python extraction server
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.pythonServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.isAvailable = response.ok;
      console.log(`🐍 Python Bridge: ${this.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      this.isAvailable = false;
      console.log('🐍 Python Bridge: Not available - using fallback methods');
    }
  }

  async execute(pythonScript, timeout = 30000) {
    if (!this.isAvailable) {
      throw new Error('Python bridge not available');
    }

    try {
      const response = await fetch(`${this.pythonServerUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: pythonScript,
          timeout: timeout
        }),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`Python execution failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Python error: ${result.error}`);
      }

      return result.output;
    } catch (error) {
      console.error('Python Bridge execution failed:', error);
      throw error;
    }
  }

  async executeFile(filepath, pythonScript) {
    // Upload file first, then execute script
    const formData = new FormData();
    formData.append('script', pythonScript);
    formData.append('filepath', filepath);

    const response = await fetch(`${this.pythonServerUrl}/execute-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`File execution failed: ${response.status}`);
    }

    return await response.json();
  }
}

export default PythonBridge;