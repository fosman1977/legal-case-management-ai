# 🔧 Integration Example: Enhanced OCR Progress in CaseFolderScanner

## **Simple Integration Steps**

Here's how to enhance the existing `CaseFolderScanner.tsx` with beautiful OCR progress indicators:

### **1. Add Imports**

```tsx
// At the top of CaseFolderScanner.tsx
import { EnhancedOCRProgress } from './EnhancedOCRProgress';
import { EnhancedProgressTracker } from '../utils/enhancedProgressTracker';
import { EnhancedProgressUpdate } from '../services/productionDocumentExtractor';
```

### **2. Add State for Enhanced Progress**

```tsx
// Add these state variables
const [enhancedProgress, setEnhancedProgress] = useState<EnhancedProgressUpdate | null>(null);
const [progressTracker, setProgressTracker] = useState<EnhancedProgressTracker | null>(null);
```

### **3. Initialize Progress Tracker**

```tsx
// In handleScanFolder function, before processing
const tracker = new EnhancedProgressTracker();
setProgressTracker(tracker);

// Set up the enhanced progress callback
tracker.setProgressCallback((progress) => {
  setEnhancedProgress(progress);
});
```

### **4. Update Document Processing**

```tsx
// When processing individual files, replace basic progress with enhanced tracking
for (const file of files) {
  if (progressTracker) {
    progressTracker.reset(file.name, file.size);
  }

  try {
    // Use ProductionDocumentExtractor with enhanced progress
    const extractionResult = await extractor.extract(file.content, {
      onProgress: (basicProgress) => {
        // Convert basic progress to enhanced progress
        progressTracker?.updateProgress(basicProgress);
        
        // Keep existing basic progress for backward compatibility
        setScanProgress({
          current: basicProgress.current,
          total: basicProgress.total,
          currentFile: file.name
        });
      }
    });

    // Process results...
  } catch (error) {
    // Handle errors...
    if (progressTracker) {
      setEnhancedProgress({
        stage: 'error',
        progress: 0,
        error: error.message,
        fileName: file.name
      });
    }
  }
}
```

### **5. Update the Render Method**

```tsx
// Replace the existing progress display with the enhanced version
{(isScanning || isProcessing) && (
  <>
    {/* Keep existing basic progress for fallback */}
    {!enhancedProgress && (
      <div className="progress-indicator">
        Processing {scanProgress.currentFile}... 
        ({scanProgress.current}/{scanProgress.total})
      </div>
    )}
    
    {/* Show enhanced progress when available */}
    {enhancedProgress && (
      <EnhancedOCRProgress 
        progress={enhancedProgress}
        onCancel={() => {
          // Add cancellation logic here
          setIsScanning(false);
          setIsProcessing(false);
          setEnhancedProgress(null);
        }}
        showDetailedStats={true}
      />
    )}
  </>
)}
```

---

## **Complete Enhanced CaseFolderScanner Example**

Here's what the key parts of the enhanced component look like:

