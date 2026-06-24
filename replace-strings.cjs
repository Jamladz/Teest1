const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, searchValue, replaceValue) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchValue)) {
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

replaceFileContent(
  'src/components/TaskCenterModal.tsx',
  '<span className="text-slate-500 text-xs ms-2">Min 500</span>',
  '<span className="text-slate-500 text-xs ms-2">{t("min_500", "Min 500")}</span>'
);

replaceFileContent(
  'src/components/HomeTab.tsx',
  '<span>Exchange Standard Rate</span>',
  '<span>{t("exchange_standard_rate", "Exchange Standard Rate")}</span>'
);

replaceFileContent(
  'src/components/HomeTab.tsx',
  '/ 100k GQH max',
  '/ 100k {t("gqh_max", "GQH max")}'
);

replaceFileContent(
  'src/components/HomeTab.tsx',
  '1 GQH per tap',
  '1 {t("gqh_per_tap", "GQH per tap")}'
);

replaceFileContent(
  'src/components/GameTab.tsx',
  'Score: <strong className="text-yellow-400">High</strong>',
  '{t("score_high", "Score: High").replace("High", "")} <strong className="text-yellow-400">High</strong>'
);
