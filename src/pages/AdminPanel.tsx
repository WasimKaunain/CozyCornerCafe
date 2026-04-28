import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Camera, Shield, Users, Ticket, CheckCircle2, LogOut, ArrowLeft, X } from "lucide-react";
import AdminScanner from "./AdminScanner";

type Stats = {
  customers: number;
  vouchersClaimed: number;
  vouchersRedeemed: number;
};

type CustomerRow = {
  id: number;
  name: string;
  whatsapp: string;
  createdAt: string;
};

type OfferGroupRow = { offerId: number | null; offerTitle?: string | null; count: number };

function getTokenExp(token: string): number | null {
  try {
    const [bodyB64] = token.split(".");
    if (!bodyB64) return null;

    const b64 = bodyB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    const payload = JSON.parse(json) as any;
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string | null) {
  if (!token) return false;
  const exp = getTokenExp(token);
  if (!exp) return false;
  return Math.floor(Date.now() / 1000) <= exp;
}

function getStoredConsoleToken() {
  try {
    return localStorage.getItem("adminConsoleToken");
  } catch {
    return null;
  }
}

function setStoredConsoleToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem("adminConsoleToken");
    else localStorage.setItem("adminConsoleToken", token);
  } catch {
    // ignore
  }
}

function GlassCard(props: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="w-full text-left rounded-3xl border border-white/12 bg-white/5 backdrop-blur-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition hover:bg-white/10 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">{props.title}</div>
          <div className="mt-1 text-xs text-white/55">{props.desc}</div>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/12 bg-black/20 p-3 text-brand-gold">
          {props.icon}
        </div>
      </div>
    </button>
  );
}

