import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ArticleRenderer from "@/components/ArticleRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { getPreviewDoc } from "@/lib/previewsApi";
import { getActiveArticle } from "@/lib/articlesApi";
import type { Article, PreviewDoc } from "@/lib/articleTypes";

const ARTICLE_CACHE_KEY = "vindoy_active_article_v1";

function readCachedArticle(): Article | null {
  try {
    const raw = sessionStorage.getItem(ARTICLE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Article) : null;
  } catch {
    return null;
  }
}

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<PreviewDoc | undefined | null>(undefined);
  const [article, setArticle] = useState<Article | null>(readCachedArticle);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Fetch the preview doc — this is what the page primarily depends on.
  useEffect(() => {
    let cancelled = false;
    getPreviewDoc(slug).then((doc) => {
      if (!cancelled) setPreview(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Fetch the global article in the background — never blocks the preview.
  useEffect(() => {
    let cancelled = false;
    getActiveArticle()
      .then((a) => {
        if (cancelled || !a) return;
        setArticle(a);
        try {
          sessionStorage.setItem(ARTICLE_CACHE_KEY, JSON.stringify(a));
        } catch {
          // ignore quota errors
        }
      })
      .catch(() => {
        // silent — article is optional
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (preview === undefined) {
    return (
      <Layout>
        <article className="container max-w-3xl py-8 sm:py-12">
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <div className="mt-6 flex justify-center">
            <Skeleton className="h-12 w-40 rounded-md" />
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
      <article className="container max-w-3xl px-2 py-4 sm:px-3 sm:py-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-secondary">
          {!imgLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
          <img
            src={preview.image}
            alt={article?.title || "Article preview"}
            onLoad={() => setImgLoaded(true)}
            fetchPriority="high"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>

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
            className="absolute left-1/2 ml-14 h-8 w-16 text-primary"
          />
        </div>

        {article && (
          <div className="mt-20 sm:mt-24">
            <ArticleRenderer article={article} />
          </div>
        )}
      </article>
    </Layout>
  );
}
