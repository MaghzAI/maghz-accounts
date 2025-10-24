# 📋 نماذج الإضافة والتعديل - Add/Edit Forms

**الإصدار**: 1.0.0
**الحالة**: 🟢 جاهز للإنتاج
**آخر تحديث**: 2025-10-24 20:17 UTC+3

---

## 📖 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الميزات](#الميزات)
3. [البنية](#البنية)
4. [الاستخدام](#الاستخدام)
5. [API](#api)
6. [معالجة الأخطاء](#معالجة-الأخطاء)
7. [الاختبار](#الاختبار)

---

## نظرة عامة

تم تطوير نماذج كاملة لإضافة وتعديل الموجات (Waves) والـ ASNs في نظام إدارة المخزون. النماذج مدمجة بشكل كامل مع لوحات التحكم وتوفر تجربة مستخدم احترافية.

### الملفات الرئيسية
```
components/inventory/wave-form.tsx          # نموذج الموجة
components/inventory/asn-form.tsx           # نموذج ASN
components/inventory/outbound-dashboard.tsx # لوحة الموجات
components/inventory/inbound-dashboard.tsx  # لوحة ASNs
```

---

## الميزات

### ✨ Wave Form (نموذج الموجة)

#### الإمكانيات
- ✅ إنشاء موجات جديدة
- ✅ تحديث الموجات الموجودة
- ✅ حقول مطلوبة واختيارية
- ✅ تحقق من الصحة
- ✅ معالجة الأخطاء
- ✅ رسائل المستخدم

#### الحقول
| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| Wave Number | Text | Yes (Add) | رقم الموجة الفريد |
| Wave Name | Text | Yes | اسم الموجة |
| Picker Team | Text | No | فريق الالتقاط |
| Priority Focus | Select | Yes | مستوى الأولوية |

#### الخيارات
- Priority Focus: `Low` | `Balanced` | `High`

---

### ✨ ASN Form (نموذج ASN)

#### الإمكانيات
- ✅ إنشاء ASNs جديدة
- ✅ تحديث ASNs الموجودة
- ✅ حقول مطلوبة واختيارية
- ✅ تحقق من الصحة
- ✅ معالجة الأخطاء
- ✅ رسائل المستخدم

#### الحقول
| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| ASN Number | Text | Yes (Add) | رقم ASN الفريد |
| Reference | Text | Yes | رقم المرجع |
| Type | Select | Yes | نوع ASN |
| Partner Name | Text | Yes | اسم الشريك |
| Dock | Text | No | الرصيف |
| Expected Date | Date | Yes (Add) | التاريخ المتوقع |
| Priority | Select | Yes | مستوى الأولوية |

#### الخيارات
- Type: `Purchase Order` | `Inter-warehouse Transfer` | `Customer Return`
- Priority: `Low` | `Medium` | `High`

---

## البنية

### Wave Form Structure
```typescript
interface WaveFormProps {
  open: boolean;                    // حالة النموذج
  onOpenChange: (open: boolean) => void;  // دالة تغيير الحالة
  mode: "add" | "edit";            // وضع النموذج
  wave?: {                         // بيانات الموجة (للتعديل)
    id: string;
    name: string;
    pickerTeam: string;
    priorityFocus: string;
  };
  onSuccess?: () => void;          // دالة النجاح
}
```

### ASN Form Structure
```typescript
interface AsnFormProps {
  open: boolean;                    // حالة النموذج
  onOpenChange: (open: boolean) => void;  // دالة تغيير الحالة
  mode: "add" | "edit";            // وضع النموذج
  asn?: {                          // بيانات ASN (للتعديل)
    id: string;
    reference: string;
    type: string;
    partnerName: string;
    dock: string;
    priority: string;
  };
  onSuccess?: () => void;          // دالة النجاح
}
```

---

## الاستخدام

### استخدام Wave Form

```typescript
import { WaveForm } from "@/components/inventory/wave-form";

export function MyComponent() {
  const [waveFormOpen, setWaveFormOpen] = useState(false);
  const [waveFormMode, setWaveFormMode] = useState<"add" | "edit">("add");
  const [selectedWave, setSelectedWave] = useState(null);

  const handleAdd = () => {
    setWaveFormMode("add");
    setWaveFormOpen(true);
  };

  const handleEdit = () => {
    setWaveFormMode("edit");
    setWaveFormOpen(true);
  };

  return (
    <>
      <button onClick={handleAdd}>Add Wave</button>
      <button onClick={handleEdit}>Edit Wave</button>
      
      <WaveForm
        open={waveFormOpen}
        onOpenChange={setWaveFormOpen}
        mode={waveFormMode}
        wave={selectedWave}
        onSuccess={() => {
          // تحديث البيانات
          loadWaves();
        }}
      />
    </>
  );
}
```

### استخدام ASN Form

```typescript
import { AsnForm } from "@/components/inventory/asn-form";

export function MyComponent() {
  const [asnFormOpen, setAsnFormOpen] = useState(false);
  const [asnFormMode, setAsnFormMode] = useState<"add" | "edit">("add");
  const [selectedAsn, setSelectedAsn] = useState(null);

  const handleAdd = () => {
    setAsnFormMode("add");
    setAsnFormOpen(true);
  };

  const handleEdit = () => {
    setAsnFormMode("edit");
    setAsnFormOpen(true);
  };

  return (
    <>
      <button onClick={handleAdd}>Add ASN</button>
      <button onClick={handleEdit}>Edit ASN</button>
      
      <AsnForm
        open={asnFormOpen}
        onOpenChange={setAsnFormOpen}
        mode={asnFormMode}
        asn={selectedAsn}
        onSuccess={() => {
          // تحديث البيانات
          loadAsns();
        }}
      />
    </>
  );
}
```

---

## API

### Wave API

#### POST /api/inventory/waves (Create)
```json
{
  "waveNumber": "WAVE-001",
  "name": "موجة الصباح",
  "pickerTeam": "فريق أ",
  "priorityFocus": "High"
}
```

**Response (201)**:
```json
{
  "id": "wave-123",
  "waveNumber": "WAVE-001",
  "name": "موجة الصباح",
  "pickerTeam": "فريق أ",
  "priorityFocus": "High",
  "createdAt": "2025-10-24T20:17:00Z"
}
```

#### PATCH /api/inventory/waves/{id} (Update)
```json
{
  "name": "موجة الصباح المحدثة",
  "pickerTeam": "فريق ب",
  "priorityFocus": "Balanced"
}
```

**Response (200)**:
```json
{
  "id": "wave-123",
  "waveNumber": "WAVE-001",
  "name": "موجة الصباح المحدثة",
  "pickerTeam": "فريق ب",
  "priorityFocus": "Balanced",
  "updatedAt": "2025-10-24T20:17:00Z"
}
```

---

### ASN API

#### POST /api/inventory/asn (Create)
```json
{
  "asnNumber": "ASN-001",
  "reference": "PO-10234",
  "type": "Purchase Order",
  "partnerName": "الموردون الصناعيون",
  "dock": "Dock A",
  "expectedDate": "2025-10-25T00:00:00Z",
  "priority": "High"
}
```

**Response (201)**:
```json
{
  "id": "asn-123",
  "asnNumber": "ASN-001",
  "reference": "PO-10234",
  "type": "Purchase Order",
  "partnerName": "الموردون الصناعيون",
  "dock": "Dock A",
  "expectedDate": "2025-10-25T00:00:00Z",
  "priority": "High",
  "createdAt": "2025-10-24T20:17:00Z"
}
```

#### PATCH /api/inventory/asn/{id} (Update)
```json
{
  "priority": "Medium"
}
```

**Response (200)**:
```json
{
  "id": "asn-123",
  "asnNumber": "ASN-001",
  "reference": "PO-10234",
  "type": "Purchase Order",
  "partnerName": "الموردون الصناعيون",
  "dock": "Dock A",
  "expectedDate": "2025-10-25T00:00:00Z",
  "priority": "Medium",
  "updatedAt": "2025-10-24T20:17:00Z"
}
```

---

## معالجة الأخطاء

### أخطاء التحقق من الصحة

#### Wave Form
```
- Wave Name مطلوب (2 أحرف على الأقل)
- Wave Number مطلوب عند الإنشاء
- Priority Focus مطلوب
```

#### ASN Form
```
- Reference مطلوب
- Partner Name مطلوب
- Type مطلوب
- Expected Date مطلوب عند الإنشاء
- Priority مطلوب
```

### أخطاء API

| الكود | الرسالة | الحل |
|------|--------|------|
| 400 | Invalid fields | تحقق من البيانات المدخلة |
| 401 | Unauthorized | تحقق من المصادقة |
| 404 | Not found | تحقق من الـ ID |
| 500 | Server error | اتصل بالدعم |

### رسائل المستخدم

#### النجاح
```
✅ تم إنشاء الموجة بنجاح
✅ تم تحديث الموجة بنجاح
✅ تم إنشاء ASN بنجاح
✅ تم تحديث ASN بنجاح
```

#### الخطأ
```
❌ اسم الموجة مطلوب
❌ رقم المرجع مطلوب
❌ فشل إنشاء الموجة
❌ فشل تحديث ASN
```

---

## الاختبار

### اختبار يدوي

1. **اختبار الإنشاء**
   - اذهب إلى الصفحة
   - اضغط على "Add"
   - ملء البيانات
   - اضغط على "Create"
   - تحقق من النجاح

2. **اختبار التحديث**
   - اختر عنصر موجود
   - اضغط على "Edit"
   - عدّل البيانات
   - اضغط على "Update"
   - تحقق من النجاح

3. **اختبار الأخطاء**
   - اترك حقل مطلوب فارغاً
   - اضغط على "Create"
   - تحقق من رسالة الخطأ

### اختبار آلي

```bash
# تشغيل الاختبارات
npm run test

# تشغيل اختبارات محددة
npm run test -- wave-form.test.ts
npm run test -- asn-form.test.ts
```

---

## 🚀 الخطوات التالية

### قصير الأجل
- [ ] اختبار شامل للنماذج
- [ ] اختبار معالجة الأخطاء
- [ ] اختبار الأداء

### متوسط الأجل
- [ ] إضافة عمليات جماعية
- [ ] إضافة تصفية متقدمة
- [ ] إضافة تصدير Excel

### طويل الأجل
- [ ] إضافة سجل التدقيق
- [ ] إضافة الإشعارات
- [ ] إضافة التقارير

---

## 📞 الدعم

### الأسئلة الشائعة

**س: كيف أضيف موجة جديدة؟**
ج: اذهب إلى `/inventory/outbound` واضغط على زر "Add"

**س: هل يمكن تحديث Wave Number؟**
ج: لا، Wave Number ثابت ولا يمكن تحديثه

**س: ما هي الفرق بين Priority Focus و Priority؟**
ج: Priority Focus للموجات و Priority للـ ASNs

**س: هل يمكن حذف موجة من النموذج؟**
ج: لا، الحذف يتم من زر "Delete" منفصل

---

## 📝 الملاحظات

- جميع التواريخ بصيغة ISO 8601
- جميع الأرقام يجب أن تكون موجبة
- جميع النصوص حساسة لحالة الأحرف
- جميع الحقول المطلوبة يجب ملؤها

---

## 📄 الملفات ذات الصلة

- `FORMS_READY.md` - توثيق مفصل للنماذج
- `FINAL_STATUS.md` - الحالة النهائية
- `QUICK_TEST.md` - دليل الاختبار السريع
- `PHASE_7_COMPLETE.md` - ملخص المرحلة السابعة

---

**آخر تحديث**: 2025-10-24 20:17 UTC+3
**الإصدار**: 1.0.0
**الحالة**: 🟢 جاهز للإنتاج
