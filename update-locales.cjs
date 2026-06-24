const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));

const newKeys = {
  "total_estimated_yield": ["Total Estimated Yield", "إجمالي العائد المقدر"],
  "leagues_progression": ["Leagues Progression", "تقدم الدوريات"],
  "gramqash_airdrop": ["🎁 GramQash Airdrop", "🎁 أيردروب GramQash"],
  "wallet_convert": ["💎 Wallet & Convert", "💎 المحفظة والتحويل"],
  "strategic_airdrop": ["Strategic AirDrop", "الأيردروب الاستراتيجي"],
  "snapshot_active": ["Snapshot Active", "اللقطة نشطة"],
  "secure_allocation": ["Secure your verified allocation from GramQash reward pool before the final snapshot (Snapshot Ledger).", "قم بتأمين مخصصاتك المعتمدة من مجمع مكافآت GramQash قبل اللقطة النهائية (سجل اللقطة)."],
  "countdown_snapshot": ["Countdown to snapshot closure", "العد التنازلي لإغلاق اللقطة"],
  "days": ["Days", "أيام"],
  "hours": ["Hours", "ساعات"],
  "minutes": ["Minutes", "دقائق"],
  "seconds": ["Seconds", "ثواني"],
  "airdrop_snapshot_taken": ["🚨 AirDrop snapshot has been taken!", "🚨 تم أخذ لقطة الأيردروب!"],
  "reward_pool_consumption": ["Reward Pool Consumption", "استهلاك مجمع المكافآت"],
  "distributed_rewards": ["Distributed", "تم توزيع"],
  "of_total_rewards": ["of total rewards to active GramQash farmers", "من إجمالي المكافآت لمزارعي GramQash النشطين"],
  "eligibility_calculator": ["Eligibility Calculator", "حاسبة الأهلية"],
  "forecast_allocation": ["Forecast your strategic allocation", "توقع مخصصاتك الاستراتيجية"],
  "test_reward_growth": ["Test your reward growth! Adjust default expectation sliders to increase future GRAM allocation:", "اختبر نمو مكافآتك! قم بتعديل أشرطة التوقعات الافتراضية لزيادة مخصصاتك المستقبلية من GRAM:"],
  "expected_gqh_balance": ["Expected GQH balance:", "رصيد GQH المتوقع:"],
  "expected_invitees": ["Expected invitees count:", "عدد المدعوين المتوقع:"],
  "persons": ["Persons", "أشخاص"],
  "estimated_usd_value": ["Estimated USD Value", "القيمة المقدرة بالدولار"],
  "expected_airdrop_allocation": ["Expected AirDrop allocation", "مخصصات الأيردروب المتوقعة"],
  "activity_proof": ["Activity Proof & Financial Address", "إثبات النشاط والعنوان المالي"],
  "on_chain_proof": ["ON-CHAIN PROOF SIGNATURE", "توقيع إثبات على السلسلة"],
  "broadcast_signature": ["Broadcast the digital signature document to secure your allocation on GRAM blockchain and officially authorize claim paths for public distribution.", "قم ببث مستند التوقيع الرقمي لتأمين مخصصاتك على بلوكتشين GRAM وتفويض مسارات المطالبة رسمياً للتوزيع العام."],
  "under_review_status": ["Under Review", "قيد المراجعة"],
  "verification_pending": ["Verification pending for", "المصادقة معلقة لـ"],
  "signature_verified": ["Smart contract signature fully verified", "تم التحقق من توقيع العقد الذكي بالكامل"],
  "auth_completed": ["Authentication completed and entitlement registered", "اكتملت المصادقة وتم تسجيل الاستحقاق"],
  "sign_airdrop_entitlement": ["Sign & Prove Airdrop Entitlement (0.5 TON)", "توقيع وإثبات استحقاق الأيردروب (0.5 TON)"],
  "live_sync": ["Live Sync", "مزامنة حية"],
  "wallet_connected": ["Wallet Connected", "المحفظة متصلة"],
  "total_connection_verifications": ["Total connection verifications.", "إجمالي عمليات التحقق من الاتصال."],
  "gqh_coins_amount": ["GQH Coins Amount", "كمية عملات GQH"],
  "total_gathered_holdings": ["Your total gathered holdings.", "إجمالي ممتلكاتك المجمعة."],
  "tasks_completed": ["Tasks Completed", "المهام المكتملة"],
  "participated_campaigns": ["Participated social network campaigns.", "حملات الشبكات الاجتماعية المشارك فيها."],
  "ads_watched": ["Ads Watched", "الإعلانات المشاهدة"],
  "total_ads_completed": ["Total advertisements completed.", "إجمالي الإعلانات المكتملة."],
  "daily_logins": ["Daily Logins", "تسجيلات الدخول اليومية"],
  "daily_streaks": ["Daily streaks and interactions.", "سلاسل وتفاعلات الدخول اليومية."],
  "games_played": ["Games Played", "الألعاب الملعوبة"],
  "total_games_sessions": ["Total sessions of mini-games.", "إجمالي جلسات الألعاب المصغرة."],
  "network_gas_fuel": ["Network Gas Fuel Tank", "خزان وقود غاز الشبكة"],
  "gas_subsidies": ["GramQash covers 100% of blockchain gas subsidies for daily claims & gaming transactions.", "تغطي GramQash 100٪ من إعانات غاز البلوكتشين للمطالبات اليومية ومعاملات الألعاب."],
  "deposit_gas_btn": ["Deposit 0.1 TON Gas Fuel", "إيداع 0.1 TON وقود غاز"],
  "add_task": ["Add Task", "إضافة مهمة"],
  "my_wallet": ["My Wallet", "محفظتي"],
  "convert_withdraw": ["Convert & Withdraw", "تحويل وسحب"],
  "convert_amount": ["Convert Amount (GQH)", "مبلغ التحويل (GQH)"],
  "max_btn": ["Max", "الأقصى"],
  "receive": ["You will receive:", "سوف تتلقى:"],
  "convert_to_gram": ["Convert to GRAM (ton)", "تحويل إلى GRAM (ton)"],
  "conversion_info": ["Every 10,000 GQH converts to 1 GRAM.", "كل 10,000 GQH تتحول إلى 1 GRAM."]
};

for (const key in newKeys) {
  en[key] = newKeys[key][0];
  ar[key] = newKeys[key][1];
}

fs.writeFileSync('src/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('src/locales/ar.json', JSON.stringify(ar, null, 2));

console.log('Locales updated');
