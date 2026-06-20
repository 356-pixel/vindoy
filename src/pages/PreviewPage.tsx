import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Smartphone, Link2, ExternalLink, Check, Loader2 } from "lucide-react";
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

  // Map countdown (5..0) to active step index (0..2)
  const elapsed = COUNTDOWN_SECONDS - secondsLeft; // 0..5
  const activeStep = Math.min(STEPS.length - 1, Math.floor((elapsed / COUNTDOWN_SECONDS) * STEPS.length));

  const fullUrl = preview?.sourceUrl ? normalizeUrl(preview.sourceUrl) : "";
  const displayUrl = preview?.sourceUrl ? truncateUrl(normalizeUrl(preview.sourceUrl)) : "";

  // SVG ring values
  const ringSize = 168;
  const stroke = 10;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Progress value={progress} className="h-1 w-full rounded-none" />

      {/* Ad slot placeholder: 320x90 desktop, 320x60 mobile */}
      <div className="flex w-full justify-center pt-3">
        <div
          aria-label="Advertisement slot"
          className="flex items-center justify-center border border-dashed border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground/70 h-[60px] w-[320px] md:h-[90px]"
        >
          Ad space
        </div>
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
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {displayUrl}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Prominent loading ring */}
              <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                <svg width={ringSize} height={ringSize} className="-rotate-90">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <Shield className="h-7 w-7 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Security scan
                  </span>
                </div>
              </div>

              {/* Step checklist */}
              <ul className="flex w-full flex-col gap-2">
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = i < activeStep;
                  const isActive = i === activeStep;
                  return (
                    <li
                      key={step.label}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : isDone
                          ? "border-border bg-muted/30"
                          : "border-border bg-transparent opacity-60"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          isDone
                            ? "bg-primary text-primary-foreground"
                            : isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? (
                          <Check className="h-4 w-4" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isActive ? "font-semibold text-foreground" : "text-foreground/80"
                        }`}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Disclaimer outside card */}
          <div className="flex flex-col gap-1 px-2 text-center text-xs text-muted-foreground leading-relaxed">
            <p>We weren't able to retrieve information about your destination.</p>
            <p>But rest assured—we're reviewing the link to help keep you safe.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
