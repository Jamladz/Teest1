const fs = require('fs');

function replaceFileContent(filePath, searchValue, replaceValue) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchValue)) {
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

replaceFileContent(
  'src/components/ProfileTab.tsx',
  '`https://t.me/TonQashBot?start=${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`',
  '`https://t.me/TonQashBot?startapp=ref_${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`'
);

replaceFileContent(
  'src/components/TasksTab.tsx',
  '`https://t.me/TonQashBot?start=${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`',
  '`https://t.me/TonQashBot?startapp=ref_${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`'
);
