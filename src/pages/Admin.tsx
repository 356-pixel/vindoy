import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import {
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  Lock,
  LogOut,
  MousePointerClick,
  RefreshCw,
  Search,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PASSWORD, SHAREABLE_DOMAIN } from "@/lib/adminConfig";
import {
  fetchAnalytics,
  rollupByDateTracking,
  summariseTotals,
  type AnalyticsStatDoc,
  type DailyTrackingRow,
} from "@/lib/analyticsApi";
import { nextBatchBoundary, RETENTION_DAYS, utcDateString } from "@/lib/analytics";

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
      <div className="container max-w-6xl py-8">
        {authed ? (
          <AnalyticsDashboard
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

function defaultFromDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 29);
  return utcDateString(d);
}

const CACHE_KEY = "vindoy_admin_analytics_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — well under the 4h batch cycle.

type CacheBlob = { ts: number; key: string; data: AnalyticsStatDoc[] };

function loadCache(key: string): AnalyticsStatDoc[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheBlob;
    if (parsed.key !== key) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(key: string, data: AnalyticsStatDoc[]) {
  try {
    const blob: CacheBlob = { ts: Date.now(), key, data };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(blob));
  } catch {
    // ignore
  }
}

function AnalyticsDashboard({ onLogout }: { onLogout: () => void }) {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate());
  const [toDate, setToDate] = useState<string>(utcDateString());
  const [trackingFilter, setTrackingFilter] = useState<string>("");
  const [docs, setDocs] = useState<AnalyticsStatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const cacheKey = `${fromDate}|${toDate}|${trackingFilter.trim().toLowerCase()}`;

  async function load(forceFresh = false) {
    setLoading(true);
    try {
      if (!forceFresh) {
        const cached = loadCache(cacheKey);
        if (cached) {
          setDocs(cached);
          setLoading(false);
          return;
        }
      }
      const data = await fetchAnalytics({
        fromDate,
        toDate,
        trackingId: trackingFilter.trim() || undefined,
      });
      setDocs(data);
      saveCache(cacheKey, data);
    } catch (e) {
      console.error(e);
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  // Reload on filter change.
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, trackingFilter]);

  const todaySummary = useMemo(() => {
    const today = utcDateString();
    return summariseTotals(docs.filter((d) => d.date === today));
  }, [docs]);

  const monthSummary = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    return summariseTotals(docs.filter((d) => d.date.startsWith(prefix)));
  }, [docs]);

  const rows = useMemo<DailyTrackingRow[]>(() => rollupByDateTracking(docs), [docs]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Tracking-ID links only · data older than {RETENTION_DAYS} days is excluded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-secondary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* SECTION A: SUMMARY CARDS */}
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Today"
          links={todaySummary.links}
          clicks={todaySummary.clicks}
          accent="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="This month"
          links={monthSummary.links}
          clicks={monthSummary.clicks}
          accent="bg-secondary text-foreground"
        />
      </section>

      {/* SECTION B: COUNTDOWN */}
      <BatchCountdown />

      {/* SECTION C: FILTERS */}
      <section className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filters
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={trackingFilter}
                placeholder="exact match"
                onChange={(e) => setTrackingFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>
        </div>
      </section>

      {/* SECTION D + E: TABLE WITH EXPANDABLE ROWS */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1fr] gap-2 border-b border-border bg-secondary/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span />
          <span>Date</span>
          <span>Tracking ID</span>
          <span className="text-right">Links generated</span>
          <span className="text-right">Total clicks</span>
        </div>
        {loading ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No analytics yet for this range. New tracked links will appear here after the next batch.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const key = `${row.date}__${row.trackingId}`;
              const open = openRow === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenRow(open ? null : key)}
                    className="grid w-full grid-cols-[1.5rem_1fr_1fr_1fr_1fr] items-center gap-2 px-3 py-3 text-left text-sm hover:bg-secondary/40"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    />
                    <span className="font-medium">{row.date}</span>
                    <span className="truncate font-mono text-xs">{row.trackingId}</span>
                    <span className="text-right tabular-nums">{row.linksGenerated.toLocaleString()}</span>
                    <span className="text-right tabular-nums font-semibold">{row.totalClicks.toLocaleString()}</span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-background/40 px-4 py-3">
                      {row.links.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No per-link breakdown for this batch yet.</p>
                      ) : (
                        <ul className="divide-y divide-border/60">
                          {row.links.map((l) => (
                            <li key={l.slug} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <a
                                href={`${SHAREABLE_DOMAIN}/${l.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-w-0 items-center gap-1.5 truncate text-primary hover:underline"
                              >
                                <LinkIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{SHAREABLE_DOMAIN.replace(/^https?:\/\//, "")}/{l.slug}</span>
                              </a>
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                <MousePointerClick className="h-3 w-3" />
                                {l.clicks.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
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

function SummaryCard({
  label,
  links,
  clicks,
  accent,
}: {
  label: string;
  links: number;
  clicks: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${accent}`}>{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Links generated</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{links.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total clicks</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{clicks.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function BatchCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = useMemo(() => nextBatchBoundary(new Date(now)).getTime(), [now]);
  const remaining = Math.max(0, target - now);
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    <section className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Next analytics update in
      </div>
      <div className="text-lg font-semibold tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
    </section>
  );
}
