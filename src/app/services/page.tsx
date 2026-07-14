"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { services } from "@/data/services";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Pricing State
  const [currency, setCurrency] = useState("₹");
  const [exchangeRate, setExchangeRate] = useState(1); // Default to INR multiplier (1)
  const [isForeign, setIsForeign] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [popularPlan, setPopularPlan] = useState<string>("professional");

  // Base Prices in INR
  const basePrices = {
    essential: 1999,
    professional: 4999,
    enterprise: 9999,
  };

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        
        if (data.country_code !== "IN" && data.currency) {
          setIsForeign(true);
          
          // Get correct currency symbol for the country
          let symbol = "$";
          try {
            const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: data.currency });
            const parts = formatter.formatToParts(0);
            const currencyPart = parts.find(p => p.type === 'currency');
            if (currencyPart) symbol = currencyPart.value;
          } catch (e) {
            symbol = data.currency + " ";
          }
          setCurrency(symbol);
          
          // Fetch live exchange rate for specific currency
          const rateRes = await fetch("https://open.er-api.com/v6/latest/INR");
          const rateData = await rateRes.json();
          if (rateData && rateData.rates && rateData.rates[data.currency]) {
            setExchangeRate(rateData.rates[data.currency]);
          } else if (rateData && rateData.rates && rateData.rates.USD) {
            // Fallback to USD if specific currency fails
            setCurrency("$");
            setExchangeRate(rateData.rates.USD);
          } else {
            setCurrency("$");
            setExchangeRate(0.012); 
          }
        }
      } catch (err) {
        console.error("Location detection failed, defaulting to INR.", err);
      }
    };

    const fetchPopularPlan = async () => {
      try {
        const snap = await getDocs(collection(db, "orders"));
        const counts: Record<string, number> = { essential: 0, professional: 0, enterprise: 0 };
        snap.forEach(doc => {
          const p = doc.data().planId;
          if (counts[p] !== undefined) counts[p]++;
        });
        const mostPopular = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        if (counts[mostPopular] > 0) {
          setPopularPlan(mostPopular);
        }
      } catch (e) {
        console.log("Could not fetch orders for stats", e);
      }
    };

    detectLocation();
    fetchPopularPlan();
  }, []);

  const getConvertedPrice = (basePrice: number) => {
    if (isForeign) {
      return Math.round(basePrice * exchangeRate);
    }
    return basePrice;
  };

  const handlePurchase = (planId: string, planName: string, basePrice: number) => {
    const finalPrice = getConvertedPrice(basePrice);
    
    // Save to "Cart"
    localStorage.setItem("pending_cart", JSON.stringify({
      id: planId,
      name: planName,
      price: finalPrice,
      currency: currency
    }));

    // Redirect based on auth state
    if (user) {
      router.push("/dashboard?checkout=true");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />

      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-32 pb-16 px-4 z-10 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">Capabilities</span>
          </div>
          
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            What We <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Do</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
            Focused web development services for brands that demand a premium online presence.
          </p>
        </motion.div>
      </section>

      {/* Services List */}
      <section className="py-32 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col gap-16 md:gap-32">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start"
            >
              <div className="lg:col-span-5 sticky top-32">
                <span className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Service 0{index + 1}
                </span>
                <h2 className="font-jakarta text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                  {service.title}
                </h2>
                <p className="text-xl text-zinc-400 leading-relaxed font-medium">
                  {service.summary}
                </p>
              </div>
              
              <div className="lg:col-span-7 premium-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden bg-zinc-900/50 backdrop-blur-xl border border-white/10 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 mb-12">
                  <h3 className="font-bold text-xs tracking-widest text-zinc-500 uppercase mb-8 pb-4 border-b border-white/10">
                    Ideal For
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {service.idealFor.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-zinc-300">
                        <CheckCircle2 className="w-6 h-6 text-indigo-400 shrink-0" />
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative z-10 mb-12">
                  <h3 className="font-bold text-xs tracking-widest text-zinc-500 uppercase mb-8 pb-4 border-b border-white/10">
                    What's Included
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {service.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-zinc-300">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 shrink-0 mt-2" />
                        <span className="text-base font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section - Overlapping Stacked Layout */}
      <section id="pricing" className="py-40 w-full px-4 sm:px-6 lg:px-8 relative z-10 bg-[#020202] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-24 max-w-3xl"
          >
            <h2 className="font-jakarta text-5xl md:text-7xl font-extrabold text-white tracking-tighter mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-zinc-400">
              Premium development requires serious investment. We offer clear tiers based on the scope and complexity of your digital needs.
            </p>
          </motion.div>

          <div className="relative w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-0">
            
            {/* Essential Tier (Left - Recessed) */}
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0 }}
              animate={{ 
                scale: hoveredPlan === "essential" ? 1.05 : hoveredPlan ? 0.9 : 0.95,
                zIndex: hoveredPlan === "essential" ? 50 : 10,
                opacity: hoveredPlan === "essential" ? 1 : hoveredPlan ? 0.6 : 0.9
              }}
              onHoverStart={() => setHoveredPlan("essential")}
              onHoverEnd={() => setHoveredPlan(null)}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-[350px] premium-card rounded-[2rem] p-10 bg-zinc-900 border border-white/10 flex flex-col md:translate-x-12 relative shadow-2xl backdrop-blur-md cursor-pointer"
            >
              {popularPlan === "essential" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  Users' Choice
                </div>
              )}
              <h3 className="text-2xl font-jakarta font-bold text-white mb-2">Essential</h3>
              <p className="text-zinc-500 mb-8 text-sm h-10">Perfect for startups needing a high-end landing page.</p>
              <div className="mb-8 border-b border-white/10 pb-8">
                <span className="text-4xl font-black text-white">{currency}{getConvertedPrice(basePrices.essential).toLocaleString()}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-zinc-400 text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> 1-3 Page Website</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> Premium Design System</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> Basic SEO</li>
              </ul>
              <Button onClick={() => handlePurchase("essential", "Essential", basePrices.essential)} variant="outline" className="w-full h-14 rounded-full border-white/20">
                Choose Essential
              </Button>
            </motion.div>

            {/* Professional Tier (Center - Elevated & Glowing) */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0 }}
              animate={{ 
                scale: hoveredPlan === "professional" ? 1.1 : hoveredPlan ? 0.95 : 1.05,
                zIndex: hoveredPlan === "professional" ? 50 : 30,
                opacity: hoveredPlan === "professional" ? 1 : hoveredPlan ? 0.6 : 1
              }}
              onHoverStart={() => setHoveredPlan("professional")}
              onHoverEnd={() => setHoveredPlan(null)}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-[400px] premium-card rounded-[2rem] p-12 bg-gradient-to-b from-indigo-900/40 to-zinc-900 border border-indigo-500/50 flex flex-col relative shadow-[0_30px_60px_-15px_rgba(99,102,241,0.3)] md:-mt-8 cursor-pointer"
            >
              {popularPlan === "professional" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  Most Popular
                </div>
              )}
              <h3 className="text-3xl font-jakarta font-black text-white mb-2">Professional</h3>
              <p className="text-indigo-200/60 mb-8 text-sm h-10">For growing businesses needing a full digital platform.</p>
              <div className="mb-8 border-b border-white/10 pb-8">
                <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{currency}{getConvertedPrice(basePrices.professional).toLocaleString()}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-zinc-200">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Multi-page Platform</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Advanced Animations (WebGL)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> CMS Integration</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Advanced SEO & Analytics</li>
              </ul>
              <Button onClick={() => handlePurchase("professional", "Professional", basePrices.professional)} variant="accent" className="w-full h-16 text-lg rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-105 transition-all">
                Choose Professional
              </Button>
            </motion.div>

            {/* Enterprise Tier (Right - Recessed) */}
            <motion.div 
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0 }}
              animate={{ 
                scale: hoveredPlan === "enterprise" ? 1.05 : hoveredPlan ? 0.9 : 0.95,
                zIndex: hoveredPlan === "enterprise" ? 50 : 10,
                opacity: hoveredPlan === "enterprise" ? 1 : hoveredPlan ? 0.6 : 0.9
              }}
              onHoverStart={() => setHoveredPlan("enterprise")}
              onHoverEnd={() => setHoveredPlan(null)}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-[350px] premium-card rounded-[2rem] p-10 bg-zinc-900 border border-white/10 flex flex-col md:-translate-x-12 relative shadow-2xl backdrop-blur-md cursor-pointer"
            >
              {popularPlan === "enterprise" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  Users' Choice
                </div>
              )}
              <h3 className="text-2xl font-jakarta font-bold text-white mb-2">Enterprise</h3>
              <p className="text-zinc-500 mb-8 text-sm h-10">Bespoke web applications and complex SaaS platforms.</p>
              <div className="mb-8 border-b border-white/10 pb-8">
                <span className="text-4xl font-black text-white">{currency}{getConvertedPrice(basePrices.enterprise).toLocaleString()}</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow text-zinc-400 text-sm">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> Full-Stack Application</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> Complex Database/Auth</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-zinc-500" /> Custom Integrations</li>
              </ul>
              <Button onClick={() => handlePurchase("enterprise", "Enterprise", basePrices.enterprise)} variant="outline" className="w-full h-14 rounded-full border-white/20">
                Choose Enterprise
              </Button>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
