const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = ['node_modules', 'dist', 'build', '.git', 'uploads', 'postgres-data'];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace exact occurrences first
  content = content.replace(/KilimoHub/g, 'KiliSense');
  content = content.replace(/Kilimo Hub/g, 'KiliSense');
  content = content.replace(/KilimoLayout/g, 'KiliSenseLayout');
  
  // Then replace the rest with appropriate casing
  content = content.replace(/Kilimo/g, 'KiliSense');
  content = content.replace(/kilimo/gi, (match) => {
    if (match === 'kilimo') return 'KiliSense';
    if (match === 'Kilimo') return 'KiliSense';
    if (match === 'KILIMO') return 'KiliSense';
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORED_DIRS.includes(file)) {
          traverseAndReplace(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        // Only target code and config files
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.md', '.css', '.env', '.tsbuildinfo'].includes(ext) || file === '.env.example') {
          replaceInFile(fullPath);
        }
      }
    } catch (e) {
      console.error(`Could not process ${fullPath}: ${e.message}`);
    }
  }
}

traverseAndReplace(process.cwd());
console.log('Rebranding text replacement complete.');