```tsx
import React, { useState } from 'react';
import { CaseDocument } from '../types';
import { caseFolderScanner, ScannedFile, FileTags } from '../utils/caseFolderScanner';
import { EnhancedOCRProgress } from './EnhancedOCRProgress';
import { EnhancedProgressTracker } from '../utils/enhancedProgressTracker';
import { EnhancedProgressUpdate } from '../services/productionDocumentExtractor';

interface CaseFolderScannerProps {
  caseId: string;
  caseTitle: string;
  onDocumentsScanned: (documents: CaseDocument[]) => void;
}

export const CaseFolderScanner: React.FC<CaseFolderScannerProps> = ({
  caseId,
  caseTitle,
  onDocumentsScanned
}) => {
  // Existing state
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentFile: '' });

  // NEW: Enhanced progress state
  const [enhancedProgress, setEnhancedProgress] = useState<EnhancedProgressUpdate | null>(null);
  const [progressTracker, setProgressTracker] = useState<EnhancedProgressTracker | null>(null);

  const handleScanFolder = async () => {
    if (!folderHandle) return;

    setIsScanning(true);
    setEnhancedProgress(null);

    // NEW: Initialize enhanced progress tracker
    const tracker = new EnhancedProgressTracker();
    setProgressTracker(tracker);
    tracker.setProgressCallback(setEnhancedProgress);

    try {
      // Existing scanning logic...
      const files = await caseFolderScanner.scanCaseFolder(folderHandle, caseId);
      setScannedFiles(files);
      
      // Processing with enhanced progress
      setIsProcessing(true);
      const processedDocuments: CaseDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Reset tracker for each file
        tracker.reset(file.name, file.relativePath ? new Blob([file.relativePath]).size : 0);

        // Set overall batch progress
        setScanProgress({
          current: i + 1,
          total: files.length,
          currentFile: file.name
        });

        try {
          // Process file with enhanced progress
          const result = await processFileWithEnhancedProgress(file, tracker);
          processedDocuments.push(result);

        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          
          // Show error in enhanced progress
          tracker.setProgressCallback(() => {
            setEnhancedProgress({
              stage: 'error',
              progress: 0,
              error: `Failed to process ${file.name}: ${error.message}`,
              fileName: file.name
            });
          });
        }
      }

      // Complete
      setEnhancedProgress({
        stage: 'completed',
        progress: 100,
        fileName: `${files.length} documents processed`,
        textExtracted: processedDocuments.reduce((sum, doc) => sum + doc.content.length, 0),
        tablesFound: 0, // Calculate from results
        entitiesFound: 0 // Calculate from results
      });

      onDocumentsScanned(processedDocuments);

    } catch (error) {
      console.error('Scan failed:', error);
      setEnhancedProgress({
        stage: 'error',
        progress: 0,
        error: error.message,
        fileName: folderHandle.name
      });
    } finally {
      setIsScanning(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="case-folder-scanner">
      {/* Existing UI elements... */}
      
      {/* Enhanced Progress Display */}
      {(isScanning || isProcessing || enhancedProgress) && (
        <div className="progress-section">
          {/* Fallback to basic progress if enhanced not available */}
          {!enhancedProgress && (
            <div className="basic-progress">
              📄 Processing {scanProgress.currentFile}... 
              ({scanProgress.current}/{scanProgress.total})
            </div>
          )}
          
          {/* Enhanced progress component */}
          {enhancedProgress && (
            <EnhancedOCRProgress 
              progress={enhancedProgress}
              onCancel={() => {
                setIsScanning(false);
                setIsProcessing(false);
                setEnhancedProgress(null);
              }}
              showDetailedStats={true}
            />
          )}
        </div>
      )}

      {/* Rest of existing component... */}
    </div>
  );
};

// Helper function for processing files with enhanced progress
async function processFileWithEnhancedProgress(
  file: ScannedFile, 
  tracker: EnhancedProgressTracker
): Promise<CaseDocument> {
  
  // Use ProductionDocumentExtractor with progress tracking
  const result = await ProductionDocumentExtractor.extract(file.content, {
    mode: 'full',
    enableOCR: true,
    enableTables: true,
    enableEntities: true,
    onProgress: (basicProgress) => {
      // Enhanced progress tracking
      tracker.updateProgress(basicProgress);
    }
  });

  // Convert extraction result to CaseDocument
  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    caseId: file.caseId,
    title: file.name,
    category: 'hearing_bundle', // Or determine from file analysis
    type: 'exhibit',
    content: result.text,
    fileName: file.name,
    fileSize: result.metadata.fileSize,
    fileType: result.metadata.fileType
  };
}
```

---

## **Migration Benefits**

### **Before (Basic Progress)**
```
📄 Processing contract.pdf... (5/12)
```

### **After (Enhanced Progress)**
- 🎨 **Beautiful circular progress ring** with animated fill
- 📊 **Detailed statistics cards** showing extracted characters, tables, entities
- 🔍 **OCR-specific indicators** showing worker status and OCR progress
- ⚡ **Real-time metrics** including processing speed and ETA
- 🎯 **Quality indicators** showing extraction confidence and text quality
- 📱 **Mobile-responsive design** that works on all screen sizes

---

## **Backward Compatibility**

The integration maintains full backward compatibility:

- ✅ **Existing progress tracking** still works as fallback
- ✅ **All existing functionality** preserved
- ✅ **Graceful degradation** if enhanced progress isn't available
- ✅ **Progressive enhancement** - better experience when supported

---

## **Simple 3-Step Integration**

1. **Add the components** to your imports
2. **Add enhanced progress state** to your component  
3. **Replace progress display** with `<EnhancedOCRProgress />`

**That's it!** Your users immediately get a beautiful, professional progress experience. 🚀