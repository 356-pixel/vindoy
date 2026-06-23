import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";
import { recordClick } from "@/lib/analytics";

const COUNTDOWN_SECONDS = 6;

function normalizeUrl(url: string) {
  if (!url) return url;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function redirectAnonymously(target: string) {
  const form = document.createElement("form");
  form.action = target;
  form.method = "GET";
  form.setAttribute("rel", "noreferrer");
  document.body.appendChild(form);
  form.submit();
}

function truncateUrl(url: string) {
  const clean = url.replace(/^https?:\/\//i, "");
  if (clean.length <= 30) return clean;
  return clean.slice(0, 30) + "...";
}

const STEPS = ["Checking link", "Optimizing for FB browser", "Opening destination"];

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PreviewDoc | null | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    let cancelled = false;
    getPreviewDoc(slug)
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          navigate("/404", { replace: true });
          return;
        }
        setPreview(d);
        if (d.trackingId) {
          // Fire-and-forget: never block the redirect on analytics.
          recordClick(d.trackingId, d.slug).catch((e) => console.warn("analytics:", e));
        }
      })
      .catch(() => {
        if (!cancelled) navigate("/404", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (!preview) return;
    const target = normalizeUrl(preview.sourceUrl);
    if (!target) {
      navigate("/404", { replace: true });
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          redirectAnonymously(target);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [preview, navigate]);

  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  const elapsed = COUNTDOWN_SECONDS - secondsLeft;
  const activeStep = Math.min(STEPS.length - 1, Math.floor((elapsed / COUNTDOWN_SECONDS) * STEPS.length));

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  const ringSize = 32;
  const stroke = 5;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Progress value={progress} className="h-1 w-full rounded-none" />

      {/* Banner ad */}
      <div className="flex w-full justify-center pt-8">
        <a href="https://vindoy.com" target="_blank" rel="noopener noreferrer" aria-label="Advertisement">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/vindoy-45678.firebasestorage.app/o/banner.png?alt=media&token=27e2e692-9e2d-4859-bf2e-501104ee6239"
            alt="Advertisement"
            className="h-[250px] w-[300px] object-contain"
          />
        </a>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 pt-4 pb-10">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <h1 className="text-base font-medium text-foreground text-center">
            Here's a preview of your destination
          </h1>

          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5">

              {/* Destination */}
              <div className="flex w-full flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Destination
                </span>
                <span
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4"
                >
                  {displayUrl}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Loading row: small continuous ring + active step text */}
              <div className="flex w-full items-center gap-4">
                <div className="relative flex shrink-0 items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                  <svg width={ringSize} height={ringSize} className="animate-spin" style={{ animationDuration: "2s" }}>
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="hsl(var(--muted))"
                      strokeWidth={stroke}
                      fill="none"
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="hsl(var(--primary))"
                      strokeWidth={stroke}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {STEPS[activeStep]}
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer outside card */}
          <div className="flex flex-col gap-1 px-2 text-center text-xs text-muted-foreground leading-relaxed">
            <p>We are reviewing the link to help keep you safe.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
