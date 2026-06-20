import { useState } from "react";
import { Loader2, Link2, Copy, Check, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createPreview, generateUniqueSlug } from "@/lib/previewsApi";
import { placeholderDefaultArticle } from "@/lib/articleTypes";
import { SHAREABLE_DOMAIN } from "@/lib/adminConfig";

// 1x1 transparent gif — placeholder so backend image field is satisfied.
const PLACEHOLDER_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ShortenForm() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = sourceUrl.trim();
    if (!isValidUrl(url)) return toast.error("Please enter a valid http(s) URL");

    setSubmitting(true);
    try {
      const slug = generateSlug(6);
      await createPreview({
        slug,
        sourceUrl: url,
        image: PLACEHOLDER_IMG,
        createdAt: new Date().toISOString(),
        default: placeholderDefaultArticle(url),
      });
      setGenerated(`${SHAREABLE_DOMAIN}/${slug}`);
      setCopied(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not shorten that URL. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setGenerated("");
    setSourceUrl("");
    setCopied(false);
  }

  if (generated) {
    return (
      <div className="relative">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-30 blur-lg" aria-hidden />
        <div className="relative rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Your shortened URL
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Copy the short link and share it
          </p>

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row">
            <code className="flex-1 truncate rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-center text-base font-medium text-foreground sm:text-left">
              {generated}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/60 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" />
            Shorten Another URL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-30 blur-lg" aria-hidden />
      <form
        onSubmit={onSubmit}
        className="relative rounded-2xl border border-border/60 bg-card/70 p-4 shadow-xl backdrop-blur-xl sm:p-6"
      >
        <label htmlFor="src-url" className="sr-only">
          URL to shorten
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="src-url"
              type="url"
              required
              autoComplete="off"
              placeholder="Paste your Twitter/X video URL or any link..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="h-14 w-full rounded-xl border border-border/60 bg-background/80 pl-12 pr-4 text-base text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 sm:h-16 sm:text-lg"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:h-16 sm:px-8"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {submitting ? "Shortening…" : "Shorten"}
          </button>
        </div>
      </form>
    </div>
  );
}
