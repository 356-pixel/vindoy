import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";
import { recordClick } from "@/lib/analytics";

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
  const [bannerOpen, setBannerOpen] = useState(true);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const topAdContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!topAdContainerRef.current) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://pl29878528.effectivecpmnetwork.com/0404c82c745238b0f65a13a106675274/invoke.js";
    topAdContainerRef.current.appendChild(script);

    return () => {
      if (topAdContainerRef.current) {
        topAdContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!adContainerRef.current) return;

    const w = window as any;
    w.atOptions = {
      key: "f28135ccbe21f58db37d7fdecc8ddd33",
      format: "iframe",
      height: 50,
      width: 320,
      params: {},
    };

    const script = document.createElement("script");
    script.src =
      "https://www.highperformanceformat.com/f28135ccbe21f58db37d7fdecc8ddd33/invoke.js";
    script.async = true;
    adContainerRef.current.appendChild(script);

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }
      delete w.atOptions;
    };
  }, []);

  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  return (
    <main className="flex min-h-screen flex-col bg-background">

      {/* Banner ad */}
      <div className="flex w-full flex-col items-center pt-8">
        <span className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
          ADVERTISEMENT
        </span>
        <div
          ref={topAdContainerRef}
          id="container-0404c82c745238b0f65a13a106675274"
          className="w-full"
        />
      </div>

      <div className="flex flex-1 flex-col items-center px-4 pt-4 pb-20">
        <div className="flex w-full max-w-md flex-col items-center gap-5">

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

              {secondsLeft > 0 && (
                <div className="flex w-full flex-col gap-2">
                  <Progress value={progress} className="h-3 w-full" />
                  <span className="text-center text-sm text-foreground">
                    Optimizing link for Facebook browser
                  </span>
                </div>
              )}
              {secondsLeft <= 0 && fullUrl && (
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

          {/* Disclaimer outside card */}
          <div className="flex flex-col gap-1 px-2 text-center text-xs text-muted-foreground leading-relaxed">
            <p>We are reviewing the link to help keep you safe.</p>
          </div>
        </div>
      </div>

      {/* Sticky bottom Adsterra banner */}
      {bannerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="relative flex justify-center border-y border-border bg-background/95 backdrop-blur-sm pt-1 pb-0">
            {/* Close button */}
            <button
              onClick={() => {
                if (analytics) logEvent(analytics, "close_banner", { slug });
                setBannerOpen(false);
              }}
              className="absolute -top-6 right-0 z-10 flex h-7 w-10 items-center justify-center rounded-tl-lg bg-muted/90 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close advertisement"
            >
              <X className="h-4 w-4" />
            </button>
            {/* Ad container */}
            <div ref={adContainerRef} className="px-1" />
          </div>
        </div>
      )}
    </main>
  );
}
