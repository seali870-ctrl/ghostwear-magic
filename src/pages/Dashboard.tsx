import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  Loader2,
  Image as ImageIcon,
  LogOut,
  Globe,
  Sparkles,
  AlertCircle,
  Crown,
  Shield,
  RotateCw,
  Video,
  Play,
} from "lucide-react";

const ADMIN_EMAIL = "seali870@gmail.com";

type Style = "ghost" | "floating" | "flatlay" | "female" | "male" | "child_boy" | "child_girl";

type BgStyle =
  | "white-studio" | "grey-studio" | "transparent"
  | "sunset-golden" | "city-skyline" | "marble-studio"
  | "outdoor-garden" | "desert-dunes" | "rainy-window" | "neon-city";

const STYLE_OPTIONS: { key: Style; icon: string; label: string; labelAr: string }[] = [
  { key: "ghost", icon: "👻", label: "Ghost Mannequin", labelAr: "مانيكان شبحي" },
  { key: "floating", icon: "🪂", label: "Floating", labelAr: "عائم" },
  { key: "flatlay", icon: "📐", label: "Flat Lay", labelAr: "مسطح" },
  { key: "female", icon: "👩", label: "Female Model", labelAr: "موديل أنثى" },
  { key: "male", icon: "👨", label: "Male Model", labelAr: "موديل ذكر" },
  { key: "child_boy", icon: "👦", label: "Child Boy", labelAr: "طفل ولد" },
  { key: "child_girl", icon: "👧", label: "Child Girl", labelAr: "طفلة بنت" },
];

const BG_OPTIONS: { key: BgStyle; label: string; preview: string; description: string; premium: boolean }[] = [
  {
    key: "white-studio",
    label: "White Studio",
    preview: "bg-background border border-border",
    description: "Pure white studio background with clean professional lighting.",
    premium: false,
  },
  {
    key: "grey-studio",
    label: "Grey Studio",
    preview: "bg-muted",
    description: "Neutral grey studio background with soft even lighting.",
    premium: false,
  },
  {
    key: "transparent",
    label: "Transparent",
    preview: "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlNWU1Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4=')]",
    description: "Transparent background with no backdrop, just the clothing on empty space.",
    premium: true,
  },
  {
    key: "sunset-golden",
    label: "Sunset Golden",
    preview: "bg-gradient-to-br from-[hsl(35,90%,60%)] to-[hsl(15,80%,50%)]",
    description: "Beautiful golden hour sunset with warm amber and orange tones, dramatic sky lighting.",
    premium: true,
  },
  {
    key: "city-skyline",
    label: "City Skyline",
    preview: "bg-gradient-to-b from-[hsl(220,30%,30%)] to-[hsl(210,20%,50%)]",
    description: "Modern city skyline backdrop with tall buildings and urban atmosphere, slightly blurred bokeh.",
    premium: true,
  },
  {
    key: "marble-studio",
    label: "Marble Studio",
    preview: "bg-gradient-to-br from-[hsl(0,0%,95%)] to-[hsl(0,0%,80%)]",
    description: "Luxury marble studio with elegant white and grey marble textures, high-end fashion editorial feel.",
    premium: true,
  },
  {
    key: "outdoor-garden",
    label: "Garden",
    preview: "bg-gradient-to-b from-[hsl(120,40%,50%)] to-[hsl(90,35%,65%)]",
    description: "Beautiful outdoor garden with green plants, flowers, and natural sunlight filtering through.",
    premium: true,
  },
  {
    key: "desert-dunes",
    label: "Desert Dunes",
    preview: "bg-gradient-to-br from-[hsl(35,60%,70%)] to-[hsl(30,50%,55%)]",
    description: "Stunning desert sand dunes with golden sand and dramatic shadows, warm natural lighting.",
    premium: true,
  },
  {
    key: "rainy-window",
    label: "Rainy Window",
    preview: "bg-gradient-to-b from-[hsl(210,15%,55%)] to-[hsl(200,20%,40%)]",
    description: "Moody rainy window scene with water droplets on glass, soft blurred city lights behind, cozy atmosphere.",
    premium: true,
  },
  {
    key: "neon-city",
    label: "Neon City",
    preview: "bg-gradient-to-br from-[hsl(280,70%,30%)] to-[hsl(320,60%,40%)]",
    description: "Vibrant neon city night scene with colorful neon lights, purple and pink tones, cyberpunk urban atmosphere.",
    premium: true,
  },
];

