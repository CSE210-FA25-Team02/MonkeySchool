#!/bin/bash
# Wrapper script to set test environment variables and run a command

export NODE_ENV="${NODE_ENV:-test}"
export USE_CSV_DB="${USE_CSV_DB:-true}"
export DATABASE_URL="${DATABASE_URL:-postgresql://dummy:dummy@localhost:5432/dummy?schema=public}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test-google-client-id-12345678901234567890}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test-google-client-secret-12345678901234567890}"
export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-key-minimum-32-characters-long-for-testing-purposes}"
export GOOGLE_REDIRECT_URI="${GOOGLE_REDIRECT_URI:-http://localhost:3000/api/auth/google/callback}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5500}"
export RATE_LIMIT_WINDOW_MS="${RATE_LIMIT_WINDOW_MS:-900000}"
export RATE_LIMIT_MAX_REQUESTS="${RATE_LIMIT_MAX_REQUESTS:-100}"
export JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-7d}"
export PORT="${PORT:-3000}"

# Execute all arguments as a command
exec "$@"

