import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ArticleRenderer from "@/components/ArticleRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { detectCountry } from "@/lib/country";
import { getPreviewDoc } from "@/lib/previewsApi";
import { getArticleForCountry } from "@/lib/articlesApi";
import type { Article, PreviewDoc } from "@/lib/articleTypes";

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<PreviewDoc | undefined | null>(undefined);
  const [article, setArticle] = useState<Article | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [doc, c] = await Promise.all([getPreviewDoc(slug), detectCountry()]);
      if (cancelled) return;
      setPreview(doc);
      if (doc) {
        const a = await getArticleForCountry(c);
        if (!cancelled) setArticle(a);
      }
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

  return (
    <Layout>
      <SEO
        title={`${article?.title || "Article preview"} · Vindoy`}
        description={(article?.blocks.find((b) => b.type === "text") as { html?: string } | undefined)?.html?.replace(/<[^>]+>/g, "").slice(0, 155) ?? ""}
      />
      <article className="container max-w-3xl py-8 sm:py-12">
        {/* Thumbnail — matches blogs card: 16:9, rounded-xl, cover */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-secondary">
          {!imgLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
          <img
            src={preview.image}
            alt={article?.title || "Article preview"}
            onLoad={() => setImgLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>

        {/* View Link CTA — button centered, arrow on right rotated 150° (anti-clockwise 30° from pointing-left) */}
        <div className="relative mt-8 flex items-center justify-center">
          <a
            href={preview.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{ backgroundImage: "none" }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            View Link
          </a>
          <ArrowRight
            aria-hidden
            strokeWidth={3}
            style={{ transform: "rotate(150deg)" }}
            className="absolute left-1/2 ml-24 h-8 w-20 text-primary"
          />
        </div>

        {/* Article body */}
        {article && (
          <div className="mt-10">
            <ArticleRenderer article={article} />
          </div>
        )}
      </article>
    </Layout>
  );
}
