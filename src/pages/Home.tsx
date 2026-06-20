import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ShortenForm from "@/components/ShortenForm";
import { Shield, Link2 } from "lucide-react";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const features = [
  {
    icon: FacebookIcon,
    isCustom: true,
    title: "Facebook Browser Compatible",
    desc: "Shortened links open reliably inside Facebook's in-app browser, ensuring a smooth experience when sharing links on social media.",
  },
  {
    icon: Link2,
    title: "Shorten Any Link",
    desc: "Whether it's a Twitter/X video, website, article, YouTube video, blog post, document, or any other URL, Vindoy can shorten it instantly.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "All shortened links are protected by secure infrastructure and fast redirects, ensuring dependable performance and user trust.",
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
      <section className="container pb-12" aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          Features
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md shadow-primary/20">
                {f.isCustom ? (
                  <f.icon />
                ) : (
                  <f.icon className="h-5 w-5" />
                )}
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Article */}
      <section className="container max-w-3xl pb-20">
        <article className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 backdrop-blur-xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            About Vindoy URL Shortener
          </h2>
          <div className="mt-6 space-y-4 text-[15px] leading-7 text-muted-foreground">
            <p>
              Vindoy URL Shortener is designed for Twitter/X video links, making
              them easier to share and open inside Facebook's in-app browser. It
              also works as a universal URL shortener for websites, articles,
              videos, and any other link.
            </p>
            <p>
              Beyond its optimized use for Twitter/X video links, Vindoy URL
              Shortener provides a fast, secure, and scalable way to manage long
              URLs across the web. It works as a powerful link management tool for
              marketers, creators, and businesses who need clean, trackable short
              links. Every shortened URL is designed for speed and reliability,
              ensuring smooth redirection without delays or broken access. As a free
              URL shortener, Vindoy helps users share content easily across social
              media platforms, messaging apps, and websites. It supports articles,
              videos, blogs, and product pages. With a simple interface and instant
              generation, Vindoy improves sharing efficiency fast.
            </p>
          </div>
        </article>
      </section>
    </Layout>
  );
}
