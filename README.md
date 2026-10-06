# نظام المخازن (MG Inventory)

أصناف ومخازن متعددة، إذن إضافة وصرف وتحويل، أرصدة، تنبيه حد أدنى، موردين وعملاء، مستخدمين وصلاحيات، تقارير وحركة أصناف، بحث وباركود.

```
backend/   NestJS + PostgreSQL (REST API)
web/       React + Vite (عربي RTL)
mobile/    Flutter (أندرويد / iOS) بمسح باركود بالكاميرا
```

## 1) قاعدة البيانات
```bash
docker compose up -d db        # أو استخدم أي PostgreSQL 14+ عندك
```

## 2) الباك إند
```bash
cd backend
cp .env.example .env           # عدّل JWT_SECRET و ADMIN_PASSWORD
npm install
npm run build
npm start                      # http://localhost:3000/api
```
أول تشغيل بيبني الجداول تلقائياً وبينشئ مستخدم مدير ومخزن "المخزن الرئيسي".
لو ما حددتش `ADMIN_PASSWORD` المستخدم هيكون `admin` / `admin123` والنظام هيطلب منك تغييرها.

اختبار شامل للـ API (محتاج السيرفر شغال):
```bash
API=http://localhost:3000/api npm run test:e2e
```

## 3) الويب
```bash
cd web
npm install
npm run dev                    # http://localhost:5173  (بيوصل للـ API على :3000 تلقائياً)
npm run build                  # ملفات النشر في web/dist
```
عند النشر على سيرفر مختلف: اضبط `VITE_API_URL=https://عنوانك/api` قبل `npm run build`، واضبط `CORS_ORIGIN` في الباك إند.

## 4) الموبايل (Flutter)
محتاج Flutter SDK مثبّت. من داخل `mobile/`:
```bash
flutter create . --platforms=android,ios --org com.legacy --project-name mg_inventory
flutter pub get
```
بعدها ضيف صلاحية الكاميرا:
- أندرويد: في `android/app/src/main/AndroidManifest.xml` قبل `<application>`:
  `<uses-permission android:name="android.permission.CAMERA"/>`
  وللاتصال بسيرفر `http` (بدون https) أثناء التجربة ضيف على وسم `<application>`: `android:usesCleartextTraffic="true"`
- iOS: في `ios/Runner/Info.plist` ضيف `NSCameraUsageDescription` برسالة مثل "نحتاج الكاميرا لمسح الباركود".

```bash
flutter run
```
من شاشة الدخول → "إعدادات السيرفر" اكتب عنوان الـ API. على محاكي أندرويد العنوان الافتراضي `http://10.0.2.2:3000/api` بيوصل لجهازك؛ على موبايل حقيقي استخدم IP جهازك أو عنوان السيرفر.

## الصلاحيات
أي مستخدم مسجّل يقدر يشوف الأصناف والأرصدة. الباقي بصلاحيات منفصلة: إدارة الأصناف، إدارة المخازن، إذن إضافة، إذن صرف، تحويل، الموردين والعملاء، التقارير، المستخدمين. تعديل صلاحيات مستخدم أو تعطيله بيسري فوراً حتى لو هو مسجّل دخول.

## ملاحظات تصميم
- الرصيد محفوظ في جدول أرصدة بيتحدّث داخل نفس العملية مع الإذن، والصرف أو التحويل بكمية أكبر من الرصيد بيترفض حتى لو اتبعت أكتر من طلب في نفس اللحظة.
- الأصناف والمخازن والموردين اللي ليها حركات ما بتتمسحش، بتتعطّل بس.
- الإذون ما بتتعدلش بعد تسجيلها (للحفاظ على سجل سليم).
