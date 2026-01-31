#!/bin/bash
# RideNDine Core API Service Startup Script

set -e

echo "🚀 Starting RideNDine Core API Service..."

# Check if .env exists
if [ ! -f "../../.env" ]; then
  echo "❌ .env file not found. Copying from .env.example..."
  cp ../../.env.example ../../.env
  echo "⚠️  Please update ../../.env with your actual values before running the service"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if dist exists (build)
if [ ! -d "dist" ]; then
  echo "🔨 Building the application..."
  npm run build
fi

# Start the service
echo "✅ Starting API service on port ${API_PORT:-9001}..."
npm run start:dev
