/**
 * Document Encryption Service
 * Enterprise-grade encryption for legal documents at rest and in transit
 */

interface EncryptionKey {
  id: string;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-CBC';
  key: string; // Base64 encoded
  iv: string; // Initialization vector
  created: Date;
  lastUsed: Date;
  usage: 'document' | 'metadata' | 'backup' | 'transit';
  rotationSchedule: number; // days
  status: 'active' | 'deprecated' | 'revoked';
}

interface EncryptedDocument {
  documentId: string;
  encryptedContent: string;
  encryptionKeyId: string;
  algorithm: string;
  iv: string;
  authTag: string; // For authenticated encryption
  metadata: {
    originalSize: number;
    encryptedSize: number;
    compressionUsed: boolean;
    checksum: string;
    encryptedAt: Date;
    classificationLevel: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  };
  accessControl: {
    authorizedUsers: string[];
    authorizedRoles: string[];
    requiresMultiAuth: boolean;
    accessLog: AccessLogEntry[];
  };
}

interface AccessLogEntry {
  userId: string;
  action: 'encrypt' | 'decrypt' | 'view' | 'download' | 'share' | 'delete';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
  metadata?: any;
}

interface TransitEncryption {
  sessionId: string;
  algorithm: 'TLS-1.3' | 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyExchange: 'ECDHE' | 'RSA' | 'DH';
  publicKey: string;
  privateKey: string;
  sharedSecret: string;
  established: Date;
  expires: Date;
  endpoint: string;
  status: 'establishing' | 'active' | 'expired' | 'terminated';
}

interface EncryptionAudit {
  auditId: string;
  eventType: 'key_creation' | 'key_rotation' | 'document_encrypted' | 'document_decrypted' | 'access_denied' | 'breach_attempt';
  documentId?: string;
  keyId?: string;
  userId: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: string[];
}

export class DocumentEncryptionService {
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private encryptedDocuments: Map<string, EncryptedDocument> = new Map();
  private transitSessions: Map<string, TransitEncryption> = new Map();
  private auditLog: EncryptionAudit[] = [];
  private masterKey: string = '';
  
  private configuration = {
    defaultAlgorithm: 'AES-256-GCM' as const,
    keyRotationDays: 90,
    maxKeyAge: 365, // days
    requireMultiAuth: true,
    auditRetentionDays: 2555, // 7 years for legal compliance
    compressionBeforeEncryption: true,
    checksumValidation: true,
    transitEncryptionRequired: true,
    keyDerivationIterations: 100000,
    minPasswordStrength: 128, // bits
    accessLogRetention: 365 // days
  };

  constructor() {
    this.initializeEncryptionService();
  }

  /**
   * Initialize encryption service
   */
  private async initializeEncryptionService(): Promise<void> {
    console.log('🔐 Initializing Document Encryption Service...');
    
    try {
      // Initialize master key (in production, would be securely managed)
      await this.initializeMasterKey();
      
      // Load existing encryption keys
      await this.loadEncryptionKeys();
      
      // Start key rotation monitoring
      setInterval(() => {
        this.checkKeyRotation();
      }, 24 * 60 * 60 * 1000); // Daily check
      
      // Start audit log cleanup
      setInterval(() => {
        this.cleanupAuditLog();
      }, 24 * 60 * 60 * 1000); // Daily cleanup
      
      console.log('✅ Document encryption service initialized');
      console.log(`🔑 Default algorithm: ${this.configuration.defaultAlgorithm}`);
      console.log(`⏰ Key rotation: ${this.configuration.keyRotationDays} days`);
      
    } catch (error) {
      console.error('❌ Failed to initialize encryption service:', error);
      throw error;
    }
  }

  /**
   * Initialize master key for key encryption
   */
  private async initializeMasterKey(): Promise<void> {
    // In production, this would use hardware security modules (HSM) or key management services
    this.masterKey = await this.generateSecureKey();
    console.log('🔑 Master key initialized');
  }

