import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    key: "free_trial",
    name: "Free Trial",
    priceMonthly: 0,
    priceAnnual: 0,
    images: 10,
    features: ["feature1", "feature2", "feature3"],
    popular: false,
    subtitle: "one_time",
    whatsapp: null,
  },
  {
    key: "starter",
    name: null,
    priceMonthly: 9.99,
    priceAnnual: 7.99,
    images: 50,
    features: ["feature1", "feature2", "feature3", "feature4"],
    popular: false,
    subtitle: "per_month",
    whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Starter%20%249.99",
  },
  {
    key: "pro",
    name: null,
    priceMonthly: 24.99,
    priceAnnual: 19.99,
    images: 200,
    features: ["feature1", "feature2", "feature3", "feature4", "feature5"],
    popular: true,
    subtitle: "per_month",
    whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Pro%20%2424.99",
  },
  {
    key: "business",
    name: null,
    priceMonthly: 59.99,
    priceAnnual: 47.99,
    images: 500,
    features: ["feature1", "feature2", "feature3", "feature4", "feature5", "feature6"],
    popular: false,
    subtitle: "per_month",
    whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Business%20%2459.99",
  },
];

const PricingSection = () => {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl font-bold text-center text-foreground mb-4"
        >
          {t("pricing.title")}
        </motion.h2>
        <p className="text-center text-muted-foreground mb-8 text-lg">
          {t("pricing.subtitle")}
        </p>

        {/* Monthly/Annual Toggle */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            {t("pricing.monthly")}
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? "bg-primary" : "bg-border"}`}
            aria-label="Toggle annual pricing"
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-primary-foreground shadow transition-transform ${isAnnual ? "translate-x-7" : "translate-x-0.5"}`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            {t("pricing.annual")}
          </span>
          {isAnnual && (
            <span className="text-xs font-semibold text-primary bg-accent px-2 py-0.5 rounded-full">
              {t("pricing.save_20")}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`card-elevated p-8 relative ${plan.popular ? "border-primary ring-2 ring-primary/20" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {t("pricing.popular")}
                  </span>
                )}

                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {plan.name || t(`pricing.${plan.key}`)}
                </h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    ${price.toFixed(2)}
                  </span>
                  {plan.key !== "free_trial" && (
                    <span className="text-muted-foreground text-sm">
                      {t(`pricing.${plan.subtitle}`)}
                    </span>
                  )}
                </div>

                {plan.key === "free_trial" && (
                  <p className="text-muted-foreground text-xs mb-1">{t("pricing.no_credit_card")}</p>
                )}

                {isAnnual && plan.key !== "free_trial" && (
                  <p className="text-xs text-muted-foreground line-through mb-1">
                    ${plan.priceMonthly.toFixed(2)}/{t("pricing.mo_short")}
                  </p>
                )}

                <p className="text-muted-foreground text-sm mb-6">
                  {`${plan.images} ${plan.key === "free_trial" ? t("pricing.images_total") : t("pricing.images")}`}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {t(`pricing.${f}`)}
                    </li>
                  ))}
                </ul>

                {plan.whatsapp ? (
                  <a href={plan.whatsapp} target="_blank" rel="noopener noreferrer">
                    <Button className={`w-full ${plan.popular ? "btn-gradient" : ""}`} variant={plan.popular ? "default" : "outline"}>
                      {t("pricing.cta")}
                    </Button>
                  </a>
                ) : (
                  <a href="/auth?mode=signup">
                    <Button className="w-full" variant="outline">
                      {t("pricing.cta")}
                    </Button>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
