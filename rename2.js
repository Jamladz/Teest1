import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('./src');

files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let content = original;
    
    // Replace standalone TON with GRAM (ton)
    // Positive lookbehind for " " or ">" or "\n"
    // Negative lookahead for " Connect"
    // Let's just do targeted replaces for known strings
    
    // Using regex for replacing TON => GRAM (ton)
    // Match " TON " or ">TON<" or " TON<"
    content = content.replace(/(\b|>|\s)TON(\b|<|\s)/g, (match, p1, p2) => {
        // preserve casing but we only match uppercase TON
        // avoid "TON Connect"
        if (match.includes('TON Connect')) return match;
        return `${p1}GRAM (ton)${p2}`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
