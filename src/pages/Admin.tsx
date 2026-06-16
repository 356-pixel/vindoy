import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Loader2, Lock, LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PASSWORD } from "@/lib/adminConfig";
import { DEFAULT_ID, getDefaultArticle, saveArticle } from "@/lib/articlesApi";
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
      <div className="container max-w-4xl py-8">
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
  const [draft, setDraft] = useState<Article>(emptyArticle());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await getDefaultArticle();
        if (a) setDraft(a);
      } catch (e) {
        console.error(e);
        toast.error("Could not load article");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await saveArticle(DEFAULT_ID, draft);
      toast.success("Article saved — live on every preview page");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Save failed:", e);
      toast.error(`Could not save: ${msg}`);
    } finally {
      setSaving(false);
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
          <h1 className="text-lg font-semibold">Default article</h1>
          <p className="text-xs text-muted-foreground">
            This article is shown on every preview page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      <ArticleEditor value={draft} onChange={setDraft} countryLabel="Default article (all visitors)" />
    </>
  );
}
