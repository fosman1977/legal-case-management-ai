-- ENTERPRISE DATABASE SCHEMA EXTENSION
-- Extends existing database with enterprise processing and legal intelligence capabilities
-- Status: Phase 1, Week 1 - Core enterprise architecture
-- Integration: Extends existing document storage with enterprise features

-- ================================================================
-- ENTERPRISE PROCESSING TABLES
-- ================================================================

-- Enterprise processing tasks queue
CREATE TABLE IF NOT EXISTS enterprise_tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('document_extraction', 'legal_analysis', 'cross_document', 'search_indexing')),
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    data TEXT NOT NULL, -- JSON blob with task data
    options TEXT NOT NULL, -- JSON blob with processing options
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    estimated_duration INTEGER, -- milliseconds
    actual_duration INTEGER, -- milliseconds
    memory_used INTEGER, -- bytes
    worker_id TEXT,
    dependencies TEXT, -- JSON array of task IDs this task depends on
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    legal_intelligence_enabled BOOLEAN DEFAULT FALSE,
    legal_analysis_data TEXT, -- JSON blob for legal intelligence results
    
    -- Indexes for performance
    FOREIGN KEY (worker_id) REFERENCES enterprise_workers(id)
);

-- Enterprise worker pool management
CREATE TABLE IF NOT EXISTS enterprise_workers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('document_processor', 'legal_analyzer', 'search_indexer', 'cross_document_analyzer')),
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'error', 'shutdown')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_task_id TEXT,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    total_processing_time INTEGER DEFAULT 0, -- milliseconds
    average_memory_usage INTEGER DEFAULT 0, -- bytes
    capabilities TEXT, -- JSON array of worker capabilities
    health_score REAL DEFAULT 1.0 CHECK (health_score BETWEEN 0.0 AND 1.0),
    
    FOREIGN KEY (current_task_id) REFERENCES enterprise_tasks(id)
);

-- Processing checkpoints for resumability
CREATE TABLE IF NOT EXISTS processing_checkpoints (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress REAL CHECK (progress BETWEEN 0.0 AND 100.0),
    data TEXT NOT NULL, -- JSON blob with checkpoint data
    recoverable BOOLEAN DEFAULT TRUE,
    checkpoint_type TEXT CHECK (checkpoint_type IN ('progress', 'state', 'error', 'completion')),
    
    FOREIGN KEY (task_id) REFERENCES enterprise_tasks(id)
);

-- Resource monitoring metrics
CREATE TABLE IF NOT EXISTS resource_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    memory_used INTEGER NOT NULL, -- bytes
    memory_available INTEGER NOT NULL, -- bytes
    memory_total INTEGER NOT NULL, -- bytes
    memory_percentage REAL NOT NULL CHECK (memory_percentage BETWEEN 0.0 AND 100.0),
    cpu_usage REAL NOT NULL CHECK (cpu_usage BETWEEN 0.0 AND 100.0),
    cpu_cores INTEGER NOT NULL,
    disk_used INTEGER NOT NULL, -- bytes
    disk_available INTEGER NOT NULL, -- bytes
    disk_total INTEGER NOT NULL, -- bytes
    active_documents INTEGER DEFAULT 0,
    queue_length INTEGER DEFAULT 0,
    processing_metrics TEXT -- JSON blob with detailed processing metrics
);

-- ================================================================
-- LEGAL INTELLIGENCE TABLES
-- ================================================================

