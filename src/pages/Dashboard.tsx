import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
} from "lucide-react";

type Style = "ghost" | "floating" | "flatlay";

type BgStyle = "white-studio" | "grey-studio" | "transparent" | "sunny-studio" | "cool-studio" | "beach" | "forest" | "autumn";

const BG_OPTIONS: { key: BgStyle; label: string; preview: string; description: string; premium: boolean }[] = [
  {
    key: "white-studio",
    label: "White Studio",
    preview: "bg-white border border-border",
    description: "Pure white studio background with clean professional lighting.",
    premium: false,
  },
  {
    key: "grey-studio",
    label: "Grey Studio",
    preview: "bg-[hsl(0,0%,75%)]",
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
    key: "sunny-studio",
    label: "Sunny Studio",
    preview: "bg-gradient-to-br from-[hsl(40,90%,70%)] to-[hsl(25,85%,60%)]",
    description: "Warm golden hour studio setting with soft orange and yellow gradient lighting, giving a luxurious warm glow.",
    premium: true,
  },
  {
    key: "cool-studio",
    label: "Cool Studio",
    preview: "bg-gradient-to-br from-[hsl(210,60%,85%)] to-[hsl(220,50%,75%)]",
    description: "Cool blue-white professional studio with crisp cold lighting, modern and sleek feel.",
    premium: true,
  },
  {
    key: "beach",
    label: "Beach",
    preview: "bg-gradient-to-b from-[hsl(185,70%,60%)] to-[hsl(45,80%,85%)]",
    description: "Tropical beach scene with turquoise water and white sand in the background, bright sunny day.",
    premium: true,
  },
  {
    key: "forest",
    label: "Forest",
    preview: "bg-gradient-to-b from-[hsl(120,40%,35%)] to-[hsl(100,35%,55%)]",
    description: "Lush green forest with soft bokeh trees and dappled sunlight filtering through leaves.",
    premium: true,
  },
  {
    key: "autumn",
    label: "Autumn",
    preview: "bg-gradient-to-br from-[hsl(25,80%,55%)] to-[hsl(45,70%,50%)]",
    description: "Autumn park with orange and red falling leaves, warm golden light, cozy seasonal atmosphere.",
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

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setUserProfile(data);
      
      // Show upgrade prompt if free trial is used up
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
    };
    reader.readAsDataURL(file);
  };

  const canProcess = userProfile && !(
    userProfile.plan_type === 'free_trial' && userProfile.images_used >= FREE_TRIAL_LIMIT
  ) && !(
    userProfile.images_limit !== -1 && userProfile.images_used >= userProfile.images_limit
  );

  const handleProcess = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }
    if (!canProcess) {
      setShowUpgradePrompt(true);
      return;
    }
    setProcessing(true);
    try {
      const selectedBg = BG_OPTIONS.find((b) => b.key === bgStyle);
      const { data, error } = await supabase.functions.invoke('process-image', {
        body: { image_base64: uploadedImage, background: selectedBg?.description || "" },
      });

      // Handle 403 from server-side limit enforcement
      if (data?.code === 'FREE_TRIAL_EXHAUSTED' || data?.code === 'PLAN_LIMIT_REACHED') {
        if (data.images_used !== undefined && userProfile) {
          setUserProfile({ ...userProfile, images_used: data.images_used });
        }
        setShowUpgradePrompt(true);
        return;
      }

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Processing failed');

      setProcessedImage(data.output_url);
      
      // Sync usage from server response
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

  const styles: { key: Style; icon: string }[] = [
    { key: "ghost", icon: "👻" },
    { key: "floating", icon: "🪂" },
    { key: "flatlay", icon: "📐" },
  ];

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
            {userProfile?.plan_type === 'free_trial' && (
              <Badge variant="secondary" className="text-xs">
                Free Trial
              </Badge>
            )}
            {userProfile?.plan_type === 'starter' && (
              <Badge variant="default" className="text-xs">
                Starter Plan
              </Badge>
            )}
            {userProfile?.plan_type === 'pro' && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-primary/80">
                Pro Plan
              </Badge>
            )}
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
                <p className="text-sm text-muted-foreground mb-3">
                  You've used all 5 free images. Upgrade to continue.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="btn-gradient">
                    Upgrade to Starter ($9/month)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowUpgradePrompt(false)}>
                    Maybe later
                  </Button>
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
              <div className="grid grid-cols-4 gap-2">
                {BG_OPTIONS.map((bg) => {
                  const isFreeTrial = userProfile?.plan_type === 'free_trial';
                  const isLocked = isFreeTrial && bg.premium;
                  
                  return (
                    <button
                      key={bg.key}
                      onClick={() => {
                        if (isLocked) {
                          setShowUpgradePrompt(true);
                        } else {
                          setBgStyle(bg.key);
                        }
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
                className={`aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden ${resultBgClass}`}
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
