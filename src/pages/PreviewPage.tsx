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

        {/* View Here CTA with curved arrow whose tail starts from the image */}
        <div className="relative mt-8 flex justify-center">
          {/* Arrow: tail near bottom-right of the image above, head pointing at the button */}
          <svg
            aria-hidden
            viewBox="0 0 200 140"
            className="pointer-events-none absolute right-2 hidden h-32 w-44 text-primary sm:block"
            style={{ top: "-110px" }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Curve from upper-right (image area) down-left to the button */}
            <path d="M188 8 C 180 60, 150 95, 110 120" />
            {/* Arrowhead pointing toward the button (down-left) */}
            <path d="M118 108 L 108 122 L 124 126" />
          </svg>

          <a
            href={preview.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="relative inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
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
