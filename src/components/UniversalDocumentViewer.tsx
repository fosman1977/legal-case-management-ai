import React, { useState } from 'react';
import { UniversalDocumentExtractor } from '../services/universalDocumentExtractor';

interface UniversalDocumentViewerProps {
  onClose: () => void;
}

export const UniversalDocumentViewer: React.FC<UniversalDocumentViewerProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'entities' | 'tables' | 'analysis'>('text');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && UniversalDocumentExtractor.isSupported(uploadedFile)) {
      setFile(uploadedFile);
      setExtractionResult(null);
    } else if (uploadedFile) {
      alert(`Unsupported file format. Supported formats: ${UniversalDocumentExtractor.getSupportedFormats().join(', ')}`);
    }
  };

  const handleExtractDocument = async () => {
    if (!file) return;

    setIsExtracting(true);
    try {
      console.log('🚀 Starting universal document extraction...');
      
      // Use the universal extraction API with full features
      const result = await UniversalDocumentExtractor.extract(file, {
        extractTables: true,
        extractEntities: true,
        extractImages: true, // Extract images from Word docs
        maxPages: 50
      });

      console.log('📊 Universal Extraction Results:', {
        format: result.format.toUpperCase(),
        method: result.method,
        processingTime: result.processingTime + 'ms',
        textLength: result.text.length,
        wordCount: result.metadata.wordCount,
        entitiesFound: result.entities?.length || 0,
        tablesFound: result.tables?.length || 0,
        imagesFound: result.images?.length || 0,
        warnings: result.warnings?.length || 0
      });

      console.log('📄 Document format:', result.format);
      console.log('⚖️ Legal entities:', result.entities);
      console.log('📋 Tables found:', result.tables);
      console.log('🖼️ Images found:', result.images);
      
      setExtractionResult(result);
    } catch (error) {
      console.error('Document extraction failed:', error);
      alert('Failed to extract document. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return '📑';
      case 'docx': return '📝';
      case 'doc': return '📄';
      case 'txt': return '📃';
      case 'rtf': return '📜';
      default: return '📋';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'pdf': return 'bg-red-100 text-red-800';
      case 'docx': return 'bg-blue-100 text-blue-800';
      case 'doc': return 'bg-indigo-100 text-indigo-800';
      case 'txt': return 'bg-gray-100 text-gray-800';
      case 'rtf': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Universal Document Extractor</h2>
            <p className="text-sm text-gray-600">
              Supports: {UniversalDocumentExtractor.getSupportedFormats().join(' • ')}
            </p>
          </div>
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
                <div className="mb-6">
                  <div className="grid grid-cols-5 gap-4 mb-4 text-4xl">
                    <div className="flex flex-col items-center">
                      <span>📑</span>
                      <span className="text-xs text-gray-500 mt-1">PDF</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span>📝</span>
                      <span className="text-xs text-gray-500 mt-1">Word</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span>📄</span>
                      <span className="text-xs text-gray-500 mt-1">Legacy</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span>📃</span>
                      <span className="text-xs text-gray-500 mt-1">Text</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span>📜</span>
                      <span className="text-xs text-gray-500 mt-1">RTF</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label
                    htmlFor="doc-upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Select Document
                  </label>
                </div>
                <p className="text-gray-600 max-w-md">
                  Upload any supported document to see intelligent extraction with legal analysis
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getFormatIcon(extractionResult?.format || 'unknown')}</div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        {extractionResult && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getFormatColor(extractionResult.format)}`}>
                            {extractionResult.format.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleExtractDocument}
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
                  <div className="p-4 bg-green-50 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Format:</span>
                        <div className="text-green-600 font-semibold">
                          {extractionResult.format.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Method:</span>
                        <div className="text-blue-600 font-semibold">
                          {extractionResult.method.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <div className="text-purple-600 font-semibold">
                          {extractionResult.processingTime}ms
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Words:</span>
                        <div className="text-orange-600 font-semibold">
                          {extractionResult.metadata.wordCount?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Entities:</span>
                        <div className="text-teal-600 font-semibold">
                          {extractionResult.entities?.length || 0}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Tables:</span>
                        <div className="text-indigo-600 font-semibold">
                          {extractionResult.tables?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {extractionResult.legalMetadata?.documentType && (
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          📑 {extractionResult.legalMetadata.documentType.replace('_', ' ')}
                        </span>
                      )}
                      {extractionResult.images?.length > 0 && (
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                          🖼️ {extractionResult.images.length} images
                        </span>
                      )}
                      {extractionResult.warnings?.length > 0 && (
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          ⚠️ {extractionResult.warnings.length} warnings
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b">
                    <div className="flex space-x-4 px-4">
                      {[
                        { id: 'text', label: '📄 Text Content', count: null },
                        { id: 'entities', label: '⚖️ Legal Entities', count: extractionResult.entities?.length || 0 },
                        { id: 'tables', label: '📋 Tables', count: extractionResult.tables?.length || 0 },
                        { id: 'analysis', label: '📊 Document Analysis', count: null }
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
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Extracted Text Content</h3>
                          <div className="text-sm text-gray-500">
                            {extractionResult.metadata.characterCount?.toLocaleString()} characters
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                          <div className="text-sm leading-relaxed">
                            {extractionResult.text ? (
                              extractionResult.text.substring(0, 3000).split('\n').map((line: string, index: number) => (
                                <div key={index} className="mb-1">
                                  {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 italic">No text content extracted</div>
                            )}
                            {extractionResult.text && extractionResult.text.length > 3000 && (
                              <div className="text-gray-500 italic mt-2">... (showing first 3000 characters)</div>
                            )}
                          </div>
                        </div>
                        
                        {extractionResult.images && extractionResult.images.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium mb-3">📷 Images Found ({extractionResult.images.length})</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {extractionResult.images.slice(0, 6).map((img: any, index: number) => (
                                <div key={index} className="border rounded-lg p-2">
                                  <img 
                                    src={img.src} 
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling!.textContent = 'Image preview unavailable';
                                    }}
                                  />
                                  <div className="text-xs text-gray-500 mt-1">Image {index + 1}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'entities' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Legal Entities Detected</h3>
                        {!extractionResult.entities || extractionResult.entities.length === 0 ? (
                          <p className="text-gray-500">No legal entities detected in this document</p>
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
                                    </div>
                                    <p className="font-semibold">{entity.value}</p>
                                    {entity.normalizedValue && entity.normalizedValue !== entity.value && (
                                      <p className="text-sm text-gray-600">→ {entity.normalizedValue}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">{entity.context}</p>
                                  </div>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {Math.round((entity.confidence || 0.5) * 100)}%
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
                        <h3 className="text-lg font-semibold">Tables Extracted</h3>
                        {!extractionResult.tables || extractionResult.tables.length === 0 ? (
                          <p className="text-gray-500">No tables detected in this document</p>
                        ) : (
                          <div className="space-y-6">
                            {extractionResult.tables.map((table: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium">Table {index + 1}</h4>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {Math.round((table.confidence || 0.5) * 100)}% confidence
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full table-auto border-collapse border border-gray-200">
                                    {table.headers && (
                                      <thead>
                                        <tr className="bg-gray-50">
                                          {table.headers.map((header: string, hIndex: number) => (
                                            <th key={hIndex} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                    )}
                                    <tbody>
                                      {table.rows && table.rows.map((row: string[], rIndex: number) => (
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

                    {activeTab === 'analysis' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Document Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">📊 Document Statistics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Format:</span>
                                <span className="font-medium">{extractionResult.format.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Extraction Method:</span>
                                <span className="font-medium">{extractionResult.method}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Processing Time:</span>
                                <span className="font-medium">{extractionResult.processingTime}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Word Count:</span>
                                <span className="font-medium">{extractionResult.metadata.wordCount?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Character Count:</span>
                                <span className="font-medium">{extractionResult.metadata.characterCount?.toLocaleString() || 'N/A'}</span>
                              </div>
                              {extractionResult.metadata.pages && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Pages:</span>
                                  <span className="font-medium">{extractionResult.metadata.pages}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">⚖️ Legal Analysis</h4>
                            {extractionResult.legalMetadata ? (
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Document Type:</span>
                                  <div className="mt-1">{extractionResult.legalMetadata.documentType?.replace('_', ' ') || 'Unknown'}</div>
                                </div>
                                {extractionResult.legalMetadata.caseNumber && (
                                  <div>
                                    <span className="font-medium">Case Number:</span>
                                    <div className="mt-1">{extractionResult.legalMetadata.caseNumber}</div>
                                  </div>
                                )}
                                {extractionResult.legalMetadata.court && (
                                  <div>
                                    <span className="font-medium">Court:</span>
                                    <div className="mt-1">{extractionResult.legalMetadata.court}</div>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Legal Entities Found:</span>
                                  <div className="mt-1">{extractionResult.legalMetadata.entities || 0}</div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No legal metadata available for this document format</p>
                            )}
                          </div>
                        </div>

                        {extractionResult.warnings && extractionResult.warnings.length > 0 && (
                          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                            <h4 className="font-medium text-orange-800 mb-2">⚠️ Extraction Warnings</h4>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {extractionResult.warnings.map((warning: string, index: number) => (
                                <li key={index}>• {warning}</li>
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