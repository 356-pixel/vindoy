import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ShortenForm from "@/components/ShortenForm";
import { Zap, Shield, Link2, Share2 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant shortening",
    desc: "Generate a short link in milliseconds — no signup, no waiting.",
  },
  {
    icon: Shield,
    title: "Safe & reliable",
    desc: "Built on a hardened infrastructure with high uptime.",
  },
  {
    icon: Link2,
    title: "Works with any URL",
    desc: "Twitter/X videos, articles, product pages, anything you can paste.",
  },
  {
    icon: Share2,
    title: "Made to share",
    desc: "Clean, copy-ready links that look great anywhere you drop them.",
  },
];

export default function Home() {
  return (
    <Layout>
      <SEO
        title="Vindoy — Shorten Twitter Video Links Instantly"
        description="Vindoy URL Shortener turns long Twitter/X video links and any URL into clean, fast, shareable short links. Free, instant, no signup."
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.35),transparent_60%)] blur-3xl" />
          <div className="absolute right-[-120px] top-40 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.30),transparent_60%)] blur-3xl" />
          <div className="absolute left-[-120px] top-60 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary-glow)/0.30),transparent_60%)] blur-3xl" />
        </div>

        <div className="container max-w-3xl py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
              Vindoy URL Shortener
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Shorten{" "}
              <span className="text-gradient-primary">Twitter Video Links</span>{" "}
              Instantly
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Paste any long URL — Twitter/X video, article, or product page —
              and get a clean short link in one click.
            </p>
          </div>

          <div className="mt-10">
            <ShortenForm />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Free · No signup · Works with any link
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20" aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          Features
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md shadow-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
