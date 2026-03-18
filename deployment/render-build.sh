#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting Deployment Build for DBU-IMS Backend..."

# Install dependencies
npm install

# (Optional) If we had backend build steps like TypeScript compiler:
# npm run build

echo "Build complete. Ready to serve server.js."
