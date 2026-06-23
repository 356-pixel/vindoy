import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BLOGS } from "@/lib/blogs";
import { useEffect, useRef } from "react";

// Renders text with "Vindoy" mentions and URLs converted into anchor tags.
function renderWithLinks(text: string) {
  const pattern = /(https?:\/\/[^\s]+|Vindoy)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part === "Vindoy") {
      return (
        <a
          key={i}
          href="https://vindoy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Vindoy
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      // Strip trailing punctuation from URL match
      const trailingMatch = part.match(/[.,!?;:]+$/);
      const trailing = trailingMatch ? trailingMatch[0] : "";
      const url = trailing ? part.slice(0, -trailing.length) : part;
      return (
        <span key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {url}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function BlogPost() {
  const { id = "" } = useParams();
  const post = BLOGS.find((b) => b.id === id);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!post) {
    return (
      <Layout>
        <SEO title="Article not found · Vindoy" />
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-bold">Article not found</h1>
          <Link
            to="/blogs"
            className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Browse blogs
          </Link>
        </div>
      </Layout>
    );
  }

  const wordCount = post.body.split(/\s+/).filter(Boolean).length;


  return (
    <Layout>
      <SEO
        title={`${post.title} · Vindoy`}
        description={post.excerpt}
      />
      <article className="container max-w-3xl py-8 sm:py-12">
        {/* Image — no border, no back/home button above */}
        <img
          src={post.image}
          alt={post.title}
          loading="eager"
          className="aspect-[16/9] w-full rounded-2xl object-cover"
        />

        {/* View Here CTA with curved arrow from right */}
        <div className="relative mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={scrollToBody}
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-md transition-transform hover:scale-[1.03]"
          >
            View Here
          </button>

          {/* Curved arrow pointing to the button from the right */}
          <svg
            aria-hidden="true"
            viewBox="0 0 140 90"
            className="pointer-events-none absolute right-2 top-1/2 hidden h-20 w-32 -translate-y-1/2 translate-x-full text-primary sm:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M132 78 C 110 78, 70 70, 40 55 C 20 45, 12 30, 14 14" />
            <path d="M6 22 L 14 8 L 24 18" />
          </svg>

          {/* Mobile version of arrow (smaller, above-right) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 80"
            className="pointer-events-none absolute -right-2 -top-10 h-14 w-20 text-primary sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M110 70 C 95 65, 70 55, 50 40 C 35 30, 25 20, 22 8" />
            <path d="M12 16 L 22 4 L 32 14" />
          </svg>
        </div>

        <header className="mt-10">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {post.category}
          </span>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {wordCount} words · {Math.max(1, Math.round(wordCount / 220))} min
            read
          </p>
        </header>

        <div
          ref={bodyRef}
          className="prose prose-neutral mt-8 max-w-none text-[16px] leading-8 text-foreground/90"
        >
          {post.body.split("\n\n").map((p, i) => (
            <p key={i} className="mb-5">
              {renderWithLinks(p)}
            </p>
          ))}
        </div>
      </article>
    </Layout>
  );
}
