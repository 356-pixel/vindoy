import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Preview, getAllPreviews } from "@/lib/storage";
import { Clock } from "lucide-react";

export default function FeaturedPreviews() {
  const [items, setItems] = useState<Preview[]>([]);
  useEffect(() => setItems(getAllPreviews().slice(0, 6)), []);

  if (!items.length) return null;

  return (
    <section className="container mt-20" aria-labelledby="featured-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            id="featured-title"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Featured previews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recently shared by the community.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.slug}
            to={`/${p.slug}`}
            className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {p.content}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(p.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
