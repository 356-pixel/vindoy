import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { getPreviewDoc, incrementPreviewClicks } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";
import { getBannerAd, DEFAULT_BANNER, type BannerAd } from "@/lib/bannerAdApi";

const COUNTDOWN_SECONDS = 4;

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

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PreviewDoc | null | undefined>(undefined);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [banner, setBanner] = useState<BannerAd>(DEFAULT_BANNER);

  useEffect(() => {
    let cancelled = false;
    getBannerAd().then((b) => {
      if (!cancelled) setBanner(b);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
          // Fire-and-forget: increment click count directly on the preview doc.
          incrementPreviewClicks(d.slug);
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
          if (analytics) {
            logEvent(analytics, "countdown_complete", { slug });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [preview, navigate]);



  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center px-4 pt-8 pb-20">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          {/* Banner Ad */}
          <div className="w-full flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              ADVERTISEMENT
            </span>
            <a
              href={banner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <img
                src={banner.image}
                alt="Advertisement"
                className="w-full h-auto rounded-lg object-contain"
              />
            </a>
            <a
              href={banner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-sm font-medium text-foreground hover:underline"
            >
              {banner.title}
            </a>
          </div>

          {/* Destination Card */}
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5">
              {/* Destination */}
              <div className="flex w-full flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Destination
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4">
                  {displayUrl}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Stable action area */}
              <div className="relative w-full min-h-[80px]">
                <div
                  className={`absolute inset-0 flex w-full flex-col items-center justify-center gap-2 transition-opacity duration-300 ${
                    secondsLeft <= 0 ? "pointer-events-none opacity-0" : ""
                  }`}
                >
                  <Progress value={progress} className="h-3 w-full" />
                  <span className="text-center text-sm text-foreground">
                    Optimizing link for Facebook browser
                  </span>
                </div>
                <div
                  className={`absolute inset-0 flex w-full items-center justify-center transition-opacity duration-300 ${
                    secondsLeft > 0 ? "pointer-events-none opacity-0" : ""
                  }`}
                >
                  {fullUrl && (
                    <button
                      onClick={() => {
                        if (analytics) logEvent(analytics, "click_here", { slug });
                        redirectAnonymously(fullUrl);
                      }}
                      className="w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      CLICK HERE
                    </button>
                  )}
                </div>
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
