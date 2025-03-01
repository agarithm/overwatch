const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

// Create public dir if it doesn't exist
const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Ensure manifest.json exists
const manifestPath = path.resolve(publicDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  // Copy from src if exists, otherwise create empty
  const srcManifestPath = path.resolve(__dirname, 'src/manifest.json');
  if (fs.existsSync(srcManifestPath)) {
    fs.copyFileSync(srcManifestPath, manifestPath);
    console.log('Copied manifest.json from src to public');
  } else {
    fs.writeFileSync(manifestPath, JSON.stringify({
      "manifest_version": 3,
      "name": "Overwatch AI",
      "version": "1.0.0",
      "description": "Add local Ollama-based chat to all websites",
      "permissions": ["activeTab", "scripting", "storage", "tabs"],
      "host_permissions": ["http://localhost:11434/*", "<all_urls>"],
      "action": {
        "default_popup": "popup.html"
      },
      "background": {
        "service_worker": "background.js"
      },
      "content_scripts": [{
        "matches": ["<all_urls>"],
        "css": ["styles.css"],
        "js": ["content-script.js"],
        "run_at": "document_end"
      }]
    }, null, 2));
    console.log('Created default manifest.json in public directory');
  }
}

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './src/background/background.ts',
    'content-script': './src/content/content-script.ts',
    popup: './src/popup/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public/manifest.json',
          to: 'manifest.json',
          transform: (content) => {
            // Return the content as-is without any transformation
            return content;
          }
        },
        { 
          from: 'src/popup/popup.css', 
          to: 'popup.css' 
        },
        { 
          from: 'src/styles/sidebar.css', 
          to: 'styles.css' 
        },
        { 
          from: 'src/assets/icons/*.png', 
          to: 'assets/icons/[name][ext]', 
          noErrorOnMissing: true 
        }
      ]
    })
  ]
};