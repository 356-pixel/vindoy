import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ArticleRenderer from "@/components/ArticleRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { detectCountry } from "@/lib/country";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<PreviewDoc | undefined | null>(undefined);
  const [country, setCountry] = useState<string>("");
  const [imgLoaded, setImgLoaded] = useState(false);

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
        <article className="container max-w-3xl py-8 sm:py-12">
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <div className="mt-6 flex justify-center">
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
          <div className="mt-10 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        </article>
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
        description={(article.blocks.find((b) => b.type === "text") as { html?: string } | undefined)?.html?.replace(/<[^>]+>/g, "").slice(0, 155) ?? ""}
      />
      <article className="container max-w-3xl py-8 sm:py-12">
        {/* Thumbnail with skeleton */}
        <div className="relative w-full">
          {!imgLoaded && <Skeleton className="aspect-[16/9] w-full rounded-xl" />}
          <img
            src={preview.image}
            alt={article.title || "Article preview"}
            onLoad={() => setImgLoaded(true)}
            className={`block w-full rounded-xl transition-opacity ${imgLoaded ? "opacity-100" : "absolute inset-0 opacity-0"}`}
          />
        </div>

        {/* View Here CTA with a simple horizontal arrow pointing at the button */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <ArrowRight
            aria-hidden
            strokeWidth={3}
            className="h-7 w-10 text-primary"
          />
          <a
            href={preview.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-md transition-opacity hover:opacity-90"
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
