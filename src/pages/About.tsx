import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

export default function About() {
  return (
    <Layout>
      <SEO
        title="About · Vindoy"
        description="Vindoy helps readers discover useful content quickly while sending qualified traffic to original publishers."
      />
      <section className="container max-w-3xl py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          About Vindoy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We believe great writing deserves to be found, and readers deserve a
          faster way to decide what's worth their time.
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-7">
          <p>
            Vindoy is a lightweight platform where anyone can share a short
            preview of an article along with a link to the original source.
            Instead of full reposts, we focus on previews: just enough context
            for readers to know if a piece is relevant to them.
          </p>
          <p>
            <strong>For readers</strong>, that means discovering useful content
            in minutes, not hours, with no paywalls between you and the
            decision to keep reading.
          </p>
          <p>
            <strong>For publishers and writers</strong>, every preview funnels
            qualified, motivated readers straight to your site. You keep the
            attention, the ad revenue, the comments, and the relationship with
            the audience.
          </p>
          <p>
            We're built around three principles: respect the source, keep the
            experience fast, and make sharing effortless. No accounts to
            create, no friction to ship a preview.
          </p>
        </div>
      </section>
    </Layout>
  );
}
