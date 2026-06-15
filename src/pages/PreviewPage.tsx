import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Preview, getPreview } from "@/lib/storage";
import { ExternalLink, Calendar, ArrowLeft } from "lucide-react";

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<Preview | undefined | null>(undefined);

  useEffect(() => {
    setPreview(getPreview(slug) || null);
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
            This link doesn't exist or was created on a different device.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`${preview.title} · Vindoy`}
        description={preview.content.slice(0, 155)}
      />
      <article className="container max-w-3xl py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <img
            src={preview.image}
            alt={preview.title}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(preview.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {preview.title}
            </h1>
            <div className="prose-base mt-6 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
              {preview.content}
            </div>

            <a
              href={preview.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 sm:w-auto"
            >
              Read Complete Article
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              You'll be taken to {new URL(preview.sourceUrl).hostname} in a new
              tab.
            </p>
          </div>
        </div>
      </article>
    </Layout>
  );
}
