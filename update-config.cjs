const fs = require('fs');

function replaceFileContent(filePath, searchValue, replaceValue) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchValue)) {
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

replaceFileContent('src/App.tsx', 'blockId: "int-36008"', 'blockId: "int-36108"');
replaceFileContent('src/components/DropBlastGame.tsx', 'blockId: "int-36010"', 'blockId: "int-36109"');
replaceFileContent('src/components/CryptoRunnerGame.tsx', 'blockId: "int-36011"', 'blockId: "int-36110"');
replaceFileContent('src/components/CardMatchGame.tsx', 'blockId: "int-36012"', 'blockId: "int-36111"');

replaceFileContent(
  'src/components/ProfileTab.tsx',
  '`https://t.me/TonQashBot/app?startapp=ref_${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`',
  '`https://t.me/TonQashBot?start=${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`'
);

replaceFileContent(
  'src/components/TasksTab.tsx',
  '`https://t.me/TonQashBot/app?startapp=ref_${user.username.toLowerCase().replace(/\\s+/g, "_")}`',
  '`https://t.me/TonQashBot?start=${user.telegramId || user.username.toLowerCase().replace(/\\s+/g, "_")}`'
);
