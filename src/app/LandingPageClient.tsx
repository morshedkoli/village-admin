"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  LayoutDashboard,
  HeartPulse,
  Building2,
  Users,
  ShieldCheck,
  Smartphone,
  Calendar,
} from "lucide-react";

const SCREENS = [
  "/images/screens (1).jpeg",
  "/images/screens (2).jpeg",
  "/images/screens (3).jpeg",
  "/images/screens (4).jpeg",
];

interface ApkInfo {
  sizeMB: string;
  updatedAt: string;
  version: string;
}

export default function LandingPageClient({ apkInfo }: { apkInfo: ApkInfo }) {
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % SCREENS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans text-text-primary overflow-x-hidden">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-md border border-border">
              <img
                src="/images/logo.png"
                alt="AL ISLAH"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.svg";
                }}
              />
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">
              আল-ইসলাহ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-text-primary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-text-secondary" />
              <span className="hidden sm:inline">অ্যাডমিন লগইন</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero section ──────────────────────────────────────────── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-light border border-primary/15 text-primary text-[11px] font-semibold mb-6 tracking-wide uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </span>
                গ্রাম কমিউনিটি প্ল্যাটফর্ম
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight mb-5 leading-[1.05] text-text-primary">
                একসাথে গড়ি{" "}
                <span className="text-primary font-bold">আমাদের গ্রাম</span>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-base text-text-secondary leading-relaxed mb-8">
                আল-ইসলাহ যুব ফোরাম আমাদের সমাজকে একত্রিত করে। গ্রামের উন্নয়ন
                প্রকল্প, তহবিল ব্যবস্থাপনা এবং যেকোনো সমস্যায় একে অপরের পাশে
                দাঁড়ানোর প্ল্যাটফর্ম।
              </p>

              {/* Download CTA */}
              <div className="flex flex-col items-center lg:items-start gap-3">
                <a
                  href="/apps/al_islah.apk"
                  download
                  className="inline-flex items-center gap-2.5 px-5 py-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  অ্যাপ ডাউনলোড করুন (APK)
                </a>

                {/* Compact metadata row */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Android · v{apkInfo.version}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {apkInfo.sizeMB}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    আপডেট: {apkInfo.updatedAt}
                  </span>
                </div>

                {/* Install hint */}
                <p className="text-[11px] text-text-muted max-w-md">
                  ইনস্টল করতে: ডাউনলোড সম্পন্ন হলে APK ফাইল ওপেন করুন। প্রথমবার
                  &ldquo;Unknown sources&rdquo; অনুমতি দিতে হতে পারে।
                </p>
              </div>
            </div>

            {/* Right phone mockup */}
            <div className="relative mx-auto lg:mr-0 lg:ml-auto w-full max-w-[300px] xl:max-w-[340px] animate-fade-in stagger-2">
              <div className="relative z-10 rounded-[2.5rem] border-[8px] border-zinc-900 bg-zinc-900 shadow-xl shadow-black/20 overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-900 rounded-b-2xl z-20"></div>

                {/* Screen carousel */}
                <div className="relative bg-white rounded-[2rem] overflow-hidden w-full aspect-[9/19.5]">
                  {SCREENS.map((src, idx) => (
                    <img
                      key={src}
                      src={src}
                      alt={`App screen ${idx + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        idx === currentScreen
                          ? "opacity-100 z-10"
                          : "opacity-0 z-0"
                      }`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Decorative floating notification cards (subtler) */}
              <div className="hidden md:flex absolute -left-10 top-20 bg-white px-3 py-2.5 rounded-lg border border-border items-center gap-2.5 z-20 max-w-[180px]">
                <div className="w-7 h-7 rounded-md bg-success-light text-success flex items-center justify-center shrink-0">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text-primary truncate">
                    নতুন অনুদান
                  </p>
                  <p className="text-[10px] text-text-muted">এইমাত্র</p>
                </div>
              </div>

              <div className="hidden md:flex absolute -right-6 bottom-28 bg-white px-3 py-2.5 rounded-lg border border-border items-center gap-2.5 z-20 max-w-[180px]">
                <div className="w-7 h-7 rounded-md bg-info-light text-info flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text-primary truncate">
                    প্রকল্প আপডেট
                  </p>
                  <p className="text-[10px] text-text-muted">অ্যাডমিন</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-text-primary">
              প্রয়োজনীয় সকল সেবা এক জায়গায়
            </h2>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              আমাদের গ্রামের দৈনন্দিন প্রয়োজন এবং উন্নয়নমূলক কাজ একসাথে
              সমাধানের একটি আধুনিক প্ল্যাটফর্ম।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Building2 className="w-5 h-5" />}
              iconBg="bg-primary-light"
              iconColor="text-primary"
              title="উন্নয়ন প্রকল্প পর্যবেক্ষণ"
              body="চলমান সকল উন্নয়ন কাজের পরিকল্পনা, বাজেট, এবং বাস্তবায়নের আপডেট নিয়মিত দেখুন। গ্রামের যেকোনো উন্নয়ন কার্যক্রমে সরাসরি নজর রাখুন।"
            />
            <FeatureCard
              icon={<HeartPulse className="w-5 h-5" />}
              iconBg="bg-warning-light"
              iconColor="text-warning"
              title="তহবিল ব্যবস্থাপনা ও অনুদান"
              body="গ্রামের সার্বিক উন্নয়নের জন্য স্বচ্ছভাবে তহবিল সংগ্রহ এবং অভাবী প্রতিবেশীকে সাহায্য করার সুবিধা। আপনার অনুদান কোথায় ব্যয় হচ্ছে তা যাচাই করুন।"
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-info-light"
              iconColor="text-info"
              title="নাগরিক তথ্য ও রিপোর্ট"
              body="গ্রামের সকল নিবন্ধিত মানুষ এবং তাদের পেশার তথ্য খুঁজুন। যেকোনো নাগরিক সমস্যা সরাসরি রিপোর্ট করার ব্যবস্থা রয়েছে।"
            />
          </div>

          {/* Trust strip */}
          <div className="mt-14 pt-10 border-t border-border-light grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <TrustItem
              icon={<ShieldCheck className="w-4 h-4" />}
              title="নিরাপদ"
              subtitle="Firebase Auth"
            />
            <TrustItem
              icon={<Download className="w-4 h-4" />}
              title="হালকা"
              subtitle={apkInfo.sizeMB}
            />
            <TrustItem
              icon={<Smartphone className="w-4 h-4" />}
              title="অফলাইন"
              subtitle="ক্যাশ সাপোর্ট"
            />
            <TrustItem
              icon={<Calendar className="w-4 h-4" />}
              title="আপডেট"
              subtitle={apkInfo.updatedAt}
            />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md overflow-hidden border border-border">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.svg";
                }}
              />
            </div>
            <span className="text-[13px] font-semibold text-text-primary">
              আল-ইসলাহ যুব ফোরাম
            </span>
          </div>
          <p className="text-[12px] text-text-muted">
            &copy; {new Date().getFullYear()} আল ইসলাহ। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-white border border-border hover:border-text-muted/40 transition-colors">
      <div
        className={`w-10 h-10 rounded-md ${iconBg} ${iconColor} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold mb-2 text-text-primary tracking-tight">
        {title}
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-8 h-8 rounded-md bg-surface-hover text-text-secondary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      <p className="text-[11px] text-text-muted">{subtitle}</p>
    </div>
  );
}
