import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Minus,
  Plus,
  ShoppingCart,
  X,
  Coffee,
  CupSoda,
  Cake,
  GlassWater,
} from "lucide-react";

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
  icon?: any;
  items: MenuItem[];
};

type CartLine = {
  key: string;
  item: MenuItem;
  qty: number;
  unitPrice: number;
  selectedType?: string;
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
    icon: Coffee,
    items: [
      {
        enName: "Cozy Latte",
        arName: "كوزي لاتيه",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "88",
      },
      {
        enName: "White Mocha",
        arName: "موكا بيضاء",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "91",
      },
      {
        enName: "Pistachio Latte",
        arName: "لاتيه فستق",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "123",
      },
      {
        enName: "Caramel Latte",
        arName: "كراميل لاتيه",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "94",
      },
      {
        enName: "Cappuccino",
        arName: "كابتشينو",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "75",
      },
      {
        enName: "Latte",
        arName: "لاتيه",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "60",
      },
      {
        enName: "Flat White",
        arName: "فلات وايت",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "75",
      },
      {
        enName: "Cortado",
        arName: "كورتادو",
        details: "Hot / Cold / Frape",
        arDetails: "ساخن / بارد / فرابيه",
        price: "12/12/14",
        kcal: "85",
      },
      {
        enName: "Matcha",
        arName: "ماتشا",
        details: "Hot / Cold",
        arDetails: "ساخن / بارد",
        price: "16",
        kcal: "57",
      },
      {
        enName: "Americano",
        arName: "أمريكانو",
        details: "Hot / Cold",
        arDetails: "ساخن / بارد",
        price: "8",
        kcal: "2",
      },
      {
        enName: "Espresso",
        arName: "اسبريسو",
        details: "Hot / Cold",
        arDetails: "ساخن / بارد",
        price: "7",
        kcal: "2",
      },
      {
        enName: "Coffee Of The Day",
        arName: "قهوة اليوم",
        details: "Hot / Cold",
        arDetails: "ساخن / بارد",
        price: "10",
        kcal: "2",
      },
      {
        enName: "V60",
        arName: "V٦٠",
        details: "Hot / Cold",
        arDetails: "ساخن / بارد",
        price: "14",
        kcal: "2",
      },
      {
        enName: "Cozy Cold Brew",
        arName: "المشروب البارد",
        details: "Cold",
        arDetails: "بارد",
        price: "12",
        kcal: "2",
      },
    ],
  },

  {
    titleEn: "TEA",
    titleAr: "شاي",
    icon: CupSoda,
    items: [
      {
        enName: "Chai Latte",
        arName: "شاي لاتيه",
        details: "Hot",
        arDetails: "ساخن",
        price: "8",
        kcal: "155",
      },
      {
        enName: "Iced Peach Tea",
        arName: "شاي الخوخ المثلج",
        details: "Cold",
        arDetails: "بارد",
        price: "12",
        kcal: "5",
      },
      {
        enName: "Black Tea",
        arName: "شاي أسود",
        details: "Hot",
        arDetails: "ساخن",
        price: "5",
        kcal: "2",
      },
      {
        enName: "Lemon Ginger Tea",
        arName: "شاي ليمون وزنجبيل",
        details: "Hot",
        arDetails: "ساخن",
        price: "6",
        kcal: "4",
      },
      {
        enName: "Cutting Chai",
        arName: "شاي كاتينج",
        details: "Hot",
        arDetails: "ساخن",
        price: "5",
        kcal: "2",
      },
    ],
  },

  {
    titleEn: "OTHER DRINK",
    titleAr: "مشروبات أخرى",
    icon: CupSoda,
    items: [
      {
        enName: "Hot Chocolate",
        arName: "شكولاتة ساخنة",
        details: "Hot",
        arDetails: "ساخن",
        price: "9",
        kcal: "240",
      },
      {
        enName: "Mojito",
        arName: "موهيتو",
        details: "Cold",
        arDetails: "بارد",
        price: "14",
        kcal: "130",
      },
      {
        enName: "Hibiscus Lemonade",
        arName: "عصير الكركديه بالليمون",
        details: "Cold",
        arDetails: "بارد",
        price: "14",
        kcal: "105",
      },
      {
        enName: "Turkish Coffee",
        arName: "قهوة تركية",
        details: "Hot",
        arDetails: "ساخن",
        price: "7",
        kcal: "2",
      },
      {
        enName: "Arabic Qahwa Jar",
        arName: "جرة القهوة العربية",
        details: "Hot",
        arDetails: "ساخن",
        price: "10",
        kcal: "5",
      },
    ],
  },

  {
    titleEn: "DESSERT",
    titleAr: "حلويات",
    icon: Cake,
    items: [
      {
        enName: "Pancake",
        arName: "فطيرة بان كيك",
        details: "Half / Full",
        arDetails: "نصف / كامل",
        price: "8/14",
        kcal: "190",
      },
      {
        enName: "Waffles",
        arName: "وافل",
        details: "Half / Full",
        arDetails: "نصف / كامل",
        price: "8/14",
        kcal: "291",
      },
      {
        enName: "French Toast",
        arName: "خبز فرنسي محمص",
        price: "16",
        kcal: "350",
      },
      {
        enName: "Choco Pudding Cake",
        arName: "كعكة بودنغ الشوكولاتة",
        price: "15",
        kcal: "365",
      },
      {
        enName: "Croissant",
        arName: "كرواسون",
        price: "8",
        kcal: "451",
      },
      {
        enName: "Muffin",
        arName: "مافن",
        price: "8",
        kcal: "355",
      },
      {
        enName: "Chease Cake",
        arName: "تشيز كيك",
        price: "12",
        kcal: "378",
      },
      {
        enName: "Cookies",
        arName: "كوكيز",
        price: "7",
        kcal: "370",
      },
      {
        enName: "Ciabatta",
        arName: "شياباتا",
        price: "16",
        kcal: "270",
      },
    ],
  },

  {
    titleEn: "ADDON",
    titleAr: "إضافات",
    icon: Coffee,
    items: [
      {
        enName: "Extra Shot",
        arName: "جرعة إضافية",
        price: "2",
      },
      {
        enName: "Extra Sauces",
        arName: "صلصة إضافية",
        price: "2",
      },
      {
        enName: "Extra Cream",
        arName: "كريمة إضافية",
        price: "2",
      },
      {
        enName: "Soya or Almond milk",
        arName: "حليب الصويا أو اللوز",
        price: "2",
      },
    ],
  },

  {
    titleEn: "WATER",
    titleAr: "مياه",
    icon: GlassWater,
    items: [
      {
        enName: "Drinking Water 330 ml",
        arName: "مياه شرب ٣٣٠ مل",
        price: "1",
      },
      {
        enName: "Still Water 330 ml",
        arName: "مياه عادية ٣٣٠ مل",
        price: "9",
      },
      {
        enName: "Sparkling Water 250 ml",
        arName: "مياه غازية ٢٥٠ مل",
        price: "9",
      },
    ],
  },
];

