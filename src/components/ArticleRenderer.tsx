import { ExternalLink } from "lucide-react";
import type { Article } from "@/lib/articleTypes";

export default function ArticleRenderer({ article }: { article: Article }) {
  if (!article) return null;
  return (
    <div className="space-y-6">
      {article.title && (
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          {article.title}
        </h2>
      )}
      {article.blocks.map((b) => {
        if (b.type === "text") {
          return (
            <div
              key={b.id}
              className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/90"
            >
              {b.html}
            </div>
          );
        }
        if (b.type === "image") {
          if (!b.src) return null;
          return (
            <img
              key={b.id}
              src={b.src}
              alt={b.alt || ""}
              loading="lazy"
              className="w-full rounded-lg"
            />
          );
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
