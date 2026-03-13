import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

const WHATSAPP_LINK = "https://api.whatsapp.com/send?phone=201040535481";
const TELEGRAM_LINK = "https://t.me/TTRQ33";

const plans = [
  { name: "Starter", price: "$5", period: "/mo", images: "30 images/month", whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Starter%20%245" },
  { name: "Pro", price: "$15", period: "/mo", images: "100 images/month", popular: true, whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Pro%20%2415" },
  { name: "Business", price: "$49", period: "/mo", images: "Unlimited images", whatsapp: "https://api.whatsapp.com/send?phone=201040535481&text=أريد%20الاشتراك%20في%20باقة%20Business%20%2449" },
];

const paymentMethods = [
  {
    id: "instapay",
    name: "InstaPay",
    icon: Zap,
    primary: true,
    color: "hsl(var(--primary))",
    steps: [
      "Open your banking app (CIB, NBE, QNB, etc.)",
      "Go to InstaPay / Transfers",
      'Send to IPA: ghostwear@instapay',
      "Enter the plan amount",
      "Take a screenshot of the confirmation",
      "Send the screenshot via WhatsApp below",
    ],
  },
  {
    id: "vodafone",
    name: "Vodafone Cash",
    icon: Smartphone,
    primary: false,
    color: "hsl(0, 84%, 45%)",
    steps: [
      "Dial *9*7# from your Vodafone line",
      "Choose 'Send Money'",
      "Enter number: 01040535481",
      "Enter the plan amount",
      "Confirm with your PIN",
      "Send the confirmation SMS via WhatsApp",
    ],
  },
  {
    id: "etisalat",
    name: "Etisalat Cash",
    icon: CreditCard,
    primary: false,
    color: "hsl(145, 60%, 40%)",
    steps: [
      "Dial *777# from your Etisalat line",
      "Choose 'Send Money'",
      "Enter number: 01040535481",
      "Enter the plan amount",
      "Confirm with your PIN",
      "Send the confirmation SMS via WhatsApp",
    ],
  },
];

const Payment = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto flex items-center h-16 px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl font-bold text-foreground">
            Ghost<span className="text-gradient">Wear</span>
            <span className="text-muted-foreground font-normal text-base ml-2">— Payment</span>
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Plans Summary */}
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Choose Your Plan & Pay
          </h2>
          <p className="text-muted-foreground">
            Select a plan, pay using any method below, and your account will be activated.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {plans.map((plan) => (
            <a
              key={plan.name}
              href={plan.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={`card-elevated p-5 text-center relative block hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              {"badge" in plan && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
              <div className="mt-2">
                {"originalPrice" in plan && plan.originalPrice && (
                  <span className="text-muted-foreground text-sm line-through mr-1">{plan.originalPrice}</span>
                )}
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.images}</p>
              {"note" in plan && plan.note && (
                <p className="text-xs text-orange-500 font-medium mt-1">{plan.note}</p>
              )}
            </a>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="space-y-8">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`card-elevated overflow-hidden ${
                method.primary ? "ring-2 ring-primary" : ""
              }`}
            >
              {/* Method Header */}
              <div
                className={`px-6 py-4 flex items-center gap-3 ${
                  method.primary
                    ? "bg-gradient-to-r from-primary/10 to-primary/5"
                    : "bg-muted/50"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: method.color + "20" }}
                >
                  <method.icon className="w-5 h-5" style={{ color: method.color }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    {method.name}
                    {method.primary && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              {/* Steps */}
              <div className="p-6">
                <ol className="space-y-3">
                  {method.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>

        {/* Activation Notice */}
        <div className="mt-10 card-elevated p-6 bg-gradient-to-r from-primary/5 to-accent/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-lg mb-1">
                ⚡ Your account will be activated within minutes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                After sending your payment confirmation via WhatsApp, our team will activate your
                plan almost instantly. Most activations happen within 5 minutes during business
                hours.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Instant activation
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  Secure payment
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  24/7 WhatsApp support
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-8 text-center space-y-3">
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="btn-gradient px-8 py-6 text-base gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send Payment Confirmation via WhatsApp
            </Button>
          </a>
          <div>
            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="px-8 py-5 text-base gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Or contact us on Telegram
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Need help? Contact us anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
