import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, Link as LinkIcon, Copy, Check, ImageIcon } from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import { generateSlug, isValidUrl, savePreview } from "@/lib/storage";
import { toast } from "sonner";

export default function CreatePreviewForm() {
  const [image, setImage] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [sourceUrl, setSourceUrl] = useState("");
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return toast.error("Please add a thumbnail image");
    if (!isValidUrl(sourceUrl)) return toast.error("Enter a valid http(s) URL");

    let title = "Shared article";
    try {
      title = new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      // ignore
    }

    const slug = generateSlug();
    savePreview({
      slug,
      title,
      sourceUrl: sourceUrl.trim(),
      content: "",
      image,
      createdAt: new Date().toISOString(),
    });
    const url = `${window.location.origin}/${slug}`;
    setGenerated(url);
    setCopied(false);
    toast.success("Preview link created");
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
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && fileRef.current?.click()
            }
            className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:bg-secondary/60"
            }`}
          >
            {compressing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing image…
              </div>
            ) : image ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">Image uploaded</span>
                <span className="text-muted-foreground">
                  · {imageName || "thumbnail.jpg"}
                </span>
                <span className="text-xs text-muted-foreground">
                  (click to replace)
                </span>
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
          disabled={compressing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <LinkIcon className="h-4 w-4" />
          Generate Preview Link
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
