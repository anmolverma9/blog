const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let modifiedCount = 0;

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Replace fetch('/api/...
        // We use a regex that matches fetch('/api/ leaving the rest intact.
        if (content.includes("fetch('/api/")) {
            content = content.replace(/fetch\('\/api\//g, "fetch((process.env.NEXT_PUBLIC_APP_URL || '') + '/api/");
            modified = true;
        }
        
        // Replace fetch(`/api/...
        if (content.includes("fetch(`/api/")) {
            content = content.replace(/fetch\(`\/api\//g, "fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/");
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Patched: ${filePath}`);
            modifiedCount++;
        }
    }
});

console.log(`\nSuccessfully patched ${modifiedCount} files.`);
