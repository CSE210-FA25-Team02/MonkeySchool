#!/bin/sh
# Entrypoint script for Docker: reset DB, run migrations, seed, then start app
set -e

# Wait for Postgres to be ready
until npx prisma db push; do
  echo "Waiting for database to be ready..."
  sleep 2
done

# Reset and migrate database
npx prisma migrate reset --force --skip-seed
# Seed database
npx prisma db seed

# Start the server on the specified PORT (from env or default)
export PORT=${PORT:-3000}
exec node src/server.js