-- Legal entities extracted from documents
CREATE TABLE IF NOT EXISTS legal_entities (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    entity_text TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'organization', 'court', 'case', 'statute', 'regulation', 'date', 'monetary', 'address')),
    confidence_score REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    context_window TEXT, -- 50-character window around entity
    page_number INTEGER,
    position_start INTEGER,
    position_end INTEGER,
    legal_significance TEXT CHECK (legal_significance IN ('critical', 'important', 'contextual')),
    validation_status TEXT DEFAULT 'needs_review' CHECK (validation_status IN ('verified', 'needs_review', 'uncertain', 'invalid')),
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_at DATETIME,
    validator_type TEXT CHECK (validator_type IN ('ai', 'human', 'cross_reference')),
    
    -- Additional legal-specific fields
    normalized_form TEXT, -- Standardized entity representation
    legal_role TEXT, -- e.g., 'plaintiff', 'defendant', 'judge', 'witness'
    jurisdiction TEXT, -- Legal jurisdiction if applicable
    entity_metadata TEXT, -- JSON blob for additional entity data
    
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Entity resolution and clustering
CREATE TABLE IF NOT EXISTS entity_clusters (
    id TEXT PRIMARY KEY,
    cluster_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    confidence_score REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    primary_entity_id TEXT, -- Main representative entity for this cluster
    entity_count INTEGER DEFAULT 0,
    documents_mentioned INTEGER DEFAULT 0,
    legal_significance TEXT CHECK (legal_significance IN ('critical', 'important', 'contextual')),
    resolution_method TEXT CHECK (resolution_method IN ('exact_match', 'fuzzy_match', 'semantic_similarity', 'manual')),
    
    FOREIGN KEY (primary_entity_id) REFERENCES legal_entities(id)
);

-- Mapping table for entity cluster membership
CREATE TABLE IF NOT EXISTS entity_cluster_members (
    cluster_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    similarity_score REAL CHECK (similarity_score BETWEEN 0.0 AND 1.0),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolution_method TEXT,
    
    PRIMARY KEY (cluster_id, entity_id),
    FOREIGN KEY (cluster_id) REFERENCES entity_clusters(id),
    FOREIGN KEY (entity_id) REFERENCES legal_entities(id)
);

-- Legal events and timeline
CREATE TABLE IF NOT EXISTS legal_events (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    event_text TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('filing', 'hearing', 'deadline', 'settlement', 'judgment', 'motion', 'discovery', 'correspondence')),
    event_date DATE,
    event_time TIME,
    confidence_score REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    page_number INTEGER,
    context_window TEXT,
    legal_significance TEXT CHECK (legal_significance IN ('critical', 'important', 'contextual')),
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Event-specific metadata
    participants TEXT, -- JSON array of entity IDs involved
    location TEXT,
    deadline_type TEXT, -- e.g., 'statute_of_limitations', 'filing_deadline', 'discovery_cutoff'
    event_metadata TEXT, -- JSON blob for additional event data
    
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Cross-document relationships
CREATE TABLE IF NOT EXISTS document_relationships (
    id TEXT PRIMARY KEY,
    source_document_id TEXT NOT NULL,
    target_document_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('references', 'responds_to', 'amends', 'supersedes', 'supplements', 'contradicts', 'supports')),
    confidence_score REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    relationship_basis TEXT, -- What indicates this relationship (shared entities, explicit references, etc.)
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    evidence TEXT, -- JSON array of supporting evidence
    legal_significance TEXT CHECK (legal_significance IN ('critical', 'important', 'contextual')),
    
    FOREIGN KEY (source_document_id) REFERENCES documents(id),
    FOREIGN KEY (target_document_id) REFERENCES documents(id),
    UNIQUE(source_document_id, target_document_id, relationship_type)
);

-- Legal case analysis results
CREATE TABLE IF NOT EXISTS case_analysis (
    id TEXT PRIMARY KEY,
    case_folder_id TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('case_strength', 'evidence_analysis', 'legal_issues', 'timeline_analysis', 'entity_analysis')),
    analysis_results TEXT NOT NULL, -- JSON blob with analysis results
    confidence_score REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analyzer_version TEXT,
    processing_time INTEGER, -- milliseconds
    documents_analyzed INTEGER,
    entities_involved INTEGER,
    legal_issues_found INTEGER,
    
    -- Analysis metadata
    methodology TEXT, -- How the analysis was performed
    assumptions TEXT, -- JSON array of key assumptions made
    limitations TEXT, -- JSON array of analysis limitations
    recommendations TEXT, -- JSON array of recommended actions
    
    FOREIGN KEY (case_folder_id) REFERENCES case_folders(id)
);

