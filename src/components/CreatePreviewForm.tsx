import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import {
  generateSlug,
  isValidUrl,
  sanitize,
  savePreview,
  wordCount,
} from "@/lib/storage";
import { toast } from "sonner";

const MAX_WORDS = 500;
const MAX_TITLE = 120;

export default function CreatePreviewForm() {
  const [image, setImage] = useState<string>("");
  const [imageSize, setImageSize] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generated, setGenerated] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const words = wordCount(content);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setCompressing(true);
    try {
      const data = await compressImage(file, 40);
      setImage(data);
      const bytes = Math.ceil((data.length - 23) * 0.75);
      setImageSize(Math.round(bytes / 1024));
    } catch {
      toast.error("Could not process that image");
    } finally {
      setCompressing(false);
    }
  }, []);

  useEffect(() => {
    const t = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f) handleFile(f);
    };
    window.addEventListener("paste", t);
    return () => window.removeEventListener("paste", t);
  }, [handleFile]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return toast.error("Please add a cover image");
    if (!isValidUrl(sourceUrl)) return toast.error("Enter a valid http(s) URL");
    if (!title.trim()) return toast.error("Title is required");
    if (title.length > MAX_TITLE) return toast.error("Title is too long");
    if (!content.trim()) return toast.error("Preview content is required");
    if (words > MAX_WORDS) return toast.error("Preview exceeds 500 words");

    const slug = generateSlug();
    savePreview({
      slug,
      title: sanitize(title.trim()),
      sourceUrl: sourceUrl.trim(),
      content: sanitize(content.trim()),
      image,
      createdAt: new Date().toISOString(),
    });
    const url = `${window.location.origin}/${slug}`;
    setGenerated(url);
    toast.success("Preview link created");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8"
      aria-labelledby="create-form-title"
    >
      <h2
        id="create-form-title"
        className="text-2xl font-semibold tracking-tight"
      >
        Create your article preview
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a cover image, the source link, and a short summary up to 500 words.
      </p>

      <div className="mt-6 space-y-5">
        {/* Image */}
        <div>
          <label className="mb-2 block text-sm font-medium">Cover image</label>
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
            className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:bg-secondary/60"
            }`}
          >
            {image ? (
              <>
                <img
                  src={image}
                  alt="Cover preview"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="relative z-10 m-3 rounded-md bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur">
                  ~{imageSize} KB · click to replace
                </div>
              </>
            ) : compressing ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Compressing image…
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span>
                  <span className="font-medium text-foreground">
                    Drag & drop
                  </span>{" "}
                  or click to upload
                </span>
                <span className="text-xs">
                  Compressed automatically to ~40 KB
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
            Source website URL
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

        {/* Title */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="title" className="block text-sm font-medium">
              Article title
            </label>
            <span
              className={`text-xs ${
                title.length > MAX_TITLE
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {title.length}/{MAX_TITLE}
            </span>
          </div>
          <input
            id="title"
            type="text"
            required
            maxLength={MAX_TITLE}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A short, descriptive headline"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Content */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="content" className="block text-sm font-medium">
              Preview content
            </label>
            <span
              className={`text-xs ${
                words > MAX_WORDS ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {words}/{MAX_WORDS} words
            </span>
          </div>
          <textarea
            id="content"
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Summarize the article in your own words…"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed shadow-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={compressing || words > MAX_WORDS}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          <LinkIcon className="h-4 w-4" />
          Generate Unique Preview Link
        </button>

        {generated && (
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <p className="text-sm font-medium">Your preview link is ready</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded bg-background px-3 py-2 text-sm">
                {generated}
              </code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-secondary"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/${generated.split("/").pop()}`)}
                  className="inline-flex items-center rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
