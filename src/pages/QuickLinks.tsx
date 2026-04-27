import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Ticket, ShieldCheck, CalendarDays } from "lucide-react";

const VALIDITY_TEXT = "Valid till 3rd May 11:59 PM";

function buildWaText(opts: {
  name: string;
  code: string;
  validityText: string;
}) {
  // Keep instructions (user asked not to delete instructions)
  return (
    `Hi ${opts.name}! Welcome to Cozy Corner Cafe.\n\n` +
    `Your Grand Opening Voucher Code: ${opts.code}\n` +
    `${opts.validityText}\n\n` +
    `Instructions:\n` +
    `1) Show this voucher code at the cafe counter.\n` +
    `2) Voucher is valid for one-time use only.\n` +
    `3) Not transferable and cannot be exchanged for cash.\n` +
    `4) Screenshots are not recommended; keep this message safe.\n\n` +
    `Location: Cozy Corner Cafe, Riyadh\n` +
    `We can’t wait to serve you!`
  );
}

type CreatedVoucher = {
  customer: { id: number; name: string; whatsapp: string };
  voucher: {
    id: number;
    code: string;
    validityEnd: string;
    createdAt: string;
    offer?: { id: number; title: string; description?: string };
    voucherCardUrl?: string;
  };
};

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getCountdownParts(target: Date) {
  const now = Date.now();
  const diffMs = Math.max(0, target.getTime() - now);
  const totalSec = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSec / (3600 * 24));
  const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { days, hours, minutes, seconds, done: diffMs <= 0 };
}

