-- transform_logs.lua
-- Transforms parsed HTTP logs for database compatibility
-- Fixes the bigint error by proper field mapping and type conversion

function transform_http_log(tag, timestamp, record)
    -- Create new record with proper field mapping
    local new_record = {}
    
    -- Handle timestamp - convert from parsed time or use current timestamp
    if record.time then
        -- Convert from Morgan format "10/Dec/2025:06:28:28 +0000" to ISO format
        new_record.timestamp = record.time
    else
        new_record.timestamp = os.date("!%Y-%m-%dT%H:%M:%S.000Z")
    end
    
    -- Map HTTP fields with proper type conversion
    new_record.method = record.method or "UNKNOWN"
    new_record.url = record.url or "/"
    
    -- Ensure status_code is numeric
    if record.status_code then
        new_record.status_code = tonumber(record.status_code) or 0
    else
        new_record.status_code = 0
    end
    
    -- Map IP address (handle IPv6 format ::ffff:192.168.65.1)
    new_record.ip_address = record.ip
    new_record.user_agent = record.user_agent or ""
    
    -- Handle referer (convert "-" to null for database)
    if record.referer and record.referer ~= "-" then
        new_record.referer = record.referer
    end
    
    -- Handle response size - CRITICAL: Convert to number or null for BIGINT column
    if record.response_size and record.response_size ~= "-" then
        local size = tonumber(record.response_size)
        if size then
            new_record.response_size_bytes = size
        end
    end
    
    -- Add metadata
    new_record.environment = record.environment or "development"
    new_record.service = record.service or "monkeyschool"
    
    -- Log transformation for debugging
    local log_msg = string.format("Transformed log: %s %s %s -> status=%d, size=%s", 
        new_record.method, 
        new_record.url, 
        new_record.ip_address or "unknown",
        new_record.status_code,
        tostring(new_record.response_size_bytes or "null")
    )
    
    -- Return: code (1=success), timestamp, transformed_record
    return 1, timestamp, new_record
end