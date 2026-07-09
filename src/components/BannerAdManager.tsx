import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compressImage";
import { getBannerAd, saveBannerAd } from "@/lib/bannerAdApi";

export default function BannerAdManager() {
  const [image, setImage] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBannerAd()
      .then((ad) => {
        setImage(ad.image);
        setTitle(ad.title);
        setUrl(ad.url);
        setUpdatedAt(ad.updatedAt);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, 40);
      setImage(compressed);
      const approxKB = Math.ceil((compressed.length * 0.75) / 1024);
      toast.success(`Image ready (~${approxKB} KB)`);
    } catch (e) {
      console.error(e);
      toast.error("Could not process image");
    } finally {
      setCompressing(false);
    }
  }

  function clearImage() {
    setImage("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handlePost() {
    if (!image) return toast.error("Please upload a banner image");
    if (!title.trim()) return toast.error("Please enter a title");
    if (!url.trim()) return toast.error("Please enter a destination link");
    const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setSaving(true);
    try {
      await saveBannerAd({ image, title: title.trim(), url: target });
      setUpdatedAt(new Date().toISOString());
      toast.success("Banner ad updated on preview pages");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update banner ad");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Banner Ad</h2>

        {/* Image uploader */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Banner image (auto-compressed to ~40 KB)
          </label>
          {image ? (
            <div className="relative overflow-hidden rounded-lg border border-border bg-secondary/30">
              <img src={image} alt="Banner preview" className="max-h-64 w-full object-contain" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-10 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              {compressing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <span>{compressing ? "Compressing…" : "Click to upload banner image"}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Title (shown below the banner)
          </label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            placeholder="Enter promotional title…"
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Destination link */}
        <div className="mb-5">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Destination link (opens when banner or title is clicked)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/offer"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString()}` : "No previous update"}
          </p>
          <button
            onClick={handlePost}
            disabled={saving || compressing}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post Ads
          </button>
        </div>
      </section>

      {/* Live preview */}
      <aside className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <ImageIcon className="h-4 w-4" /> Preview
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-lg bg-background p-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Advertisement</span>
          {image ? (
            <img src={image} alt="Preview" className="w-full rounded-lg object-contain" />
          ) : (
            <div className="grid h-32 w-full place-items-center rounded-lg bg-secondary text-xs text-muted-foreground">
              No image
            </div>
          )}
          <p className="text-center text-sm font-medium text-foreground">
            {title || "Title appears here"}
          </p>
        </div>
      </aside>
    </div>
  );
}
