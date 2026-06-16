import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { CheckCircle2, Circle, FileText, Loader2, Lock, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PASSWORD } from "@/lib/adminConfig";
import {
  deleteArticle,
  getActiveArticleId,
  listArticles,
  newArticleId,
  saveArticle,
  setActiveArticleId,
  type ArticleMeta,
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

function formatDate(ms: number) {
  try {
    return new Date(ms).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Article>(emptyArticle());
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [list, active] = await Promise.all([listArticles(), getActiveArticleId()]);
    setArticles(list);
    setActiveId(active);
    return { list, active };
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error(e);
        toast.error("Could not load articles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const editing = useMemo(
    () => articles.find((a) => a.id === editingId),
    [articles, editingId],
  );

  function startNew() {
    setIsNew(true);
    setEditingId(newArticleId());
    setDraft(emptyArticle());
  }

  function startEdit(meta: ArticleMeta) {
    setIsNew(false);
    setEditingId(meta.id);
    setDraft(meta.article);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsNew(false);
    setDraft(emptyArticle());
  }

  async function save() {
    if (!editingId) return;
    setSaving(true);
    try {
      await saveArticle(editingId, draft, isNew);
      // If this is the first article, mark it active automatically
      const list = await listArticles();
      let active = activeId;
      if (!active && list.length > 0) {
        await setActiveArticleId(editingId);
        active = editingId;
      }
      setArticles(list);
      setActiveId(active);
      setIsNew(false);
      toast.success("Article saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Save failed:", e);
      toast.error(`Could not save: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  async function makeActive(id: string) {
    try {
      await setActiveArticleId(id);
      setActiveId(id);
      toast.success("Now shown on all preview links");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Could not update: ${msg}`);
    }
  }

  async function remove(meta: ArticleMeta) {
    if (!confirm(`Delete "${meta.article.title || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await deleteArticle(meta.id);
      if (editingId === meta.id) cancelEdit();
      const { active } = await refresh();
      if (active === meta.id) {
        toast.message("Heads up: the active article was deleted. Pick a new one.");
      } else {
        toast.success("Deleted");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Could not delete: ${msg}`);
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
      <header className="mb-5 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Articles</h1>
          <p className="text-xs text-muted-foreground">
            Pick one article to show on every preview link.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New article
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      <section className="mb-6 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          All articles ({articles.length})
        </div>
        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No articles yet. Click <span className="font-medium">New article</span> to write your first one.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {articles.map((meta) => {
              const isActive = activeId === meta.id;
              const isEditing = editingId === meta.id;
              return (
                <li
                  key={meta.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                    isEditing ? "bg-secondary/40" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => makeActive(meta.id)}
                    title={isActive ? "Currently active" : "Make this the active article"}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="truncate text-sm font-medium">
                        {meta.article.title || "Untitled article"}
                      </p>
                      {isActive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Published {formatDate(meta.createdAt)}
                      {meta.updatedAt && meta.updatedAt - meta.createdAt > 1000 ? (
                        <> · Updated {formatDate(meta.updatedAt)}</>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(meta)}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(meta)}
                      aria-label="Delete"
                      className="grid h-8 w-8 place-items-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editingId && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {isNew ? "New article" : `Editing: ${editing?.article.title || "Untitled"}`}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>

          <ArticleEditor
            value={draft}
            onChange={setDraft}
            countryLabel={isNew ? "New article" : "Existing article"}
          />
        </section>
      )}
    </>
  );
}
