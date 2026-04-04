import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "ar";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.pricing": { en: "Pricing", ar: "الأسعار" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.login": { en: "Login", ar: "تسجيل الدخول" },
  "nav.signup": { en: "Sign Up", ar: "إنشاء حساب" },
  "nav.logout": { en: "Logout", ar: "تسجيل الخروج" },
  "hero.tagline": { en: "Professional Ghost Mannequin Photos in Seconds", ar: "صور احترافية بدون مانيكان في ثوانٍ" },
  "hero.subtitle": { en: "Transform your clothing photography with AI-powered ghost mannequin removal. Perfect for e-commerce brands.", ar: "حوّل صور ملابسك باستخدام الذكاء الاصطناعي لإزالة المانيكان. مثالي لعلامات التجارة الإلكترونية." },
  "hero.cta": { en: "Get Started Free", ar: "ابدأ مجاناً" },
  "hero.cta2": { en: "View Pricing", ar: "عرض الأسعار" },
  "upload.title": { en: "Drop your clothing image here", ar: "أسقط صورة الملابس هنا" },
  "upload.subtitle": { en: "or click to browse files", ar: "أو انقر لتصفح الملفات" },
  "upload.formats": { en: "Supports JPG, PNG, WEBP up to 10MB", ar: "يدعم JPG, PNG, WEBP حتى 10 ميجابايت" },
  "pricing.title": { en: "Simple, Transparent Pricing", ar: "أسعار بسيطة وشفافة" },
  "pricing.subtitle": { en: "Start free, upgrade when you need more", ar: "ابدأ مجاناً، قم بالترقية عند الحاجة" },
  "pricing.starter": { en: "Starter", ar: "المبتدئ" },
  "pricing.pro": { en: "Pro", ar: "المحترف" },
  "pricing.business": { en: "Business", ar: "الأعمال" },
  "pricing.mo": { en: "/mo", ar: "/شهر" },
  "pricing.mo_short": { en: "mo", ar: "شهر" },
  "pricing.monthly": { en: "Monthly", ar: "شهري" },
  "pricing.annual": { en: "Annual", ar: "سنوي" },
  "pricing.save_20": { en: "Save 20%", ar: "وفر 20%" },
  "pricing.per_month": { en: "/month", ar: "/شهر" },
  "pricing.one_time": { en: "One-time", ar: "مرة واحدة" },
  "pricing.no_credit_card": { en: "No credit card needed", ar: "لا حاجة لبطاقة ائتمان" },
  "pricing.images": { en: "images/month", ar: "صورة/شهر" },
  "pricing.images_total": { en: "images total", ar: "صورة إجمالية" },
  "pricing.unlimited": { en: "Unlimited images", ar: "صور غير محدودة" },
  "pricing.cta": { en: "Get Started", ar: "ابدأ الآن" },
  "pricing.popular": { en: "Most Popular", ar: "الأكثر شعبية" },
  "pricing.feature1": { en: "Ghost mannequin removal", ar: "إزالة المانيكان" },
  "pricing.feature2": { en: "Background customization", ar: "تخصيص الخلفية" },
  "pricing.feature3": { en: "HD downloads", ar: "تحميل بجودة عالية" },
  "pricing.feature4": { en: "Priority processing", ar: "معالجة ذات أولوية" },
  "pricing.feature5": { en: "API access", ar: "الوصول للواجهة البرمجية" },
  "pricing.feature6": { en: "Dedicated support", ar: "دعم مخصص" },
  "beforeafter.title": { en: "See the Magic", ar: "شاهد السحر" },
  "beforeafter.before": { en: "Before", ar: "قبل" },
  "beforeafter.after": { en: "After", ar: "بعد" },
  "dashboard.title": { en: "Dashboard", ar: "لوحة التحكم" },
  "dashboard.upload": { en: "Upload Image", ar: "رفع صورة" },
  "dashboard.style": { en: "Style", ar: "النمط" },
  "dashboard.ghost": { en: "Ghost Mannequin", ar: "مانيكان شبحي" },
  "dashboard.floating": { en: "Floating", ar: "عائم" },
  "dashboard.flatlay": { en: "Flat Lay", ar: "مسطح" },
  "dashboard.background": { en: "Background", ar: "الخلفية" },
  "dashboard.white": { en: "White", ar: "أبيض" },
  "dashboard.grey": { en: "Grey", ar: "رمادي" },
  "dashboard.transparent": { en: "Transparent", ar: "شفاف" },
  "dashboard.process": { en: "Process Image", ar: "معالجة الصورة" },
  "dashboard.download": { en: "Download Result", ar: "تحميل النتيجة" },
  "dashboard.usage": { en: "Usage", ar: "الاستخدام" },
  "dashboard.of": { en: "of", ar: "من" },
  "dashboard.images_used": { en: "images used", ar: "صور مستخدمة" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.login": { en: "Log In", ar: "تسجيل الدخول" },
  "auth.signup": { en: "Sign Up", ar: "إنشاء حساب" },
  "auth.no_account": { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  "auth.have_account": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div dir={dir}>{children}</div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
