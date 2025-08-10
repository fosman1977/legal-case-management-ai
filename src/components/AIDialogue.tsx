import React, { useState, useRef, useEffect } from 'react';
import { CaseDocument, ChronologyEvent, Person, Issue, KeyPoint, LegalAuthority } from '../types';
import { storage } from '../utils/storage';
import { indexedDBManager } from '../utils/indexedDB';
import { unifiedAIClient } from '../utils/unifiedAIClient';
import { PDFTextExtractor } from '../services/enhancedBrowserPdfExtractor';
import { fileSystemManager } from '../utils/fileSystemManager';

interface AIDialogueProps {
  caseId: string;
  documents: CaseDocument[];
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  extractedData?: {
    chronologyEvents?: Partial<ChronologyEvent>[];
    persons?: Partial<Person>[];
    issues?: Partial<Issue>[];
    keyPoints?: Partial<KeyPoint>[];
    authorities?: Partial<LegalAuthority>[];
  };
  savedItems?: string[];
}

export const AIDialogue: React.FC<AIDialogueProps> = ({ caseId, documents }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Debug: Log documents when component receives them
  React.useEffect(() => {
    console.log(`🤖 AI Dialogue received ${documents.length} documents:`, documents.map(d => ({ 
      title: d.title, 
      hasFileId: !!d.fileId, 
      hasContent: !!d.content,
      hasFileContent: !!d.fileContent,
      contentLength: (d.content || '').length,
      fileContentLength: (d.fileContent || '').length
    })));
  }, [documents]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'auto' | 'chronology' | 'persons' | 'issues' | 'keypoints' | 'authorities'>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeWithAI = async (question: string) => {
    try {
      // Check if any documents are available
      if (documents.length === 0) {
        return {
          answer: "❌ **No Documents Available**\n\nI cannot analyze your case because no documents have been uploaded yet. Please:\n\n1. Go to the **Documents** tab\n2. Upload your legal documents (PDFs, Word docs, etc.)\n3. Return here to ask questions about your case\n\nOnce you have documents uploaded, I'll be able to provide detailed analysis based on your actual case materials.",
          extractedData: undefined
        };
      }

      // Get all document contents
      const documentContents = await Promise.all(
        documents.map(async (doc) => {
          let content = doc.content || '';
          
          // Add file content if available
          if (doc.fileContent) {
            content += '\n\n' + doc.fileContent;
          }
          
          // Check document type and read content accordingly
          const isScannedDoc = doc.id.startsWith('scan_');
          const isFileSystemDoc = doc.id.startsWith('fs_');
          
          if (isScannedDoc) {
            // Scanned documents already have content extracted during scanning
            // The fileContent should already be populated
            if (doc.fileContent && doc.fileContent.length > 50) {
              console.log(`📄 Using pre-extracted content from scanned document: ${doc.title} (${doc.fileContent.length} chars)`);
              // Content is already added above from doc.fileContent
            } else {
              console.warn(`⚠️ Scanned document ${doc.title} has no extracted content`);
            }
          } else if (isFileSystemDoc && (doc as any).filePath) {
            // Read from OneDrive file system (legacy file system approach)
            try {
              const caseData = storage.getCasesSync().find(c => c.id === caseId);
              if (caseData) {
                const file = await fileSystemManager.readDocumentFile(
                  caseId, 
                  caseData.title, 
                  (doc as any).filePath
                );
                
                if (file) {
                  if (PDFTextExtractor.isPDF(file)) {
                    const pdfText = await PDFTextExtractor.extractWithOCRFallback(file);
                    content += '\n\n' + pdfText;
                    console.log(`📄 Extracted ${pdfText.length} chars from OneDrive PDF: ${doc.title}`);
                  } else {
                    const fileText = await readFileAsText(file);
                    content += '\n\n' + fileText;
                    console.log(`📄 Read ${fileText.length} chars from OneDrive file: ${doc.title}`);
                  }
                }
              }
            } catch (error) {
              console.warn(`Failed to read OneDrive file for document ${doc.id}:`, error);
            }
          } else if (doc.fileId) {
            // Try to read actual file from IndexedDB
            try {
              const file = await indexedDBManager.getFile(doc.fileId);
              if (file) {
                if (PDFTextExtractor.isPDF(file)) {
                  const pdfText = await PDFTextExtractor.extractWithOCRFallback(file);
                  content += '\n\n' + pdfText;
                  console.log(`📄 Extracted ${pdfText.length} chars from IndexedDB PDF: ${doc.title}`);
                } else {
                  const fileText = await readFileAsText(file);
                  content += '\n\n' + fileText;
                  console.log(`📄 Read ${fileText.length} chars from IndexedDB file: ${doc.title}`);
                }
              }
            } catch (error) {
              console.warn(`Failed to read IndexedDB file for document ${doc.id}:`, error);
            }
          }
          
          // Optimize content length for AI processing
          const optimizedContent = optimizeContentForAI(content, doc.title);
          return `Document: ${doc.title} (${doc.category} - ${doc.type})\n${optimizedContent}`;
        })
      );

      const context = documentContents.join('\n\n---\n\n');
      
      // Check if we actually have content to analyze
      const totalContentLength = context.replace(/Document: .* \(.*\)\n/g, '').trim().length;
      if (totalContentLength < 50) {
        return {
          answer: "⚠️ **Limited Document Content**\n\nI found documents in your case, but they appear to be empty or contain very little text content. This could happen if:\n\n1. **Documents are just titles** without actual file uploads\n2. **PDF text extraction failed** - some PDFs are images without extractable text\n3. **Documents haven't finished processing**\n\nPlease check that your documents contain readable text content. You can try:\n- Re-uploading documents\n- Using text-based PDFs instead of scanned images\n- Adding content directly in the document description fields",
          extractedData: undefined
        };
      }
      
      // Get security preferences
      const savedPrefs = localStorage.getItem(`ai_prefs_${caseId}`);
      const prefs = savedPrefs ? JSON.parse(savedPrefs) : { selectedModel: 'gpt-3.5-turbo' };
      
      // Create prompt based on selected category
      let analysisPrompt = `You are analyzing REAL legal documents from an actual case. Answer this question based ONLY on the content provided: "${question}"

IMPORTANT INSTRUCTIONS:
- Analyze ONLY the actual document content provided below
- Do NOT create hypothetical scenarios or generic legal examples
- Do NOT use placeholder names like [Party A] or [Party B] 
- If information is not in the documents, say "This information is not available in the provided documents"
- Be specific and reference actual content from the documents

CASE DOCUMENTS:
${context}

QUESTION TO ANSWER: ${question}`;

      if (selectedCategory !== 'auto') {
        analysisPrompt += `\n\nFOCUS: Pay special attention to extracting information relevant to ${getCategoryDescription(selectedCategory)}.`;
      }

      analysisPrompt += `

RESPONSE FORMAT:
- Use clear headings with ## for main sections
- Use **bold** for important terms and names
- Use - for bullet points when listing items
- Structure your response clearly with proper formatting
- If you find specific information that should be saved, format it as JSON after your answer:

EXTRACTED_DATA:
{
  "chronologyEvents": [...],
  "persons": [...],
  "issues": [...],
  "keyPoints": [...],
  "authorities": [...]
}

Remember: Only analyze the actual documents provided. Use clear formatting to make your response easy to read.`;

      // Call LocalAI for analysis
      console.log(`🤖 Using model: ${prefs.selectedModel || 'gpt-3.5-turbo'}`);
      console.log(`📝 Prompt length: ${analysisPrompt.length} characters`);
      console.log(`📄 Document context length: ${context.length} characters`);
      console.log(`📋 Documents processed:`, documents.map(d => ({ 
        title: d.title, 
        id: d.id,
        isScanned: d.id.startsWith('scan_'),
        hasFileContent: !!d.fileContent,
        fileContentLength: d.fileContent?.length || 0,
        hasContent: !!d.content,
        contentLength: d.content?.length || 0
      })));
      
      // Use document context for better understanding
      const docContext = documents.map(doc => ({
        title: doc.title,
        content: doc.fileContent || doc.content || ''
      }));
      
      const aiResponse = await unifiedAIClient.queryWithDocuments(analysisPrompt, docContext, {
        model: prefs.selectedModel || 'gpt-3.5-turbo'
      });
      const response = aiResponse.content;
      
      console.log(`📊 AI response length: ${response.length} characters`);

      // Parse response to separate answer from extracted data
      const extractedDataMatch = response.match(/EXTRACTED_DATA:\s*(\{[\s\S]*\})/);
      let extractedData = undefined;
      let answer = response;

      if (extractedDataMatch) {
        try {
          extractedData = JSON.parse(extractedDataMatch[1]);
          answer = response.substring(0, response.indexOf('EXTRACTED_DATA:')).trim();
        } catch (error) {
          console.error('Failed to parse extracted data:', error);
        }
      }

      return { answer, extractedData };
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Return a helpful message when LocalAI is not available
      if (error instanceof Error && error.message.includes('No LocalAI models are available')) {
        return {
          answer: "⚠️ AI features are not available. Please check that LocalAI is running on localhost:8080.",
          extractedData: undefined
        };
      }
      throw error;
    }
  };

  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const optimizeContentForAI = (content: string, docTitle: string): string => {
    if (!content || content.length === 0) {
      return content;
    }

    const MAX_CONTENT_LENGTH = 8000; // Reasonable limit per document
    
    if (content.length <= MAX_CONTENT_LENGTH) {
      return content;
    }

    console.log(`📊 Optimizing content for ${docTitle}: ${content.length} chars → ${MAX_CONTENT_LENGTH} chars`);
    
    // Smart content sampling: take beginning, middle, and end
    const chunkSize = Math.floor(MAX_CONTENT_LENGTH / 3);
    const beginning = content.substring(0, chunkSize);
    const middle = content.substring(
      Math.floor(content.length / 2) - Math.floor(chunkSize / 2),
      Math.floor(content.length / 2) + Math.floor(chunkSize / 2)
    );
    const end = content.substring(content.length - chunkSize);
    
    return `${beginning}\n\n[... CONTENT TRUNCATED FOR AI PROCESSING ...]\n\n${middle}\n\n[... CONTENT TRUNCATED FOR AI PROCESSING ...]\n\n${end}`;
  };

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      chronology: 'chronological events and dates',
      persons: 'people, their roles, and relationships',
      issues: 'legal and factual issues',
      keypoints: 'key points for oral advocacy',
      authorities: 'legal authorities and case law'
    };
    return descriptions[category] || category;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const { answer, extractedData } = await analyzeWithAI(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: answer,
        timestamp: new Date(),
        extractedData,
        savedItems: []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while analyzing the documents. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveExtractedItem = async (messageId: string, category: string, item: any) => {
    try {
      let savedId = '';
      
      switch (category) {
        case 'chronologyEvents':
          const event: ChronologyEvent = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId
          };
          storage.saveChronologyEvent(event);
          savedId = event.id;
          break;
          
        case 'persons':
          const person: Person = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId,
            documentRefs: item.documentRefs || []
          };
          storage.savePerson(person);
          savedId = person.id;
          break;
          
        case 'issues':
          const issue: Issue = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId,
            documentRefs: item.documentRefs || [],
            relatedIssues: item.relatedIssues || []
          };
          storage.saveIssue(issue);
          savedId = issue.id;
          break;
          
        case 'keyPoints':
          const keyPoint: KeyPoint = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId,
            supportingDocs: item.supportingDocs || []
          };
          storage.saveKeyPoint(keyPoint);
          savedId = keyPoint.id;
          break;
          
        case 'authorities':
          const authority: LegalAuthority = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            caseId
          };
          storage.saveAuthority(authority);
          savedId = authority.id;
          break;
      }

      // Update message to mark item as saved
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            savedItems: [...(msg.savedItems || []), `${category}-${savedId}`]
          };
        }
        return msg;
      }));

      return savedId;
    } catch (error) {
      console.error('Failed to save item:', error);
      throw error;
    }
  };

  const isSaved = (messageId: string, category: string, index: number): boolean => {
    const message = messages.find(m => m.id === messageId);
    return message?.savedItems?.includes(`${category}-${index}`) || false;
  };

  const formatMessageContent = (content: string): React.ReactElement => {
    // Convert markdown-style formatting to HTML
    let formattedContent = content
      // First handle bold to avoid conflicts with italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert remaining single * to italic (but not already processed bold)
      .replace(/(?<!\<strong\>.*)\*([^*]+?)\*(?!.*<\/strong>)/g, '<em>$1</em>')
      // Convert ## Headings to <h3>
      .replace(/^#{2}\s+(.*$)/gm, '<h3>$1</h3>')
      // Convert ### Sub-headings to <h4>
      .replace(/^#{3}\s+(.*$)/gm, '<h4>$1</h4>')
      // Convert #### Sub-sub-headings to <h5>
      .replace(/^#{4}\s+(.*$)/gm, '<h5>$1</h5>')
      // Convert bullet points (-, *, +) to <li>
      .replace(/^[-*+]\s+(.*$)/gm, '<li>$1</li>')
      // Convert numbered lists to <li>
      .replace(/^\d+\.\s+(.*$)/gm, '<li>$1</li>')
      // Convert double line breaks to paragraph breaks
      .replace(/\n\n/g, '</p><p>')
      // Convert single line breaks to <br>
      .replace(/\n/g, '<br>')
      // Wrap content in paragraphs
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Fix paragraph breaks around headings and lists
      .replace(/<p><h([3-5])>/g, '<h$1>')
      .replace(/<\/h([3-5])><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>')
      // Group consecutive list items
      .replace(/<\/ul><br><ul>/g, '')
      .replace(/<\/ul><ul>/g, '')
      // Clean up empty paragraphs and extra breaks
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br><\/p>/g, '')
      .replace(/<br><h/g, '<h')
      .replace(/<\/h([3-5])><br>/g, '</h$1>')
      // Final cleanup
      .replace(/<br><br>/g, '<br>');

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  return (
    <div className="ai-dialogue">
      <div className="dialogue-header">
        <h3>🤖 AI Legal Assistant</h3>
        <div className="category-selector">
          <label>Focus on:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value as any)}
          >
            <option value="auto">Auto-detect</option>
            <option value="chronology">Chronology</option>
            <option value="persons">Persons</option>
            <option value="issues">Issues</option>
            <option value="keypoints">Key Points</option>
            <option value="authorities">Authorities</option>
          </select>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hello! I'm your AI legal assistant. I can help you analyze your case documents.</p>
            <p>You can ask me questions like:</p>
            <ul>
              <li>"What are the key dates in this case?"</li>
              <li>"Who are the main parties involved?"</li>
              <li>"What are the main legal issues?"</li>
              <li>"Find all references to breach of contract"</li>
              <li>"What authorities support the claimant's position?"</li>
            </ul>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="message-type">{message.type === 'user' ? '👤 You' : '🤖 AI'}</span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.type === 'ai' ? formatMessageContent(message.content) : message.content}
            </div>
            
            {message.extractedData && (
              <div className="extracted-data">
                <h4>📋 Extracted Information:</h4>
                
                {message.extractedData.chronologyEvents && message.extractedData.chronologyEvents.length > 0 && (
                  <div className="extracted-category">
                    <h5>Chronology Events</h5>
                    {message.extractedData.chronologyEvents.map((event, index) => (
                      <div key={index} className="extracted-item">
                        <p><strong>{event.date}</strong>: {event.description}</p>
                        {event.significance && <p className="significance">Significance: {event.significance}</p>}
                        <button 
                          className="btn btn-sm"
                          onClick={() => saveExtractedItem(message.id, 'chronologyEvents', event)}
                          disabled={isSaved(message.id, 'chronologyEvents', index)}
                        >
                          {isSaved(message.id, 'chronologyEvents', index) ? '✓ Saved' : 'Save to Chronology'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.extractedData.persons && message.extractedData.persons.length > 0 && (
                  <div className="extracted-category">
                    <h5>Persons</h5>
                    {message.extractedData.persons.map((person, index) => (
                      <div key={index} className="extracted-item">
                        <p><strong>{person.name}</strong> - {person.role}</p>
                        {person.description && <p>{person.description}</p>}
                        <button 
                          className="btn btn-sm"
                          onClick={() => saveExtractedItem(message.id, 'persons', person)}
                          disabled={isSaved(message.id, 'persons', index)}
                        >
                          {isSaved(message.id, 'persons', index) ? '✓ Saved' : 'Save to Dramatis Personae'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.extractedData.issues && message.extractedData.issues.length > 0 && (
                  <div className="extracted-category">
                    <h5>Issues</h5>
                    {message.extractedData.issues.map((issue, index) => (
                      <div key={index} className="extracted-item">
                        <p><strong>{issue.title}</strong></p>
                        <p>{issue.description}</p>
                        <p className="issue-meta">
                          {issue.category} | Priority: {issue.priority} | Status: {issue.status}
                        </p>
                        <button 
                          className="btn btn-sm"
                          onClick={() => saveExtractedItem(message.id, 'issues', issue)}
                          disabled={isSaved(message.id, 'issues', index)}
                        >
                          {isSaved(message.id, 'issues', index) ? '✓ Saved' : 'Save to Issues'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.extractedData.keyPoints && message.extractedData.keyPoints.length > 0 && (
                  <div className="extracted-category">
                    <h5>Key Points</h5>
                    {message.extractedData.keyPoints.map((point, index) => (
                      <div key={index} className="extracted-item">
                        <p>{point.point}</p>
                        <p className="point-category">Category: {point.category}</p>
                        <button 
                          className="btn btn-sm"
                          onClick={() => saveExtractedItem(message.id, 'keyPoints', point)}
                          disabled={isSaved(message.id, 'keyPoints', index)}
                        >
                          {isSaved(message.id, 'keyPoints', index) ? '✓ Saved' : 'Save to Key Points'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {message.extractedData.authorities && message.extractedData.authorities.length > 0 && (
                  <div className="extracted-category">
                    <h5>Legal Authorities</h5>
                    {message.extractedData.authorities.map((authority, index) => (
                      <div key={index} className="extracted-item">
                        <p><strong>{authority.citation}</strong></p>
                        <p>Principle: {authority.principle}</p>
                        {authority.relevance && <p>Relevance: {authority.relevance}</p>}
                        <button 
                          className="btn btn-sm"
                          onClick={() => saveExtractedItem(message.id, 'authorities', authority)}
                          disabled={isSaved(message.id, 'authorities', index)}
                        >
                          {isSaved(message.id, 'authorities', index) ? '✓ Saved' : 'Save to Authorities'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="message ai processing">
            <div className="message-header">
              <span className="message-type">🤖 AI</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Analyzing documents...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your case..."
          disabled={isProcessing}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isProcessing}
          className="btn btn-primary send-button"
        >
          {isProcessing ? '⏳' : '➤'} Send
        </button>
      </form>
    </div>
  );
};