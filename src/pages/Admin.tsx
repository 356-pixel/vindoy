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
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PASSWORD, ALLOWED_TRACKING_IDS, MIN_CLICKS_DISPLAY, SHAREABLE_DOMAIN } from "@/lib/adminConfig";
import {
  fetchAllTrackingAnalytics,
  filterAnalytics,
  monthRange,
  sumDays,
  todayRange,
  weekRange,
  type TrackingAnalytics,
} from "@/lib/analyticsApi";
import { REFRESH_HOURS, REFRESH_MS, RETENTION_DAYS, utcDateString } from "@/lib/analytics";

const SESSION_KEY = "vindoy_admin_auth";
const CACHE_KEY = "analyticsCache";
const CACHE_TS_KEY = "analyticsCacheTimestamp";

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

type CacheBlob = { ts: number; data: TrackingAnalytics[] };

function loadCache(): CacheBlob | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const ts = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
    if (!raw || !ts) return null;
    return { ts, data: JSON.parse(raw) as TrackingAnalytics[] };
  } catch { return null; }
}

function saveCache(data: TrackingAnalytics[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

function AnalyticsDashboard({ onLogout }: { onLogout: () => void }) {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate());
  const [toDate, setToDate] = useState<string>(utcDateString());
  const [trackingFilter, setTrackingFilter] = useState<string>("");
  const [data, setData] = useState<TrackingAnalytics[]>([]);
  const [cacheTs, setCacheTs] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [openRow, setOpenRow] = useState<string | null>(null);

  async function refresh(force = false) {
    setLoading(true);
    try {
      const cache = loadCache();
      if (!force && cache && Date.now() - cache.ts < REFRESH_MS) {
        setData(cache.data);
        setCacheTs(cache.ts);
      } else {
        const fresh = await fetchAllTrackingAnalytics();
        saveCache(fresh);
        setData(fresh);
        setCacheTs(Date.now());
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(false); /* eslint-disable-next-line */ }, []);

  // Summary cards always use full dataset (not affected by filters).
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

  // Dropdown options: every tracking id still within the 60-day window that meets the
  // display threshold, unioned with the admin allow-list so issued IDs always appear.
  const trackingOptions = useMemo(() => {
    const eligible = data
      .filter((d) => d.totalClicks >= MIN_CLICKS_DISPLAY)
      .map((d) => d.trackingId);
    return [...new Set([...eligible, ...ALLOWED_TRACKING_IDS])].sort();
  }, [data]);

  const filtered = useMemo(
    () => filterAnalytics(data, fromDate, toDate, trackingFilter || undefined),
    [data, fromDate, toDate, trackingFilter],
  );

  const rows = useMemo(() => {
    return [...filtered]
      .filter((t) => t.totalClicks >= MIN_CLICKS_DISPLAY)
      .sort((a, b) => {
        const ax = Math.max(a.lastClickAt || 0, a.createdAt || 0);
        const bx = Math.max(b.lastClickAt || 0, b.createdAt || 0);
        return bx - ax;
      });
  }, [filtered]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Tracking-ID links only · entries older than {RETENTION_DAYS} days are hidden
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh(true)}
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
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Today" links={summaries.today.links} clicks={summaries.today.clicks} accent="bg-primary/10 text-primary" />
        <SummaryCard label="This week" links={summaries.week.links} clicks={summaries.week.clicks} accent="bg-secondary text-foreground" />
        <SummaryCard label="This month" links={summaries.month.links} clicks={summaries.month.clicks} accent="bg-secondary text-foreground" />
      </section>

      {/* SECTION B: COUNTDOWN */}
      <RefreshCountdown cacheTs={cacheTs} />

      {/* SECTION D: FILTERS */}
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
        </div>
      </section>

      {/* SECTION E + F: TABLE WITH EXPANDABLE ROWS */}
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
            No tracking IDs with ≥ {MIN_CLICKS_DISPLAY} clicks in this range.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const key = row.trackingId;
              const open = openRow === key;
              const activityMs = Math.max(row.lastClickAt || 0, row.createdAt || 0);
              const date = activityMs ? new Date(activityMs).toISOString().slice(0, 10) : "—";
              const sortedLinks = [...row.links]
                .filter((l) => l.clicks >= MIN_CLICKS_DISPLAY)
                .sort((a, b) => b.clicks - a.clicks);
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
                    <span className="font-medium">{date}</span>
                    <span className="truncate font-mono text-xs">{row.trackingId}</span>
                    <span className="text-right tabular-nums">{row.totalLinksGenerated.toLocaleString()}</span>
                    <span className="text-right tabular-nums font-semibold">{row.totalClicks.toLocaleString()}</span>
                  </button>
                  {open && (
                    <div className="border-t border-border bg-background/40 px-4 py-3">
                      {sortedLinks.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No links with ≥ {MIN_CLICKS_DISPLAY} clicks yet.</p>

                      ) : (
                        <ul className="divide-y divide-border/60">
                          {sortedLinks.map((l) => {
                            const url = l.shortUrl || `${SHAREABLE_DOMAIN}/${l.slug}`;
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
                                </a>
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  <MousePointerClick className="h-3 w-3" />
                                  {l.clicks.toLocaleString()}
                                </span>
                              </li>
                            );
                          })}
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

function pad(n: number) { return String(n).padStart(2, "0"); }

function RefreshCountdown({ cacheTs }: { cacheTs: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = (cacheTs || now) + REFRESH_MS;
  const remaining = Math.max(0, target - now);
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    <section className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Next analytics refresh in (cache: {REFRESH_HOURS}h)
      </div>
      <div className="text-lg font-semibold tabular-nums">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
    </section>
  );
}
