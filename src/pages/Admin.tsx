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
import {
  fetchAllTrackingAnalytics,
  filterAnalytics,
  monthRange,
  sumDays,
  todayRange,
  weekRange,
  type TrackingAnalytics,
} from "@/lib/analyticsApi";
import { RETENTION_DAYS, utcDateString } from "@/lib/analytics";

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

function AnalyticsDashboard({ onLogout }: { onLogout: () => void }) {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate());
  const [toDate, setToDate] = useState<string>(utcDateString());
  const [trackingFilter, setTrackingFilter] = useState<string>("");
  const [minClicks, setMinClicks] = useState<number>(100);
  const [data, setData] = useState<TrackingAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setOpenRow(null);
    try {
      const fresh = await fetchAllTrackingAnalytics();
      setData(fresh);
      setFetched(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  // Summary cards use full dataset (independent of filters).
  const summaries = useMemo(() => {
    const t = todayRange();
    const w = weekRange();
    const m = monthRange();
    return {
      today: sumDays(data, t.from, t.to),
      week: sumDays(data, w.from, w.to),
      month: sumDays(data, m.from, m.to),
    };
  }, [data]);

  // Tracking dropdown: union of fetched IDs + admin allow-list.
  const trackingOptions = useMemo(() => {
    const ids = data.map((d) => d.trackingId);
    return [...new Set([...ids, ...ALLOWED_TRACKING_IDS])].sort();
  }, [data]);

  const filtered = useMemo(
    () => filterAnalytics(data, fromDate, toDate, trackingFilter || undefined),
    [data, fromDate, toDate, trackingFilter],
  );

  // Group by date (descending). For each date, count links that crossed minClicks
  // and sum total clicks across those tracking IDs active that date.
  type DateRow = {
    date: string;
    linksGenerated: number;
    totalClicks: number;
    links: { slug: string; shortUrl: string; clicks: number; trackingId: string }[];
  };

  const dateRows: DateRow[] = useMemo(() => {
    const byDate = new Map<string, DateRow>();
    for (const t of filtered) {
      const qualifyingLinks = t.links.filter((l) => l.clicks >= minClicks);
      if (qualifyingLinks.length === 0) continue;
      for (const day of t.days) {
        if (day.date < fromDate || day.date > toDate) continue;
        if (!byDate.has(day.date)) {
          byDate.set(day.date, { date: day.date, linksGenerated: 0, totalClicks: 0, links: [] });
        }
        const row = byDate.get(day.date)!;
        row.totalClicks += day.clicks;
      }
      // Attach qualifying links to their most recent activity date within range.
      const activityMs = Math.max(t.lastClickAt || 0, t.createdAt || 0);
      if (!activityMs) continue;
      const activityDate = new Date(activityMs).toISOString().slice(0, 10);
      if (activityDate < fromDate || activityDate > toDate) continue;
      if (!byDate.has(activityDate)) {
        byDate.set(activityDate, { date: activityDate, linksGenerated: 0, totalClicks: 0, links: [] });
      }
      const target = byDate.get(activityDate)!;
      target.linksGenerated += qualifyingLinks.length;
      for (const l of qualifyingLinks) {
        target.links.push({ ...l, trackingId: t.trackingId });
      }
    }
    return [...byDate.values()]
      .filter((r) => r.linksGenerated > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filtered, fromDate, toDate, minClicks]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Real-time fetch · entries older than {RETENTION_DAYS} days are hidden
          </p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </header>

      {/* SUMMARY CARDS */}
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Today" links={summaries.today.links} clicks={summaries.today.clicks} accent="bg-primary/10 text-primary" />
        <SummaryCard label="This week" links={summaries.week.links} clicks={summaries.week.clicks} accent="bg-secondary text-foreground" />
        <SummaryCard label="This month" links={summaries.month.links} clicks={summaries.month.clicks} accent="bg-secondary text-foreground" />
      </section>

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
                    <span className="text-right tabular-nums">{row.linksGenerated.toLocaleString()}</span>
                    <span className="text-right tabular-nums font-semibold">{row.totalClicks.toLocaleString()}</span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-background/40 px-4 py-3">
                      <ul className="divide-y divide-border/60">
                        {sortedLinks.map((l) => {
                          const url = l.shortUrl || `${SHAREABLE_DOMAIN}/${l.slug}`;
                          return (
                            <li key={`${l.trackingId}-${l.slug}`} className="flex items-center justify-between gap-3 py-2 text-sm">
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

function SummaryCard({ label, links, clicks, accent }: { label: string; links: number; clicks: number; accent: string }) {
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
