import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, CheckCircle2, XCircle, LogOut } from "lucide-react";


type ValidateResp =
  | {
      ok: true;
      status: "VALID" | "ALREADY_USED" | "EXPIRED";
      voucher: {
        code: string;
        offer?: { title?: string; description?: string };
        validityEnd: string;
        usedAt: string | null;
      };
    }
  | { ok: false; status: "NOT_FOUND"; error: string };

type RedeemResp =
  | {
      ok: true;
      status: "REDEEMED";
      voucher: {
        code: string;
        offer?: { title?: string; description?: string };
        validityEnd: string;
        usedAt: string;
      };
    }
  | {
      ok: false;
      status: "NOT_FOUND" | "ALREADY_USED" | "EXPIRED" | "NOT_REDEEMED";
      error: string;
      voucher?: any;
    };

function vibrate(pattern: number | number[]) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem("adminToken");
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem("adminToken");
    else localStorage.setItem("adminToken", token);
  } catch {
    // ignore
  }
}

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

export default function AdminScanner() {
  const [token, setToken] = useState<string | null>(() => {
    const t = getStoredToken();
    return isTokenValid(t) ? t : null;
  });
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupKind, setPopupKind] = useState<"success" | "fail">("success");
  const [popupTitle, setPopupTitle] = useState<string>("");
  const [popupDetail, setPopupDetail] = useState<string>("");

  const scannerId = "admin-qr-reader";
  const html5Ref = useRef<Html5Qrcode | null>(null);

  // Prevent repeated scans while validating/redeeming
  const scanLockRef = useRef(false);

  // UI state for loading + modal result
  const [scanStatus, setScanStatus] = useState<
    | { state: "idle" }
    | { state: "loading"; code: string }
    | { state: "result"; code: string; ok: boolean; title: string; message: string }
  >({ state: "idle" });

  const isBusy = scanStatus.state === "loading" || scanStatus.state === "result";

  const closeResult = useCallback(() => {
    scanLockRef.current = false;
    setScanStatus({ state: "idle" });
  }, []);

  const authHeader = useMemo(() => {
    if (!token) return undefined;
    return { Authorization: `Bearer ${token}` } as const;
  }, [token]);

  async function login() {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const r = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await r.json();
      if (!r.ok) {
        setAuthError(data?.error ?? "Login failed");
        return;
      }
      setToken(data.token);
      setStoredToken(data.token);
      setPin("");
    } catch {
      setAuthError("Network error");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setStoredToken(null);
    setLastCode(null);
    setCameraError(null);
  }

  function openPopup(kind: "success" | "fail", title: string, detail: string) {
    setPopupKind(kind);
    setPopupTitle(title);
    setPopupDetail(detail);
    setPopupOpen(true);
  }

  async function validateAndRedeem(scannedText: string) {
    if (busy) return;
    setBusy(true);

    try {
      setLastCode(scannedText);

      const vr = await fetch("/api/voucher-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ?? {}) },
        body: JSON.stringify({ code: scannedText }),
      });

      const vdata = (await vr.json()) as ValidateResp;

      if (!vr.ok || !(vdata as any).ok) {
        vibrate([120, 80, 120]);
        openPopup("fail", "Invalid voucher", (vdata as any)?.error ?? "Voucher not found");
        return;
      }

      if (vdata.status !== "VALID") {
        vibrate([120, 80, 120]);
        const msg =
          vdata.status === "ALREADY_USED"
            ? `Already used${vdata.voucher?.usedAt ? ` at ${new Date(vdata.voucher.usedAt).toLocaleString()}` : ""}`
            : "Voucher expired";
        openPopup("fail", "Voucher not valid", msg);
        return;
      }

      // redeem
      const rr = await fetch("/api/voucher-redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ?? {}) },
        body: JSON.stringify({ code: scannedText }),
      });
      const rdata = (await rr.json()) as RedeemResp;

      if (rr.ok && (rdata as any).ok && (rdata as any).status === "REDEEMED") {
        vibrate([40, 40, 120]);
        const offer = (rdata as any).voucher?.offer?.title;
        openPopup("success", "Voucher redeemed", offer ? `Offer: ${offer}` : "Success");
        return;
      }

      vibrate([120, 80, 120]);
      openPopup("fail", "Redeem failed", (rdata as any)?.error ?? "Could not redeem");
    } catch {
      vibrate([120, 80, 120]);
      openPopup("fail", "Network error", "Please try again");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const t = getStoredToken();
    if (t && !isTokenValid(t)) {
      // stale token in localStorage: clear it so we show PIN screen
      setStoredToken(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function start() {
      setCameraError(null);
      try {
        const html5 = new Html5Qrcode(scannerId);
        html5Ref.current = html5;

        // Prefer back camera
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
          async (decodedText) => {
            if (cancelled) return;

            // 🚫 prevent multiple scans
            if (scanLockRef.current) return;

            scanLockRef.current = true;

            // show loading overlay
            setScanStatus({ state: "loading", code: decodedText });

            try {
              await validateAndRedeem(decodedText);
            } finally {
              // after API completes → show result state
              setScanStatus({
                state: "result",
                code: decodedText,
                ok: true,
                title: "Processed",
                message: "Check result",
              });
            }
          },,
          () => {
            // ignore scan errors
          }
        );
      } catch (e: any) {
        setCameraError(e?.message ?? "Failed to access camera");
      }
    }

    start();

    return () => {
      cancelled = true;
      const inst = html5Ref.current;
      html5Ref.current = null;
      if (inst) {
        inst
          .stop()
          .then(() => inst.clear())
          .catch(() => {
            // ignore
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0b102e] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-white/60">Admin</div>
            <h1 className="mt-1 font-display text-3xl font-black">Voucher Scanner</h1>
            <p className="mt-2 text-sm text-white/65">Scan voucher QR codes to validate & redeem.</p>
          </div>

          {token ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-black/20 px-4 py-2 text-sm text-white/80 hover:bg-black/30"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>

        {!token ? (
          <div className="mt-8 rounded-3xl border border-white/12 bg-white/5 p-5">
            <div className="text-sm font-semibold">Biller login</div>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs text-white/60">PIN</span>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="Enter PIN"
                  className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
                />
              </label>
              {authError ? <div className="text-sm text-red-300">{authError}</div> : null}
              <button
                disabled={authLoading || pin.trim().length < 3}
                onClick={login}
                className="h-12 rounded-2xl bg-brand-gold px-5 font-semibold text-brand-navy disabled:opacity-60"
              >
                {authLoading ? "Signing in..." : "Login"}
              </button>

              <div className="text-xs text-white/45">
                Tip: add <code className="text-white/70">ADMIN_PIN</code> and <code className="text-white/70">ADMIN_AUTH_SECRET</code> in Vercel env.
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            <div className="rounded-3xl border border-white/12 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Camera</div>
                  <div className="mt-1 text-xs text-white/55">
                    Align QR inside the box. {busy ? "Validating..." : "Ready"}
                  </div>
                </div>
                <div className="text-xs text-white/55">Last: {lastCode ? lastCode : "—"}</div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <div id={scannerId} className="w-full" />
              </div>

              {cameraError ? <div className="mt-3 text-sm text-red-300">{cameraError}</div> : null}
            </div>

            <div className="rounded-3xl border border-white/12 bg-white/5 p-5">
              <div className="text-sm font-semibold">Manual entry</div>
              <p className="mt-1 text-xs text-white/55">If camera fails, paste voucher code and redeem.</p>
              <ManualRedeem onRedeem={validateAndRedeem} disabled={busy || scanLockRef.current} />
            </div>
          </div>
        )}
      </div>

        {/* Loading Overlay */}
        {scanStatus.state === "loading" ? (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              <div className="text-sm text-white/80">Processing voucher...</div>
            </div>
          </div>
        ) : null}

      {/* Result popup */}
      {popupOpen ? (
        <div className="fixed inset-0 z-[200] grid place-items-center px-4">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setPopupOpen(false);
              scanLockRef.current = false;
              setScanStatus({ state: "idle" });
            }}
            aria-label="Close popup"
          />

          <div className="relative w-full max-w-md rounded-3xl border border-white/12 bg-[#0b102e]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => {
                setPopupOpen(false);
                scanLockRef.current = false;
                setScanStatus({ state: "idle" });
              }}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/20 text-white/80 hover:bg-black/30"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3">
              {popupKind === "success" ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-300" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 text-red-300" />
              )}
              <div>
                <div className="text-lg font-black">{popupTitle}</div>
                <div className="mt-1 text-sm text-white/70 whitespace-pre-line">{popupDetail}</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setPopupOpen(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ManualRedeem(props: { onRedeem: (code: string) => void | Promise<void>; disabled?: boolean }) {
  const [code, setCode] = useState("");

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code (e.g. A1B2C3D4)"
        className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
      />
      <button
        disabled={props.disabled || code.trim().length < 4}
        onClick={() => props.onRedeem(code)}
        className="h-12 rounded-2xl bg-brand-gold px-5 font-semibold text-brand-navy disabled:opacity-60"
      >
        Redeem
      </button>
    </div>
  );
}
