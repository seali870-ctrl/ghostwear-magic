import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Loader2,
  Image as ImageIcon,
  LogOut,
  Globe,
  Sparkles,
} from "lucide-react";

type Style = "ghost" | "floating" | "flatlay";
type BgColor = "white" | "grey" | "transparent";

const Dashboard = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("ghost");
  const [bgColor, setBgColor] = useState<BgColor>("white");
  const [processing, setProcessing] = useState(false);
  const [usedImages, setUsedImages] = useState(7);
  const totalImages = 20;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setProcessedImage(uploadedImage);
      setUsedImages((prev) => prev + 1);
      setProcessing(false);
      toast.success("Image processed successfully!");
    }, 2500);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `ghostwear-${style}-${Date.now()}.png`;
    link.click();
  };

  const styles: { key: Style; icon: string }[] = [
    { key: "ghost", icon: "👻" },
    { key: "floating", icon: "🪂" },
    { key: "flatlay", icon: "📐" },
  ];

  const bgColors: { key: BgColor; color: string; border?: boolean }[] = [
    { key: "white", color: "bg-background border border-border" },
    { key: "grey", color: "bg-muted" },
    { key: "transparent", color: "bg-background border border-dashed border-border" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="font-display text-xl font-bold text-foreground">
            Ghost<span className="text-gradient">Wear</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language === "en" ? "العربية" : "English"}
            </button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">{t("dashboard.title")}</h2>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        {/* Usage */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">{t("dashboard.usage")}</span>
            <span className="text-sm text-muted-foreground">
              {usedImages} {t("dashboard.of")} {totalImages} {t("dashboard.images_used")}
            </span>
          </div>
          <Progress value={(usedImages / totalImages) * 100} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            {/* Upload */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">{t("dashboard.upload")}</h3>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-accent/50 transition-all"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("upload.title")}</span>
              </button>
            </div>

            {/* Style */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">{t("dashboard.style")}</h3>
              <div className="grid grid-cols-3 gap-2">
                {styles.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={`p-3 rounded-lg text-center transition-all border ${
                      style === s.key
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-xs mt-1 font-medium">{t(`dashboard.${s.key === "flatlay" ? "flatlay" : s.key}`)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">{t("dashboard.background")}</h3>
              <div className="flex gap-3">
                {bgColors.map((bg) => (
                  <button
                    key={bg.key}
                    onClick={() => setBgColor(bg.key)}
                    className={`flex flex-col items-center gap-2 flex-1 p-3 rounded-lg transition-all border ${
                      bgColor === bg.key ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${bg.color}`} />
                    <span className="text-xs font-medium">{t(`dashboard.${bg.key}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <Button
              className="w-full btn-gradient py-6 text-base gap-2"
              onClick={handleProcess}
              disabled={processing || !uploadedImage}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {t("dashboard.process")}
            </Button>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="card-elevated p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Original</p>
              <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-sm">No image uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Result */}
            <div className="card-elevated p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Result</p>
                {processedImage && (
                  <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {t("dashboard.download")}
                  </Button>
                )}
              </div>
              <div
                className={`aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden ${
                  bgColor === "white" ? "bg-background border border-border" : bgColor === "grey" ? "bg-muted" : "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlNWU1Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4=')]"
                }`}
              >
                {processing ? (
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                ) : processedImage ? (
                  <img src={processedImage} alt="Processed" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-12 h-12" />
                    <span className="text-sm">Result will appear here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
