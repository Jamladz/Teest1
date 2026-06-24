const fs = require('fs');

function addTranslation(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useTranslation')) {
    content = content.replace(/import React[^;]*;/, '$&\nimport { useTranslation } from "react-i18next";');
    
    // Find component definition
    const functionMatch = content.match(/export default function \w+\([^)]*\)\s*{/);
    if (functionMatch) {
      content = content.replace(functionMatch[0], functionMatch[0] + '\n  const { t } = useTranslation();');
    } else {
      const functionMatch2 = content.match(/export function \w+\([^)]*\)\s*{/);
      if (functionMatch2) {
        content = content.replace(functionMatch2[0], functionMatch2[0] + '\n  const { t } = useTranslation();');
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

addTranslation('src/components/GameTab.tsx');
addTranslation('src/components/TaskCenterModal.tsx');
