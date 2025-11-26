#!/bin/sh
set -e

echo "Running database migrations..."
node -e "const { AppDataSource } = require('./dist/config/database'); AppDataSource.initialize().then(() => AppDataSource.runMigrations()).then(() => { console.log('Migrations completed!'); return AppDataSource.destroy(); }).catch(err => { console.error('Migration failed:', err); process.exit(1); })" || echo "No migrations to run or migration failed"

echo "Starting server..."
exec node dist/server.js
