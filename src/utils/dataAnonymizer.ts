interface AnonymizationMapping {
  people: Map<string, string>;
  companies: Map<string, string>;
  places: Map<string, string>;
  amounts: Map<string, string>;
  dates: Map<string, string>;
  caseNumbers: Map<string, string>;
  addresses: Map<string, string>;
  phoneNumbers: Map<string, string>;
  emails: Map<string, string>;
  reverseMapping: Map<string, string>;
}

interface AnonymizationResult {
  anonymizedText: string;
  mapping: AnonymizationMapping;
}

class DataAnonymizer {
  private peoplePatterns = [
    // Titles with names
    /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?|Professor|Prof\.?|Sir|Dame|Lord|Lady)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // Judge patterns
    /\b(?:His|Her)\s+Honour\s+Judge\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\bJudge\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // Barrister/Solicitor patterns
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:QC|KC|of\s+counsel|solicitor|barrister)/gi,
    // Full names in quotes or formal contexts
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b(?=\s+(?:stated|testified|claimed|argued|said|signed|witnessed))/g,
    // Name followed by role
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((?:claimant|defendant|witness|expert)\)/gi
  ];

  private companyPatterns = [
    // Ltd/Limited companies
    /\b([A-Z][A-Za-z\s&]+)\s+(?:Limited|Ltd\.?|PLC|plc)\b/g,
    // Inc/Corp companies
    /\b([A-Z][A-Za-z\s&]+)\s+(?:Inc\.?|Corp\.?|Corporation|Company|Co\.?)\b/g,
    // LLP partnerships
    /\b([A-Z][A-Za-z\s&]+)\s+LLP\b/g
  ];

  private amountPatterns = [
    // Currency amounts
    /£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /€\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    // Written amounts
    /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:pounds?|dollars?|euros?)\b/gi
  ];

  private datePatterns = [
    // DD/MM/YYYY, DD-MM-YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
    // DD Month YYYY
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
    // Month DD, YYYY
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi
  ];

  private addressPatterns = [
    // UK postcodes
    /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/g,
    // Street addresses
    /\b(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St\.?|Road|Rd\.?|Avenue|Ave\.?|Lane|Close|Drive|Way|Place))\b/gi
  ];

  private phonePatterns = [
    // UK phone numbers
    /\b((?:0|\+44\s?)\d{2,4}\s?\d{3,4}\s?\d{3,4})\b/g,
    // General phone patterns
    /\b(\(\d{3,4}\)\s?\d{3,4}[-\s]?\d{3,4})\b/g
  ];

  private emailPatterns = [
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g
  ];

  private caseNumberPatterns = [
    // Court case references
    /\b((?:Case\s+No\.?\s*)?(?:HC|QB|Ch|TCC|EWHC|EWCA|UKSC)[\w\-\/]+\d+)\b/gi,
    // Claim numbers
    /\b(Claim\s+No\.?\s*[\w\-\/]+\d+)\b/gi
  ];

  anonymize(text: string): AnonymizationResult {
    const mapping: AnonymizationMapping = {
      people: new Map(),
      companies: new Map(),
      places: new Map(),
      amounts: new Map(),
      dates: new Map(),
      caseNumbers: new Map(),
      addresses: new Map(),
      phoneNumbers: new Map(),
      emails: new Map(),
      reverseMapping: new Map()
    };

    let anonymizedText = text;

    // Anonymize in order of specificity (most specific first)
    
    // 1. Case numbers
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.caseNumberPatterns, 
      mapping.caseNumbers, 
      mapping.reverseMapping,
      'CASE-REF'
    );

    // 2. Email addresses
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.emailPatterns, 
      mapping.emails, 
      mapping.reverseMapping,
      'EMAIL'
    );

    // 3. Phone numbers
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.phonePatterns, 
      mapping.phoneNumbers, 
      mapping.reverseMapping,
      'PHONE'
    );

    // 4. Addresses
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.addressPatterns, 
      mapping.addresses, 
      mapping.reverseMapping,
      'ADDRESS'
    );

    // 5. Companies (before people to catch corporate entities)
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.companyPatterns, 
      mapping.companies, 
      mapping.reverseMapping,
      'COMPANY',
      1 // Capture group 1
    );

    // 6. People names
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.peoplePatterns, 
      mapping.people, 
      mapping.reverseMapping,
      'PERSON',
      1 // Capture group 1 for most patterns
    );

    // 7. Amounts
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.amountPatterns, 
      mapping.amounts, 
      mapping.reverseMapping,
      'AMOUNT'
    );

    // 8. Dates
    anonymizedText = this.anonymizePattern(
      anonymizedText, 
      this.datePatterns, 
      mapping.dates, 
      mapping.reverseMapping,
      'DATE'
    );

    return {
      anonymizedText,
      mapping
    };
  }

  private anonymizePattern(
    text: string, 
    patterns: RegExp[], 
    categoryMap: Map<string, string>,
    reverseMap: Map<string, string>,
    tokenPrefix: string,
    captureGroup: number = 0
  ): string {
    let result = text;
    
    for (const pattern of patterns) {
      result = result.replace(pattern, (match, ...groups) => {
        // Get the value to anonymize (either full match or capture group)
        const value = captureGroup > 0 && groups[captureGroup - 1] 
          ? groups[captureGroup - 1].trim() 
          : match.trim();
        
        // Skip if already anonymized
        if (value.startsWith('[') && value.endsWith(']')) {
          return match;
        }

        // Check if we've already mapped this value
        if (categoryMap.has(value)) {
          const token = categoryMap.get(value)!;
          return captureGroup > 0 
            ? match.replace(groups[captureGroup - 1], token)
            : token;
        }

        // Create new token
        const tokenNumber = categoryMap.size + 1;
        const token = `[${tokenPrefix}-${tokenNumber}]`;
        
        categoryMap.set(value, token);
        reverseMap.set(token, value);
        
        return captureGroup > 0 
          ? match.replace(groups[captureGroup - 1], token)
          : token;
      });
    }
    
    return result;
  }

  deanonymize(anonymizedText: string, mapping: AnonymizationMapping): string {
    let result = anonymizedText;
    
    // Replace all tokens with original values
    for (const [token, original] of mapping.reverseMapping) {
      result = result.replace(new RegExp(this.escapeRegex(token), 'g'), original);
    }
    
    return result;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper method to get anonymization statistics
  getAnonymizationStats(mapping: AnonymizationMapping): Record<string, number> {
    return {
      people: mapping.people.size,
      companies: mapping.companies.size,
      places: mapping.places.size,
      amounts: mapping.amounts.size,
      dates: mapping.dates.size,
      caseNumbers: mapping.caseNumbers.size,
      addresses: mapping.addresses.size,
      phoneNumbers: mapping.phoneNumbers.size,
      emails: mapping.emails.size,
      totalTokens: mapping.reverseMapping.size
    };
  }

  // Method to export mapping for secure storage
  exportMapping(mapping: AnonymizationMapping): string {
    const exportData = {
      people: Array.from(mapping.people.entries()),
      companies: Array.from(mapping.companies.entries()),
      places: Array.from(mapping.places.entries()),
      amounts: Array.from(mapping.amounts.entries()),
      dates: Array.from(mapping.dates.entries()),
      caseNumbers: Array.from(mapping.caseNumbers.entries()),
      addresses: Array.from(mapping.addresses.entries()),
      phoneNumbers: Array.from(mapping.phoneNumbers.entries()),
      emails: Array.from(mapping.emails.entries())
    };
    
    return JSON.stringify(exportData);
  }

  // Method to import mapping from secure storage
  importMapping(mappingJson: string): AnonymizationMapping {
    const data = JSON.parse(mappingJson);
    const reverseMapping = new Map<string, string>();
    
    const mapping: AnonymizationMapping = {
      people: new Map(data.people || []),
      companies: new Map(data.companies || []),
      places: new Map(data.places || []),
      amounts: new Map(data.amounts || []),
      dates: new Map(data.dates || []),
      caseNumbers: new Map(data.caseNumbers || []),
      addresses: new Map(data.addresses || []),
      phoneNumbers: new Map(data.phoneNumbers || []),
      emails: new Map(data.emails || []),
      reverseMapping
    };

    // Rebuild reverse mapping
    [mapping.people, mapping.companies, mapping.places, mapping.amounts, 
     mapping.dates, mapping.caseNumbers, mapping.addresses, mapping.phoneNumbers, mapping.emails]
      .forEach(map => {
        for (const [original, token] of map) {
          reverseMapping.set(token, original);
        }
      });

    return mapping;
  }
}

export const dataAnonymizer = new DataAnonymizer();
export type { AnonymizationMapping, AnonymizationResult };