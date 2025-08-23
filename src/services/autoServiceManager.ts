/**
 * Automatic Service Manager
 * Handles PDF-Extract-Kit setup and startup in the background
 */

export class AutoServiceManager {
  private static instance: AutoServiceManager;
  private setupPromise: Promise<boolean> | null = null;
  private isSetupComplete = false;
  private statusListeners: Array<(status: string, message: string) => void> = [];

  private constructor() {
    // Start setup process automatically
    this.initializeService();
  }

  static getInstance(): AutoServiceManager {
    if (!AutoServiceManager.instance) {
      AutoServiceManager.instance = new AutoServiceManager();
    }
    return AutoServiceManager.instance;
  }

  /**
   * Subscribe to setup status updates
   */
  onStatusUpdate(callback: (status: string, message: string) => void) {
    this.statusListeners.push(callback);
  }

  /**
   * Get setup promise for waiting
   */
  getSetupPromise(): Promise<boolean> {
    if (this.isSetupComplete) {
      return Promise.resolve(true);
    }
    return this.setupPromise || Promise.resolve(false);
  }

  /**
   * Initialize the service automatically
   */
  private async initializeService() {
    if (this.setupPromise) {
      return this.setupPromise;
    }

    this.setupPromise = this.performAutoSetup();
    return this.setupPromise;
  }

  /**
   * Perform automatic setup
   */
  private async performAutoSetup(): Promise<boolean> {
    try {
      this.notifyListeners('checking', 'Checking PDF extraction service...');

      // First, check if service is already running
      const isRunning = await this.checkServiceHealth();
      if (isRunning) {
        this.notifyListeners('ready', 'PDF extraction service is ready');
        this.isSetupComplete = true;
        return true;
      }

      // Try to start the service automatically
      this.notifyListeners('starting', 'Starting PDF extraction service...');
      const started = await this.attemptAutoStart();
      
      if (started) {
        // Wait for service to be ready
        const ready = await this.waitForService();
        if (ready) {
          this.notifyListeners('ready', 'PDF extraction service is ready');
          this.isSetupComplete = true;
          return true;
        }
      }

      // Fallback to basic mode
      this.notifyListeners('fallback', 'Using basic PDF extraction (enhanced features unavailable)');
      this.isSetupComplete = true;
      return false;

    } catch (error) {
      console.warn('Auto-setup failed:', error);
      this.notifyListeners('fallback', 'Using basic PDF extraction');
      this.isSetupComplete = true;
      return false;
    }
  }

  /**
   * Check if service is healthy
   */
  private async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8001/health', {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Attempt to start service automatically
   */
  private async attemptAutoStart(): Promise<boolean> {
    try {
      // Try different startup methods

      // Method 1: Check if Python script exists and run it
      const hasLocalScript = await this.checkLocalScript();
      if (hasLocalScript) {
        return await this.startLocalScript();
      }

      // Method 2: Try API-based setup
      return await this.startViaAPI();

    } catch (error) {
      console.warn('Auto-start failed:', error);
      return false;
    }
  }

  /**
   * Check if local script exists
   */
  private async checkLocalScript(): Promise<boolean> {
    try {
      // In a real implementation, this would check the file system
      // For now, we'll assume the script might exist
      return false; // Disable for now
    } catch (error) {
      return false;
    }
  }

  /**
   * Start local script
   */
  private async startLocalScript(): Promise<boolean> {
    try {
      // This would spawn the local Python script
      // For now, return false to fall back to other methods
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start via API
   */
  private async startViaAPI(): Promise<boolean> {
    try {
      const response = await fetch('/api/setup-pdf-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoStart: true })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for service to become ready
   */
  private async waitForService(maxWaitTime = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isReady = await this.checkServiceHealth();
      if (isReady) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: string, message: string) {
    this.statusListeners.forEach(listener => listener(status, message));
  }

  /**
   * Show setup status notification to user
   */
  showSetupNotification(): void {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.id = 'pdf-extract-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui;
      font-size: 14px;
      max-width: 350px;
      transition: all 0.3s ease;
    `;

    // Update notification based on status
    this.onStatusUpdate((status, message) => {
      if (document.getElementById('pdf-extract-notification')) {
        const statusIcon = {
          'checking': '🔍',
          'starting': '⏳',
          'ready': '🚀',
          'fallback': '📄'
        }[status] || '❓';

        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${statusIcon}</span>
            <span>${message}</span>
            ${status === 'ready' || status === 'fallback' ? 
              '<button onclick="this.parentElement.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">✕</button>' : 
              ''
            }
          </div>
        `;

        // Auto-hide after 5 seconds for final states
        if (status === 'ready' || status === 'fallback') {
          setTimeout(() => {
            const elem = document.getElementById('pdf-extract-notification');
            if (elem) elem.remove();
          }, 5000);
        }
      }
    });

    document.body.appendChild(notification);
  }
}

// Create and export singleton instance
export const autoServiceManager = AutoServiceManager.getInstance();

// Auto-start setup when module loads
if (typeof window !== 'undefined') {
  // Show notification in browser environment
  autoServiceManager.showSetupNotification();
}