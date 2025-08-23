import Tesseract, { createWorker, Worker } from 'tesseract.js';

export interface OCRWorkerPool {
  process: (canvas: HTMLCanvasElement, language?: string) => Promise<Tesseract.RecognizeResult>;
  terminate: () => Promise<void>;
  getAvailableWorker: () => Worker | null;
  getStatus: () => { active: number; total: number };
}

class WorkerPoolManager implements OCRWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(private poolSize: number = 4) {}

  private async initializeWorkers(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      console.log(`🔧 Initializing OCR worker pool with ${this.poolSize} workers...`);
      
      const workerPromises = Array(this.poolSize).fill(null).map(async (_, index) => {
        try {
          const worker = await createWorker('eng', 1, {
            workerPath: '/tesseract/worker.min.js',
            langPath: '/tesseract/lang-data',
            corePath: '/tesseract/tesseract-core.wasm.js',
            cacheMethod: 'indexedDB',
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                console.log(`🔍 Worker ${index}: ${Math.round(m.progress * 100)}%`);
              }
            }
          });

          // Configure for better performance
          await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            preserve_interword_spaces: '1',
          });

          this.workers.push(worker);
          this.availableWorkers.push(worker);
          console.log(`✅ OCR Worker ${index} initialized`);
          
          return worker;
        } catch (error) {
          console.error(`❌ Failed to initialize OCR worker ${index}:`, error);
          throw error;
        }
      });

      await Promise.all(workerPromises);
      this.isInitialized = true;
      console.log(`🚀 OCR worker pool ready with ${this.workers.length} workers`);
    })();

    return this.initPromise;
  }

  async process(canvas: HTMLCanvasElement, language: string = 'eng'): Promise<Tesseract.RecognizeResult> {
    if (!this.isInitialized) {
      await this.initializeWorkers();
    }

    return new Promise((resolve, reject) => {
      const tryGetWorker = () => {
        if (this.availableWorkers.length > 0) {
          const worker = this.availableWorkers.pop()!;
          this.busyWorkers.add(worker);
          
          worker.recognize(canvas, language)
            .then((result) => {
              this.busyWorkers.delete(worker);
              this.availableWorkers.push(worker);
              resolve(result);
            })
            .catch((error) => {
              this.busyWorkers.delete(worker);
              this.availableWorkers.push(worker);
              reject(error);
            });
        } else {
          // Wait for a worker to become available
          setTimeout(tryGetWorker, 100);
        }
      };

      tryGetWorker();
    });
  }

  getAvailableWorker(): Worker | null {
    return this.availableWorkers.length > 0 ? this.availableWorkers[0] : null;
  }

  getStatus(): { active: number; total: number } {
    return {
      active: this.busyWorkers.size,
      total: this.workers.length
    };
  }

  async terminate(): Promise<void> {
    console.log('🛑 Terminating OCR worker pool...');
    
    const terminatePromises = this.workers.map(async (worker) => {
      try {
        await worker.terminate();
      } catch (error) {
        console.warn('Warning: Error terminating worker:', error);
      }
    });

    await Promise.all(terminatePromises);
    
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.isInitialized = false;
    this.initPromise = null;
    
    console.log('✅ OCR worker pool terminated');
  }
}

// Singleton instance
let ocrWorkerPool: WorkerPoolManager | null = null;

export const getOCRWorkerPool = (poolSize?: number): OCRWorkerPool => {
  if (!ocrWorkerPool) {
    ocrWorkerPool = new WorkerPoolManager(poolSize);
  }
  return ocrWorkerPool;
};

export const terminateOCRWorkerPool = async (): Promise<void> => {
  if (ocrWorkerPool) {
    await ocrWorkerPool.terminate();
    ocrWorkerPool = null;
  }
};