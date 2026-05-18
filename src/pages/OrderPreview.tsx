import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type MenuItem = {
  enName: string;
  arName?: string;
  details?: string;
  arDetails?: string;
  price: string;
  kcal?: string;
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

function cartTotals(cart: Record<string, CartLine>) {
  const lines = Object.values(cart).filter((l) => l.qty > 0);
  const itemsCount = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  return { lines, itemsCount, total };
}

function FieldLabel({ children }: { children: string }) {
  return <div className="text-[11px] uppercase tracking-wider text-white/50">{children}</div>;
}

export default function OrderPreview() {
  const navigate = useNavigate();
  const location = useLocation();

  const draft = (location.state as OrderDraft | null) ?? null;
  const cart = draft?.cart ?? {};

  const totals = useMemo(() => cartTotals(cart), [cart]);

  const [address, setAddress] = useState<Address>(
    draft?.address ?? {
      name: "",
      phone: "",
      address1: "",
      address2: "",
      district: "",
      city: "Riyadh",
      state: "Riyadh",
      postalCode: "",
      notes: "",
    }
  );

  function backToMenu() {
    navigate("/order", { state: { cart, address } satisfies OrderDraft });
  }

  function proceed() {
    if (totals.lines.length === 0) return backToMenu();
    navigate("/order/confirm", { state: { cart, address } satisfies OrderDraft });
  }

  return (
    <div className="min-h-screen bg-[#0b102e] text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={backToMenu}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="text-sm font-semibold text-white/80">Preview</div>
          <div className="w-20" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-white/55">Selected items</div>
            <div className="mt-1 text-2xl font-black tracking-tight">
              {totals.itemsCount} item(s) • {totals.total.toFixed(2)} SR
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {totals.lines.map((l) => (
              <div key={l.key} className="p-5 sm:p-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-white/95 truncate">{l.item.enName}</div>
                  {l.item.details ? <div className="text-xs text-white/60">{l.item.details}</div> : null}
                  {l.item.arName ? (
                    <div className="mt-1 text-sm text-white/75" dir="rtl">
                      {l.item.arName}
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs text-white/60">
                    {l.qty} × {l.unitPrice.toFixed(2)} SR
                  </div>
                </div>

                <div className="text-right font-extrabold text-brand-gold tabular-nums whitespace-nowrap">
                  {(l.qty * l.unitPrice).toFixed(2)} SR
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-white/55">Delivery details</div>
            <div className="mt-1 text-2xl font-black tracking-tight">Address</div>
          </div>

          <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldLabel>Name</FieldLabel>
              <input
                value={address.name}
                onChange={(e) => setAddress((p) => ({ ...p, name: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Your name"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Mobile / WhatsApp (optional)</FieldLabel>
              <input
                value={address.phone ?? ""}
                onChange={(e) => setAddress((p) => ({ ...p, phone: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="+9665XXXXXXXX"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Address line 1</FieldLabel>
              <input
                value={address.address1}
                onChange={(e) => setAddress((p) => ({ ...p, address1: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Street, building, house/apartment number"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Address line 2</FieldLabel>
              <input
                value={address.address2}
                onChange={(e) => setAddress((p) => ({ ...p, address2: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Landmark, floor, gate code (optional)"
              />
            </div>

            <div>
              <FieldLabel>District</FieldLabel>
              <input
                value={address.district}
                onChange={(e) => setAddress((p) => ({ ...p, district: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Al Olaya"
                required
              />
            </div>

            <div>
              <FieldLabel>City</FieldLabel>
              <input
                value={address.city}
                onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Riyadh"
                required
              />
            </div>

            <div>
              <FieldLabel>State</FieldLabel>
              <input
                value={address.state}
                onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Riyadh"
                required
              />
            </div>

            <div>
              <FieldLabel>Postal code</FieldLabel>
              <input
                value={address.postalCode}
                onChange={(e) => setAddress((p) => ({ ...p, postalCode: e.target.value }))}
                className="mt-2 h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="Optional"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Notes for the cafe (optional)</FieldLabel>
              <textarea
                value={address.notes}
                onChange={(e) => setAddress((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/20"
                placeholder="e.g. no sugar, extra napkins, call on arrival"
              />
            </div>
          </div>

          <div className="px-5 sm:px-6 pb-6 text-[11px] text-white/55">
            <p className="font-semibold text-white/70">Terms & Conditions</p>
            <p className="mt-1">
              Delivery is available for addresses within a 5 km radius of Cozy Corner Cafe. Orders outside this service area may
              be declined or require in-store pickup.
            </p>
          </div>
        </section>
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
            disabled={totals.lines.length === 0 || !address.name.trim() || !address.address1.trim() || !address.district.trim()}
            className="rounded-2xl bg-brand-gold px-5 py-3 font-extrabold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.28)] transition hover:brightness-110 disabled:opacity-50"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
