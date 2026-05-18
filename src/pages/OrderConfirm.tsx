import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, XCircle, Pencil, Send, CheckCircle2 } from "lucide-react";

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

function formatOrderId() {
  // Lightweight client-side order id (for WhatsApp reference)
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `CC-${ts}-${rand}`;
}

function buildWhatsappMessage(orderId: string, lines: CartLine[], total: number, address: Address) {
  const itemLines = lines
    .map((l, i) => {
      const lineTotal = (l.qty * l.unitPrice).toFixed(2);
      const unit = l.unitPrice.toFixed(2);
      return `${i + 1}. ${l.item.enName} — Qty: ${l.qty} — ${unit} SR each — Line: ${lineTotal} SR`;
    })
    .join("\n");

  const addr = [
    address.address1,
    address.address2 ? address.address2 : null,
    `District: ${address.district}`,
    `City: ${address.city}`,
    `State: ${address.state}`,
    address.postalCode ? `Postal Code: ${address.postalCode}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const notes = address.notes?.trim() ? address.notes.trim() : "—";
  const phone = address.phone?.trim() ? address.phone.trim() : "—";

  return (
    `Cozy Corner Cafe — Online Order\n` +
    `Order ID: ${orderId}\n` +
    `--------------------------------\n` +
    `Customer: ${address.name}\n` +
    `Phone/WhatsApp: ${phone}\n` +
    `--------------------------------\n` +
    `Items:\n${itemLines}\n` +
    `--------------------------------\n` +
    `Total Payable: ${total.toFixed(2)} SR\n` +
    `--------------------------------\n` +
    `Delivery Address:\n${addr}\n` +
    `--------------------------------\n` +
    `Notes: ${notes}\n` +
    `\nPlease confirm availability and delivery time. Thank you!`
  );
}

export default function OrderConfirm() {
  const navigate = useNavigate();
  const location = useLocation();

  const draft = (location.state as OrderDraft | null) ?? null;
  const cart = draft?.cart ?? {};
  const address =
    draft?.address ??
    ({
      name: "",
      phone: "",
      address1: "",
      address2: "",
      district: "",
      city: "Riyadh",
      state: "Riyadh",
      postalCode: "",
      notes: "",
    } as Address);

  const totals = useMemo(() => cartTotals(cart), [cart]);

  const [orderId] = useState(() => formatOrderId());
  const [showSubmitHelp, setShowSubmitHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function cancel() {
    navigate("/order", { state: { cart, address } satisfies OrderDraft });
  }

  function edit() {
    navigate("/order", { state: { cart, address } satisfies OrderDraft });
  }

  async function submit() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const items = totals.lines.map((l) => ({
      name: l.item.enName,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.qty * l.unitPrice,
    }));

    // Fire-and-forget DB tracking (best-effort). Even if it fails,
    // we still open WhatsApp so the customer can place the order.
    try {
      await fetch("/api/order-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          totalPrice: totals.total,
          currency: "SR",
          items,
          customer: {
            name: address.name,
            phone: address.phone,
            address1: address.address1,
            address2: address.address2,
            district: address.district,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            notes: address.notes,
          },
        }),
      });
    } catch {
      // ignore
    }

    const message = buildWhatsappMessage(orderId, totals.lines, totals.total, address);
    const waNumber = "966583236711";
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    setShowSubmitHelp(true);

    window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setIsSubmitting(false);
    }, 450);
  }

  return (
    <div className="min-h-screen bg-[#0b102e] text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/order/preview", { state: { cart, address } satisfies OrderDraft })}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="text-sm font-semibold text-white/80">Final Preview</div>
          <div className="w-20" aria-hidden="true" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/55">Order reference</div>
                <div className="mt-1 text-2xl font-black tracking-tight">{orderId}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-white/55">Total payable</div>
                <div className="mt-1 text-2xl font-black tracking-tight text-brand-gold tabular-nums">
                  {totals.total.toFixed(2)} SR
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {totals.lines.map((l) => (
              <div key={l.key} className="p-5 sm:p-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-white/95 truncate">{l.item.enName}</div>
                  {l.item.details ? <div className="text-xs text-white/60">{l.item.details}</div> : null}
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
            <div className="mt-1 text-2xl font-black tracking-tight">{address.name || "—"}</div>
          </div>

          <div className="p-5 sm:p-6 text-sm text-white/75 space-y-2">
            <div className="text-white/60">Phone/WhatsApp: {address.phone?.trim() ? address.phone : "—"}</div>
            <div className="whitespace-pre-line">
              {address.address1}
              {address.address2 ? `\n${address.address2}` : ""}
              {`\nDistrict: ${address.district}`}
              {`\nCity: ${address.city}`}
              {`\nState: ${address.state}`}
              {address.postalCode ? `\nPostal Code: ${address.postalCode}` : ""}
            </div>
            <div className="text-white/60">Notes: {address.notes?.trim() ? address.notes : "—"}</div>
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

      {/* Sticky actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={edit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-gold px-5 py-3 text-sm font-extrabold text-brand-navy shadow-[0_18px_55px_rgba(195,160,89,0.28)] transition hover:brightness-110"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Instructions Pop */}
      {showSubmitHelp ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b102e] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-brand-gold" />
              <div>
                <div className="text-lg font-extrabold">Confirm & Send on WhatsApp</div>
                <div className="mt-1 text-sm text-white/70">
                  We’re opening WhatsApp with your order message. Please review it and tap <span className="font-semibold text-white">Send</span>
                  to place the order with Cozy Corner Cafe.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitHelp(false)}
              className="mt-5 w-full rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/85 hover:bg-white/10"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
