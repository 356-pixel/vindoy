import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <Layout>
      <SEO
        title="Privacy Policy · ArticlePreview"
        description="How ArticlePreview handles data, cookies, user-generated content, and external links."
      />
      <section className="container max-w-3xl py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-8 space-y-8 text-[15px] leading-7">
          <section>
            <h2 className="text-xl font-semibold">Data we collect</h2>
            <p className="mt-2">
              ArticlePreview is designed to collect as little personal data as
              possible. Previews you create are stored locally in your browser
              by default. If you contact us, we keep the information you send
              only as long as needed to respond.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Cookies and local storage</h2>
            <p className="mt-2">
              We use browser local storage to save the previews you've created
              so you can revisit them. We may use minimal analytics cookies to
              understand which pages are popular. You can clear local storage
              and cookies at any time from your browser settings.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">User-generated content</h2>
            <p className="mt-2">
              Previews, titles, and images submitted through ArticlePreview are
              your responsibility. By submitting content you confirm you have
              the right to share it and that it doesn't infringe copyright,
              violate privacy, or include illegal material. We may remove
              content that breaks these rules or that we believe is harmful.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">External links</h2>
            <p className="mt-2">
              Previews link to third-party websites. We don't control those
              sites and aren't responsible for their content, privacy
              practices, or accuracy. Review the destination site's own terms
              and policies before sharing personal information there.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="mt-2">
              For privacy questions, reach us via the Contact page and we'll
              respond as soon as we can.
            </p>
          </section>
        </div>
      </section>
    </Layout>
  );
}
