import fs from 'fs';

const files = [
  'src/App.tsx',
  'src/components/HomeTab.tsx',
  'src/components/TasksTab.tsx',
  'src/components/GameTab.tsx',
  'src/components/ProfileTab.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace color themes to make it pristine like Telegram iOS app
    content = content.replace(/bg-\[#(?:04081b|02040a|020512|010309|05081b|030612|030611|0e1635)\]/g, 'bg-[#1c1c1e]');
    content = content.replace(/bg-blue-950/g, 'bg-slate-800');
    content = content.replace(/border-blue-500\/[0-9]+/g, 'border-slate-800');
    content = content.replace(/text-cyan-400/g, 'text-blue-500');
    content = content.replace(/bg-cyan-500/g, 'bg-blue-500');
    content = content.replace(/text-emerald-400/g, 'text-green-500');
    content = content.replace(/bg-emerald-500/g, 'bg-green-500');
    content = content.replace(/shadow-\[.*?\]/g, 'shadow-sm'); // drop neon shadows
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
