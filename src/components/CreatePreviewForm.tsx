import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, Link as LinkIcon, Copy, Check, X } from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import { toast } from "sonner";
import { createPreview, generateSlug } from "@/lib/previewsApi";
import { placeholderDefaultArticle } from "@/lib/articleTypes";
import { SHAREABLE_DOMAIN } from "@/lib/adminConfig";

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreatePreviewForm() {
  const [image, setImage] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generated, setGenerated] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setCompressing(true);
    try {
      const data = await compressImage(file, 40);
      setImage(data);
      setImageName(file.name);
    } catch {
      toast.error("Could not process that image");
    } finally {
      setCompressing(false);
    }
  }, []);

  function clearImage(e?: React.MouseEvent) {
    e?.stopPropagation();
    setImage("");
    setImageName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return toast.error("Please add a thumbnail image");
    if (!isValidUrl(sourceUrl)) return toast.error("Enter a valid http(s) URL");

    setSubmitting(true);
    try {
      const slug = generateSlug(6);
      await createPreview({
        slug,
        sourceUrl: sourceUrl.trim(),
        image,
        createdAt: new Date().toISOString(),
        default: placeholderDefaultArticle(sourceUrl.trim()),
      });
      const url = `${SHAREABLE_DOMAIN}/${slug}`;
      setGenerated(url);
      setCopied(false);
      toast.success("Preview link created");
    } catch (err) {
      console.error(err);
      toast.error("Could not save preview. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8"
      aria-labelledby="create-form-title"
    >
      <h2 id="create-form-title" className="sr-only">
        Create your preview link
      </h2>

      <div className="space-y-5">
        {/* Thumbnail */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Thumbnail image
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onClick={() => !image && fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              !image &&
              (e.key === "Enter" || e.key === " ") &&
              fileRef.current?.click()
            }
            className={`relative flex min-h-[110px] ${
              image ? "cursor-default" : "cursor-pointer"
            } flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:bg-secondary/60"
            }`}
          >
            {compressing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Compressing to under 40KB…
              </div>
            ) : image ? (
              <div className="relative flex w-full flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove image"
                  className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-border hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <img
                  src={image}
                  alt="Thumbnail preview"
                  className="max-h-40 rounded-md object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {imageName || "thumbnail.jpg"} · replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                <Upload className="h-5 w-5" />
                <span>
                  <span className="font-medium text-foreground">
                    Drag & drop
                  </span>{" "}
                  or click to upload
                </span>
                <span className="text-xs">Auto-compressed to ~40KB</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <label htmlFor="src" className="mb-2 block text-sm font-medium">
            Article URL
          </label>
          <input
            id="src"
            type="url"
            required
            placeholder="https://example.com/article"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={compressing || submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
          {submitting ? "Creating…" : "Generate Preview Link"}
        </button>

        {generated && (
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <p className="text-sm font-medium">Your shareable link is ready</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded bg-background px-3 py-2 text-sm">
                {generated}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  copied
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-secondary"
                }`}
                aria-live="polite"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Link copied!" : "Copy link"}
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-xs text-primary">
                Copied to clipboard — paste it anywhere to share.
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
