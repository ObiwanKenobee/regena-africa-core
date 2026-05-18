import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "household" | "farmer" | "sme" | "rider";

export type CartItem = {
  id: string;
  name: string;
  farm: string;
  price: number;
  unit: string;
  qty: number;
};

export type OrderStatus =
  | "paid"
  | "preparing"
  | "picked"
  | "in_transit"
  | "delivered";

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  total: number;
  phone: string;
  rider: string;
  route: string;
  status: OrderStatus;
  progress: number; // 0..100
  channel: "marketplace" | "whatsapp";
};

export type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  households: number;
  waste: number; // tons
  deliveries: number;
  jobs: number;
  co2: number; // tons
  revenue: number; // KSh
  status: "online" | "scaling" | "pilot";
};

export const ZONES: Zone[] = [
  { id: "nairobi", name: "Nairobi", x: 62, y: 58, size: 24, households: 18420, waste: 642, deliveries: 4120, jobs: 540, co2: 1180, revenue: 78_400_000, status: "online" },
  { id: "kiambu", name: "Kiambu", x: 58, y: 52, size: 12, households: 6210, waste: 218, deliveries: 1240, jobs: 168, co2: 410, revenue: 22_300_000, status: "online" },
  { id: "nakuru", name: "Nakuru", x: 48, y: 48, size: 16, households: 9340, waste: 384, deliveries: 1840, jobs: 224, co2: 612, revenue: 34_800_000, status: "online" },
  { id: "kisumu", name: "Kisumu", x: 28, y: 50, size: 14, households: 7820, waste: 296, deliveries: 1420, jobs: 196, co2: 488, revenue: 28_600_000, status: "scaling" },
  { id: "eldoret", name: "Eldoret", x: 38, y: 38, size: 10, households: 4180, waste: 142, deliveries: 620, jobs: 88, co2: 224, revenue: 12_400_000, status: "scaling" },
  { id: "mombasa", name: "Mombasa", x: 82, y: 80, size: 12, households: 5620, waste: 124, deliveries: 180, jobs: 56, co2: 188, revenue: 6_800_000, status: "pilot" },
  { id: "nyeri", name: "Nyeri", x: 60, y: 44, size: 8, households: 2640, waste: 41, deliveries: 0, jobs: 12, co2: 18, revenue: 1_200_000, status: "pilot" },
];

type AtlasState = {
  role: Role | null;
  setRole: (r: Role | null) => void;
  cart: CartItem[];
  addToCart: (i: Omit<CartItem, "qty">, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  placeOrder: (o: Omit<Order, "id" | "createdAt" | "status" | "progress">) => Order;
  advanceOrder: (id: string) => void;
  selectedZone: string;
  setSelectedZone: (id: string) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (v: boolean) => void;
};

const Ctx = createContext<AtlasState | null>(null);

const STORAGE = "atlas-sanctum-v1";

type Persisted = {
  role: Role | null;
  cart: CartItem[];
  orders: Order[];
  lowBandwidth: boolean;
};

function load(): Persisted {
  if (typeof window === "undefined")
    return { role: null, cart: [], orders: [], lowBandwidth: false };
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { role: null, cart: [], orders: [], lowBandwidth: false };
    return JSON.parse(raw);
  } catch {
    return { role: null, cart: [], orders: [], lowBandwidth: false };
  }
}

const ORDER_FLOW: OrderStatus[] = ["paid", "preparing", "picked", "in_transit", "delivered"];

export function AtlasProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [role, setRole] = useState<Role | null>(initial.role);
  const [cart, setCart] = useState<CartItem[]>(initial.cart);
  const [orders, setOrders] = useState<Order[]>(initial.orders);
  const [selectedZone, setSelectedZone] = useState<string>("nairobi");
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(initial.lowBandwidth);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    const data: Persisted = { role, cart, orders, lowBandwidth };
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }, [role, cart, orders, lowBandwidth]);

  // auto-advance in-flight orders for prototype realism
  useEffect(() => {
    const t = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.status === "delivered") return o;
          const nextProgress = Math.min(100, o.progress + 12);
          let status: OrderStatus = o.status;
          if (nextProgress >= 100) status = "delivered";
          else if (nextProgress >= 70) status = "in_transit";
          else if (nextProgress >= 40) status = "picked";
          else if (nextProgress >= 15) status = "preparing";
          return { ...o, progress: nextProgress, status };
        }),
      );
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const addToCart: AtlasState["addToCart"] = (item, qty = 1) => {
    setCart((c) => {
      const found = c.find((x) => x.id === item.id);
      if (found) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + qty } : x));
      return [...c, { ...item, qty }];
    });
  };
  const updateQty: AtlasState["updateQty"] = (id, qty) =>
    setCart((c) =>
      qty <= 0 ? c.filter((x) => x.id !== id) : c.map((x) => (x.id === id ? { ...x, qty } : x)),
    );
  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder: AtlasState["placeOrder"] = (o) => {
    const order: Order = {
      ...o,
      id: "AT-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      createdAt: Date.now(),
      status: "paid",
      progress: 5,
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const advanceOrder = (id: string) =>
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const i = ORDER_FLOW.indexOf(o.status);
        const next = ORDER_FLOW[Math.min(i + 1, ORDER_FLOW.length - 1)];
        return { ...o, status: next, progress: Math.min(100, o.progress + 25) };
      }),
    );

  const value: AtlasState = useMemo(
    () => ({
      role,
      setRole,
      cart,
      addToCart,
      updateQty,
      clearCart,
      cartTotal,
      orders,
      placeOrder,
      advanceOrder,
      selectedZone,
      setSelectedZone,
      lowBandwidth,
      setLowBandwidth,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, cart, orders, selectedZone, lowBandwidth, cartTotal],
  );

  return (
    <Ctx.Provider value={value}>
      <div className={lowBandwidth ? "atlas-lowbw" : undefined}>{children}</div>
    </Ctx.Provider>
  );
}

export function useAtlas() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAtlas must be used within AtlasProvider");
  return v;
}

export function statusLabel(s: OrderStatus) {
  return {
    paid: "Payment received",
    preparing: "Preparing at hub",
    picked: "Picked by rider",
    in_transit: "In transit",
    delivered: "Delivered",
  }[s];
}
