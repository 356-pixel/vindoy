import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ArticleRenderer from "@/components/ArticleRenderer";
import { detectCountry } from "@/lib/country";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<PreviewDoc | undefined | null>(undefined);
  const [country, setCountry] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [doc, c] = await Promise.all([getPreviewDoc(slug), detectCountry()]);
      if (cancelled) return;
      setPreview(doc);
      setCountry(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (preview === undefined) {
    return (
      <Layout>
        <div className="container py-24 text-center text-muted-foreground">
          Loading…
        </div>
      </Layout>
    );
  }

  if (preview === null) {
    return (
      <Layout>
        <SEO title="Preview not found · Vindoy" />
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-bold">Preview not found</h1>
          <p className="mt-2 text-muted-foreground">
            This link doesn't exist or has been removed.
          </p>
        </div>
      </Layout>
    );
  }

  const article =
    (country && preview.countries?.[country]) || preview.default;

  return (
    <Layout>
      <SEO
        title={`${article.title || "Article preview"} · Vindoy`}
        description={(article.blocks.find((b) => b.type === "text") as { html?: string } | undefined)?.html?.slice(0, 155) ?? ""}
      />
      <article className="container max-w-3xl py-8 sm:py-12">
        {/* Borderless image, no nav buttons above */}
        <img
          src={preview.image}
          alt={article.title || "Article preview"}
          loading="lazy"
          className="block w-full rounded-xl"
        />

        {/* View Here CTA with curved arrow from the right */}
        <div className="relative mt-6 flex justify-center">
          <a
            href={preview.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            View Here
          </a>
          <svg
            aria-hidden
            viewBox="0 0 120 70"
            className="pointer-events-none absolute right-2 top-1/2 hidden h-16 w-28 -translate-y-1/2 translate-x-full text-primary sm:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M115 12 C 95 5, 55 5, 30 35 C 22 45, 18 55, 18 60" />
            <path d="M10 56 L 18 62 L 26 54" />
          </svg>
        </div>

        {/* Article body */}
        <div className="mt-10">
          <ArticleRenderer article={article} />
        </div>
      </article>
    </Layout>
  );
}
