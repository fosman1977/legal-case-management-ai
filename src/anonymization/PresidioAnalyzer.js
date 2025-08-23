/**
 * Presidio Analyzer - Exact implementation from roadmap
 * Week 4: Day 1-2 Microsoft Presidio Integration
 */

class PresidioAnalyzer {
  constructor() {
    this.presidio_url = 'http://localhost:5002'; // Local Presidio instance
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.presidio_url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.isAvailable = response.ok;
      console.log(`🔒 Presidio Analyzer: ${this.isAvailable ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      this.isAvailable = false;
      console.log('🔒 Presidio Analyzer: Not available - using fallback anonymization');
    }
  }

  async analyzePII(text) {
    if (!this.isAvailable) {
      console.warn('Presidio not available, using basic PII detection');
      return this.fallbackPIIDetection(text);
    }

    try {
      const response = await fetch(`${this.presidio_url}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: 'en',
          entities: [
            'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD',
            'IBAN_CODE', 'IP_ADDRESS', 'DATE_TIME', 'LOCATION',
            'UK_NHS', 'UK_NINO' // Custom UK entities
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Presidio analysis failed: ${response.status}`);
      }

      const entities = await response.json();
      
      return entities.map(entity => ({
        entity_type: entity.entity_type,
        start: entity.start,
        end: entity.end,
        score: entity.score,
        text: text.substring(entity.start, entity.end),
        analysis_explanation: entity.analysis_explanation || {}
      }));

    } catch (error) {
      console.error('Presidio PII analysis failed:', error);
      return this.fallbackPIIDetection(text);
    }
  }

  async anonymizeText(text, entities) {
    if (!this.isAvailable) {
      return this.fallbackAnonymization(text, entities);
    }

    try {
      const response = await fetch(`${this.presidio_url}/anonymize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          anonymizers: {
            'DEFAULT': { 'type': 'replace', 'new_value': '<ANONYMIZED>' },
            'PERSON': { 'type': 'replace', 'new_value': '<PERSON>' },
            'EMAIL_ADDRESS': { 'type': 'replace', 'new_value': '<EMAIL>' },
            'PHONE_NUMBER': { 'type': 'replace', 'new_value': '<PHONE>' },
            'LOCATION': { 'type': 'replace', 'new_value': '<LOCATION>' },
            'DATE_TIME': { 'type': 'replace', 'new_value': '<DATE>' },
            'CREDIT_CARD': { 'type': 'replace', 'new_value': '<PAYMENT_CARD>' },
            'UK_NHS': { 'type': 'replace', 'new_value': '<NHS_NUMBER>' },
            'UK_NINO': { 'type': 'replace', 'new_value': '<NINO>' }
          },
          analyzer_results: entities
        })
      });

      if (!response.ok) {
        throw new Error(`Presidio anonymization failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        text: result.text,
        items: result.items || [],
        confidence: this.calculateAnonymizationConfidence(entities)
      };

    } catch (error) {
      console.error('Presidio anonymization failed:', error);
      return this.fallbackAnonymization(text, entities);
    }
  }

  fallbackPIIDetection(text) {
    // Basic regex-based PII detection for fallback
    const patterns = {
      EMAIL_ADDRESS: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      PHONE_NUMBER: /(\+44|0)[0-9\s-]{9,13}/g,
      PERSON: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
      UK_NINO: /[A-Z]{2}\d{6}[A-Z]/g,
      CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
    };

    const entities = [];
    
    for (const [entityType, pattern] of Object.entries(patterns)) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        entities.push({
          entity_type: entityType,
          start: match.index,
          end: match.index + match[0].length,
          score: 0.8, // Lower confidence for regex-based detection
          text: match[0],
          analysis_explanation: { fallback: true }
        });
      }
    }

    return entities;
  }

  fallbackAnonymization(text, entities) {
    let anonymizedText = text;
    let offset = 0;

    // Sort entities by start position (reverse order for replacement)
    const sortedEntities = [...entities].sort((a, b) => b.start - a.start);

    for (const entity of sortedEntities) {
      const replacement = this.getReplacementText(entity.entity_type);
      const start = entity.start;
      const end = entity.end;
      
      anonymizedText = anonymizedText.substring(0, start) + 
                     replacement + 
                     anonymizedText.substring(end);
    }

    return {
      text: anonymizedText,
      items: entities,
      confidence: 0.7, // Lower confidence for fallback
      fallback: true
    };
  }

  getReplacementText(entityType) {
    const replacements = {
      'PERSON': '<PERSON>',
      'EMAIL_ADDRESS': '<EMAIL>',
      'PHONE_NUMBER': '<PHONE>',
      'LOCATION': '<LOCATION>',
      'DATE_TIME': '<DATE>',
      'CREDIT_CARD': '<PAYMENT_CARD>',
      'UK_NHS': '<NHS_NUMBER>',
      'UK_NINO': '<NINO>',
      'DEFAULT': '<ANONYMIZED>'
    };
    
    return replacements[entityType] || replacements['DEFAULT'];
  }

  calculateAnonymizationConfidence(entities) {
    if (entities.length === 0) return 1.0; // No PII found = perfect anonymization
    
    const totalScore = entities.reduce((sum, entity) => sum + entity.score, 0);
    const averageScore = totalScore / entities.length;
    
    // High detection scores = high anonymization confidence
    return Math.min(0.99, averageScore);
  }

  // Utility methods
  getAnalyzerInfo() {
    return {
      name: 'Microsoft Presidio Analyzer',
      version: '2.2.0',
      isAvailable: this.isAvailable,
      url: this.presidio_url,
      supportedEntities: [
        'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD',
        'IBAN_CODE', 'IP_ADDRESS', 'DATE_TIME', 'LOCATION',
        'UK_NHS', 'UK_NINO'
      ],
      features: [
        'PII Detection',
        'Multi-language Support',
        'Custom Entity Recognition',
        'Confidence Scoring'
      ]
    };
  }

  async testConnection() {
    try {
      await this.checkAvailability();
      return {
        available: this.isAvailable,
        url: this.presidio_url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default PresidioAnalyzer;