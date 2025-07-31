/**
 * OpenWebUI RAG Client for Legal Case Management
 * Handles document upload, indexing, and RAG-powered queries
 */

interface RAGDocument {
  id: string;
  name: string;
  content?: string;
  metadata?: {
    caseId?: string;
    category?: string;
    uploadedAt?: string;
    fileSize?: number;
  };
}

interface RAGQueryOptions {
  model?: string;
  documents?: boolean;
  caseId?: string;
  maxTokens?: number;
  temperature?: number;
}

interface RAGResponse {
  answer: string;
  citations: Array<{
    documentId: string;
    documentName: string;
    content: string;
    relevance: number;
  }>;
  confidence: number;
}

class OpenWebUIRAGClient {
  private baseUrl: string;
  private apiKey: string | null;
  private timeout: number;

  constructor(baseUrl = 'http://localhost:3001', apiKey: string | null = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = 300000; // 5 minutes for large documents
  }

  /**
   * Upload a document to OpenWebUI for RAG processing
   */
  async uploadDocument(
    file: File,
    metadata?: { caseId?: string; category?: string }
  ): Promise<RAGDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
        method: 'POST',
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📄 Document uploaded to RAG:', result);
      
      return {
        id: result.id || result.document_id,
        name: file.name,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size
        }
      };
    } catch (error) {
      console.error('Failed to upload document to RAG:', error);
      throw error;
    }
  }

  /**
   * Query documents using RAG
   */
  async query(
    prompt: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGResponse> {
    try {
      const requestBody = {
        model: options.model || 'llama3.2:3b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 2000
        },
        // Enable document context
        documents: options.documents !== false,
        // Filter by case if provided
        ...(options.caseId && { 
          filter: { 
            metadata: { caseId: options.caseId } 
          } 
        })
      };

      const response = await fetch(`${this.baseUrl}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`RAG query failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Extract citations from the response
      const citations = this.extractCitations(result);
      
      return {
        answer: result.choices?.[0]?.message?.content || result.response || '',
        citations,
        confidence: result.confidence || 0.8
      };
    } catch (error) {
      console.error('RAG query failed:', error);
      throw error;
    }
  }

  /**
   * Extract citations from RAG response
   */
  private extractCitations(response: any): RAGResponse['citations'] {
    const citations: RAGResponse['citations'] = [];
    
    // OpenWebUI may include citations in different formats
    if (response.citations) {
      return response.citations.map((cite: any) => ({
        documentId: cite.document_id || cite.id,
        documentName: cite.document_name || cite.name || 'Unknown',
        content: cite.content || cite.text || '',
        relevance: cite.relevance || cite.score || 0.5
      }));
    }
    
    // Parse citations from the message content if embedded
    const content = response.choices?.[0]?.message?.content || response.response || '';
    const citationMatches = content.match(/\[cite:([^\]]+)\]/g) || [];
    
    citationMatches.forEach((match: string) => {
      const parts = match.replace('[cite:', '').replace(']', '').split('|');
      if (parts.length >= 2) {
        citations.push({
          documentId: parts[0],
          documentName: parts[1],
          content: parts[2] || '',
          relevance: parseFloat(parts[3] || '0.5')
        });
      }
    });
    
    return citations;
  }

  /**
   * Delete a document from RAG
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete document from RAG:', error);
      throw error;
    }
  }

  /**
   * List documents in RAG (with optional case filter)
   */
  async listDocuments(caseId?: string): Promise<RAGDocument[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/v1/documents`);
      if (caseId) {
        url.searchParams.append('filter', JSON.stringify({ metadata: { caseId } }));
      }

      const response = await fetch(url.toString(), {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to list documents: ${response.statusText}`);
      }

      const documents = await response.json();
      return documents.map((doc: any) => ({
        id: doc.id || doc.document_id,
        name: doc.name || doc.filename,
        metadata: doc.metadata || {}
      }));
    } catch (error) {
      console.error('Failed to list RAG documents:', error);
      return [];
    }
  }

  /**
   * Check if RAG service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auths`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ragClient = new OpenWebUIRAGClient();

// Export class for custom instances
export { OpenWebUIRAGClient, type RAGDocument, type RAGQueryOptions, type RAGResponse };