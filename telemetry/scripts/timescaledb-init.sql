-- ============================================================================
-- MonkeySchool TimescaleDB Log Schema
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- HTTP ACCESS LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS http_logs (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- HTTP Request Details
    method VARCHAR(10) NOT NULL,
    url TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms NUMERIC(10,3),
    response_size_bytes BIGINT,
    
    -- Client Information
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- User Context (if authenticated)
    user_id TEXT,
    user_email TEXT,
    session_id TEXT,
    
    -- Additional Metadata
    request_id TEXT,
    environment VARCHAR(20) DEFAULT 'development',
    
    PRIMARY KEY (timestamp, id)
);

-- Convert to hypertable (TimescaleDB time-series table)
SELECT create_hypertable('http_logs', 'timestamp', if_not_exists => TRUE);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_http_logs_status ON http_logs(status_code, timestamp);
CREATE INDEX IF NOT EXISTS idx_http_logs_user ON http_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_http_logs_url ON http_logs(url, timestamp);
CREATE INDEX IF NOT EXISTS idx_http_logs_method ON http_logs(method, timestamp);

-- ============================================================================
-- APPLICATION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_logs (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Log Details
    level VARCHAR(10) NOT NULL, -- ERROR, WARN, INFO, DEBUG
    message TEXT NOT NULL,
    category VARCHAR(50), -- auth, class, availability, etc.
    
    -- Context Information
    user_id TEXT,
    class_id TEXT,
    session_id TEXT,
    request_id TEXT,
    
    -- Technical Details
    module VARCHAR(100), -- Controller/Service name
    function_name VARCHAR(100),
    file_path TEXT,
    line_number INTEGER,
    
    -- Error Information (for ERROR level logs)
    error_type VARCHAR(100),
    stack_trace TEXT,
    
    -- Additional Data (JSON for flexibility)
    metadata JSONB,
    
    -- Environment
    environment VARCHAR(20) DEFAULT 'development',
    
    PRIMARY KEY (timestamp, id)
);

-- Convert to hypertable
SELECT create_hypertable('application_logs', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON application_logs(level, timestamp);
CREATE INDEX IF NOT EXISTS idx_app_logs_category ON application_logs(category, timestamp);
CREATE INDEX IF NOT EXISTS idx_app_logs_user ON application_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_app_logs_class ON application_logs(class_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_app_logs_error ON application_logs(error_type, timestamp);

-- ============================================================================
-- SECURITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_logs (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Security Event Details
    event_type VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, FAILED_LOGIN, PERMISSION_DENIED, etc.
    event_result VARCHAR(20) NOT NULL, -- SUCCESS, FAILURE, BLOCKED
    
    -- User Information
    user_id TEXT,
    user_email TEXT,
    attempted_email TEXT, -- For failed logins
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    
    -- Additional Security Context
    risk_score INTEGER, -- 0-100
    geo_location JSONB, -- Country, city if available
    is_suspicious BOOLEAN DEFAULT FALSE,
    
    -- Details
    details JSONB,
    
    PRIMARY KEY (timestamp, id)
);

-- Convert to hypertable
SELECT create_hypertable('security_logs', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_event ON security_logs(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_user ON security_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_result ON security_logs(event_result, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_suspicious ON security_logs(is_suspicious, timestamp);

-- ============================================================================
-- PERFORMANCE LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_logs (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Performance Metrics
    metric_type VARCHAR(50) NOT NULL, -- DATABASE_QUERY, API_RESPONSE, PAGE_LOAD, etc.
    operation_name VARCHAR(100) NOT NULL,
    duration_ms NUMERIC(10,3) NOT NULL,
    
    -- Context
    user_id TEXT,
    session_id TEXT,
    request_id TEXT,
    
    -- Technical Details
    query_text TEXT, -- For database operations
    query_params JSONB,
    result_count INTEGER,
    
    -- Resource Usage
    memory_usage_mb NUMERIC(8,2),
    cpu_usage_percent NUMERIC(5,2),
    
    -- Additional Metadata
    metadata JSONB,
    
    PRIMARY KEY (timestamp, id)
);

-- Convert to hypertable
SELECT create_hypertable('performance_logs', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_perf_metric ON performance_logs(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_perf_operation ON performance_logs(operation_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_perf_duration ON performance_logs(duration_ms, timestamp);

-- ============================================================================
-- BUSINESS ANALYTICS TABLE (User Behavior)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_logs (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User Activity
    user_id TEXT,
    session_id TEXT,
    event_type VARCHAR(50) NOT NULL, -- PAGE_VIEW, CLICK, FORM_SUBMIT, etc.
    page_path TEXT,
    
    -- Duration Tracking
    page_view_duration_seconds INTEGER,
    session_duration_seconds INTEGER,
    
    -- Class Context
    class_id TEXT,
    group_id TEXT,
    
    -- Feature Usage
    feature_name VARCHAR(100),
    action_name VARCHAR(100),
    
    -- Device/Browser Info
    device_type VARCHAR(20), -- mobile, desktop, tablet
    browser VARCHAR(50),
    screen_resolution VARCHAR(20),
    
    -- Additional Properties
    properties JSONB,
    
    PRIMARY KEY (timestamp, id)
);

-- Convert to hypertable
SELECT create_hypertable('analytics_logs', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_logs(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_class ON analytics_logs(class_id, timestamp);

-- ============================================================================
-- RETENTION POLICIES (TimescaleDB data lifecycle management)
-- ============================================================================

-- Keep detailed logs for 30 days, then aggregate
SELECT add_retention_policy('http_logs', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('application_logs', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('security_logs', INTERVAL '365 days', if_not_exists => TRUE);
SELECT add_retention_policy('performance_logs', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('analytics_logs', INTERVAL '180 days', if_not_exists => TRUE);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Recent errors view
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
    timestamp,
    level,
    message,
    category,
    user_id,
    error_type,
    module
FROM application_logs 
WHERE level = 'ERROR' 
    AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- API performance summary
CREATE OR REPLACE VIEW api_performance_summary AS
SELECT 
    url,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM http_logs 
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY url, method
ORDER BY avg_response_time DESC;

-- Security alerts
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    timestamp,
    event_type,
    user_email,
    attempted_email,
    ip_address,
    is_suspicious,
    details
FROM security_logs 
WHERE event_result = 'FAILURE' 
    OR is_suspicious = TRUE
    AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO telemetry;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO telemetry;

-- Success message
\echo 'TimescaleDB log schema initialized successfully!'
\echo 'Tables created: http_logs, application_logs, security_logs, performance_logs, analytics_logs'
\echo 'Hypertables enabled for time-series optimization'
\echo 'Retention policies configured'