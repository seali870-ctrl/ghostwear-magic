import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4 text-center">
        <p className="font-display text-lg font-bold text-foreground mb-2">
          Ghost<span className="text-gradient">Wear</span>
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} GhostWear. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
