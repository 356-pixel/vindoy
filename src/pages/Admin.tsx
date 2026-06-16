import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  CheckCircle2,
  ChevronLeft,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_PASSWORD,
  COUNTRIES,
  PRIORITY_COUNTRY_CODES,
  SHAREABLE_DOMAIN,
  countryName,
} from "@/lib/adminConfig";
import {
  deletePreview,
  listPreviews,
  updatePreviewArticles,
} from "@/lib/previewsApi";
import type { Article, PreviewDoc } from "@/lib/articleTypes";
import { emptyArticle } from "@/lib/articleTypes";
import ArticleEditor from "@/components/ArticleEditor";

const SESSION_KEY = "vindoy_admin_auth";

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  return (
    <Layout>
      <SEO title="Admin · Vindoy" />
      <div className="container max-w-5xl py-8">
        {authed ? (
          <AdminDashboard
            onLogout={() => {
              try {
                sessionStorage.removeItem(SESSION_KEY);
              } catch {
                // ignore
              }
              setAuthed(false);
            }}
          />
        ) : (
          <LoginGate
            onSuccess={() => {
              try {
                sessionStorage.setItem(SESSION_KEY, "1");
              } catch {
                // ignore
              }
              setAuthed(true);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-semibold">Vindoy Admin</h1>
          <p className="text-xs text-muted-foreground">Enter password to continue.</p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pw === ADMIN_PASSWORD) {
            onSuccess();
            toast.success("Welcome back");
          } else {
            toast.error("Wrong password");
          }
        }}
        className="space-y-3"
      >
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PreviewDoc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listPreviews();
      setItems(list);
    } catch (e) {
      console.error(e);
      toast.error("Could not load previews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const current = selected ? items.find((i) => i.slug === selected) : null;

  if (current) {
    return (
      <PreviewEditor
        preview={current}
        onBack={() => setSelected(null)}
        onSaved={(updated) => {
          setItems((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
        }}
        onLogout={onLogout}
      />
    );
  }

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Previews</h1>
          <p className="text-sm text-muted-foreground">
            Edit per-country articles for every shareable link.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-10 text-center text-sm text-muted-foreground">
          No previews yet. Create one from the home page.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((p) => (
            <li
              key={p.slug}
              className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
            >
              <img
                src={p.image}
                alt=""
                className="h-20 w-28 flex-none rounded-md object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="truncate text-sm font-semibold">
                  {p.default?.title || p.slug}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {SHAREABLE_DOMAIN}/{p.slug}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {Object.keys(p.countries || {}).length} country override
                  {Object.keys(p.countries || {}).length === 1 ? "" : "s"}
                </div>
                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    onClick={() => setSelected(p.slug)}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this preview link?")) return;
                      try {
                        await deletePreview(p.slug);
                        setItems((prev) => prev.filter((i) => i.slug !== p.slug));
                        toast.success("Deleted");
                      } catch {
                        toast.error("Could not delete");
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PreviewEditor({
  preview,
  onBack,
  onSaved,
  onLogout,
}: {
  preview: PreviewDoc;
  onBack: () => void;
  onSaved: (next: PreviewDoc) => void;
  onLogout: () => void;
}) {
  const [defaultArticle, setDefaultArticle] = useState<Article>(
    preview.default || emptyArticle(),
  );
  const [countries, setCountries] = useState<Record<string, Article>>(
    preview.countries || {},
  );
  const [active, setActive] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeArticle: Article =
    active === null
      ? defaultArticle
      : active === "ALL"
        ? defaultArticle
        : countries[active] ||
          { ...defaultArticle, title: defaultArticle.title };

  function updateActive(next: Article) {
    if (active === "ALL" || active === null) {
      setDefaultArticle(next);
    } else {
      setCountries({ ...countries, [active]: next });
    }
  }

  function removeCountry(code: string) {
    if (!confirm(`Remove override for ${countryName(code)}? Visitors will see the default again.`)) return;
    const next = { ...countries };
    delete next[code];
    setCountries(next);
    if (active === code) setActive(null);
  }

  async function save() {
    setSaving(true);
    try {
      await updatePreviewArticles(preview.slug, defaultArticle, countries);
      onSaved({ ...preview, default: defaultArticle, countries });
      toast.success("Saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }


  return (
    <>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">
              {preview.default?.title || preview.slug}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {SHAREABLE_DOMAIN}/{preview.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save changes
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Country list — Rest of the world on top, then each priority country */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3.5 w-3.5" /> Articles by country
        </div>

        <ul className="divide-y divide-border">
          {/* Rest of the world (default) */}
          <CountryRow
            flag="🌐"
            name="Rest of the world"
            subtitle="Default — used when no country override applies"
            title={defaultArticle?.title}
            hasCustom={true}
            isDefault
            onEdit={() => setActive("ALL")}
          />

          {PRIORITY_COUNTRY_CODES.map((code) => {
            const c = COUNTRIES.find((x) => x.code === code);
            if (!c) return null;
            const override = countries[code];
            const hasCustom = !!override;
            return (
              <CountryRow
                key={code}
                flag={c.flag}
                name={c.name}
                title={hasCustom ? override.title : ""}
                hasCustom={hasCustom}
                onEdit={() => setActive(code)}
                onRemove={hasCustom ? () => removeCountry(code) : undefined}
              />
            );
          })}
        </ul>

        <p className="flex items-start gap-1.5 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3 w-3 text-primary" />
          Countries without a custom article will fall back to "Rest of the world".
        </p>
      </div>

      {/* Floating editor modal */}
      {active && (
        <CountryEditorModal
          countryLabel={active === "ALL" ? "Rest of the world (Default)" : `${COUNTRIES.find((c) => c.code === active)?.flag ?? ""} ${countryName(active)}`}
          article={activeArticle}
          onChange={updateActive}
          onClose={() => setActive(null)}
          onRemove={
            active !== "ALL" && countries[active]
              ? () => {
                  removeCountry(active);
                }
              : undefined
          }
          onSave={async () => {
            await save();
          }}
          saving={saving}
        />
      )}
    </>
  );
}

function CountryRow({
  flag,
  name,
  subtitle,
  title,
  hasCustom,
  isDefault,
  onEdit,
  onRemove,
}: {
  flag: string;
  name: string;
  subtitle?: string;
  title?: string;
  hasCustom: boolean;
  isDefault?: boolean;
  onEdit: () => void;
  onRemove?: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40 ${
        isDefault ? "bg-primary/5" : ""
      }`}
    >
      <span className="text-xl leading-none">{flag}</span>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="w-48 flex-none min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {subtitle ?? (hasCustom ? "Custom article" : "Using default")}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {title ? (
            <span className="truncate text-sm text-foreground">{title}</span>
          ) : (
            <span className="text-xs italic text-muted-foreground">
              {isDefault ? "No title yet" : "— blank (uses default)"}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${name}`}
          title="Edit"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete ${name} override`}
            title="Delete custom article"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </li>
  );
}

function CountryEditorModal({
  countryLabel,
  article,
  onChange,
  onClose,
  onRemove,
  onSave,
  saving,
}: {
  countryLabel: string;
  article: Article;
  onChange: (next: Article) => void;
  onClose: () => void;
  onRemove?: () => void;
  onSave: () => Promise<void> | void;
  saving: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-background shadow-xl sm:h-[90vh] sm:rounded-2xl sm:border sm:border-border">
        <div className="flex flex-none items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Writing article for
            </div>
            <h2 className="truncate text-base font-semibold">{countryLabel}</h2>
          </div>
          <div className="flex flex-none items-center gap-2">
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ArticleEditor value={article} onChange={onChange} countryLabel={countryLabel} />
        </div>
      </div>
    </div>
  );
}