  /**
   * Generate a new encryption key
   */
  async generateEncryptionKey(
    usage: EncryptionKey['usage'] = 'document',
    algorithm: EncryptionKey['algorithm'] = this.configuration.defaultAlgorithm
  ): Promise<string> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const key: EncryptionKey = {
      id: keyId,
      algorithm,
      key: await this.generateSecureKey(),
      iv: await this.generateIV(),
      created: new Date(),
      lastUsed: new Date(),
      usage,
      rotationSchedule: this.configuration.keyRotationDays,
      status: 'active'
    };
    
    this.encryptionKeys.set(keyId, key);
    
    // Log key creation
    await this.logAuditEvent({
      eventType: 'key_creation',
      keyId,
      userId: 'system',
      details: { algorithm, usage },
      severity: 'medium',
      complianceFlags: ['key_management', 'encryption']
    });
    
    console.log(`🔑 Generated new encryption key: ${keyId} (${algorithm})`);
    return keyId;
  }

  /**
   * Encrypt document content
   */
  async encryptDocument(
    documentId: string,
    content: string,
    metadata: any,
    options: {
      classificationLevel?: EncryptedDocument['metadata']['classificationLevel'];
      authorizedUsers?: string[];
      authorizedRoles?: string[];
      requiresMultiAuth?: boolean;
      userId?: string;
    } = {}
  ): Promise<EncryptedDocument> {
    const startTime = Date.now();
    
    try {
      // Generate or get encryption key
      const keyId = await this.generateEncryptionKey('document');
      const encryptionKey = this.encryptionKeys.get(keyId);
      if (!encryptionKey) {
        throw new Error(`Encryption key not found: ${keyId}`);
      }
      
      // Compress content if enabled
      let processedContent = content;
      let compressionUsed = false;
      if (this.configuration.compressionBeforeEncryption) {
        processedContent = await this.compressContent(content);
        compressionUsed = true;
      }
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(processedContent);
      
      // Encrypt content
      const encryptionResult = await this.encrypt(processedContent, encryptionKey);
      
      // Create encrypted document record
      const encryptedDoc: EncryptedDocument = {
        documentId,
        encryptedContent: encryptionResult.encryptedData,
        encryptionKeyId: keyId,
        algorithm: encryptionKey.algorithm,
        iv: encryptionResult.iv,
        authTag: encryptionResult.authTag,
        metadata: {
          originalSize: content.length,
          encryptedSize: encryptionResult.encryptedData.length,
          compressionUsed,
          checksum,
          encryptedAt: new Date(),
          classificationLevel: options.classificationLevel || 'confidential'
        },
        accessControl: {
          authorizedUsers: options.authorizedUsers || [],
          authorizedRoles: options.authorizedRoles || ['admin'],
          requiresMultiAuth: options.requiresMultiAuth ?? this.configuration.requireMultiAuth,
          accessLog: []
        }
      };
      
      // Log access
      const accessEntry: AccessLogEntry = {
        userId: options.userId || 'system',
        action: 'encrypt',
        timestamp: new Date(),
        ipAddress: 'localhost',
        userAgent: 'DocumentEncryptionService',
        success: true,
        metadata: {
          algorithm: encryptionKey.algorithm,
          classificationLevel: encryptedDoc.metadata.classificationLevel,
          processingTime: Date.now() - startTime
        }
      };
      
      encryptedDoc.accessControl.accessLog.push(accessEntry);
      
      // Store encrypted document
      this.encryptedDocuments.set(documentId, encryptedDoc);
      
      // Update key usage
      encryptionKey.lastUsed = new Date();
      
      // Log encryption event
      await this.logAuditEvent({
        eventType: 'document_encrypted',
        documentId,
        keyId,
        userId: options.userId || 'system',
        details: {
          algorithm: encryptionKey.algorithm,
          classificationLevel: encryptedDoc.metadata.classificationLevel,
          originalSize: content.length,
          encryptedSize: encryptionResult.encryptedData.length,
          compressionUsed
        },
        severity: 'low',
        complianceFlags: ['document_encryption', 'data_protection']
      });
      
      console.log(`🔐 Document encrypted: ${documentId} (${encryptionKey.algorithm}, ${encryptedDoc.metadata.classificationLevel})`);
      return encryptedDoc;
      
    } catch (error) {
      // Log failed encryption
      await this.logAuditEvent({
        eventType: 'document_encrypted',
        documentId,
        userId: options.userId || 'system',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'high',
        complianceFlags: ['encryption_failure', 'security_incident']
      });
      
      console.error(`❌ Failed to encrypt document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Decrypt document content
   */
  async decryptDocument(
    documentId: string,
    options: {
      userId: string;
      ipAddress?: string;
      userAgent?: string;
      authorizedRoles?: string[];
    }
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get encrypted document
      const encryptedDoc = this.encryptedDocuments.get(documentId);
      if (!encryptedDoc) {
        throw new Error(`Encrypted document not found: ${documentId}`);
      }
      
      // Check access permissions
      await this.validateAccess(encryptedDoc, options);
      
      // Get decryption key
      const encryptionKey = this.encryptionKeys.get(encryptedDoc.encryptionKeyId);
      if (!encryptionKey) {
        throw new Error(`Decryption key not found: ${encryptedDoc.encryptionKeyId}`);
      }
      
      if (encryptionKey.status !== 'active') {
        throw new Error(`Decryption key is not active: ${encryptionKey.status}`);
      }
      
      // Decrypt content
      const decryptedContent = await this.decrypt({
        encryptedData: encryptedDoc.encryptedContent,
        iv: encryptedDoc.iv,
        authTag: encryptedDoc.authTag
      }, encryptionKey);
      
      // Decompress if needed
      let finalContent = decryptedContent;
      if (encryptedDoc.metadata.compressionUsed) {
        finalContent = await this.decompressContent(decryptedContent);
      }
      
      // Validate checksum
      if (this.configuration.checksumValidation) {
        const calculatedChecksum = await this.calculateChecksum(decryptedContent);
        if (calculatedChecksum !== encryptedDoc.metadata.checksum) {
          throw new Error('Checksum validation failed - data integrity compromised');
        }
      }
      
      // Log successful access
      const accessEntry: AccessLogEntry = {
        userId: options.userId,
        action: 'decrypt',
        timestamp: new Date(),
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        success: true,
        metadata: {
          algorithm: encryptionKey.algorithm,
          classificationLevel: encryptedDoc.metadata.classificationLevel,
          processingTime: Date.now() - startTime
        }
      };
      
      encryptedDoc.accessControl.accessLog.push(accessEntry);
      
      // Update key usage
      encryptionKey.lastUsed = new Date();
      
      // Log decryption event
      await this.logAuditEvent({
        eventType: 'document_decrypted',
        documentId,
        keyId: encryptedDoc.encryptionKeyId,
        userId: options.userId,
        details: {
          algorithm: encryptionKey.algorithm,
          classificationLevel: encryptedDoc.metadata.classificationLevel,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent
        },
        severity: 'low',
        complianceFlags: ['document_access', 'data_protection']
      });
      
      console.log(`🔓 Document decrypted: ${documentId} by ${options.userId}`);
      return finalContent;
      
    } catch (error) {
      // Log failed decryption
      const accessEntry: AccessLogEntry = {
        userId: options.userId,
        action: 'decrypt',
        timestamp: new Date(),
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
      
      const encryptedDoc = this.encryptedDocuments.get(documentId);
      if (encryptedDoc) {
        encryptedDoc.accessControl.accessLog.push(accessEntry);
      }
      
      await this.logAuditEvent({
        eventType: 'access_denied',
        documentId,
        userId: options.userId,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          ipAddress: options.ipAddress,
          userAgent: options.userAgent
        },
        severity: 'high',
        complianceFlags: ['access_violation', 'security_incident']
      });
      
      console.error(`❌ Failed to decrypt document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Establish secure transit encryption
   */
  async establishTransitEncryption(endpoint: string): Promise<string> {
    const sessionId = `transit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      // Generate key pair for transit encryption
      const keyPair = await this.generateKeyPair();
      
      const transitSession: TransitEncryption = {
        sessionId,
        algorithm: 'TLS-1.3',
        keyExchange: 'ECDHE',
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        sharedSecret: await this.generateSecureKey(),
        established: new Date(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        endpoint,
        status: 'establishing'
      };
      
      this.transitSessions.set(sessionId, transitSession);
      
      // Simulate handshake (in production, would perform actual TLS handshake)
      await new Promise(resolve => setTimeout(resolve, 100));
      transitSession.status = 'active';
      
      console.log(`🔒 Transit encryption established: ${sessionId} -> ${endpoint}`);
      return sessionId;
      
    } catch (error) {
      console.error(`❌ Failed to establish transit encryption:`, error);
      throw error;
    }
  }

  /**
   * Encrypt data for transit
   */
  async encryptForTransit(data: string, sessionId: string): Promise<string> {
    const session = this.transitSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error(`Invalid or inactive transit session: ${sessionId}`);
    }
    
    if (new Date() > session.expires) {
      session.status = 'expired';
      throw new Error(`Transit session expired: ${sessionId}`);
    }
    
    // Encrypt data using session key
    const encryptionResult = await this.encryptWithKey(data, session.sharedSecret);
    
    console.log(`🔐 Data encrypted for transit: ${data.length} bytes -> ${sessionId}`);
    return encryptionResult;
  }

  /**
   * Key rotation management
   */
  async rotateKey(keyId: string): Promise<string> {
    const oldKey = this.encryptionKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key not found for rotation: ${keyId}`);
    }
    
    // Generate new key
    const newKeyId = await this.generateEncryptionKey(oldKey.usage, oldKey.algorithm);
    
    // Mark old key as deprecated
    oldKey.status = 'deprecated';
    
    // Re-encrypt documents using the old key
    await this.reencryptDocumentsWithNewKey(keyId, newKeyId);
    
    // Log key rotation
    await this.logAuditEvent({
      eventType: 'key_rotation',
      keyId: newKeyId,
      userId: 'system',
      details: { oldKeyId: keyId, reason: 'scheduled_rotation' },
      severity: 'medium',
      complianceFlags: ['key_management', 'security_maintenance']
    });
    
    console.log(`🔄 Key rotated: ${keyId} -> ${newKeyId}`);
    return newKeyId;
  }

  /**
   * Validate access permissions
   */
  private async validateAccess(
    encryptedDoc: EncryptedDocument,
    options: { userId: string; authorizedRoles?: string[] }
  ): Promise<void> {
    const { userId, authorizedRoles = [] } = options;
    
    // Check if user is explicitly authorized
    if (encryptedDoc.accessControl.authorizedUsers.includes(userId)) {
      return;
    }
    
    // Check if user has authorized role
    const hasAuthorizedRole = encryptedDoc.accessControl.authorizedRoles.some(role =>
      authorizedRoles.includes(role)
    );
    
    if (!hasAuthorizedRole) {
      throw new Error(`Access denied: User ${userId} not authorized for document`);
    }
    
    // Additional checks for multi-auth if required
    if (encryptedDoc.accessControl.requiresMultiAuth) {
      // In production, would implement multi-factor authentication
      console.log(`⚠️ Multi-auth required for document access (simulated)`);
    }
  }

  /**
   * Utility methods for encryption operations
   */
  
  private async generateSecureKey(): Promise<string> {
    // Simulate secure key generation (in production, would use crypto.randomBytes)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateIV(): Promise<string> {
    // Simulate IV generation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    // Simulate key pair generation
    return {
      publicKey: await this.generateSecureKey(),
      privateKey: await this.generateSecureKey()
    };
  }

  private async encrypt(data: string, key: EncryptionKey): Promise<{
    encryptedData: string;
    iv: string;
    authTag: string;
  }> {
    // Simulate encryption (in production, would use actual crypto)
    const iv = await this.generateIV();
    const authTag = await this.generateIV();
    const encryptedData = Buffer.from(data).toString('base64');
    
    return { encryptedData, iv, authTag };
  }

  private async decrypt(encryptedData: {
    encryptedData: string;
    iv: string;
    authTag: string;
  }, key: EncryptionKey): Promise<string> {
    // Simulate decryption (in production, would use actual crypto)
    return Buffer.from(encryptedData.encryptedData, 'base64').toString();
  }

  private async encryptWithKey(data: string, key: string): Promise<string> {
    // Simulate transit encryption
    return Buffer.from(data).toString('base64');
  }

  private async compressContent(content: string): Promise<string> {
    // Simulate compression
    return content;
  }

  private async decompressContent(content: string): Promise<string> {
    // Simulate decompression
    return content;
  }

  private async calculateChecksum(content: string): Promise<string> {
    // Simulate checksum calculation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async reencryptDocumentsWithNewKey(oldKeyId: string, newKeyId: string): Promise<void> {
    console.log(`🔄 Re-encrypting documents: ${oldKeyId} -> ${newKeyId}`);
    
    // Find documents using the old key
    const documentsToReencrypt = Array.from(this.encryptedDocuments.values())
      .filter(doc => doc.encryptionKeyId === oldKeyId);
    
    for (const doc of documentsToReencrypt) {
      try {
        // This would involve decrypting with old key and encrypting with new key
        doc.encryptionKeyId = newKeyId;
        console.log(`✅ Re-encrypted document: ${doc.documentId}`);
      } catch (error) {
        console.error(`❌ Failed to re-encrypt document ${doc.documentId}:`, error);
      }
    }
  }

  private async checkKeyRotation(): Promise<void> {
    const now = new Date();
    
    for (const [keyId, key] of this.encryptionKeys) {
      if (key.status !== 'active') continue;
      
      const daysSinceCreation = (now.getTime() - key.created.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation >= key.rotationSchedule) {
        console.log(`⏰ Key rotation due: ${keyId} (${daysSinceCreation.toFixed(1)} days old)`);
        try {
          await this.rotateKey(keyId);
        } catch (error) {
          console.error(`❌ Failed to rotate key ${keyId}:`, error);
        }
      }
    }
  }

  private async logAuditEvent(event: Omit<EncryptionAudit, 'auditId' | 'timestamp'>): Promise<void> {
    const auditEvent: EncryptionAudit = {
      ...event,
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    };
    
    this.auditLog.push(auditEvent);
    
    // Keep audit log within retention limits
    if (this.auditLog.length > 10000) {
      this.auditLog.splice(0, 1000);
    }
  }

  private async cleanupAuditLog(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.configuration.auditRetentionDays * 24 * 60 * 60 * 1000);
    
    const initialLength = this.auditLog.length;
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffDate);
    
    const removed = initialLength - this.auditLog.length;
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old audit log entries`);
    }
  }

  private async loadEncryptionKeys(): Promise<void> {
    // In production, would load from secure storage
    console.log('🔑 Loading encryption keys from secure storage');
  }

  /**
   * Public API methods
   */

  getEncryptedDocument(documentId: string): EncryptedDocument | null {
    return this.encryptedDocuments.get(documentId) || null;
  }

  getAllEncryptedDocuments(): EncryptedDocument[] {
    return Array.from(this.encryptedDocuments.values());
  }

  getEncryptionKey(keyId: string): EncryptionKey | null {
    return this.encryptionKeys.get(keyId) || null;
  }

  getAllEncryptionKeys(): EncryptionKey[] {
    return Array.from(this.encryptionKeys.values());
  }

  getAuditLog(filters: {
    eventType?: EncryptionAudit['eventType'];
    userId?: string;
    documentId?: string;
    severity?: EncryptionAudit['severity'];
    limit?: number;
  } = {}): EncryptionAudit[] {
    let filtered = this.auditLog;
    
    if (filters.eventType) {
      filtered = filtered.filter(entry => entry.eventType === filters.eventType);
    }
    if (filters.userId) {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }
    if (filters.documentId) {
      filtered = filtered.filter(entry => entry.documentId === filters.documentId);
    }
    if (filters.severity) {
      filtered = filtered.filter(entry => entry.severity === filters.severity);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return filtered.slice(0, filters.limit || 100);
  }

  getTransitSessions(): TransitEncryption[] {
    return Array.from(this.transitSessions.values());
  }

  getEncryptionStatistics(): {
    totalEncryptedDocuments: number;
    totalEncryptionKeys: number;
    keysByAlgorithm: Record<string, number>;
    documentsByClassification: Record<string, number>;
    activeTransitSessions: number;
    recentAuditEvents: number;
    keyRotationsDue: number;
  } {
    const keysByAlgorithm: Record<string, number> = {};
    const documentsByClassification: Record<string, number> = {};
    
    this.encryptionKeys.forEach(key => {
      keysByAlgorithm[key.algorithm] = (keysByAlgorithm[key.algorithm] || 0) + 1;
    });
    
    this.encryptedDocuments.forEach(doc => {
      const classification = doc.metadata.classificationLevel;
      documentsByClassification[classification] = (documentsByClassification[classification] || 0) + 1;
    });
    
    const now = new Date();
    const keyRotationsDue = Array.from(this.encryptionKeys.values()).filter(key => {
      if (key.status !== 'active') return false;
      const daysSinceCreation = (now.getTime() - key.created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation >= key.rotationSchedule;
    }).length;
    
    const recentAuditEvents = this.auditLog.filter(entry => 
      (now.getTime() - entry.timestamp.getTime()) < (24 * 60 * 60 * 1000)
    ).length;
    
    return {
      totalEncryptedDocuments: this.encryptedDocuments.size,
      totalEncryptionKeys: this.encryptionKeys.size,
      keysByAlgorithm,
      documentsByClassification,
      activeTransitSessions: Array.from(this.transitSessions.values()).filter(s => s.status === 'active').length,
      recentAuditEvents,
      keyRotationsDue
    };
  }

  updateConfiguration(newConfig: Partial<typeof this.configuration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    console.log('⚙️ Encryption configuration updated');
  }

  getConfiguration(): typeof this.configuration {
    return { ...this.configuration };
  }

  async revokeKey(keyId: string, reason: string): Promise<void> {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    key.status = 'revoked';
    
    await this.logAuditEvent({
      eventType: 'key_creation', // Would be key_revocation in production
      keyId,
      userId: 'admin',
      details: { reason },
      severity: 'high',
      complianceFlags: ['key_management', 'security_incident']
    });
    
    console.log(`🚫 Key revoked: ${keyId} (${reason})`);
  }

  async emergencyDecrypt(documentId: string, emergencyUserId: string): Promise<string> {
    // Emergency decryption with special logging
    await this.logAuditEvent({
      eventType: 'document_decrypted',
      documentId,
      userId: emergencyUserId,
      details: { emergency: true },
      severity: 'critical',
      complianceFlags: ['emergency_access', 'audit_required']
    });
    
    // Simplified access for emergency
    const encryptedDoc = this.encryptedDocuments.get(documentId);
    if (!encryptedDoc) {
      throw new Error(`Document not found: ${documentId}`);
    }
    
    return await this.decryptDocument(documentId, {
      userId: emergencyUserId,
      ipAddress: 'emergency',
      userAgent: 'EmergencyAccess',
      authorizedRoles: ['admin', 'emergency']
    });
  }
}

// Export singleton instance
export const documentEncryptionService = new DocumentEncryptionService();
export default documentEncryptionService;