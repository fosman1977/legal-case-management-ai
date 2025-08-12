import { exec, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { app, dialog } from 'electron';
import { EventEmitter } from 'events';
import https from 'https';

interface SystemRequirements {
  hasDocker: boolean;
  dockerVersion?: string;
  dockerRunning: boolean;
  hasDockerCompose: boolean;
  platform: string;
  arch: string;
  memory: number;
  diskSpace: number;
  canInstallDocker: boolean;
}

export class DockerManager extends EventEmitter {
  private platform: string;
  private arch: string;

  constructor() {
    super();
    this.platform = process.platform;
    this.arch = process.arch;
  }

  // Check system requirements and Docker status
  async checkSystemRequirements(): Promise<SystemRequirements> {
    const requirements: SystemRequirements = {
      hasDocker: false,
      dockerRunning: false,
      hasDockerCompose: false,
      platform: this.platform,
      arch: this.arch,
      memory: os.totalmem() / (1024 * 1024 * 1024), // GB
      diskSpace: await this.getAvailableDiskSpace(),
      canInstallDocker: this.canAutoInstallDocker()
    };

    // Check if Docker is installed
    try {
      const dockerVersion = await this.executeCommand('docker --version');
      requirements.hasDocker = true;
      requirements.dockerVersion = dockerVersion.trim();
      
      // Check if Docker daemon is running
      try {
        await this.executeCommand('docker ps');
        requirements.dockerRunning = true;
      } catch {
        requirements.dockerRunning = false;
      }

      // Check Docker Compose
      try {
        await this.executeCommand('docker-compose --version');
        requirements.hasDockerCompose = true;
      } catch {
        // Try docker compose (v2)
        try {
          await this.executeCommand('docker compose version');
          requirements.hasDockerCompose = true;
        } catch {
          requirements.hasDockerCompose = false;
        }
      }
    } catch {
      requirements.hasDocker = false;
    }

    return requirements;
  }

  // Check if we can auto-install Docker on this platform
  private canAutoInstallDocker(): boolean {
    return ['win32', 'darwin', 'linux'].includes(this.platform);
  }

  // Get available disk space
  private async getAvailableDiskSpace(): Promise<number> {
    try {
      if (this.platform === 'win32') {
        const result = await this.executeCommand('wmic logicaldisk get size,freespace,caption');
        // Parse Windows disk space (simplified - returns C: drive space in GB)
        const lines = result.split('\n');
        for (const line of lines) {
          if (line.includes('C:')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              return parseInt(parts[1]) / (1024 * 1024 * 1024);
            }
          }
        }
      } else {
        const result = await this.executeCommand('df -BG / | tail -1');
        const parts = result.trim().split(/\s+/);
        if (parts.length >= 4) {
          return parseInt(parts[3].replace('G', ''));
        }
      }
    } catch {
      return 0;
    }
    return 0;
  }

  // Install Docker based on platform
  async installDocker(onProgress?: (status: string, progress: number) => void): Promise<boolean> {
    const updateProgress = (status: string, progress: number) => {
      this.emit('install-progress', { status, progress });
      onProgress?.(status, progress);
    };

    try {
      switch (this.platform) {
        case 'win32':
          return await this.installDockerWindows(updateProgress);
        case 'darwin':
          return await this.installDockerMac(updateProgress);
        case 'linux':
          return await this.installDockerLinux(updateProgress);
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }
    } catch (error) {
      console.error('Docker installation failed:', error);
      this.emit('install-error', error);
      return false;
    }
  }

  // Install Docker Desktop for Windows
  private async installDockerWindows(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    updateProgress('Downloading Docker Desktop for Windows...', 10);
    
    const installerUrl = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe';
    const installerPath = path.join(app.getPath('temp'), 'DockerDesktopInstaller.exe');

    // Download Docker Desktop
    const downloaded = await this.downloadFile(installerUrl, installerPath, (progress) => {
      updateProgress(`Downloading Docker Desktop... ${Math.round(progress)}%`, 10 + progress * 0.6);
    });

    if (!downloaded) {
      throw new Error('Failed to download Docker Desktop');
    }

    updateProgress('Installing Docker Desktop...', 70);

    // Check if we need admin privileges
    const isAdmin = await this.checkWindowsAdmin();
    
    if (!isAdmin) {
      // Request elevation
      const result = dialog.showMessageBoxSync({
        type: 'info',
        title: 'Administrator Permission Required',
        message: 'Docker Desktop installation requires administrator permissions. Click OK to continue with elevated privileges.',
        buttons: ['OK', 'Cancel']
      });
      
      if (result === 1) {
        return false;
      }
    }

    // Install Docker Desktop silently
    return new Promise((resolve) => {
      const installer = spawn(installerPath, ['install', '--quiet', '--accept-license'], {
        detached: true,
        stdio: 'ignore'
      });

      installer.on('error', (error) => {
        console.error('Installation error:', error);
        resolve(false);
      });

      // Wait for installation to complete (polling)
      let checkCount = 0;
      const checkInstallation = setInterval(async () => {
        checkCount++;
        updateProgress('Installing Docker Desktop...', 70 + checkCount);
        
        const requirements = await this.checkSystemRequirements();
        if (requirements.hasDocker) {
          clearInterval(checkInstallation);
          updateProgress('Docker Desktop installed successfully!', 100);
          
          // Start Docker Desktop
          await this.startDockerDesktop();
          resolve(true);
        }
        
        // Timeout after 5 minutes
        if (checkCount > 60) {
          clearInterval(checkInstallation);
          resolve(false);
        }
      }, 5000);
    });
  }

  // Install Docker Desktop for Mac
  private async installDockerMac(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    updateProgress('Downloading Docker Desktop for Mac...', 10);
    
    const isAppleSilicon = this.arch === 'arm64';
    const installerUrl = isAppleSilicon
      ? 'https://desktop.docker.com/mac/main/arm64/Docker.dmg'
      : 'https://desktop.docker.com/mac/main/amd64/Docker.dmg';
    
    const dmgPath = path.join(app.getPath('temp'), 'Docker.dmg');

    // Download Docker Desktop
    const downloaded = await this.downloadFile(installerUrl, dmgPath, (progress) => {
      updateProgress(`Downloading Docker Desktop... ${Math.round(progress)}%`, 10 + progress * 0.6);
    });

    if (!downloaded) {
      throw new Error('Failed to download Docker Desktop');
    }

    updateProgress('Installing Docker Desktop...', 70);

    // Mount the DMG
    await this.executeCommand(`hdiutil attach "${dmgPath}"`);
    
    // Copy Docker.app to Applications
    await this.executeCommand('cp -R "/Volumes/Docker/Docker.app" /Applications/');
    
    // Unmount the DMG
    await this.executeCommand('hdiutil detach "/Volumes/Docker"');
    
    updateProgress('Starting Docker Desktop...', 90);
    
    // Start Docker Desktop
    await this.executeCommand('open /Applications/Docker.app');
    
    // Wait for Docker to be ready
    await this.waitForDocker(updateProgress);
    
    updateProgress('Docker Desktop installed successfully!', 100);
    return true;
  }

  // Install Docker on Linux
  private async installDockerLinux(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    updateProgress('Installing Docker Engine for Linux...', 10);
    
    // Detect Linux distribution
    const distro = await this.detectLinuxDistro();
    
    switch (distro) {
      case 'ubuntu':
      case 'debian':
        return await this.installDockerDebian(updateProgress);
      case 'fedora':
      case 'centos':
      case 'rhel':
        return await this.installDockerFedora(updateProgress);
      default:
        // Try generic installation script
        return await this.installDockerGeneric(updateProgress);
    }
  }

  // Install Docker on Fedora/CentOS/RHEL
  private async installDockerFedora(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    const commands = [
      'sudo dnf -y install dnf-plugins-core',
      'sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo',
      'sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'sudo systemctl start docker',
      'sudo systemctl enable docker',
      'sudo usermod -aG docker $USER'
    ];

    let progress = 20;
    const stepIncrement = 70 / commands.length;

    for (const cmd of commands) {
      updateProgress(`Running: ${cmd.substring(0, 50)}...`, progress);
      try {
        await this.executeCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        // Continue with next command
      }
      progress += stepIncrement;
    }

    updateProgress('Docker Engine installed successfully!', 100);
    return true;
  }

  // Install Docker on Debian/Ubuntu
  private async installDockerDebian(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    const commands = [
      'sudo apt-get update',
      'sudo apt-get install -y ca-certificates curl gnupg',
      'sudo install -m 0755 -d /etc/apt/keyrings',
      'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg',
      'sudo chmod a+r /etc/apt/keyrings/docker.gpg',
      'echo "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
      'sudo apt-get update',
      'sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin',
      'sudo usermod -aG docker $USER'
    ];

    let progress = 20;
    const stepIncrement = 70 / commands.length;

    for (const cmd of commands) {
      updateProgress(`Running: ${cmd.substring(0, 50)}...`, progress);
      try {
        await this.executeCommand(cmd);
      } catch (error) {
        console.error(`Command failed: ${cmd}`, error);
        // Continue with next command
      }
      progress += stepIncrement;
    }

    // Start Docker service
    await this.executeCommand('sudo systemctl start docker');
    await this.executeCommand('sudo systemctl enable docker');
    
    updateProgress('Docker Engine installed successfully!', 100);
    return true;
  }

  // Generic Docker installation using official script
  private async installDockerGeneric(updateProgress: (status: string, progress: number) => void): Promise<boolean> {
    updateProgress('Downloading Docker installation script...', 20);
    
    const scriptPath = path.join(app.getPath('temp'), 'get-docker.sh');
    const downloaded = await this.downloadFile('https://get.docker.com', scriptPath, (progress) => {
      updateProgress(`Downloading installation script... ${Math.round(progress)}%`, 20 + progress * 0.3);
    });

    if (!downloaded) {
      throw new Error('Failed to download Docker installation script');
    }

    updateProgress('Running Docker installation script...', 50);
    
    // Make script executable and run it
    await this.executeCommand(`chmod +x "${scriptPath}"`);
    await this.executeCommand(`sudo sh "${scriptPath}"`);
    
    // Add user to docker group
    await this.executeCommand('sudo usermod -aG docker $USER');
    
    // Start Docker service
    await this.executeCommand('sudo systemctl start docker');
    await this.executeCommand('sudo systemctl enable docker');
    
    updateProgress('Docker Engine installed successfully!', 100);
    return true;
  }

  // Start Docker Desktop (Windows/Mac)
  async startDockerDesktop(): Promise<boolean> {
    try {
      if (this.platform === 'win32') {
        // Start Docker Desktop on Windows
        await this.executeCommand('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"');
      } else if (this.platform === 'darwin') {
        // Start Docker Desktop on Mac
        await this.executeCommand('open /Applications/Docker.app');
      }
      
      // Wait for Docker to be ready
      await this.waitForDocker();
      return true;
    } catch (error) {
      console.error('Failed to start Docker Desktop:', error);
      return false;
    }
  }

  // Wait for Docker daemon to be ready
  private async waitForDocker(updateProgress?: (status: string, progress: number) => void): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (attempts < maxAttempts) {
      try {
        await this.executeCommand('docker ps');
        return true;
      } catch {
        attempts++;
        updateProgress?.(`Waiting for Docker to start... (${attempts}/${maxAttempts})`, 90 + (attempts / maxAttempts) * 10);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    return false;
  }

  // Pull LocalAI Docker image
  async pullLocalAIImage(onProgress?: (status: string, progress: number) => void): Promise<boolean> {
    const updateProgress = (status: string, progress: number) => {
      this.emit('pull-progress', { status, progress });
      onProgress?.(status, progress);
    };

    try {
      updateProgress('Pulling LocalAI Docker image...', 0);
      
      return new Promise((resolve) => {
        const pullProcess = spawn('docker', ['pull', 'quay.io/go-skynet/local-ai:latest'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let outputBuffer = '';
        
        pullProcess.stdout.on('data', (data) => {
          outputBuffer += data.toString();
          // Parse Docker pull progress
          const lines = outputBuffer.split('\n');
          for (const line of lines) {
            if (line.includes('Pull complete')) {
              updateProgress('Pulling LocalAI layers...', 50);
            } else if (line.includes('Downloaded')) {
              updateProgress('Downloading LocalAI...', 30);
            }
          }
        });

        pullProcess.stderr.on('data', (data) => {
          console.error('Docker pull stderr:', data.toString());
        });

        pullProcess.on('close', (code) => {
          if (code === 0) {
            updateProgress('LocalAI Docker image ready!', 100);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Failed to pull LocalAI image:', error);
      return false;
    }
  }

  // Start LocalAI container
  async startLocalAIContainer(modelsPath: string, port: number = 8080): Promise<boolean> {
    try {
      // Check if container already exists
      try {
        await this.executeCommand('docker stop localai');
        await this.executeCommand('docker rm localai');
      } catch {
        // Container doesn't exist, continue
      }

      // Start LocalAI container
      const command = `docker run -d --name localai -p ${port}:8080 -v "${modelsPath}:/models" quay.io/go-skynet/local-ai:latest`;
      await this.executeCommand(command);
      
      // Wait for LocalAI to be ready
      await this.waitForLocalAI(port);
      
      return true;
    } catch (error) {
      console.error('Failed to start LocalAI container:', error);
      return false;
    }
  }

  // Wait for LocalAI API to be ready
  private async waitForLocalAI(port: number): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://localhost:${port}/readyz`);
        if (response.ok) {
          return true;
        }
      } catch {
        // Not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
  }

  // Helper: Execute command
  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  // Helper: Download file with progress
  private downloadFile(url: string, destination: string, onProgress?: (progress: number) => void): Promise<boolean> {
    return new Promise((resolve) => {
      const file = fs.createWriteStream(destination);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            response.destroy();
            file.close();
            this.downloadFile(redirectUrl, destination, onProgress).then(resolve);
            return;
          }
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0 && onProgress) {
            onProgress((downloadedBytes / totalBytes) * 100);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      }).on('error', (error) => {
        console.error('Download error:', error);
        fs.unlink(destination, () => {});
        resolve(false);
      });
    });
  }

  // Check if running as Windows admin
  private async checkWindowsAdmin(): Promise<boolean> {
    if (this.platform !== 'win32') return false;
    
    try {
      await this.executeCommand('net session');
      return true;
    } catch {
      return false;
    }
  }

  // Detect Linux distribution
  private async detectLinuxDistro(): Promise<string> {
    try {
      const osRelease = await this.executeCommand('cat /etc/os-release');
      if (osRelease.includes('ubuntu')) return 'ubuntu';
      if (osRelease.includes('debian')) return 'debian';
      if (osRelease.includes('fedora')) return 'fedora';
      if (osRelease.includes('centos')) return 'centos';
      if (osRelease.includes('rhel')) return 'rhel';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Install Docker Compose if needed
  async installDockerCompose(): Promise<boolean> {
    try {
      // Check if already installed
      const requirements = await this.checkSystemRequirements();
      if (requirements.hasDockerCompose) {
        return true;
      }

      if (this.platform === 'linux') {
        // Install Docker Compose plugin
        await this.executeCommand('sudo apt-get update && sudo apt-get install -y docker-compose-plugin');
        return true;
      }

      // Docker Desktop includes Docker Compose
      return true;
    } catch (error) {
      console.error('Failed to install Docker Compose:', error);
      return false;
    }
  }
}