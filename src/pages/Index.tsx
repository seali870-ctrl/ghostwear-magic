import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BeforeAfterSection from "@/components/landing/BeforeAfterSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <BeforeAfterSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