export default function QuickLinks() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [step, setStep] = useState<"start" | "form" | "result">("start");

  // May 1 countdown (local time)
  const countdownTarget = useMemo(() => new Date(2026, 4, 1, 0, 0, 0), []);
  const [countdown, setCountdown] = useState(() => getCountdownParts(countdownTarget));

  // drink carousel (uses same images as menu section)
  const drinkImages = useMemo(
    () => ["/menu-1.png", "/menu-2.png", "/menu-3.png", "/menu-4.png", "/menu-5.png"],
    []
  );
  const [drinkIndex, setDrinkIndex] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setCountdown(getCountdownParts(countdownTarget));
    }, 1000);
    return () => window.clearInterval(t);
  }, [countdownTarget]);

  useEffect(() => {
    if (!bannerOpen) return;
    const t = window.setInterval(() => {
      setDrinkIndex((i) => (i + 1) % drinkImages.length);
    }, 3000);
    return () => window.clearInterval(t);
  }, [bannerOpen, drinkImages.length]);

  function closeBannerPermanent() {
    setBannerOpen(false);
  }

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("+966");

  // Voucher generation temporarily disabled
  const [error, setError] = useState<string | null>(null);
  const [waUsedError] = useState<string | null>(null);

  // Keep for UI compatibility, but they won't be set while generation is disabled
  const [created, setCreated] = useState<CreatedVoucher | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  const waText = useMemo(() => {
    if (!created) return "";
    return buildWaText({
      name: created.customer.name,
      code: created.voucher.code,
      validityText: VALIDITY_TEXT,
    });
  }, [created]);

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  const focusModalClose = () => {
    modalCloseBtnRef.current?.focus();
  };

  useEffect(() => {
    if (!voucherModalOpen) return;

    // prevent background scroll (modal open only)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus close button for accessibility
    const raf = window.requestAnimationFrame(() => focusModalClose());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVoucherModal();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [voucherModalOpen]);

  function closeVoucherModal() {
    setVoucherModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#0b102e] text-white overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      {/* Center Banner (landscape desktop, portrait mobile) */}
      <AnimatePresence>
        {bannerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] grid place-items-center px-3 sm:px-4"
          >
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={
                "relative w-full overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_35px_110px_rgba(0,0,0,0.55)] " +
                "max-w-[94vw] sm:max-w-[92vw] md:max-w-4xl max-h-[calc(100dvh-24px)]"
              }
            >
              {/* Close (permanent for this session) */}
              <button
                onClick={closeBannerPermanent}
                className="absolute right-2 top-2 sm:right-4 sm:top-4 z-30 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-[0_10px_30px_rgba(0,0,0,0.50)] backdrop-blur-md transition hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
                aria-label="Close offers"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr] max-h-[calc(100dvh-24px)] overflow-y-auto">
                <div className="p-4 sm:p-7 md:p-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                    <Sparkles className="h-4 w-4 text-brand-gold" />
                    GRAND OPENING OFFERS
                  </div>

                  <h1 className="mt-4 sm:mt-5 font-display text-[28px] sm:text-4xl md:text-5xl font-black leading-tight">
                    Cozy Corner Cafe
                    <span className="block text-brand-gold">Voucher Drop</span>
                  </h1>

                  <p className="mt-3 sm:mt-4 text-white/70 leading-relaxed max-w-xl text-sm sm:text-base">
                    Limited-time launch perks. Claim your personalized voucher and keep it safe in WhatsApp.
                  </p>

                  <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-brand-gold font-semibold">30% OFF</div>
                      <div className="text-white/70 text-sm">Selected drinks</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-brand-gold font-semibold">25% OFF</div>
                      <div className="text-white/70 text-sm">Snacks & desserts</div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
                    {/* View-only pill */}
                    <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/5 px-6 py-4 font-semibold text-white/85">
                      <Ticket className="h-5 w-5 text-brand-gold" />
                      Excited for Voucher, one step away
                    </div>

                    <button
                      onClick={() => {
                        // reveal the form behind by collapsing the banner
                        setStep("form");
                        closeBannerPermanent();
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-brand-gold px-6 py-4 font-semibold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.35)] transition hover:brightness-110"
                    >
                      Continue to links
                    </button>
                  </div>

                  <div className="mt-4 sm:mt-5 text-xs text-white/55">
                    By claiming, you agree we can contact you on WhatsApp with your voucher.
                  </div>
                </div>

                {/* Right part: countdown + drink carousel */}
                <div className="p-4 sm:p-7 md:p-10 border-t md:border-t-0 md:border-l border-white/10">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-brand-gold" />
                      </div>
                      <div>
                        <div className="font-semibold">Offer starts in</div>
                        <div className="text-xs text-white/60">Countdown to 1st May</div>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-5 grid grid-cols-4 gap-2">
                      {[ 
                        { label: "Days", value: String(countdown.days) },
                        { label: "Hours", value: pad2(countdown.hours) },
                        { label: "Min", value: pad2(countdown.minutes) },
                        { label: "Sec", value: pad2(countdown.seconds) },
                      ].map((p) => (
                        <div key={p.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                          <div className="font-mono text-xl font-bold text-brand-gold leading-none">{p.value}</div>
                          <div className="mt-1 text-[11px] text-white/55">{p.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 sm:mt-5">
                      <div className="mt-2 sm:mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="relative h-44 sm:h-64 md:h-72">
                          <AnimatePresence mode="wait">
                            <motion.img
                              key={drinkIndex}
                              src={drinkImages[drinkIndex]}
                              alt="Drink"
                              initial={{ opacity: 0, x: 18 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -18 }}
                              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </AnimatePresence>
                          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex gap-1">
                              {drinkImages.map((_, i) => (
                                <span
                                  key={i}
                                  className={
                                    "h-1.5 w-1.5 rounded-full " +
                                    (i === drinkIndex ? "bg-brand-gold" : "bg-white/25")
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 text-[11px] text-white/45">
                    Tip: Tap “Continue to links” to fill your details.
                  </div>
                </div>
              </div>

              {/* Mobile portrait emphasis */}
              <div className="md:hidden px-4 sm:px-6 pb-5 sm:pb-7 -mt-1">
                <div className="h-px bg-white/10" />
                <div className="pt-3 sm:pt-4 text-xs text-white/60">
                  This banner is portrait-friendly on mobile and landscape on desktop.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher Result Modal */}
      <AnimatePresence>
        {voucherModalOpen && created && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[120] grid place-items-center px-4 py-[max(16px,env(safe-area-inset-top))]"
          >
            <button
              onClick={closeVoucherModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-label="Close voucher details"
            />

            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_35px_110px_rgba(0,0,0,0.60)]"
              role="dialog"
              aria-modal="true"
            >
              {/* Sticky top bar: drag handle + title + close */}
              <div className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="pt-3">
                  <div className="mx-auto h-1.5 w-12 rounded-full bg-white/25" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between gap-3 px-6 py-3 sm:px-7 md:px-8">
                  <div className="min-w-0">
                    <div className="text-xs text-white/55">Voucher</div>
                    <div className="truncate text-sm font-semibold text-white/90">{created.customer.name}</div>
                  </div>

                  <button
                    ref={modalCloseBtnRef}
                    onClick={closeVoucherModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/80 transition hover:bg-black/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-7 md:p-8">
                <div className="flex items-start justify-between gap-4 pr-10">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                      <Ticket className="h-4 w-4 text-brand-gold" />
                      Voucher Generated
                    </div>
                    <h3 className="mt-4 font-display text-2xl sm:text-3xl font-black leading-tight">
                      Your voucher is ready
                    </h3>
                    <p className="mt-2 text-sm text-white/65">
                      Show this QR at the counter. The QR contains only your voucher code.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.95fr]">
                  <div className="rounded-3xl border border-white/12 bg-black/20 p-5">
                    <div className="text-xs text-white/55">Voucher Code</div>
                    <div className="mt-1 font-mono text-3xl font-black tracking-widest text-brand-gold">
                      {created.voucher.code}
                    </div>

                    {created.voucher.offer?.title && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="text-[11px] text-white/55">Offer</div>
                        <div className="mt-1 text-sm font-semibold text-white/90">{created.voucher.offer.title}</div>
                      </div>
                    )}

                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/60">
                      <CalendarDays className="h-4 w-4 text-brand-gold" />
                      {VALIDITY_TEXT}
                    </div>

                    <div className="mt-4 text-[11px] text-white/55 whitespace-pre-line">{waText}</div>
                  </div>

                  <div className="rounded-3xl border border-white/12 bg-black/20 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Counter QR</div>
                      <div className="text-xs text-white/55">Scan to read code</div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/12 bg-white/5 p-3 grid place-items-center">
                      {qrUrl ? (
                        <img src={qrUrl} alt="Voucher QR" className="w-full max-w-[260px] h-auto rounded-xl" />
                      ) : (
                        <div className="text-xs text-white/55">Generating QR...</div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-white/55">Present this QR at the billing counter. Staff will validate this voucher.</div>
                  </div>
                </div>

                {/* Bottom actions: exactly two options */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <a
                    href={created.voucher.voucherCardUrl || `/api/voucher-card?code=${encodeURIComponent(created.voucher.code)}`}
                    download
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    Download Voucher
                  </a>

                  <button
                    onClick={() => {
                      if (!waUrl) return;
                      window.open(waUrl, "_blank", "noopener,noreferrer");
                    }}
                    className={
                      "inline-flex items-center justify-center rounded-2xl bg-brand-gold px-5 py-3 font-semibold text-brand-navy transition hover:brightness-110 " +
                      (!waUrl ? "opacity-60 pointer-events-none" : "")
                    }
                  >
                    Share on WhatsApp
                  </button>
                </div>

                {/* bottom safe-area spacer for mobile so last content isn't hidden */}
                <div className="h-[max(16px,env(safe-area-inset-bottom))]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="relative z-10 px-4 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-black">Quick Links</h2>
              <p className="mt-2 text-white/65">
                Claim your voucher first, then explore socials & directions.
              </p>
            </div>

            <button
              onClick={() => setBannerOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-brand-gold" />
              View offers
            </button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[0.98fr_1.02fr]">
            {/* Left: steps/form/result */}
            <div className="rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                    <Ticket className="h-4 w-4 text-brand-gold" />
                    Voucher Center
                  </div>
                  {step !== "start" && (
                    <button
                      className="text-xs text-white/55 hover:text-white"
                      onClick={() => {
                        setStep("start");
                        setCreated(null);
                        setError(null);
                        setQrUrl(null);
                        setWaUrl(null);
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {step === "start" && (
                  <div className="mt-6">
                    <h3 className="font-display text-2xl font-bold">Excited for Voucher?</h3>
                    <p className="mt-2 text-white/65">
                      One step away. Fill your name & WhatsApp number to generate a unique voucher.
                    </p>

                    <button
                      onClick={() => setStep("form")}
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gold px-6 py-4 font-semibold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.35)] transition hover:brightness-110"
                    >
                      <Ticket className="h-5 w-5" />
                      Excited for Voucher, one step away
                    </button>

                  </div>
                )}

                {step === "form" && (
                  <div className="mt-6">
                    <h3 className="font-display text-2xl font-bold">Claim your voucher</h3>
                    <p className="mt-2 text-white/65">Enter details and submit. We’ll generate a unique code.</p>

                    <div className="mt-6 grid gap-4">
                      <label className="grid gap-2">
                        <span className="text-sm text-white/70">Name</span>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm text-white/70">WhatsApp Number</span>
                        <input
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+9665XXXXXXXX"
                          className="h-12 rounded-2xl border border-white/12 bg-black/20 px-4 text-white placeholder:text-white/35 outline-none focus:border-brand-gold/60"
                        />
                        <span className="text-[11px] text-white/45">Include country code (e.g. +966...)</span>
                        {waUsedError && (
                          <span className="text-[11px] text-red-200">
                            {waUsedError}
                          </span>
                        )}
                      </label>

                      {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {error}
                        </div>
                      )}

                      {step === "form" ? (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                            Voucher generation is temporarily disabled.
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              return;
                            }}
                            disabled={true}
                            className="w-full rounded-xl bg-white text-[#0b102e] px-4 py-3 font-bold opacity-60 pointer-events-none"
                          >
                            Voucher generation disabled
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {step === "result" && created && (
                  <div className="mt-6">
                    <div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white/70">
                      Voucher generated. Use the popup window to view and share your voucher.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: links */}
            <div className="rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                    <Sparkles className="h-4 w-4 text-brand-gold" />
                    Quick Links
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <a
                    href="https://goo.gl/maps/xyz123"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/20">
                        <img src="/icon-location.svg" alt="Location" className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white/90">Our Location</div>
                        <div className="mt-1 text-xs text-white/55">
                          Find us at Cozy Corner Cafe, Riyadh
                        </div>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/9665XXXXXXXXX"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/20">
                        <img src="/icon-whatsapp.svg" alt="WhatsApp" className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white/90">Chat with Us</div>
                        <div className="mt-1 text-xs text-white/55">
                          Have questions? We're here to help!
                        </div>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://instagram.com/yourcafe"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/20">
                        <img src="/icon-instagram.svg" alt="Instagram" className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white/90">Follow us on Instagram</div>
                        <div className="mt-1 text-xs text-white/55">
                          Check out our latest updates and promotions
                        </div>
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://facebook.com/yourcafe"
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/20">
                        <img src="/icon-facebook.svg" alt="Facebook" className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white/90">Like us on Facebook</div>
                        <div className="mt-1 text-xs text-white/55">
                          Join our community and stay updated
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}