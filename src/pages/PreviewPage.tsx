import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";
import type { PreviewDoc } from "@/lib/articleTypes";

const TOTAL_MS = 5000;
const STEPS = [
  "Checking link…",
  "Verifying destination…",
  "Optimizing for Facebook browser…",
  "Securing your redirect…",
  "Opening destination…",
];

function truncate(url: string, n = 20) {
  const clean = url.replace(/^https?:\/\//, "");
  return clean.length > n ? clean.slice(0, n) + "…" : clean;
}

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const [preview, setPreview] = useState<PreviewDoc | null | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPreviewDoc(slug).then((d) => !cancelled && setPreview(d));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!preview) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / TOTAL_MS) * 100);
      setProgress(pct);
      setStepIdx(Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length)));
      if (elapsed < TOTAL_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        window.location.replace(preview.sourceUrl);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [preview]);

  if (preview === null) {
    return (
      <Layout>
        <SEO title="Link not found · Vindoy" />
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-bold">Link not found</h1>
          <p className="mt-2 text-muted-foreground">
            This link doesn't exist or has been removed.
          </p>
        </div>
      </Layout>
    );
  }

  const destination = preview ? truncate(preview.sourceUrl, 20) : "…";

  return (
    <Layout>
      <SEO title="Opening your link · Vindoy" />
      {/* Top progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-secondary/60">
        <div
          className="h-full bg-gradient-primary transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <section className="container flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure redirect
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Taking you to your destination
        </h1>

        <div className="mt-8 w-full rounded-2xl border border-border/60 bg-card/70 p-6 text-left shadow-xl backdrop-blur-xl">
          <p className="text-sm font-medium text-muted-foreground">Destination</p>
          <p className="mt-1 break-all text-lg font-semibold text-foreground">
            {destination}
          </p>

          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{STEPS[stepIdx]}</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Please wait — we're making sure your link opens safely.
        </p>
      </section>
    </Layout>
  );
}
