import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BLOGS } from "@/lib/blogs";
import { ArrowRight } from "lucide-react";

export default function Blogs() {
  return (
    <Layout>
      <SEO
        title="Blogs · Vindoy"
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
            <Link
              to={`/blogs/${b.id}`}
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
                <span className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary group-hover:underline">
                  Read More <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
