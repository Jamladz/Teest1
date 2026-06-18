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

const files = walkDir('./src').concat(['./public/tonconnect-manifest.json']);

files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    let content = original;
    
    // Replace TonQash -> GramQash
    content = content.replace(/TonQash/g, 'GramQash');
    content = content.replace(/tonqash/g, 'gramqash');
    
    // Replace TQH -> GQH
    content = content.replace(/TQH/g, 'GQH');
    content = content.replace(/tqh/g, 'gqh');

    // Replace TON -> GRAM
    // We should be careful not to break @tonconnect/ui or @tonconnect/manifest
    // Let's replace only specific word occurrences of TON
    // like " TON" -> " GRAM", "TON " -> "GRAM ", "TONs" -> "GRAMs"
    // Wait, the prompt says "GRAM (ton)"
    // Let's just do it directly mostly in user-facing text:
    // replacing " TON " -> " GRAM " etc.
    content = content.split(' TON ').join(' GRAM ');
    content = content.split(' TON<').join(' GRAM<');
    content = content.split('>TON ').join('>GRAM ');
    content = content.split(' TON.').join(' GRAM.');
    content = content.split(' TON,').join(' GRAM,');
    
    // Replace specific image URL
    content = content.replace(/https:\/\/i.suar.me\/jv0W2\/l/g, 'https://i.suar.me/EpN7r/l');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
