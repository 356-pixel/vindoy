import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  ChevronDown,
  Filter,
  Loader2,
  Lock,
  LogOut,
  MousePointerClick,
  Link as LinkIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PASSWORD, ALLOWED_TRACKING_IDS, SHAREABLE_DOMAIN } from "@/lib/adminConfig";
import { listPreviews } from "@/lib/previewsApi";
import type { PreviewDoc } from "@/lib/articleTypes";
import { utcDateString } from "@/lib/analytics";

const SESSION_KEY = "vindoy_admin_auth";
const MIN_CLICKS_OPTIONS = [100, 150, 200] as const;

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
  });

  return (
    <Layout>
      <SEO title="Admin · Vindoy" />
      <div className="container max-w-6xl py-8">
        {authed ? (
          <AnalyticsDashboard
            onLogout={() => {
              try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
              setAuthed(false);
            }}
          />
        ) : (
          <LoginGate onSuccess={() => {
            try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
            setAuthed(true);
          }} />
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
          if (pw === ADMIN_PASSWORD) { onSuccess(); toast.success("Welcome back"); }
          else toast.error("Wrong password");
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

function defaultFromDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 29);
  return utcDateString(d);
}

function dateOnly(iso: string): string {
  // createdAt is stored as ISO string. Use UTC date portion.
  return iso ? iso.slice(0, 10) : "";
}

type DateRow = {
  date: string;
  qualifyingLinks: number;
  totalClicks: number;
  links: { slug: string; shortUrl: string; clicks: number; trackingId: string }[];
};

function AnalyticsDashboard({ onLogout }: { onLogout: () => void }) {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate());
  const [toDate, setToDate] = useState<string>(utcDateString());
  const [trackingFilter, setTrackingFilter] = useState<string>("");
  const [minClicks, setMinClicks] = useState<number>(100);
  const [data, setData] = useState<PreviewDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setOpenRow(null);
    try {
      const fresh = await listPreviews();
      setData(fresh);
      setFetched(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  const trackingOptions = useMemo(() => {
    const ids = data.map((p) => p.trackingId).filter((x): x is string => !!x);
    return [...new Set([...ids, ...ALLOWED_TRACKING_IDS])].sort();
  }, [data]);

  const dateRows: DateRow[] = useMemo(() => {
    const byDate = new Map<string, DateRow>();
    for (const p of data) {
      if (!p.trackingId) continue;
      if (trackingFilter && p.trackingId !== trackingFilter) continue;
      const clicks = Number(p.clicks || 0);
      if (clicks < minClicks) continue;
      const date = dateOnly(p.createdAt);
      if (!date) continue;
      if (date < fromDate || date > toDate) continue;
      if (!byDate.has(date)) {
        byDate.set(date, { date, qualifyingLinks: 0, totalClicks: 0, links: [] });
      }
      const row = byDate.get(date)!;
      row.qualifyingLinks += 1;
      row.totalClicks += clicks;
      row.links.push({
        slug: p.slug,
        shortUrl: `${SHAREABLE_DOMAIN}/${p.slug}`,
        clicks,
        trackingId: p.trackingId,
      });
    }
    return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data, fromDate, toDate, trackingFilter, minClicks]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Real-time fetch from previews · click "Fetch Data" to refresh
          </p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </header>

      {/* FILTERS */}
      <section className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-medium text-muted-foreground">
            From date
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={utcDateString()}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Tracking ID
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Tracking IDs</option>
              {trackingOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Min. Clicks
            <select
              value={minClicks}
              onChange={(e) => setMinClicks(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {MIN_CLICKS_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Fetch Data
          </button>
        </div>
      </section>

      {/* TABLE: GROUPED BY DATE (DESC) */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr] gap-2 border-b border-border bg-secondary/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span />
          <span>Date</span>
          <span className="text-right">Links (≥ {minClicks} clicks)</span>
          <span className="text-right">Total clicks</span>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !fetched ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Set your filters and click <span className="font-semibold text-foreground">Fetch Data</span> to load analytics.
          </div>
        ) : dateRows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No links with ≥ {minClicks} clicks in this range.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {dateRows.map((row) => {
              const open = openRow === row.date;
              const sortedLinks = [...row.links].sort((a, b) => b.clicks - a.clicks);
              return (
                <li key={row.date}>
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : row.date)}
                    className="grid w-full grid-cols-[1.5rem_1fr_1fr_1fr] items-center gap-2 px-3 py-3 text-left text-sm hover:bg-secondary/40"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    />
                    <span className="font-medium">{row.date}</span>
                    <span className="text-right tabular-nums">{row.qualifyingLinks.toLocaleString()}</span>
                    <span className="text-right tabular-nums font-semibold">{row.totalClicks.toLocaleString()}</span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-background/40 px-4 py-3">
                      <ul className="divide-y divide-border/60">
                        {sortedLinks.map((l) => {
                          const url = l.shortUrl;
                          return (
                            <li key={l.slug} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-w-0 items-center gap-1.5 truncate text-primary hover:underline"
                              >
                                <LinkIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                                <span className="ml-1 shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{l.trackingId}</span>
                              </a>
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                <MousePointerClick className="h-3 w-3" />
                                {l.clicks.toLocaleString()}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