function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] grid place-items-center px-3 py-[max(12px,env(safe-area-inset-top))]"
        >
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={props.onClose} aria-label="Close" />

          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-[96vw] sm:max-w-2xl max-h-[calc(100dvh-20px)] overflow-y-auto rounded-[26px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_35px_110px_rgba(0,0,0,0.60)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/55">Admin Console</div>
                  <div className="truncate text-base font-semibold text-white/90">{props.title}</div>
                  {props.subtitle ? <div className="mt-1 text-xs text-white/55">{props.subtitle}</div> : null}
                </div>
                <button
                  onClick={props.onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/20 text-white/80 hover:bg-black/30"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5">{props.children}</div>

            {props.footer ? <div className="border-t border-white/10 p-5">{props.footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AdminConsole() {
  const [token, setToken] = useState<string | null>(() => {
    const t = getStoredConsoleToken();
    return isTokenValid(t) ? t : null;
  });

  const authHeader = useMemo(() => {
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` } as const;
  }, [token]);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState<string | undefined>(undefined);
  const [modalBody, setModalBody] = useState<React.ReactNode>(null);

  const [customerPage, setCustomerPage] = useState(1);
  const [customerLimit] = useState(25);

  function logout() {
    setToken(null);
    setStoredConsoleToken(null);
    setStats(null);
  }

  async function login() {
    if (authLoading) return;
    setAuthErr(null);
    setAuthLoading(true);
    try {
      const r = await fetch("/api/admin-console-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setAuthErr(data?.error ?? "Login failed");
        return;
      }
      setToken(data.token);
      setStoredConsoleToken(data.token);
      setUserId("");
      setPassword("");
    } catch {
      setAuthErr("Network error");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadStats() {
    if (!authHeader) return;
    setStatsErr(null);
    setStatsLoading(true);
    try {
      const r = await fetch("/api/admin-console-stats", { headers: { ...(authHeader ?? {}) } });
      const data = await r.json();

      if (r.status === 401 && String(data?.error || "").toLowerCase().includes("token")) {
        logout();
        setAuthErr("Session expired. Please login again.");
        return;
      }

      if (!r.ok) {
        setStatsErr(data?.error ?? "Failed to load stats");
        return;
      }

      setStats({
        customers: Number(data.customers ?? 0),
        vouchersClaimed: Number(data.vouchersClaimed ?? 0),
        vouchersRedeemed: Number(data.vouchersRedeemed ?? 0),
      });
    } catch {
      setStatsErr("Network error");
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    const t = getStoredConsoleToken();
    if (t && !isTokenValid(t)) {
      setStoredConsoleToken(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function openCustomers(init?: { page?: number }) {
    if (!authHeader) return;

    const page = typeof init?.page === "number" ? init.page : customerPage;

    setCustomerPage(page);

    setModalTitle("Total people joined");
    setModalSubtitle("Paginated customer list");

    const render = (opts: {
      loading: boolean;
      err?: string | null;
      total?: number;
      rows?: CustomerRow[];
    }) => {
      const total = opts.total ?? 0;
      const rows = opts.rows ?? [];
      const totalPages = Math.max(1, Math.ceil(total / customerLimit));

      setModalBody(
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-xs text-white/60">
              Showing page <span className="text-white/80 font-semibold">{page}</span> of{" "}
              <span className="text-white/80 font-semibold">{totalPages}</span> · Total: {total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => openCustomers({ page: Math.max(1, page - 1) })}
                className="h-10 rounded-xl border border-white/12 bg-black/20 px-3 text-xs font-semibold text-white/85 disabled:opacity-60 hover:bg-black/30"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => openCustomers({ page: Math.min(totalPages, page + 1) })}
                className="h-10 rounded-xl border border-white/12 bg-black/20 px-3 text-xs font-semibold text-white/85 disabled:opacity-60 hover:bg-black/30"
              >
                Next
              </button>
            </div>
          </div>

          {opts.loading ? <div className="text-sm text-white/70">Loading...</div> : null}
          {opts.err ? <div className="text-sm text-red-200">{opts.err}</div> : null}

          {!opts.loading && !opts.err ? (
            <div className="grid gap-2">
              {rows.length === 0 ? (
                <div className="text-sm text-white/70">No customers found.</div>
              ) : (
                rows.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white/90 truncate">{c.name}</div>
                    <div className="mt-1 text-xs text-white/60">WhatsApp: {c.whatsapp}</div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      );
    };

    render({ loading: true });
    setModalOpen(true);

    try {
      const url = `/api/admin-console-customers?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(
        String(customerLimit)
      )}`;
      const r = await fetch(url, { headers: { ...(authHeader ?? {}) } });
      const data = await r.json();

      if (r.status === 401) {
        render({ loading: false, err: "Session expired. Please login again." });
        logout();
        return;
      }

      if (!r.ok) {
        render({ loading: false, err: data?.error ?? "Failed" });
        return;
      }

      const rows: CustomerRow[] = Array.isArray(data?.customers) ? data.customers : [];
      render({ loading: false, total: Number(data?.total ?? 0), rows });
    } catch {
      render({ loading: false, err: "Network error" });
    }
  }

  async function openGrouped(title: string, endpoint: string) {
    if (!authHeader) return;
    setModalTitle(title);
    setModalSubtitle("Grouped by Offer ID");

    setModalBody(<div className="text-sm text-white/70">Loading...</div>);
    setModalOpen(true);

    try {
      const r = await fetch(endpoint, { headers: { ...(authHeader ?? {}) } });
      const data = await r.json();

      if (r.status === 401) {
        setModalBody(<div className="text-sm text-red-200">Session expired. Please login again.</div>);
        logout();
        return;
      }

      if (!r.ok) {
        setModalBody(<div className="text-sm text-red-200">{data?.error ?? "Failed"}</div>);
        return;
      }

      const groups: OfferGroupRow[] = Array.isArray(data?.groups) ? data.groups : [];
      setModalBody(
        <div className="grid gap-2">
          {groups.length === 0 ? (
            <div className="text-sm text-white/70">No data.</div>
          ) : (
            groups.map((g) => (
              <div
                key={String(g.offerId) + String(g.offerTitle ?? "")}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate">Offer {g.offerId ?? "—"}</div>
                    {g.offerTitle ? <div className="mt-1 text-xs text-white/55 truncate">{g.offerTitle}</div> : null}
                  </div>
                  <div className="text-sm font-black text-brand-gold">{g.count}</div>
                </div>
              </div>
            ))
          )}
        </div>
      );
    } catch {
      setModalBody(<div className="text-sm text-red-200">Network error</div>);
    }
  }

  if (!token) {
    return (
      <div className="mt-6 rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/60">Admin</div>
              <div className="mt-1 font-display text-2xl font-black">Admin Console</div>
              <div className="mt-2 text-sm text-white/65">Login with admin credentials to view stats.</div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/12 bg-black/20 p-3">
              <Shield className="h-5 w-5 text-brand-gold" />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-wide text-white/70">User ID</span>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
                placeholder="Enter user id"
                autoComplete="username"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-wide text-white/70">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </label>

            {authErr ? <div className="text-sm text-red-200">{authErr}</div> : null}

            <button
              onClick={login}
              disabled={authLoading || userId.trim().length < 1 || password.trim().length < 1}
              className="h-12 rounded-2xl bg-brand-gold px-5 font-semibold text-brand-navy disabled:opacity-60"
            >
              {authLoading ? "Signing in..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/60">Admin</div>
              <div className="mt-1 font-display text-2xl font-black">Admin Console</div>
              <div className="mt-2 text-sm text-white/65">Live stats for vouchers and customers.</div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-black/30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              onClick={loadStats}
              disabled={statsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-black/30 disabled:opacity-60"
            >
              <BarChart3 className="h-4 w-4 text-brand-gold" />
              {statsLoading ? "Refreshing..." : "Refresh"}
            </button>

            {statsErr ? <div className="text-sm text-red-200">{statsErr}</div> : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <GlassCard
              title={`Total people joined: ${stats?.customers ?? "—"}`}
              desc="Tap to view list of customers"
              icon={<Users className="h-5 w-5" />}
              onClick={() => openCustomers({ page: 1 })}
            />

            <GlassCard
              title={`Total vouchers claimed: ${stats?.vouchersClaimed ?? "—"}`}
              desc="Tap to group by offer id"
              icon={<Ticket className="h-5 w-5" />}
              onClick={() => openGrouped("Total vouchers claimed", "/api/admin-console-vouchers-claimed")}
            />

            <GlassCard
              title={`Total vouchers redeemed: ${stats?.vouchersRedeemed ?? "—"}`}
              desc="Tap to group by offer id"
              icon={<CheckCircle2 className="h-5 w-5" />}
              onClick={() => openGrouped("Total vouchers redeemed", "/api/admin-console-vouchers-redeemed")}
            />
          </div>
        </div>
      </div>

      <Modal open={modalOpen} title={modalTitle} subtitle={modalSubtitle} onClose={() => setModalOpen(false)}>
        {modalBody}
      </Modal>
    </>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState<"home" | "scanner" | "console">("home");

  return (
    <div className="min-h-screen bg-[#0b102e] text-white overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8">
        {tab !== "home" ? (
          <button
            onClick={() => setTab("home")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-black/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}

        {tab === "home" ? (
          <>
            <div className="mt-4">
              <div className="text-xs text-white/60">Admin</div>
              <h1 className="mt-1 font-display text-3xl font-black">Admin Panel</h1>
              <p className="mt-2 text-sm text-white/65">Choose Scanner or Admin Console.</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <GlassCard
                title="Scanner"
                desc="Scan QR codes and redeem vouchers"
                icon={<Camera className="h-5 w-5" />}
                onClick={() => setTab("scanner")}
              />
              <GlassCard
                title="Admin Console"
                desc="Stats, customers and voucher breakdown"
                icon={<Shield className="h-5 w-5" />}
                onClick={() => setTab("console")}
              />
            </div>
          </>
        ) : tab === "scanner" ? (
          <div className="mt-6">
            <AdminScanner />
          </div>
        ) : (
          <AdminConsole />
        )}
      </div>
    </div>
  );
}
