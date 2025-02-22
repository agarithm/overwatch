# Overwatch AI
A Chrome Extension that adds local Ollama based chat to all websites.

## SETUP: Local Ollama

### MacOS Installation
```bash
curl https://ollama.ai/install.sh | sh
```

### Windows Installation
1. Download the Windows installer from [Ollama Releases](https://github.com/ollama/ollama/releases)
2. Run the installer

### Linux Installation
```bash
curl https://ollama.ai/install.sh | sh
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm
- Chrome browser
- Ollama installed and running

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/overwatch.git
cd overwatch
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run dev
```

### Loading the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `dist` folder in your project directory

### Testing
1. Ensure Ollama is running:
```bash
ollama serve
```

2. Download a model (if not already done):
```bash
ollama pull mistral
```

3. The extension should now appear in your browser toolbar
4. Visit any webpage to test the chat functionality

### Development Tips
- Changes to the extension require reloading:
  - Go to `chrome://extensions/`
  - Click the refresh icon on the extension card
  - Reload the webpage you're testing on
- Check the console for errors:
  - Right-click the webpage
  - Select "Inspect"
  - Navigate to the Console tab
- Background script logs can be viewed:
  - Go to `chrome://extensions/`
  - Click "service worker" under the extension

### Project Structure
```plaintext
overwatch/
├── src/
│   ├── content/        # Content scripts and UI
│   ├── background/     # Background service worker
│   └── shared/         # Shared utilities and types
├── public/             # Static assets
└── dist/              # Built extension (generated)
```