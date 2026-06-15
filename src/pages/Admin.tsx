import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  CheckCircle2,
  ChevronLeft,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_PASSWORD,
  COUNTRIES,
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
  const [active, setActive] = useState<string>("ALL");
  const [saving, setSaving] = useState(false);

  const activeArticle =
    active === "ALL" ? defaultArticle : countries[active] || emptyArticle();

  function updateActive(next: Article) {
    if (active === "ALL") {
      setDefaultArticle(next);
    } else {
      setCountries({ ...countries, [active]: next });
    }
  }

  function addCountry(code: string) {
    if (!code || code === "ALL") return;
    if (!countries[code]) {
      setCountries({ ...countries, [code]: emptyArticle(defaultArticle.title) });
    }
    setActive(code);
  }

  function removeCountry(code: string) {
    if (!confirm(`Remove override for ${countryName(code)}? Visitors will see the default again.`)) return;
    const next = { ...countries };
    delete next[code];
    setCountries(next);
    if (active === code) setActive("ALL");
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

  const availableToAdd = useMemo(
    () => COUNTRIES.filter((c) => !countries[c.code]),
    [countries],
  );
  const overrideCodes = Object.keys(countries);

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

      {/* Country selector */}
      <div className="mb-4 rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3.5 w-3.5" /> Country filter
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CountryChip
            active={active === "ALL"}
            onClick={() => setActive("ALL")}
            label="🌐 Default (all)"
            isDefault
          />
          {overrideCodes.map((code) => {
            const c = COUNTRIES.find((x) => x.code === code);
            return (
              <CountryChip
                key={code}
                active={active === code}
                onClick={() => setActive(code)}
                label={`${c?.flag || ""} ${c?.name || code}`}
                onRemove={() => removeCountry(code)}
              />
            );
          })}
          <AddCountryMenu options={availableToAdd} onPick={addCountry} />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3 w-3 text-primary" />
          Visitors from a country with an override see that article. Everyone else
          sees the Default.
        </p>
      </div>

      <ArticleEditor
        value={activeArticle}
        onChange={updateActive}
        countryLabel={active === "ALL" ? "Default (all countries)" : countryName(active)}
      />
    </>
  );
}

function CountryChip({
  active,
  onClick,
  label,
  onRemove,
  isDefault,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  onRemove?: () => void;
  isDefault?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary"
      }`}
    >
      <button type="button" onClick={onClick} className="font-medium">
        {label}
      </button>
      {onRemove && !isDefault && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove override"
          className={`ml-0.5 rounded-full p-0.5 ${active ? "hover:bg-primary-foreground/20" : "hover:bg-secondary"}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

function AddCountryMenu({
  options,
  onPick,
}: {
  options: { code: string; name: string; flag: string }[];
  onPick: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = options.filter((c) =>
    (c.name + " " + c.code).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
      >
        <Plus className="h-3 w-3" /> Add country
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-64 rounded-md border border-border bg-popover p-2 shadow-md">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search countries…"
            className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No matches
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onPick(c.code);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-secondary"
              >
                <span>{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
