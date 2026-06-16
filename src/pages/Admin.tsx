import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  CheckCircle2,
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
  countryName,
} from "@/lib/adminConfig";
import {
  DEFAULT_ID,
  deleteArticle,
  listAllArticles,
  saveArticle,
} from "@/lib/articlesApi";
import type { Article } from "@/lib/articleTypes";
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
  const [articles, setArticles] = useState<Record<string, Article>>({});
  const [active, setActive] = useState<string | null>(null); // country code or DEFAULT_ID
  const [draft, setDraft] = useState<Article>(emptyArticle());
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const all = await listAllArticles();
      setArticles(all);
    } catch (e) {
      console.error(e);
      toast.error("Could not load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openEditor(id: string) {
    setActive(id);
    setDraft(articles[id] ?? emptyArticle());
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    try {
      await saveArticle(active, draft);
      setArticles((prev) => ({ ...prev, [active]: draft }));
      toast.success("Saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function removeCountry(code: string) {
    if (code === DEFAULT_ID) return;
    if (
      !confirm(
        `Delete the article for ${countryName(code)}? Visitors from this country will fall back to the default article.`,
      )
    )
      return;
    try {
      await deleteArticle(code);
      setArticles((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
      if (active === code) setActive(null);
      toast.success("Removed");
    } catch {
      toast.error("Could not remove");
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-5 flex items-center justify-end">
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </header>

      {/* Country list — Rest of the world on top, then each priority country */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3.5 w-3.5" /> Articles by country (global — applies to every preview link)
        </div>

        <ul className="divide-y divide-border">
          {/* Rest of the world (default) */}
          <CountryRow
            index={0}
            flag="🌐"
            name="Rest of the world"
            subtitle="Default — used when no country override applies"
            title={articles[DEFAULT_ID]?.title}
            isDefault
            onEdit={() => openEditor(DEFAULT_ID)}
          />

          {PRIORITY_COUNTRY_CODES.map((code, i) => {
            const c = COUNTRIES.find((x) => x.code === code);
            if (!c) return null;
            const override = articles[code];
            const hasCustom = !!override;
            return (
              <CountryRow
                key={code}
                index={i + 1}
                flag={c.flag}
                name={c.name}
                title={hasCustom ? override.title : ""}
                hasCustom={hasCustom}
                onEdit={() => openEditor(code)}
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

      {active && (
        <CountryEditorModal
          countryLabel={
            active === DEFAULT_ID
              ? "Rest of the world (Default)"
              : `${COUNTRIES.find((c) => c.code === active)?.flag ?? ""} ${countryName(active)}`
          }
          article={draft}
          onChange={setDraft}
          onClose={() => setActive(null)}
          onSave={save}
          saving={saving}
        />
      )}
    </>
  );
}

function CountryRow({
  index,
  flag,
  name,
  subtitle,
  title,
  hasCustom,
  isDefault,
  onEdit,
  onRemove,
}: {
  index: number;
  flag: string;
  name: string;
  subtitle?: string;
  title?: string;
  hasCustom?: boolean;
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
      <span className="w-6 flex-none text-right text-xs tabular-nums text-muted-foreground">
        {index}.
      </span>
      <span className="text-xl leading-none">{flag}</span>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="w-48 flex-none min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {subtitle ?? (hasCustom ? "Custom article" : "Using default")}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {title ? (
            <>
              <span className="truncate text-sm text-foreground">{title}</span>
              {/* Delete sits inline next to the article title, only when an override exists */}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={`Delete ${name} article`}
                  title="Delete this country's article (falls back to default)"
                  className="inline-flex flex-none items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
            </>
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
      </div>
    </li>
  );
}

function CountryEditorModal({
  countryLabel,
  article,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  countryLabel: string;
  article: Article;
  onChange: (next: Article) => void;
  onClose: () => void;
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
