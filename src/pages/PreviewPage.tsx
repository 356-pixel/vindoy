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

        {/* View Here CTA with curved arrow: tail touches image bottom, head near the button */}
        <div className="relative mt-6 flex justify-center">
          <svg
            aria-hidden
            viewBox="0 0 200 120"
            className="pointer-events-none absolute right-6 hidden h-28 w-40 text-primary sm:block"
            style={{ top: "-90px" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Tail starts at top (touching image bottom), curves down-left toward button */}
            <path d="M170 4 C 168 50, 140 85, 96 104" />
            {/* Arrowhead pointing at the button */}
            <path d="M108 96 L 94 106 L 104 116" />
          </svg>

          <a
            href={preview.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="relative inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            View Here
          </a>
        </div>

        {/* Article body */}
        <div className="mt-10">
          <ArticleRenderer article={article} />
        </div>
      </article>
    </Layout>
  );
}