-- ================================================================
-- ENTERPRISE SEARCH AND INDEXING
-- ================================================================

-- Search index metadata
CREATE TABLE IF NOT EXISTS search_indexes (
    id TEXT PRIMARY KEY,
    index_type TEXT NOT NULL CHECK (index_type IN ('full_text', 'semantic_vector', 'legal_entities', 'timeline', 'cross_document')),
    index_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'ready', 'updating', 'error')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    documents_indexed INTEGER DEFAULT 0,
    index_size_bytes INTEGER DEFAULT 0,
    last_incremental_update DATETIME,
    index_version TEXT,
    index_configuration TEXT, -- JSON blob with index settings
    performance_metrics TEXT -- JSON blob with index performance data
);

-- Document processing state for incremental updates
CREATE TABLE IF NOT EXISTS document_processing_state (
    document_id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_modified_at DATETIME NOT NULL,
    file_hash TEXT NOT NULL, -- SHA-256 hash for change detection
    last_processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_version TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    extraction_checksum TEXT, -- Checksum of extracted content for change detection
    
    -- Enterprise processing metadata
    enterprise_features_processed BOOLEAN DEFAULT FALSE,
    legal_analysis_completed BOOLEAN DEFAULT FALSE,
    search_indexed BOOLEAN DEFAULT FALSE,
    cross_document_analyzed BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- ================================================================
-- PERFORMANCE AND OPTIMIZATION TABLES
-- ================================================================

-- Cache management for frequently accessed data
CREATE TABLE IF NOT EXISTS enterprise_cache (
    cache_key TEXT PRIMARY KEY,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('entity_resolution', 'document_analysis', 'search_results', 'legal_reasoning')),
    cache_value TEXT NOT NULL, -- JSON blob
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    expiry_at DATETIME,
    cache_size_bytes INTEGER,
    hit_ratio REAL DEFAULT 0.0
);

-- Performance benchmarks and monitoring
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('document_processing', 'entity_extraction', 'legal_analysis', 'search_query', 'system_overall')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    operation_name TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    memory_peak_mb INTEGER,
    documents_count INTEGER,
    entities_count INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    system_load REAL,
    benchmark_metadata TEXT -- JSON blob with additional benchmark data
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Enterprise tasks indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_status ON enterprise_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_priority ON enterprise_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_type ON enterprise_tasks(type);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_created ON enterprise_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_worker ON enterprise_tasks(worker_id);

-- Legal entities indexes
CREATE INDEX IF NOT EXISTS idx_legal_entities_document ON legal_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_entities_type ON legal_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_legal_entities_confidence ON legal_entities(confidence_score);
CREATE INDEX IF NOT EXISTS idx_legal_entities_significance ON legal_entities(legal_significance);
CREATE INDEX IF NOT EXISTS idx_legal_entities_text ON legal_entities(entity_text);

