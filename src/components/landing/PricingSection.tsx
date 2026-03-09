import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    key: "free_trial",
    name: "Free Trial",
    price: 0,
    images: 5,
    features: ["feature1", "feature2", "feature3"],
    popular: false,
    subtitle: "One-time only",
  },
  {
    key: "starter",
    name: null,
    price: 9,
    images: 30,
    features: ["feature1", "feature2", "feature3", "feature4"],
    popular: false,
    subtitle: "Per month",
  },
  {
    key: "pro",
    name: null,
    price: 29,
    images: -1,
    features: ["feature1", "feature2", "feature3", "feature4", "feature5"],
    popular: true,
    subtitle: "Per month",
  },
];

const PricingSection = () => {
  const { t } = useLanguage();

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
        <p className="text-center text-muted-foreground mb-16 text-lg">
          {t("hero.subtitle").slice(0, 60)}...
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
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
                <span className="font-display text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.subtitle}</span>
              </div>

              <p className="text-muted-foreground text-sm mb-6">
                {plan.images === -1 ? t("pricing.unlimited") : `${plan.images} ${t("pricing.images")}`}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {t(`pricing.${f}`)}
                  </li>
                ))}
              </ul>

              <Link to="/auth?mode=signup">
                <Button className={`w-full ${plan.popular ? "btn-gradient" : ""}`} variant={plan.popular ? "default" : "outline"}>
                  {t("pricing.cta")}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
