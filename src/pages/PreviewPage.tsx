import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Link2, Smartphone } from "lucide-react";
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

  const targetUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Progress value={progress} className="h-1 w-full rounded-none" />

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <StepIcon className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-base font-medium text-foreground animate-pulse">
              {currentStep.label}
            </p>
          </div>

          {targetUrl && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground break-all">
                {targetUrl}
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
