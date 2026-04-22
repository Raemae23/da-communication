import fs from 'fs';
import path from 'path';

const sizeMap = {
  'text-[9px]': 'text-base',
  'text-[10px]': 'text-lg',
  'text-[11px]': 'text-xl',
  'text-[12px]': 'text-xl',
  'text-xs': 'text-xl',
  'text-[13px]': 'text-2xl',
  'text-sm': 'text-2xl',
  'text-base': 'text-3xl',
  'text-lg': 'text-4xl'
};

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let originalContent = content;
      
      const regex = new RegExp(
        Object.keys(sizeMap)
          .map(k => k.replace(/\[/g, '\\[').replace(/\]/g, '\\]'))
          .join('|'),
        'g'
      );
      
      content = content.replace(regex, (match) => {
        return sizeMap[match] || match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

traverse('./src');
console.log('Update Complete.');
