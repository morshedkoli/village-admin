"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, LayoutDashboard, ShieldCheck, HeartPulse, Building2, Users } from "lucide-react";

const SCREENS = [
  "/images/screens (1).jpeg",
  "/images/screens (2).jpeg",
  "/images/screens (3).jpeg",
  "/images/screens (4).jpeg"
];

export default function LandingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % SCREENS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-text-primary overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-full border border-border shadow-sm">
              <img src="/images/logo.png" alt="AL ISLAH Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/favicon.svg"; }} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#13553a] to-primary">
              আল-ইসলাহ 
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-primary hover:text-white bg-surface-hover hover:bg-primary rounded-xl transition-all duration-300 shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:block">অ্যাডমিন লগইন</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-[#ce9f4d]/10 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light/50 border border-primary/20 text-primary-dark text-sm font-semibold mb-8 animate-fade-in fade-in-0 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                গ্রাম কমিউনিটি ড্যাশবোর্ড
              </div>
              
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in stagger-1 leading-[1.1]">
                একসাথে গড়ি <br className="hidden lg:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#13553a]">
                  আমাদের গ্রাম
                </span>
              </h1>
              
              <p className="max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-text-secondary leading-relaxed mb-10 animate-fade-in stagger-2">
                আল-ইসলাহ যুব ফোরাম আমাদের সমাজকে একত্রিত করে। গ্রামের উন্নয়ন প্রকল্প, তহবিল ব্যবস্থাপনা, এবং যেকোনো সমস্যায় একে অপরের পাশে দাঁড়ানোর অন্যতম প্ল্যাটফর্ম।
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in stagger-3">
                <a
                  href="/apps/al_islah.apk"
                  download
                  className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-[#13553a] to-primary text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  <Download className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">অ্যাপ ডাউনলোড করুন (APK)</span>
                </a>
              </div>
            </div>

            {/* Right Mockup Column */}
            <div className="relative mx-auto lg:mr-0 lg:ml-auto w-full max-w-[320px] xl:max-w-[380px] perspective-1000 animate-fade-in stagger-4">
              
              {/* Premium Phone Frame */}
              <div className="relative z-10 rounded-[3rem] border-[10px] border-[#111827] bg-[#111827] shadow-2xl shadow-primary/20 animate-float transform-gpu overflow-hidden">
                {/* iPhone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#111827] rounded-b-2xl z-20 flex justify-center items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full bg-[#1f2937]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#1f2937]"></div>
                </div>

                {/* Inner Mockup Container with Carousel */}
                <div className="relative bg-white rounded-[2.2rem] overflow-hidden w-full aspect-[9/19.5]">
                  {SCREENS.map((src, idx) => (
                    <img
                      key={src}
                      src={src}
                      alt={`App Screen ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        idx === currentScreen ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                      onError={(e) => { 
                         e.currentTarget.style.display = 'none'; 
                      }}
                    />
                  ))}
                  
                  {/* Subtle glare effect inside screen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none z-20"></div>
                </div>
              </div>

              {/* Behind Phone Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/30 to-[#ce9f4d]/20 blur-[80px] -z-10 rounded-full animate-pulse"></div>

              {/* Floating notification badge decoration */}
              <div className="absolute -left-12 top-24 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 animate-float slide-in-from-left z-20" style={{animationDelay: '1s'}}>
                <div className="w-8 h-8 rounded-full bg-success-light text-success flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">নতুন সাহায্য আবেদন</p>
                  <p className="text-[10px] text-text-muted">এইমাত্র</p>
                </div>
              </div>

              <div className="absolute -right-8 bottom-32 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 animate-float slide-in-from-right z-20" style={{animationDelay: '2.5s'}}>
                 <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">প্রকল্প আপডেট</p>
                  <p className="text-[10px] text-text-muted">অ্যাডমিন দ্বারা</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative border-t border-border-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">প্রয়োজনীয় সকল সেবা এক জায়গায়</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">আমাদের গ্রামের দৈনন্দিন প্রয়োজন এবং উন্নয়নমূলক কাজ একসাথে সমাধানের জন্য একটি আধুনিক প্ল্যাটফর্ম।</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#13553a]">উন্নয়ন প্রকল্প পর্যবেক্ষণ</h3>
              <p className="text-text-secondary leading-relaxed">
                চলমান সকল উন্নয়ন কাজের পরিকল্পনা, বাজেট, এবং বাস্তবায়নের আপডেট নিয়মিত দেখুন। গ্রামের যেকোনো উন্নয়ন কার্যক্রমে সরাসরি নজর রাখুন।
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-background border border-border/50 hover:border-[#ce9f4d]/20 hover:shadow-xl hover:shadow-[#ce9f4d]/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-[#ce9f4d]/10 text-[#c08f3a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#13553a]">তহবিল ব্যবস্থাপনা ও অনুদান</h3>
              <p className="text-text-secondary leading-relaxed">
                গ্রামের সার্বিক উন্নয়নের জন্য স্বচ্ছভাবে তহবিল সংগ্রহ এবং অভাবী প্রতিবেশীকে সাহায্য করার সুবিধা। আপনার অনুদান কোথায় ব্যয় হচ্ছে তা যাচাই করুন।
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-background border border-border/50 hover:border-success/20 hover:shadow-xl hover:shadow-success/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-success-light text-success flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#13553a]">নাগরিক তথ্য ও রিপোর্ট</h3>
              <p className="text-text-secondary leading-relaxed">
                গ্রামের সকল নিবন্ধিত মানুষ এবং তাদের আয়ের উৎস বা পেশার তথ্য খুঁজুন। এছাড়া যেকোনো নাগরিক সমস্যা সরাসরি রিপোর্ট করার ব্যবস্থা রয়েছে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden opacity-90 border border-border">
               <img src="/images/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/favicon.svg"; }} />
             </div>
            <span className="font-bold text-[#13553a] tracking-tight">আল-ইসলাহ যুব ফোরাম</span>
          </div>
          <p className="text-sm font-medium text-text-muted">
            &copy; {new Date().getFullYear()} আল ইসলাহ। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}
