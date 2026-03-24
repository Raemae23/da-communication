import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const keyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
if (!keyMatch) {
  console.log('No key found.');
  process.exit(1);
}
const key = keyMatch[1].trim();

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      const gcm = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
      console.log('Available models for generateContent:');
      gcm.forEach(m => console.log(m.name));
    } else {
      console.log('Error fetching models:', data);
    }
  })
  .catch(console.error);
