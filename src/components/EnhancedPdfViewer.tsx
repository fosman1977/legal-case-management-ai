import React, { useState } from 'react';
import { PDFTextExtractor } from '../services/enhancedBrowserPdfExtractor';

interface EnhancedPdfViewerProps {
  onClose: () => void;
}

export const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'entities' | 'tables' | 'metadata'>('text');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && PDFTextExtractor.isPDF(uploadedFile)) {
      setFile(uploadedFile);
      setExtractionResult(null);
    }
  };

  const handleExtractPdf = async () => {
    if (!file) return;

    setIsExtracting(true);
    try {
      console.log('🚀 Starting enhanced PDF extraction...');
      
      // Use the new enhanced extraction API
      const result = await PDFTextExtractor.extract(file, {
        extractTables: true,
        extractEntities: true,
        maxPages: 50 // Process more pages
      });

      // Access rich data
      console.log('📊 Extraction Results:', {
        method: result.method,
        processingTime: result.processingTime + 'ms',
        quality: result.quality.overall,
        textLength: result.text.length,
        entitiesFound: result.entities.length,
        tablesFound: result.tables.length,
        documentType: result.legalMetadata?.documentType
      });

      console.log('⚖️ Legal entities:', result.entities);
      console.log('📋 Tables found:', result.tables);
      console.log('🎯 Document quality:', result.quality);
      
      setExtractionResult(result);
    } catch (error) {
      console.error('PDF extraction failed:', error);
      alert('Failed to extract PDF. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Enhanced PDF Extraction Demo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!file ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Select PDF File
                  </label>
                </div>
                <p className="text-gray-600">
                  Upload a legal document to see enhanced extraction in action
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={handleExtractPdf}
                    disabled={isExtracting}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isExtracting ? '🔍 Extracting...' : '🚀 Extract with AI'}
                  </button>
                </div>
              </div>

              {extractionResult && (
                <>
                  {/* Performance Summary */}
                  <div className="p-4 bg-blue-50 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Method:</span>
                        <div className="text-blue-600 font-semibold">
                          {extractionResult.method.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <div className="text-green-600 font-semibold">
                          {extractionResult.processingTime}ms
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Quality:</span>
                        <div className="text-purple-600 font-semibold">
                          {Math.round(extractionResult.quality.overall * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Entities:</span>
                        <div className="text-orange-600 font-semibold">
                          {extractionResult.entities.length}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Tables:</span>
                        <div className="text-teal-600 font-semibold">
                          {extractionResult.tables.length}
                        </div>
                      </div>
                    </div>

                    {extractionResult.legalMetadata?.documentType && (
                      <div className="mt-2 inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        📑 {extractionResult.legalMetadata.documentType.replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b">
                    <div className="flex space-x-4 px-4">
                      {[
                        { id: 'text', label: '📄 Text', count: null },
                        { id: 'entities', label: '⚖️ Legal Entities', count: extractionResult.entities.length },
                        { id: 'tables', label: '📋 Tables', count: extractionResult.tables.length },
                        { id: 'metadata', label: '📊 Analysis', count: null }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.label}
                          {tab.count !== null && (
                            <span className="ml-2 bg-gray-200 text-gray-700 py-1 px-2 rounded-full text-xs">
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-auto p-4">
                    {activeTab === 'text' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Extracted Text</h3>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {extractionResult.text.substring(0, 2000)}
                            {extractionResult.text.length > 2000 && '... (truncated)'}
                          </pre>
                        </div>
                      </div>
                    )}

                    {activeTab === 'entities' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Legal Entities Detected</h3>
                        {extractionResult.entities.length === 0 ? (
                          <p className="text-gray-500">No legal entities detected</p>
                        ) : (
                          <div className="grid gap-4">
                            {extractionResult.entities.map((entity: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                                      <span className="text-sm font-medium text-blue-600 capitalize">
                                        {entity.type.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        Page {entity.pageNumber}
                                      </span>
                                    </div>
                                    <p className="font-semibold">{entity.value}</p>
                                    {entity.normalizedValue && entity.normalizedValue !== entity.value && (
                                      <p className="text-sm text-gray-600">→ {entity.normalizedValue}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">{entity.context}</p>
                                  </div>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {Math.round(entity.confidence * 100)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'tables' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Tables Found</h3>
                        {extractionResult.tables.length === 0 ? (
                          <p className="text-gray-500">No tables detected</p>
                        ) : (
                          <div className="space-y-6">
                            {extractionResult.tables.map((table: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium">Table {index + 1} (Page {table.pageNumber})</h4>
                                  <div className="flex space-x-2">
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      {table.type}
                                    </span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {Math.round(table.confidence * 100)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full table-auto border-collapse border border-gray-200">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        {table.headers.map((header: string, hIndex: number) => (
                                          <th key={hIndex} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {table.rows.map((row: string[], rIndex: number) => (
                                        <tr key={rIndex}>
                                          {row.map((cell: string, cIndex: number) => (
                                            <td key={cIndex} className="border border-gray-200 px-3 py-2 text-sm">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'metadata' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Document Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Quality Assessment</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Overall:</span>
                                <span className="font-medium">{Math.round(extractionResult.quality.overall * 100)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Text Quality:</span>
                                <span className="font-medium">{Math.round(extractionResult.quality.textQuality * 100)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Structure:</span>
                                <span className="font-medium">{Math.round(extractionResult.quality.structureQuality * 100)}%</span>
                              </div>
                              {extractionResult.quality.ocrQuality && (
                                <div className="flex justify-between">
                                  <span className="text-sm">OCR Quality:</span>
                                  <span className="font-medium">{Math.round(extractionResult.quality.ocrQuality * 100)}%</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Legal Metadata</h4>
                            {extractionResult.legalMetadata && (
                              <div className="space-y-2 text-sm">
                                {extractionResult.legalMetadata.caseNumber && (
                                  <div>
                                    <span className="font-medium">Case:</span> {extractionResult.legalMetadata.caseNumber}
                                  </div>
                                )}
                                {extractionResult.legalMetadata.court && (
                                  <div>
                                    <span className="font-medium">Court:</span> {extractionResult.legalMetadata.court}
                                  </div>
                                )}
                                {extractionResult.legalMetadata.parties && (
                                  <div>
                                    <span className="font-medium">Parties:</span>
                                    <ul className="ml-4 mt-1">
                                      {extractionResult.legalMetadata.parties.map((party: string, index: number) => (
                                        <li key={index}>• {party}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Type:</span> {extractionResult.legalMetadata.documentType}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {extractionResult.quality.warnings.length > 0 && (
                          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                            <h4 className="font-medium text-orange-800 mb-2">⚠️ Warnings</h4>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {extractionResult.quality.warnings.map((warning: string, index: number) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {extractionResult.quality.suggestions.length > 0 && (
                          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">💡 Suggestions</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              {extractionResult.quality.suggestions.map((suggestion: string, index: number) => (
                                <li key={index}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};