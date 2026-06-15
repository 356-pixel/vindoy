import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <Layout>
      <SEO title="Page not found · ArticlePreview" />
      <section className="container py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          404
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back home
        </Link>
      </section>
    </Layout>
  );
}