-- Entity clusters indexes
CREATE INDEX IF NOT EXISTS idx_entity_clusters_type ON entity_clusters(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_clusters_significance ON entity_clusters(legal_significance);
CREATE INDEX IF NOT EXISTS idx_entity_cluster_members_entity ON entity_cluster_members(entity_id);

-- Legal events indexes
CREATE INDEX IF NOT EXISTS idx_legal_events_document ON legal_events(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_events_type ON legal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_legal_events_date ON legal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_legal_events_significance ON legal_events(legal_significance);

-- Document relationships indexes
CREATE INDEX IF NOT EXISTS idx_doc_relationships_source ON document_relationships(source_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_relationships_target ON document_relationships(target_document_id);
CREATE INDEX IF NOT EXISTS idx_doc_relationships_type ON document_relationships(relationship_type);

-- Resource metrics indexes
CREATE INDEX IF NOT EXISTS idx_resource_metrics_timestamp ON resource_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_resource_metrics_memory ON resource_metrics(memory_percentage);

-- Processing state indexes
CREATE INDEX IF NOT EXISTS idx_doc_processing_state_status ON document_processing_state(processing_status);
CREATE INDEX IF NOT EXISTS idx_doc_processing_state_modified ON document_processing_state(file_modified_at);
CREATE INDEX IF NOT EXISTS idx_doc_processing_state_hash ON document_processing_state(file_hash);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_type ON performance_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_timestamp ON performance_benchmarks(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_operation ON performance_benchmarks(operation_name);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_cache_type ON enterprise_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_cache_accessed ON enterprise_cache(accessed_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_cache_expiry ON enterprise_cache(expiry_at);

-- ================================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================================

-- Active processing queue view
CREATE VIEW IF NOT EXISTS v_active_processing_queue AS
SELECT 
    t.id,
    t.type,
    t.priority,
    t.status,
    t.created_at,
    t.estimated_duration,
    w.type as worker_type,
    w.status as worker_status,
    (julianday('now') - julianday(t.created_at)) * 24 * 60 * 60 * 1000 as wait_time_ms
FROM enterprise_tasks t
LEFT JOIN enterprise_workers w ON t.worker_id = w.id
WHERE t.status IN ('pending', 'in_progress')
ORDER BY t.priority ASC, t.created_at ASC;

-- Legal entity summary by document
CREATE VIEW IF NOT EXISTS v_document_legal_entities AS
SELECT 
    d.id as document_id,
    d.name as document_name,
    COUNT(le.id) as total_entities,
    COUNT(CASE WHEN le.entity_type = 'person' THEN 1 END) as persons,
    COUNT(CASE WHEN le.entity_type = 'organization' THEN 1 END) as organizations,
    COUNT(CASE WHEN le.entity_type = 'case' THEN 1 END) as cases,
    COUNT(CASE WHEN le.legal_significance = 'critical' THEN 1 END) as critical_entities,
    AVG(le.confidence_score) as avg_confidence
FROM documents d
LEFT JOIN legal_entities le ON d.id = le.document_id
GROUP BY d.id, d.name;

-- Case timeline view
CREATE VIEW IF NOT EXISTS v_case_timeline AS
SELECT 
    le.event_date,
    le.event_type,
    le.event_text,
    d.name as document_name,
    le.legal_significance,
    le.confidence_score,
    le.participants
FROM legal_events le
JOIN documents d ON le.document_id = d.id
WHERE le.event_date IS NOT NULL
ORDER BY le.event_date ASC, le.event_time ASC;

-- System performance summary
CREATE VIEW IF NOT EXISTS v_system_performance AS
SELECT 
    DATE(timestamp) as date,
    AVG(memory_percentage) as avg_memory_usage,
    MAX(memory_percentage) as peak_memory_usage,
    AVG(cpu_usage) as avg_cpu_usage,
    MAX(cpu_usage) as peak_cpu_usage,
    AVG(active_documents) as avg_active_docs,
    AVG(queue_length) as avg_queue_length
FROM resource_metrics
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- ================================================================
-- TRIGGERS FOR DATA INTEGRITY
-- ================================================================

-- Update entity cluster count when members change
CREATE TRIGGER IF NOT EXISTS tr_update_cluster_count_insert
AFTER INSERT ON entity_cluster_members
BEGIN
    UPDATE entity_clusters 
    SET entity_count = (
        SELECT COUNT(*) 
        FROM entity_cluster_members 
        WHERE cluster_id = NEW.cluster_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.cluster_id;
END;

CREATE TRIGGER IF NOT EXISTS tr_update_cluster_count_delete
AFTER DELETE ON entity_cluster_members
BEGIN
    UPDATE entity_clusters 
    SET entity_count = (
        SELECT COUNT(*) 
        FROM entity_cluster_members 
        WHERE cluster_id = OLD.cluster_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.cluster_id;
END;

-- Update worker task counts
CREATE TRIGGER IF NOT EXISTS tr_update_worker_stats_complete
AFTER UPDATE OF status ON enterprise_tasks
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    UPDATE enterprise_workers
    SET tasks_completed = tasks_completed + 1,
        total_processing_time = total_processing_time + NEW.actual_duration
    WHERE id = NEW.worker_id;
END;

CREATE TRIGGER IF NOT EXISTS tr_update_worker_stats_failed
AFTER UPDATE OF status ON enterprise_tasks
WHEN NEW.status = 'failed' AND OLD.status != 'failed'
BEGIN
    UPDATE enterprise_workers
    SET tasks_failed = tasks_failed + 1
    WHERE id = NEW.worker_id;
END;

-- Update cache access statistics
CREATE TRIGGER IF NOT EXISTS tr_update_cache_access
AFTER UPDATE OF accessed_at ON enterprise_cache
BEGIN
    UPDATE enterprise_cache
    SET access_count = access_count + 1
    WHERE cache_key = NEW.cache_key;
END;

-- ================================================================
-- ENTERPRISE SCHEMA VALIDATION
-- ================================================================

-- Validate that legal entities have required confidence scores
CREATE TRIGGER IF NOT EXISTS tr_validate_legal_entity_confidence
BEFORE INSERT ON legal_entities
WHEN NEW.confidence_score IS NULL OR NEW.confidence_score < 0.5
BEGIN
    SELECT RAISE(FAIL, 'Legal entities must have confidence score >= 0.5 for enterprise processing');
END;

-- Validate that critical entities are properly validated
CREATE TRIGGER IF NOT EXISTS tr_validate_critical_entities
BEFORE UPDATE OF legal_significance ON legal_entities
WHEN NEW.legal_significance = 'critical' AND NEW.validation_status = 'needs_review'
BEGIN
    SELECT RAISE(FAIL, 'Critical legal entities must be validated before marking as critical');
END;

-- ================================================================
-- ENTERPRISE CONFIGURATION
-- ================================================================

-- Enterprise configuration settings
CREATE TABLE IF NOT EXISTS enterprise_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category TEXT CHECK (category IN ('processing', 'legal_intelligence', 'performance', 'search', 'monitoring')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT DEFAULT 'system'
);

-- Default enterprise configuration
INSERT OR IGNORE INTO enterprise_config (key, value, value_type, description, category) VALUES
('max_concurrent_workers', '8', 'number', 'Maximum number of concurrent processing workers', 'processing'),
('memory_limit_mb', '2048', 'number', 'Maximum memory usage limit in MB', 'performance'),
('legal_entity_confidence_threshold', '0.85', 'number', 'Minimum confidence score for legal entities', 'legal_intelligence'),
('enable_legal_intelligence', 'true', 'boolean', 'Enable legal intelligence features', 'legal_intelligence'),
('search_index_update_interval', '300', 'number', 'Search index update interval in seconds', 'search'),
('resource_monitoring_interval', '5', 'number', 'Resource monitoring interval in seconds', 'monitoring'),
('checkpoint_interval', '10', 'number', 'Processing checkpoint interval in percent', 'processing'),
('cache_expiry_hours', '24', 'number', 'Default cache expiry time in hours', 'performance');

-- Log enterprise schema creation
INSERT INTO enterprise_config (key, value, value_type, description, category) VALUES
('schema_version', '1.0.0', 'string', 'Enterprise schema version', 'processing'),
('schema_created_at', datetime('now'), 'string', 'Enterprise schema creation timestamp', 'processing');

-- ================================================================
-- COMPLETION MESSAGE
-- ================================================================

SELECT 'Enterprise database schema extension created successfully' as status,
       'Tables: ' || COUNT(*) || ' created' as tables_created,
       'Ready for Phase 1 Week 1 enterprise processing' as next_step
FROM sqlite_master 
WHERE type = 'table' 
AND name LIKE '%enterprise%' OR name LIKE '%legal_%';