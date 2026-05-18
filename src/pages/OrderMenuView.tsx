import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MENU } from "./OrderOnline";

type MenuItem = {
  enName: string;
  arName?: string;
  details?: string;
  arDetails?: string;
  price: string;
  kcal?: string;
};

type MenuGroup = {
  titleEn: string;
  titleAr?: string;
  items: MenuItem[];
};

export default function OrderMenuView() {
  const navigate = useNavigate();
  const groups = useMemo(() => MENU as MenuGroup[], []);
  const [page, setPage] = useState(0);

  const active = groups[Math.max(0, Math.min(groups.length - 1, page))];

  function prev() {
    setPage((p) => (p - 1 + groups.length) % groups.length);
  }

  function next() {
    setPage((p) => (p + 1) % groups.length);
  }

  return (
    <div className="min-h-screen bg-[#0b102e] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/cozy-corner-logo-transparent.svg"
                alt="Cozy Corner Cafe"
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 p-1"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/90 truncate">Cozy Corner Cafe</div>
                <div className="text-[11px] text-white/60 truncate">Menu (View only)</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              Back to site
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prev}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 text-sm font-semibold text-white/85 hover:bg-white/10"
              aria-label="Previous category"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <div className="text-center min-w-0">
              <div className="text-base sm:text-lg font-black tracking-tight truncate">
                {active?.titleEn ?? "Menu"}
                {active?.titleAr ? <span className="ml-2 text-white/55 font-semibold">{active.titleAr}</span> : null}
              </div>
              <div className="text-[11px] text-white/45">Category {page + 1} of {groups.length}</div>
            </div>

            <button
              type="button"
              onClick={next}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 text-sm font-semibold text-white/85 hover:bg-white/10"
              aria-label="Next category"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28">
        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Items</div>
            <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-3 text-[11px] uppercase tracking-wider text-white/40">
              <div>Item</div>
              <div className="text-right">Price</div>
              <div className="text-right">Kcal</div>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {active?.items?.map((it, idx) => (
              <div key={it.enName + idx} className="p-5 sm:p-6 grid grid-cols-[1fr_auto_auto] gap-3 items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <div className="font-semibold text-white/95 truncate">{it.enName}</div>
                    {it.details ? <div className="text-xs text-white/60">{it.details}</div> : null}
                  </div>
                  {it.arName ? (
                    <div className="mt-1 text-sm text-white/80" dir="rtl">
                      {it.arName}
                      {it.arDetails ? <span className="text-white/55"> — {it.arDetails}</span> : null}
                    </div>
                  ) : null}
                </div>

                <div className="text-right font-extrabold text-brand-gold tabular-nums whitespace-nowrap">{it.price}</div>
                <div className="text-right text-white/70 tabular-nums whitespace-nowrap">{it.kcal ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-[11px] text-white/55">
          <p className="font-semibold text-white/70">Terms & Conditions</p>
          <p className="mt-1">
            Delivery is available for addresses within a 5 km radius of Cozy Corner Cafe. Orders outside this service area may
            be declined or require in-store pickup.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate("/order")}
            className="rounded-2xl bg-brand-gold px-6 py-3 font-extrabold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.28)] transition hover:brightness-110"
          >
            Order Online
          </button>
        </div>
      </div>
    </div>
  );
}
