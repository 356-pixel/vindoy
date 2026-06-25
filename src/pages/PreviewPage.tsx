import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
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
  form.referrerPolicy = "no-referrer";
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
  }, [preview, navigate, slug]);

  // Social bar - bridge page only
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pl29889870.effectivecpmnetwork.com/7d/88/87/7d88878d3713af19da3ade0ab15e75f2.js";
    script.referrerPolicy = "origin";
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center px-4 pt-4 pb-20">
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <div className="w-full text-sm text-foreground leading-relaxed">
            <h2 className="font-semibold mb-2">
              Why don't Twitter (X) video links work properly inside Facebook's in-app browser?
            </h2>
            <p className="mb-3">
              Twitter (X) video links often fail to play within Facebook's in-app browser because of platform restrictions, browser compatibility limitations, and security policies that affect external media content. Users may encounter blank screens, loading errors, or playback issues, creating a frustrating experience when trying to watch shared videos directly from Facebook.
            </p>
            <p>
              To overcome this problem, we use the{" "}
              <a
                href="https://vindoy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 font-medium"
              >
                Vindoy
              </a>{" "}
              URL shortener. Vindoy creates a cleaner, more compatible redirect that helps open Twitter video links reliably across devices and browsers.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5">
              <div className="flex w-full flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Destination
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4">
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

          <div className="flex flex-col gap-1 px-2 text-center text-xs text-muted-foreground leading-relaxed">
            <p>We are reviewing the link to help keep you safe.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
