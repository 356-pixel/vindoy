import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Smartphone, Link2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";

const COUNTDOWN_SECONDS = 5;

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
  if (clean.length <= 20) return clean;
  return clean.slice(0, 20) + "...";
}

const STEPS = [
  { icon: Shield, label: "Checking link" },
  { icon: Smartphone, label: "Optimizing for FB browser" },
  { icon: Link2, label: "Opening destination" },
];

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

  const currentStepIndex =
    secondsLeft >= 4 ? 0 : secondsLeft >= 2 ? 1 : 2;
  const currentStep = STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Progress value={progress} className="h-1 w-full rounded-none" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <h1 className="text-lg font-medium text-foreground">
            Here's a preview of your destination
          </h1>

          <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Destination:</span>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-base font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {displayUrl}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <StepIcon className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-medium text-foreground animate-pulse">
                  {currentStep.label}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground leading-relaxed">
                <p>We weren't able to retrieve information about your destination.</p>
                <p>But rest assured—we're reviewing the link to help keep you safe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
