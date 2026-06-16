import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  ImagePlus,
  Loader2,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import { toast } from "sonner";
import ArticleRenderer from "@/components/ArticleRenderer";
import RichTextEditor from "@/components/RichTextEditor";
import type { Article, Block } from "@/lib/articleTypes";
import { newId } from "@/lib/articleTypes";

type Props = {
  value: Article;
  onChange: (next: Article) => void;
  countryLabel: string;
};

export default function ArticleEditor({ value, onChange, countryLabel }: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function update(next: Partial<Article>) {
    onChange({ ...value, ...next });
  }
  function updateBlock(id: string, patch: Partial<Block>) {
    onChange({
      ...value,
      blocks: value.blocks.map((b) =>
        b.id === id ? ({ ...b, ...patch } as Block) : b,
      ),
    });
  }
  function removeBlock(id: string) {
    onChange({ ...value, blocks: value.blocks.filter((b) => b.id !== id) });
  }
  function move(id: string, dir: -1 | 1) {
    const idx = value.blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const next = [...value.blocks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...value, blocks: next });
  }
  function addBlock(type: Block["type"]) {
    const base =
      type === "text"
        ? { id: newId(), type: "text" as const, html: "" }
        : type === "image"
          ? { id: newId(), type: "image" as const, src: "", alt: "" }
          : { id: newId(), type: "cta" as const, label: "Read more", url: "" };
    onChange({ ...value, blocks: [...value.blocks, base] });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Editing:</span>{" "}
          <span className="font-medium">{countryLabel}</span>
        </div>
        <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`inline-flex items-center gap-1 rounded px-3 py-1.5 ${mode === "edit" ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`inline-flex items-center gap-1 rounded px-3 py-1.5 ${mode === "preview" ? "bg-secondary font-medium" : "text-muted-foreground"}`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>

      {mode === "preview" ? (
        <div className="p-4 sm:p-6">
          <ArticleRenderer article={value} />
        </div>
      ) : (
        <div className="space-y-4 p-4 sm:p-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Article title
            </label>
            <input
              type="text"
              value={value.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="A compelling article title…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base font-semibold outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {value.blocks.length === 0 && (
            <p className="rounded-md border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
              No content yet — add a block below.
            </p>
          )}

          <div className="space-y-3">
            {value.blocks.map((b, i) => (
              <BlockEditor
                key={b.id}
                block={b}
                onChange={(patch) => updateBlock(b.id, patch)}
                onRemove={() => removeBlock(b.id)}
                onMoveUp={i > 0 ? () => move(b.id, -1) : undefined}
                onMoveDown={
                  i < value.blocks.length - 1 ? () => move(b.id, 1) : undefined
                }
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Plus className="h-3.5 w-3.5" /> Add block:
            </span>
            <ToolBtn onClick={() => addBlock("text")} icon={<Type className="h-3.5 w-3.5" />}>
              Text
            </ToolBtn>
            <ToolBtn onClick={() => addBlock("image")} icon={<ImagePlus className="h-3.5 w-3.5" />}>
              Image
            </ToolBtn>
            <ToolBtn
              onClick={() => addBlock("cta")}
              icon={<MousePointerClick className="h-3.5 w-3.5" />}
            >
              CTA button
            </ToolBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
    >
      {icon}
      {children}
    </button>
  );
}

function BlockEditor({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setBusy(true);
    try {
      const data = await compressImage(file, 60);
      onChange({ src: data } as Partial<Block>);
    } catch {
      toast.error("Couldn't process image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group rounded-lg border border-border bg-background/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="rounded bg-secondary px-2 py-0.5 font-medium uppercase tracking-wide text-muted-foreground">
          {block.type}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" onClick={onMoveUp} disabled={!onMoveUp}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Move down" onClick={onMoveDown} disabled={!onMoveDown}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {block.type === "text" && (
        <RichTextEditor
          value={block.html}
          onChange={(html) => onChange({ html } as Partial<Block>)}
          placeholder="Write your paragraph…"
        />
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          {block.src ? (
            <div className="relative">
              <img src={block.src} alt={block.alt || ""} className="w-full rounded-md" />
              <button
                type="button"
                onClick={() => onChange({ src: "" } as Partial<Block>)}
                className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-1 text-xs ring-1 ring-border hover:bg-secondary"
              >
                Replace
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-secondary/30 px-3 py-6 text-sm text-muted-foreground hover:bg-secondary/60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {busy ? "Compressing…" : "Upload image"}
              </button>
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">or paste URL</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) onChange({ src: v } as Partial<Block>);
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) onChange({ src: v } as Partial<Block>);
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
            }}
          />
          <input
            type="text"
            value={block.alt || ""}
            onChange={(e) => onChange({ alt: e.target.value } as Partial<Block>)}
            placeholder="Alt text (optional)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {block.type === "cta" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={block.label}
            onChange={(e) => onChange({ label: e.target.value } as Partial<Block>)}
            placeholder="Button label"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="url"
            value={block.url}
            onChange={(e) => onChange({ url: e.target.value } as Partial<Block>)}
            placeholder="https://destination.com"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-7 w-7 place-items-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-secondary disabled:opacity-30 ${
        danger ? "hover:text-destructive" : ""
      }`}
    >
      {children}
    </button>
  );
}
