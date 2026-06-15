import { useCallback } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CreatePreviewForm from "@/components/CreatePreviewForm";
import FeaturedPreviews from "@/components/FeaturedPreviews";
import { ArrowRight, Zap, Link2, ShieldCheck } from "lucide-react";

export default function Home() {
  const scrollToForm = useCallback(() => {
    const el = document.getElementById("create");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <Layout>
      <SEO
        title="ArticlePreview — Discover Articles in Minutes"
        description="Share and read concise article previews with a link to the original source. Fast, lightweight, mobile-first."
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]" />
        <div className="container py-16 sm:py-24 text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            Read less. Decide faster.
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Discover Articles in Minutes
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Read concise article previews and visit the original source when
            you want the complete story.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
            >
              Create Preview Now
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              How it works →
            </a>
          </div>

          {/* Features */}
          <div
            id="how"
            className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3"
          >
            {[
              {
                icon: Zap,
                title: "Blazing fast",
                desc: "Lightweight pages and compressed images load instantly anywhere.",
              },
              {
                icon: Link2,
                title: "One short link",
                desc: "Every preview gets a clean 5-letter URL you can share anywhere.",
              },
              {
                icon: ShieldCheck,
                title: "Source-first",
                desc: "We always credit and link readers back to the original article.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="create" className="container scroll-mt-20">
        <CreatePreviewForm />
      </section>

      <FeaturedPreviews />
    </Layout>
  );
}
