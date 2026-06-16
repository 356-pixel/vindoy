import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Article } from "@/lib/articleTypes";
import { Skeleton } from "@/components/ui/skeleton";

function RenderedImage({ src, alt }: { src: string; alt?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full">
      {!loaded && <Skeleton className="aspect-[16/9] w-full rounded-lg" />}
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full rounded-lg transition-opacity ${loaded ? "opacity-100" : "absolute inset-0 opacity-0"}`}
      />
    </div>
  );
}

export default function ArticleRenderer({ article }: { article: Article }) {
  if (!article) return null;
  return (
    <div className="space-y-6">
      {article.title && (
        <h2 className="text-balance text-left text-2xl font-bold tracking-tight sm:text-3xl">
          {article.title}
        </h2>
      )}
      {article.blocks.map((b) => {
        if (b.type === "text") {
          return (
            <div
              key={b.id}
              className="prose prose-neutral max-w-none text-justify text-[15px] leading-7 text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ol]:text-left [&_ul]:text-left"
              dangerouslySetInnerHTML={{ __html: b.html || "" }}
            />
          );
        }
        if (b.type === "image") {
          if (!b.src) return null;
          return <RenderedImage key={b.id} src={b.src} alt={b.alt} />;
        }
        if (b.type === "cta") {
          if (!b.label || !b.url) return null;
          return (
            <div key={b.id} className="my-2 flex justify-center">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {b.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
