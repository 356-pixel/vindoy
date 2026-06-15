import { Link } from "react-router-dom";
import { BLOGS } from "@/lib/blogs";
import { ArrowRight } from "lucide-react";

export default function FeaturedPreviews() {
  const items = BLOGS.slice(0, 6);

  return (
    <section className="container mt-16" aria-labelledby="featured-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            id="featured-title"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Featured previews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Handpicked reads from across the web.
          </p>
        </div>
        <Link
          to="/blogs"
          className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/blogs/${p.id}`}
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
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {p.category}
              </span>
              <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {p.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