function parsePrices(price: string) {
  return price.split("/").map((p) => Number(p.trim()));
}

function buildItemKey(
  group: MenuGroup,
  item: MenuItem,
  selectedType?: string
) {
  return `${group.titleEn}-${item.enName}-${selectedType}`;
}

function cartTotals(cart: Record<string, CartLine>) {
  const lines = Object.values(cart).filter((l) => l.qty > 0);

  const itemsCount = lines.reduce((s, l) => s + l.qty, 0);

  const total = lines.reduce(
    (s, l) => s + l.qty * l.unitPrice,
    0
  );

  return {
    lines,
    itemsCount,
    total,
  };
}

export default function OrderOnline() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateDraft =
    (location.state as OrderDraft | null) ?? null;

  const [query, setQuery] = useState("");

  const [activeGroup, setActiveGroup] =
    useState<string>("COFFEE");

  const [cart, setCart] = useState<
    Record<string, CartLine>
  >(stateDraft?.cart ?? {});

  const [selectedItem, setSelectedItem] =
    useState<MenuItem | null>(null);

  const [selectedGroup, setSelectedGroup] =
    useState<MenuGroup | null>(null);

  const [selectedOption, setSelectedOption] =
    useState("");

  const address =
    stateDraft?.address ?? DEFAULT_ADDRESS;

  const groups = useMemo(() => MENU, []);

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase();

    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => {
          const hay =
            `${i.enName} ${i.arName ?? ""}`.toLowerCase();

          return q ? hay.includes(q) : true;
        }),
      }))
      .filter((g) =>
        activeGroup
          ? g.titleEn === activeGroup
          : true
      );
  }, [groups, query, activeGroup]);

  const totals = useMemo(
    () => cartTotals(cart),
    [cart]
  );

  function addToCart(
    item: MenuItem,
    group: MenuGroup,
    type: string
  ) {
    const prices = parsePrices(item.price);

    let unitPrice = prices[0];

    if (type === "Cold" && prices[1]) {
      unitPrice = prices[1];
    }

    if (type === "Frape" && prices[2]) {
      unitPrice = prices[2];
    }

    const key = buildItemKey(group, item, type);

    setCart((prev) => {
      const next = { ...prev };

      if (next[key]) {
        next[key].qty += 1;
      } else {
        next[key] = {
          key,
          item,
          qty: 1,
          unitPrice,
          selectedType: type,
        };
      }

      return next;
    });

    setSelectedItem(null);
  }

  function changeQty(
    key: string,
    qty: number
  ) {
    setCart((prev) => {
      const next = { ...prev };

      if (qty <= 0) {
        delete next[key];
      } else {
        next[key].qty = qty;
      }

      return next;
    });
  }

  function proceed() {
    navigate("/order/preview", {
      state: {
        cart,
        address,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#1a1a1a] pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">
                Cozy Corner Cafe
              </h1>

              <p className="text-xs text-black/80">
                Order Online • Free Delivery In "<span>Askan</span>" Only
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold"
            >
              X
            </button>
          </div>

          {/* SEARCH */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search coffee..."
              className="w-full h-12 rounded-2xl bg-[#f4f1eb] pl-12 pr-4 outline-none text-sm"
            />
          </div>

          {/* CATEGORY SCROLL */}
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
            {groups.map((group) => {
              const Icon = group.icon;

              return (
                <button
                  key={group.titleEn}
                  onClick={() =>
                    setActiveGroup(group.titleEn)
                  }
                  className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-3 transition-all ${
                    activeGroup === group.titleEn
                      ? "bg-[#C3A059] text-white"
                      : "bg-[#f1ece4]"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  <span className="text-sm font-semibold">
                    {group.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="px-4 pt-5 space-y-8">
        {filteredGroups.map((group) => (
          <div key={group.titleEn}>
            <div className="mb-4">
              <h2 className="text-2xl font-black">
                {group.titleEn}
              </h2>

              <p className="text-sm text-black/50">
                {group.titleAr}
              </p>
            </div>

            <div className="space-y-4">
              {group.items.map((item) => {
                const prices = parsePrices(
                  item.price
                );

                return (
                  <div
                    key={item.enName}
                    className="rounded-3xl bg-white p-4 shadow-sm border border-black/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-black text-lg leading-tight">
                          {item.enName}
                        </h3>

                        {item.arName ? (
                          <p
                            className="text-sm text-black/60 mt-1"
                            dir="rtl"
                          >
                            {item.arName}
                          </p>
                        ) : null}

                        {item.details ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.details
                              .split("/")
                              .map((d) => (
                                <span
                                  key={d}
                                  className="rounded-full bg-[#f6f2eb] px-3 py-1 text-xs font-semibold"
                                >
                                  {d.trim()}
                                </span>
                              ))}
                          </div>
                        ) : null}

                        {/* PRICE TABLE */}
                        <div className="mt-4 flex gap-4 text-sm">
                          {prices.map((p, i) => (
                            <div key={i}>
                              <p className="text-black/40">
                                {i === 0
                                  ? "Hot"
                                  : i === 1
                                  ? "Cold"
                                  : "Frape"}
                              </p>

                              <p className="font-black text-[#C3A059]">
                                {p} SR
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ADD BUTTON */}
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setSelectedGroup(group);

                          if (
                            item.details?.includes("/")
                          ) {
                            setSelectedOption(
                              item.details
                                .split("/")[0]
                                .trim()
                            );
                          }
                        }}
                        className="h-12 px-5 rounded-2xl bg-[#C3A059] text-white font-bold"
                      >
                        Add +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CUSTOMIZATION MODAL */}
      {selectedItem && selectedGroup && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end">
          <div className="w-full rounded-t-[32px] bg-white p-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black">
                  {selectedItem.enName}
                </h3>

                <p className="text-sm text-black/50">
                  Customize your order
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedItem(null)
                }
                className="h-10 w-10 rounded-full bg-[#f3f3f3] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* OPTIONS */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                Select Type
              </p>

              <div className="grid grid-cols-3 gap-3">
                {selectedItem.details
                  ?.split("/")
                  .map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setSelectedOption(
                          option.trim()
                        )
                      }
                      className={`h-14 rounded-2xl border text-sm font-bold transition-all ${
                        selectedOption ===
                        option.trim()
                          ? "bg-[#C3A059] text-white border-[#C3A059]"
                          : "bg-white border-black/10"
                      }`}
                    >
                      {option.trim()}
                    </button>
                  ))}
              </div>
            </div>

            {/* ADD TO CART */}
            <button
              onClick={() =>
                addToCart(
                  selectedItem,
                  selectedGroup,
                  selectedOption
                )
              }
              className="mt-6 h-14 w-full rounded-2xl bg-[#C3A059] text-white text-lg font-black"
            >
              Add To Cart
            </button>
          </div>
        </div>
      )}

      {/* CART BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 p-4 z-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-black/50">
              {totals.itemsCount} Items
            </p>

            <p className="text-xl font-black text-[#C3A059]">
              {totals.total.toFixed(2)} SR
            </p>
          </div>

          <button
            disabled={totals.itemsCount === 0}
            onClick={proceed}
            className="h-14 px-6 rounded-2xl bg-[#C3A059] text-white font-black flex items-center gap-2 disabled:opacity-40"
          >
            <ShoppingCart className="h-5 w-5" />
            View Cart
          </button>
        </div>

        {/* CART ITEMS */}
        {totals.lines.length > 0 && (
          <div className="mt-4 space-y-3 max-h-44 overflow-y-auto">
            {totals.lines.map((line) => (
              <div
                key={line.key}
                className="flex items-center justify-between bg-[#f7f3ed] rounded-2xl p-3"
              >
                <div>
                  <p className="font-bold text-sm">
                    {line.item.enName}
                  </p>

                  <p className="text-xs text-black/50">
                    {line.selectedType}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      changeQty(
                        line.key,
                        line.qty - 1
                      )
                    }
                    className="h-8 w-8 rounded-full bg-white flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="font-bold">
                    {line.qty}
                  </span>

                  <button
                    onClick={() =>
                      changeQty(
                        line.key,
                        line.qty + 1
                      )
                    }
                    className="h-8 w-8 rounded-full bg-white flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}