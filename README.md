# عطارة سدرة بدمنهور — Web App

تطبيق ويب رسمي متكامل وسريع للمنيو الرقمي لمتجر **عطارة سدرة بدمنهور**، يقرأ الأسعار والأوزان والأقسام مباشرة وبشكل حي من Google Sheets.

## خطوات الرفع والتشغيل على Vercel و GitHub:

1. أنشئ Repository جديد على حسابك في GitHub.
2. فك ضغط الملف وارفع محتويات هذا المجلد إليه.
3. ادخل إلى لوحة تحكم **Vercel** واضغط **Add New Project** ثم اختر المستودع.
4. في خانة **Environment Variables** أضف المتغيرات التالية:
   * `GOOGLE_SHEET_CSV_URL`: رابط الـ CSV المباشر من Google Sheet.
   * `NEXT_PUBLIC_WHATSAPP_NUMBER`: `201044760160`
5. اضغط **Deploy**.
