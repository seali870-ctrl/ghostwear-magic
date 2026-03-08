import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground/90 text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Fashion Photography
          </motion.div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            {t("hero.tagline")}
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="btn-gradient text-base px-8 py-6 rounded-xl gap-2">
                {t("hero.cta")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                {t("hero.cta2")}
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
