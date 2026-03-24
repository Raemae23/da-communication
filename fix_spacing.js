import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Update CreateDocument.jsx
const createDocPath = path.join(__dirname, 'src', 'pages', 'CreateDocument.jsx');
let createDocContent = fs.readFileSync(createDocPath, 'utf8');
createDocContent = createDocContent.replace(/margin-bottom:\s*6pt;/g, 'margin-bottom: 0;');
createDocContent = createDocContent.replace(/margin-bottom:\s*8pt;/g, 'margin-bottom: 0;');
fs.writeFileSync(createDocPath, createDocContent, 'utf8');

// 2. Update all templates
const templatesDir = path.join(__dirname, 'src', 'templates');
const files = fs.readdirSync(templatesDir);
files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(templatesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace the specific tailwind arbitrary value
    content = content.replace(/\[&_p\]:mb-\[6pt\]/g, '[&_p]:mb-0');
    content = content.replace(/\[&_li\]:mb-\[6pt\]/g, '[&_li]:mb-0');
    content = content.replace(/\[&_p\]:mb-1/g, '[&_p]:mb-0'); // Just in case OfficialLetter uses it
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Spacing removed successfully.');
