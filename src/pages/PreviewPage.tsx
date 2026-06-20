import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPreviewDoc } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";

function normalizeUrl(url: string) {
  if (!url) return url;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function PreviewPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PreviewDoc | null | undefined>(undefined);

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
        const target = normalizeUrl(d.sourceUrl);
        if (target) {
          const form = document.createElement('form');
          form.action = target;
          form.method = 'GET';
          form.setAttribute('rel', 'noreferrer');
          document.body.appendChild(form);
          form.submit();
        } else {
          navigate("/404", { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) navigate("/404", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">Redirecting...</p>
      </div>

      {preview?.sourceUrl && (
        <a id="redirectLink" href={normalizeUrl(preview.sourceUrl)} className="hidden" />
      )}
    </main>
  );
}
