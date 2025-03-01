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
  ],
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
  ],
  "commands": {
    "toggle-sidebar": {
      "suggested_key": {
        "default": "Alt+W",
        "mac": "Alt+W"
      },
      "description": "Toggle the Overwatch sidebar"
    }
  }
};

// Write valid JSON (without comments) to both public and dist
const publicDir = path.resolve(__dirname, 'public');
const distDir = path.resolve(__dirname, 'dist');

[publicDir, distDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
  console.log(`Generated valid manifest.json at ${manifestPath}`);
});

console.log('Manifest generation complete');
