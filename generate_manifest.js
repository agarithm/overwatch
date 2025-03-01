const fs = require('fs');
const path = require('path');

const manifestData = {
  "manifest_version": 3,
  "name": "Overwatch AI",
  "version": "1.0.0",
  "description": "Add local Ollama-based chat to all websites",
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "http://localhost:11434/*",
    "<all_urls>"
  ],
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "css": ["styles.css"],
      "js": ["content-script.js"],
      "run_at": "document_end"
    }
  ]
};

// Ensure the public directory exists
const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Write manifest to public directory
const manifestPath = path.join(publicDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
console.log(`Generated valid manifest.json at ${manifestPath}`);

// Also write to dist directory if it exists
const distDir = path.resolve(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  const distManifestPath = path.join(distDir, 'manifest.json');
  fs.writeFileSync(distManifestPath, JSON.stringify(manifestData, null, 2));
  console.log(`Generated valid manifest.json at ${distManifestPath}`);
}

console.log('Manifest generation complete');
