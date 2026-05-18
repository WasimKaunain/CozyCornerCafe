import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Minus, Plus, ShoppingCart } from "lucide-react";

// Parsed from `cozy_corner_menu.txt` (kept in the same order/grouping)

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

type CartLine = {
  key: string;
  item: MenuItem;
  qty: number;
  unitPrice: number;
};

type Address = {
  name: string;
  phone?: string;
  address1: string;
  address2: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

type OrderDraft = {
  cart: Record<string, CartLine>;
  address: Address;
};

const DEFAULT_ADDRESS: Address = {
  name: "",
  phone: "",
  address1: "",
  address2: "",
  district: "",
  city: "Riyadh",
  state: "Riyadh",
  postalCode: "",
  notes: "",
};

export const MENU: MenuGroup[] = [
  {
    titleEn: "COFFEE",
    titleAr: "قهوة",
    items: [
      { enName: "Cozy Latte", arName: "كوزي لاتيه", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "88" },
      { enName: "White Mocha", arName: "موكا بيضاء", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "91" },
      { enName: "Pistachio Latte", arName: "لاتيه فستق", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "123" },
      { enName: "Caramel Latte", arName: "كراميل لاتيه", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "94" },
      { enName: "Cappuccino", arName: "كابتشينو", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "75" },
      { enName: "Latte", arName: "لاتيه", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "60" },
      { enName: "Flat White", arName: "فلات وايت", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "75" },
      { enName: "Cortado", arName: "كورتادو", details: "Hot / Cold / Frape", arDetails: "ساخن / بارد / معطر", price: "12/12/14", kcal: "85" },
      { enName: "Matcha", arName: "ماتشا", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "16", kcal: "57" },
      { enName: "Americano", arName: "أمريكانو", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "8", kcal: "2" },
      { enName: "Espresso", arName: "اسبريسو", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "7", kcal: "2" },
      { enName: "Coffee Of The Day", arName: "قهوة اليوم", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "10", kcal: "2" },
      { enName: "V60", arName: "V٦٠", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "14", kcal: "2" },
      { enName: "Cozy Cold Brew", arName: "المشروب البارد", details: "Hot / Cold", arDetails: "ساخن / بارد", price: "12", kcal: "2" },
    ],
  },
  {
    titleEn: "TEA",
    titleAr: "شاي",
    items: [
      { enName: "Chai latte", arName: "شاي لاتيه", details: "Hot", arDetails: "ساخن", price: "8", kcal: "155" },
      { enName: "Iced Peach Tea", arName: "شاي الخوخ المثلج", details: "Cold", arDetails: "بارد", price: "12", kcal: "5" },
      { enName: "Black Tea", arName: "شاي أسود", details: "Hot", arDetails: "ساخن", price: "5", kcal: "2" },
      { enName: "Lemon Ginger Tea", arName: "شاي ليمون وزنجبيل", details: "Hot", arDetails: "ساخن", price: "6", kcal: "4" },
      { enName: "Cutting Chai", arName: "شاي كاتينج", details: "Hot", arDetails: "ساخن", price: "5", kcal: "2" },
    ],
  },
  {
    titleEn: "OTHER DRINK",
    titleAr: "مشروبات أخرى",
    items: [
      { enName: "Hot Chocolate", arName: "شكولاتة ساخنة", details: "Hot", arDetails: "ساخن", price: "9", kcal: "240" },
      { enName: "Mojito", arName: "موهيتو", details: "Cold", arDetails: "بارد", price: "14", kcal: "130" },
      { enName: "Hibiscus Lemonade", arName: "عصير الكركديه بالليمون", details: "Cold", arDetails: "بارد", price: "14", kcal: "105" },
      { enName: "Turkish Coffee", arName: "قهوة تركية", details: "Hot", arDetails: "ساخن", price: "7", kcal: "2" },
      { enName: "Arabic Qahwa Jar", arName: "جرة القهوة العربية", details: "Hot", arDetails: "ساخن", price: "10", kcal: "5" },
    ],
  },
  {
    titleEn: "DESSERT",
    titleAr: "حلويات",
    items: [
      { enName: "Pancake", arName: "فطيرة بان كيك", details: "Half / Full", arDetails: "نصف / ممتلئ", price: "8/14", kcal: "190" },
      { enName: "Waffles", arName: "وافل", details: "Half / Full", arDetails: "نصف / ممتلئ", price: "8/14", kcal: "291" },
      { enName: "French Toast", arName: "خبز فرنسي محمص", price: "16", kcal: "350" },
      { enName: "Choco Pudding Cake", arName: "كعكة بودنغ الشوكولاتة", price: "15", kcal: "365" },
      { enName: "Croissant", arName: "كرواسون", price: "8", kcal: "451" },
      { enName: "Muffin", arName: "مافن", price: "8", kcal: "355" },
      { enName: "Chease Cake", arName: "تشيز كيك", price: "12", kcal: "378" },
      { enName: "Cookies", arName: "كوكيز", price: "7", kcal: "370" },
      { enName: "Ciabatta", arName: "شياباتا", price: "16", kcal: "270" },
    ],
  },
  {
    titleEn: "ADDON",
    titleAr: "إضافات",
    items: [
      { enName: "Extra Shot", arName: "جرعة إضافية", price: "2" },
      { enName: "Extra Sauces", arName: "صلصة إضافية", price: "2" },
      { enName: "Extra Cream", arName: "قوام كريمي إضافي", price: "2" },
      { enName: "Soya or Almond milk", arName: "حليب الصويا أو اللوز", price: "2" },
    ],
  },
  {
    titleEn: "WATER",
    titleAr: "مياه",
    items: [
      { enName: "Drinking Water 330 ml", arName: "مياه شرب ٣٣٠ مل", price: "1" },
      { enName: "Still Water 330 ml", arName: "مياه عادية ٣٣٠ مل", price: "9" },
      { enName: "Sparkling water 250 ml", arName: "مياه غازية ٢٥٠ مل", price: "9" },
    ],
  },
];

function parseFirstPrice(price: string) {
  // price can be "12/12/14" or "8/14" or "16"
  const first = String(price).split("/")[0]?.trim();
  const n = Number(first);
  return Number.isFinite(n) ? n : 0;
}

function buildItemKey(group: MenuGroup, item: MenuItem) {
  return `${group.titleEn}::${item.enName}`;
}

function cartTotals(cart: Record<string, CartLine>) {
  const lines = Object.values(cart).filter((l) => l.qty > 0);
  const itemsCount = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  return { lines, itemsCount, total };
}

export default function OrderOnline() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateDraft = (location.state as OrderDraft | null) ?? null;

  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const [cart, setCart] = useState<Record<string, CartLine>>(stateDraft?.cart ?? {});
  const address = stateDraft?.address ?? DEFAULT_ADDRESS;

  const groups = useMemo(() => MENU, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => {
        const items = g.items.filter((it) => {
          const hay = `${it.enName} ${it.arName ?? ""} ${it.details ?? ""} ${it.arDetails ?? ""}`.toLowerCase();
          return q ? hay.includes(q) : true;
        });
        return { ...g, items };
      })
      .filter((g) => (activeGroup ? g.titleEn === activeGroup : true))
      .filter((g) => g.items.length > 0);
  }, [groups, query, activeGroup]);

  const totals = useMemo(() => cartTotals(cart), [cart]);

  function setQty(key: string, item: MenuItem, qty: number) {
    const clamped = Math.max(0, Math.min(99, qty));
    setCart((prev) => {
      const next = { ...prev };
      if (clamped === 0) {
        delete next[key];
        return next;
      }
      const unitPrice = parseFirstPrice(item.price);
      next[key] = { key, item, qty: clamped, unitPrice };
      return next;
    });
  }

  function proceed() {
    if (totals.lines.length === 0) return;
    navigate("/order/preview", { state: { cart, address } satisfies OrderDraft });
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
                <div className="text-[11px] text-white/60 truncate">Order Online • Free Delivery</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/order")}
              className="hidden"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/10"
            >
              Back to site
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items... / ابحث..."
                className="h-11 w-full rounded-2xl border border-white/12 bg-black/30 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/45" />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 text-sm font-semibold text-white/85 hover:bg-white/10"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/50">Category</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGroup(null)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-semibold border transition " +
                    (activeGroup == null
                      ? "bg-brand-gold text-brand-navy border-brand-gold/40"
                      : "bg-black/20 text-white/80 border-white/10 hover:bg-black/30")
                  }
                >
                  All
                </button>
                {groups.map((g) => (
                  <button
                    key={g.titleEn}
                    type="button"
                    onClick={() => setActiveGroup(g.titleEn)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-semibold border transition " +
                      (activeGroup === g.titleEn
                        ? "bg-brand-gold text-brand-navy border-brand-gold/40"
                        : "bg-black/20 text-white/80 border-white/10 hover:bg-black/30")
                    }
                  >
                    {g.titleEn}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Cart summary */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-brand-gold" />
              <span className="text-white/80">Items:</span>
              <span className="font-bold text-white">{totals.itemsCount}</span>
            </div>
            <div className="text-sm">
              <span className="text-white/60">Total:</span>{" "}
              <span className="font-extrabold text-brand-gold tabular-nums">{totals.total.toFixed(2)} SR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28">
        {filteredGroups.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No items found.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((g) => (
              <section key={g.titleEn} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-white/10">
                  <div className="text-2xl font-black tracking-tight">
                    {g.titleEn}
                    {g.titleAr ? <span className="ml-2 text-white/55 text-lg font-semibold">{g.titleAr}</span> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[11px] uppercase tracking-wider text-white/50">
                    <div>Item</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Kcal</div>
                    <div className="text-right">Qty</div>
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {g.items.map((it, idx) => {
                    const key = buildItemKey(g, it);
                    const qty = cart[key]?.qty ?? 0;
                    return (
                      <div key={key + idx} className="p-5 sm:p-6 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-start">
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

                        <div className="text-right font-extrabold text-brand-gold tabular-nums whitespace-nowrap">
                          {it.price}
                        </div>
                        <div className="text-right text-white/70 tabular-nums whitespace-nowrap">{it.kcal ?? "—"}</div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setQty(key, it, qty - 1)}
                            disabled={qty <= 0}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/90 hover:bg-white/10 disabled:opacity-40"
                            aria-label={`Decrease ${it.enName}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="w-8 text-center font-bold tabular-nums">{qty}</div>
                          <button
                            type="button"
                            onClick={() => setQty(key, it, qty + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/90 hover:bg-white/10"
                            aria-label={`Increase ${it.enName}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-6 text-[11px] text-white/55">
          <p className="font-semibold text-white/70">Terms & Conditions</p>
          <p className="mt-1">
            Delivery is available for addresses within a 5 km radius of Cozy Corner Cafe. Orders outside this service area may
            be declined or require in-store pickup.
          </p>
        </div>
      </div>

      {/* Sticky proceed */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-white/60">Total payable</div>
            <div className="font-extrabold text-brand-gold tabular-nums">{totals.total.toFixed(2)} SR</div>
          </div>

          <button
            type="button"
            onClick={proceed}
            disabled={totals.lines.length === 0}
            className="rounded-2xl bg-brand-gold px-5 py-3 font-extrabold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.28)] transition hover:brightness-110 disabled:opacity-50"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