const FREE_TRIAL_LIMIT = 5;

const Dashboard = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("ghost");
  const [bgStyle, setBgStyle] = useState<BgStyle>("white-studio");
  const [processing, setProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [showCompare, setShowCompare] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      if (user.email === ADMIN_EMAIL) {
        setUserProfile({ plan_type: 'business', images_used: 0, images_limit: -1 });
        return;
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) { console.error('Error fetching user profile:', error); return; }
      setUserProfile(data);
      if (data.plan_type === 'free_trial' && data.images_used >= data.images_limit) {
        setShowUpgradePrompt(true);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setProcessedImage(null);
      setShowCompare(false);
    };
    reader.readAsDataURL(file);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;
  const canProcess = isAdmin || (userProfile && !(
    userProfile.plan_type === 'free_trial' && userProfile.images_used >= FREE_TRIAL_LIMIT
  ) && !(
    userProfile.images_limit !== -1 && userProfile.images_used >= userProfile.images_limit
  ));

  const handleProcess = async () => {
    if (!uploadedImage) { toast.error("Please upload an image first"); return; }
    if (!canProcess) { setShowUpgradePrompt(true); return; }
    setProcessing(true);
    setProcessedImage(null);
    setShowCompare(false);
    setRotationDeg(0);
    try {
      const selectedBg = BG_OPTIONS.find((b) => b.key === bgStyle);
      const bgDesc = bgStyle === 'white-studio' ? '' : selectedBg?.description || '';
      const { data, error } = await supabase.functions.invoke('process-image', {
        body: { image_base64: uploadedImage, background: bgDesc, mode: style },
      });

      if (data?.code === 'FREE_TRIAL_EXHAUSTED' || data?.code === 'PLAN_LIMIT_REACHED') {
        if (data.images_used !== undefined && userProfile) {
          setUserProfile({ ...userProfile, images_used: data.images_used });
        }
        setShowUpgradePrompt(true);
        return;
      }

      if (error) {
        const errorMsg = data?.error || error.message || 'Processing failed';
        throw new Error(errorMsg);
      }
      if (!data?.success) throw new Error(data?.error || 'Processing failed');

      setProcessedImage(data.output_url);
      setShowCompare(true);

      if (userProfile && data.images_used !== undefined) {
        const updated = { ...userProfile, images_used: data.images_used };
        setUserProfile(updated);
        if (updated.plan_type === 'free_trial' && updated.images_used >= FREE_TRIAL_LIMIT) {
          setShowUpgradePrompt(true);
        }
      }
      toast.success("Image processed successfully!");
    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error(err.message || "Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = `ghostwear-${style}-${Date.now()}.png`;
    link.click();
  };

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    setRotationDeg(prev => prev + 360);
    setTimeout(() => setIsSpinning(false), 1000);
  }, [isSpinning]);

  const resultBgClass = (() => {
    switch (bgStyle) {
      case "white-studio": return "bg-background border border-border";
      case "grey-studio": return "bg-muted";
      case "transparent": return "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlNWU1Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4=')]";
      default: return "bg-muted";
    }
  })();

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
            {user?.email === ADMIN_EMAIL && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            )}
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
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-2xl font-bold text-foreground">{t("dashboard.title")}</h2>
            {userProfile?.plan_type === 'free_trial' && <Badge variant="secondary" className="text-xs">Free Trial</Badge>}
            {userProfile?.plan_type === 'starter' && <Badge variant="default" className="text-xs">Starter Plan</Badge>}
            {userProfile?.plan_type === 'pro' && <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-primary/80">Pro Plan</Badge>}
            {userProfile?.plan_type === 'business' && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-primary/80">
                <Crown className="w-3 h-3 mr-1" />
                Business Plan
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>

        {/* Usage */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">{t("dashboard.usage")}</span>
            <span className="text-sm text-muted-foreground">
              {userProfile?.images_used || 0} {t("dashboard.of")} {userProfile?.images_limit === -1 ? "∞" : userProfile?.images_limit || 5} {t("dashboard.images_used")}
            </span>
          </div>
          {userProfile?.images_limit === -1 ? (
            <div className="text-sm text-primary font-medium">Unlimited usage</div>
          ) : (
            <Progress value={((userProfile?.images_used || 0) / (userProfile?.images_limit || 5)) * 100} className="h-2" />
          )}
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="card-elevated p-6 mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Free trial complete!</h3>
                <p className="text-sm text-muted-foreground mb-3">You've used all 5 free images. Upgrade to continue.</p>
                <div className="flex gap-2">
                  <a href="https://api.whatsapp.com/send?phone=201040535481&text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%A8%D8%A7%D9%82%D8%A9%20Starter%20%249" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="btn-gradient">Upgrade to Starter ($9/month)</Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={() => setShowUpgradePrompt(false)}>Maybe later</Button>
                </div>
              </div>
            </div>
          </div>
        )}

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

            {/* Style - Mode Selection Cards */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">{t("dashboard.style")}</h3>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <motion.button
                    key={s.key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStyle(s.key)}
                    className={`p-3 rounded-lg text-center transition-all border ${
                      style === s.key
                        ? "border-primary bg-accent text-accent-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{s.icon}</span>
                    <p className="text-xs font-medium leading-tight">{language === "ar" ? s.labelAr : s.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">{t("dashboard.background")}</h3>
              <div className="grid grid-cols-5 gap-2">
                {BG_OPTIONS.map((bg) => {
                  const isFreeTrial = userProfile?.plan_type === 'free_trial';
                  const isLocked = isFreeTrial && bg.premium;
                  return (
                    <button
                      key={bg.key}
                      onClick={() => {
                        if (isLocked) { setShowUpgradePrompt(true); } else { setBgStyle(bg.key); }
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all border relative ${
                        bgStyle === bg.key && !isLocked
                          ? "border-primary ring-2 ring-primary/20"
                          : isLocked
                          ? "border-border opacity-60 cursor-not-allowed"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-md ${bg.preview}`} />
                      <span className="text-[10px] font-medium leading-tight text-center flex items-center gap-0.5">
                        {isLocked && <span className="text-[8px]">🔒</span>}
                        {bg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Process Button */}
            <Button
              className="w-full btn-gradient py-6 text-base gap-2"
              onClick={!canProcess ? () => setShowUpgradePrompt(true) : handleProcess}
              disabled={processing || !uploadedImage}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {!canProcess ? "Upgrade to Process" : t("dashboard.process")}
            </Button>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Before/After Comparison Slider */}
            {showCompare && uploadedImage && processedImage && (
              <div className="card-elevated p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {language === "ar" ? "قبل / بعد" : "Before / After Comparison"}
                </p>
                <div className="relative aspect-[3/4] max-h-[400px] rounded-lg overflow-hidden select-none">
                  {/* After (full) */}
                  <img src={processedImage} alt="After" className="absolute inset-0 w-full h-full object-contain" />
                  {/* Before (clipped) */}
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${comparePosition}%` }}>
                    <img src={uploadedImage} alt="Before" className="w-full h-full object-contain" style={{ minWidth: `${10000 / comparePosition}%`, maxWidth: `${10000 / comparePosition}%` }} />
                  </div>
                  {/* Slider line */}
                  <div className="absolute top-0 bottom-0" style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0.5 h-full bg-primary/80" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg">
                      ⇔
                    </div>
                  </div>
                  {/* Labels */}
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-foreground/70 text-background text-xs font-medium">
                    {t("beforeafter.before")}
                  </span>
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-medium">
                    {t("beforeafter.after")}
                  </span>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[comparePosition]}
                    onValueChange={(v) => setComparePosition(v[0])}
                    min={5}
                    max={95}
                    step={1}
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
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
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={handleSpin} className="gap-1 text-xs px-2" disabled={isSpinning}>
                        <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                        360°
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        {t("dashboard.download")}
                      </Button>
                    </div>
                  )}
                </div>
                <div className={`aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden relative ${resultBgClass}`}>
                  {processing ? (
                    <div className="flex flex-col items-center gap-4 text-primary">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <Sparkles className="w-5 h-5 absolute -top-1 -right-1 animate-pulse text-primary" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium block">Processing...</span>
                        <span className="text-xs text-muted-foreground mt-1 block">AI is working on your image</span>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : processedImage ? (
                    <motion.div
                      className="w-full h-full relative result-shine"
                      animate={{
                        y: [0, -6, 0],
                        rotateY: rotationDeg,
                      }}
                      transition={{
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 1, ease: "easeInOut" },
                      }}
                      style={{ perspective: 800 }}
                    >
                      <img src={processedImage} alt="Processed" className="w-full h-full object-contain" />
                    </motion.div>
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
    </div>
  );
};

export default Dashboard;
