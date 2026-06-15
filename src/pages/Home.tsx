import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CreatePreviewForm from "@/components/CreatePreviewForm";
import FeaturedPreviews from "@/components/FeaturedPreviews";

export default function Home() {
  return (
    <Layout>
      <SEO
        title="Vindoy — Share Article Previews"
        description="Share article previews with a link to the original source. Fast, lightweight, mobile-first."
      />
      {/* Hero + Form */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]" />
        <div className="container max-w-xl py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Share articles preview
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Create preview links below.
            </p>
          </div>

          <div className="mt-8">
            <CreatePreviewForm />
          </div>
        </div>
      </section>

      <FeaturedPreviews />
    </Layout>
  );
}
