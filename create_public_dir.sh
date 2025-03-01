#!/bin/bash

# Create the basic directory structure
mkdir -p public
echo "Created public directory"

# Copy manifest.json to public directory
if [ ! -f public/manifest.json ]; then
  cp -f public/manifest.json public/manifest.json 2>/dev/null || echo "{}" > public/manifest.json
  echo "Created empty manifest.json in public directory"
fi

echo "Done setting up public directory"
