const fs = require('fs');

const enFile = 'src/locales/en.json';
const arFile = 'src/locales/ar.json';
const ruFile = 'src/locales/ru.json';

const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arFile, 'utf8'));
const ru = JSON.parse(fs.readFileSync(ruFile, 'utf8'));

const newKeys = {
  "community_tasks_review": ["Community Tasks Review", "مراجعة مهام المجتمع", "Обзор задач сообщества"],
  "system_status": ["System Status", "حالة النظام", "Статус системы"],
  "layers": ["LAYERS", "طبقات", "СЛОИ"],
  "exchange_standard_rate": ["Exchange Standard Rate", "سعر الصرف القياسي", "Стандартный обменный курс"],
  "score_high": ["Score: High", "النتيجة: عالية", "Счет: Высокий"],
  "min_500": ["Min 500", "الحد الأدنى 500", "Мин. 500"],
  "gqh_max": ["GQH max", "GQH كحد أقصى", "GQH макс."],
  "gqh_per_tap": ["GQH per tap", "GQH لكل نقرة", "GQH за клик"]
};

for (const key in newKeys) {
  en[key] = newKeys[key][0];
  ar[key] = newKeys[key][1];
  ru[key] = newKeys[key][2];
}

fs.writeFileSync(enFile, JSON.stringify(en, null, 2));
fs.writeFileSync(arFile, JSON.stringify(ar, null, 2));
fs.writeFileSync(ruFile, JSON.stringify(ru, null, 2));

console.log("Translations updated");
