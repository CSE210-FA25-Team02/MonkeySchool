function convert_timestamp(tag, timestamp, record)
    -- Convert Morgan timestamp format to ISO 8601 for TimescaleDB
    -- Morgan format: 10/Dec/2025:01:27:01 +0000
    -- Target format: 2025-12-10T01:27:01.000Z
    
    if record.time then
        -- Parse Morgan timestamp format
        local time_str = record.time
        local day, month, year, hour, min, sec, tz = time_str:match("(%d+)/(%w+)/(%d+):(%d+):(%d+):(%d+) ([%+%-]%d+)")
        
        if day and month and year and hour and min and sec then
            -- Month mapping
            local months = {
                Jan = "01", Feb = "02", Mar = "03", Apr = "04", May = "05", Jun = "06",
                Jul = "07", Aug = "08", Sep = "09", Oct = "10", Nov = "11", Dec = "12"
            }
            
            local month_num = months[month]
            if month_num then
                -- Format as ISO 8601
                record.timestamp = string.format("%s-%s-%02dT%02d:%02d:%02d.000Z", 
                    year, month_num, tonumber(day), tonumber(hour), tonumber(min), tonumber(sec))
            end
        end
    end
    
    -- Set current timestamp if parsing failed
    if not record.timestamp then
        record.timestamp = os.date("!%Y-%m-%dT%H:%M:%S.000Z")
    end
    
    return 1, timestamp, record
end