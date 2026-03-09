import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

// ========================================
// 📷 BEFORE/AFTER EXAMPLE IMAGES
// ========================================
import before1 from "@/assets/before-1.png";
import after1 from "@/assets/after-1.png";
import before2 from "@/assets/before-2.png";
import after2 from "@/assets/after-2.png";

const examples = [
  { before: before1, after: after1 },
  { before: before2, after: after2 },
];
// ========================================

const BeforeAfterSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl font-bold text-center text-foreground mb-16"
        >
          {t("beforeafter.title")}
        </motion.h2>

        <div className="space-y-16">
          {examples.map((example, idx) => (
            <div key={idx} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="card-elevated overflow-hidden"
              >
                <div className="relative">
                  <img 
                    src={example.before} 
                    alt={`Before ghost mannequin processing - example ${idx + 1}`} 
                    className="w-full aspect-[4/5] object-cover" 
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-foreground/80 text-background text-sm font-medium">
                    {t("beforeafter.before")}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="card-elevated overflow-hidden"
              >
                <div className="relative">
                  <img 
                    src={example.after} 
                    alt={`After ghost mannequin processing - example ${idx + 1}`} 
                    className="w-full aspect-[4/5] object-cover" 
                  />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {t("beforeafter.after")}
                  </span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
