import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BLOGS, BlogPost } from "@/lib/blogs";
import { ArrowRight, X } from "lucide-react";

export default function Blogs() {
  const [open, setOpen] = useState<BlogPost | null>(null);
  return (
    <Layout>
      <SEO
        title="Blogs · ArticlePreview"
        description="Short reads on AI, startups, finance, productivity, climate, security, marketing, health, and learning."
      />
      <section className="container py-12">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Blogs
          </h1>
          <p className="mt-3 text-muted-foreground">
            Short, useful reads across the topics shaping how we work and live.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOGS.map((b) => (
            <article
              key={b.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] overflow-hidden bg-secondary">
                <img
                  src={b.image}
                  alt={b.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {b.category}
                </span>
                <h2 className="mt-2 text-lg font-semibold leading-snug">
                  {b.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {b.excerpt}
                </p>
                <button
                  onClick={() => setOpen(b)}
                  className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary hover:underline"
                >
                  Read More <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
          >
            <div className="relative">
              <img
                src={open.image}
                alt={open.title}
                className="aspect-[16/9] w-full object-cover"
              />
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full bg-background/90 p-2 backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {open.category}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {open.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-foreground/90">
                {open.body}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
