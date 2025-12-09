#!/bin/bash
# Script to run Prisma Studio with proper environment variable expansion

# Load environment variables from .env file
# This will load all variables including POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
set -a
[ -f .env ] && source .env
set +a

# Expand DATABASE_URL if it contains variable references
# Remove surrounding quotes if present, then expand variables
if [[ "$DATABASE_URL" == *"\${"* ]] || [[ "$DATABASE_URL" == *'${'* ]]; then
  # Remove quotes and expand variables
  DATABASE_URL=$(eval echo "$DATABASE_URL")
fi

# Export the expanded DATABASE_URL
export DATABASE_URL

# Run Prisma Studio
npx prisma studio
