#!/usr/bin/env python3
"""
Start NLP Services - BlackstoneNLP + Presidio
Run both services concurrently for the legal application
"""

import subprocess
import time
import sys
import signal
import os
from threading import Thread

class ServiceManager:
    def __init__(self):
        self.processes = []
        self.running = True
        
    def start_service(self, script_name, service_name):
        """Start a service and monitor it"""
        print(f"🚀 Starting {service_name}...")
        
        try:
            process = subprocess.Popen(
                [sys.executable, script_name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes.append({
                'process': process,
                'name': service_name,
                'script': script_name
            })
            
            # Monitor output in a separate thread
            def monitor_output(proc, name):
                try:
                    while self.running and proc.poll() is None:
                        output = proc.stdout.readline()
                        if output:
                            print(f"[{name}] {output.strip()}")
                        time.sleep(0.1)
                except:
                    pass
            
            Thread(target=monitor_output, args=(process, service_name), daemon=True).start()
            
            # Give it time to start
            time.sleep(2)
            print(f"✅ {service_name} started")
            
        except Exception as e:
            print(f"❌ Failed to start {service_name}: {str(e)}")
    
    def shutdown(self):
        """Shutdown all services gracefully"""
        print("\n🛑 Shutting down services...")
        self.running = False
        
        for service in self.processes:
            try:
                service['process'].terminate()
                print(f"✅ {service['name']} stopped")
            except:
                try:
                    service['process'].kill()
                except:
                    pass

def main():
    """Main function"""
    print("🔧 Legal Case Management - NLP Services Startup")
    print("=" * 50)
    print("Starting BlackstoneNLP (port 5004) and Presidio (port 5002)...")
    print("Press Ctrl+C to stop all services\n")
    
    manager = ServiceManager()
    
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        manager.shutdown()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Start both services
        manager.start_service('blackstone_server.py', 'BlackstoneNLP')
        time.sleep(1)
        manager.start_service('presidio_server.py', 'Presidio')
        
        print(f"\n🎉 All services started successfully!")
        print(f"📡 Services available at:")
        print(f"   - BlackstoneNLP: http://localhost:5004")
        print(f"   - Presidio: http://localhost:5002")
        print(f"\n🔗 Ready for frontend integration!")
        print(f"💡 Run 'python test_complete_setup.py' to test the services")
        print(f"\nPress Ctrl+C to stop all services...")
        
        # Keep running until interrupted
        while manager.running:
            time.sleep(1)
            
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        manager.shutdown()

if __name__ == '__main__':
    main()