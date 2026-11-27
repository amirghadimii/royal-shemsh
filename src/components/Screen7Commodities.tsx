"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FolderKanban,
  GripVertical,
  Pencil,
  Plus,
  Power,
  Save,
  Trash2,
} from "lucide-react";
import { AppShell, NoAccessBanner } from "@/components/design-system";
import { SAMPLE_USER } from "@/data/sample";
import { formatFaNumber } from "@/lib/format";
import { useEndpointAccess } from "@/lib/useEndpointAccess";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

interface ProductGroupOption {
  id: string;
  name: string;
}

interface CommodityItem {
  id: string;
  name: string;
  badge: string;
  unit: string;
  productGroupId?: string;
  buyPrice: number;
  sellPrice: number;
  minOrder: string;
  maxOrder: string;
  minLimit: string;
  maxLimit: string;
  isActive: boolean;
}

const INITIAL_COMMODITIES: CommodityItem[] = [
  {
    id: "c1",
    name: "نقد فردا (آبشده)",
    badge: "طلا ۱۸ عیار",
    unit: "گرم",
    buyPrice: 44_280_000,
    sellPrice: 44_320_000,
    minOrder: "1",
    maxOrder: "1000",
    minLimit: "۱ گرم",
    maxLimit: "۱٬۰۰۰ گرم",
    isActive: true,
  },
  {
    id: "c2",
    name: "نقد پس\u200cفردا",
    badge: "طلا ۱۸ عیار",
    unit: "گرم",
    buyPrice: 44_300_000,
    sellPrice: 44_350_000,
    minOrder: "10",
    maxOrder: "1000",
    minLimit: "۱۰ گرم",
    maxLimit: "۱٬۰۰۰ گرم",
    isActive: true,
  },
  {
    id: "c3",
    name: "سکه امامی ۸۶",
    badge: "طرح جدید",
    unit: "عدد",
    buyPrice: 51_100_000,
    sellPrice: 51_250_000,
    minOrder: "1",
    maxOrder: "100",
    minLimit: "۱ عدد",
    maxLimit: "۱۰۰ عدد",
    isActive: true,
  },
  {
    id: "c4",
    name: "نیم سکه",
    badge: "بانکی",
    unit: "عدد",
    buyPrice: 27_400_000,
    sellPrice: 27_550_000,
    minOrder: "1",
    maxOrder: "200",
    minLimit: "۱ عدد",
    maxLimit: "۲۰۰ عدد",
    isActive: true,
  },
  {
    id: "c5",
    name: "ربع سکه",
    badge: "بانکی",
    unit: "عدد",
    buyPrice: 17_100_000,
    sellPrice: 17_250_000,
    minOrder: "1",
    maxOrder: "300",
    minLimit: "۱ عدد",
    maxLimit: "۳۰۰ عدد",
    isActive: true,
  },
  {
    id: "c6",
    name: "گرمی بانکی",
    badge: "سکه ۱ گرمی",
    unit: "عدد",
    buyPrice: 8_400_000,
    sellPrice: 8_500_000,
    minOrder: "1",
    maxOrder: "500",
    minLimit: "۱ عدد",
    maxLimit: "۵۰۰ عدد",
    isActive: true,
  },
  {
    id: "c7",
    name: "دلار آمریکا",
    badge: "اسکناس",
    unit: "دلار",
    buyPrice: 69_200,
    sellPrice: 69_400,
    minOrder: "100",
    maxOrder: "50000",
    minLimit: "۱۰۰ دلار",
    maxLimit: "۵۰٬۰۰۰ دلار",
    isActive: true,
  },
];

export function Screen7Commodities() {
  const { accessDenied } = useEndpointAccess("/admin/products");
  const [items, setItems] = useState<CommodityItem[]>(INITIAL_COMMODITIES);
  const [groups, setGroups] = useState<ProductGroupOption[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formGroupId, setFormGroupId] = useState("");
  const [formBuy, setFormBuy] = useState("45000000");
  const [formSell, setFormSell] = useState("45150000");
  const [formMin, setFormMin] = useState("1");
  const [formMax, setFormMax] = useState("100");
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token || accessDenied) return;

    try {
      const [prodRes, grpRes] = await Promise.all([
        fetch(`${API_BASE}/admin/products`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/product-groups`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        if (Array.isArray(prodJson?.products)) {
          const mapped: CommodityItem[] = prodJson.products.map(
            (p: {
              id: string;
              name: string;
              badge: string;
              unit: string;
              productGroupId: string;
              buyPrice: string | number;
              sellPrice: string | number;
              minOrder: string | number;
              maxOrder: string | number;
              isActive: boolean;
            }) => ({
              id: p.id,
              name: p.name,
              badge: p.badge,
              unit: p.unit,
              productGroupId: p.productGroupId,
              buyPrice: Number(p.buyPrice),
              sellPrice: Number(p.sellPrice),
              minOrder: String(p.minOrder),
              maxOrder: String(p.maxOrder),
              minLimit: `${formatFaNumber(Number(p.minOrder))} ${p.unit}`,
              maxLimit: `${formatFaNumber(Number(p.maxOrder))} ${p.unit}`,
              isActive: p.isActive,
            })
          );
          setItems(mapped);
        }
      }
      if (grpRes.ok) {
        const grpJson = await grpRes.json();
        if (Array.isArray(grpJson?.groups)) {
          setGroups(grpJson.groups);
          if (grpJson.groups.length > 0) {
            setFormGroupId((prev) => prev || grpJson.groups[0].id);
          }
        }
      }
    } catch {
      // keep sample fallback
    }
  }, [accessDenied]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (accessDenied) {
    return (
      <AppShell
        activeTab="more"
        userName={SAMPLE_USER.fullName}
        isOnline={SAMPLE_USER.isOnline}
      >
        <NoAccessBanner />
      </AppShell>
    );
  }

  const getToken = () =>
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("rs_session_token")
      : null;

  const moveItem = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(target, 0, removed);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    setErrorMsg(null);
    setNotice(null);
    const token = getToken();
    if (!token) {
      setNotice("ترتیب نمایش کالاها ذخیره نمایشی شد.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/products/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ orderedIds: items.map((i) => i.id) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data?.message ?? "خطا در ذخیره ترتیب");
        return;
      }
      setNotice("ترتیب نمایش کالاها با موفقیت ذخیره شد.");
      await loadProducts();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    }
  };

  const handleCreateSubmit = async () => {
    setErrorMsg(null);
    setNotice(null);
    const token = getToken();
    if (!token) {
      setNotice("افزودن کالا (نمایش نمونه)");
      setShowCreateForm(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: formName,
          productGroupId: formGroupId || undefined,
          buyPrice: formBuy,
          sellPrice: formSell,
          minOrder: formMin,
          maxOrder: formMax,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ایجاد کالا");
        return;
      }
      setNotice(`کالای «${data.product.name}» با موفقیت ایجاد شد.`);
      setShowCreateForm(false);
      setFormName("");
      await loadProducts();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: CommodityItem) => {
    setEditingId(item.id);
    setShowCreateForm(false);
    setFormName(item.name);
    setFormBuy(String(item.buyPrice));
    setFormSell(String(item.sellPrice));
    setFormMin(item.minOrder);
    setFormMax(item.maxOrder);
    setErrorMsg(null);
    setNotice(null);
  };

  const handleEditSubmit = async (id: string) => {
    setErrorMsg(null);
    setNotice(null);
    const token = getToken();
    if (!token) {
      setNotice("ویرایش کالا (نمایش نمونه)");
      setEditingId(null);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: formName,
          buyPrice: formBuy,
          sellPrice: formSell,
          minOrder: formMin,
          maxOrder: formMax,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در ویرایش کالا");
        return;
      }
      setNotice(`کالای «${data.product.name}» به‌روزرسانی شد.`);
      setEditingId(null);
      await loadProducts();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: CommodityItem) => {
    setErrorMsg(null);
    setNotice(null);
    const token = getToken();
    if (!token) {
      setNotice(`تغییر وضعیت ${item.name} (نمایش نمونه)`);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/products/${item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data?.message ?? "خطا در تغییر وضعیت کالا");
        return;
      }
      setNotice(
        `کالای «${item.name}» ${!item.isActive ? "فعال" : "غیرفعال"} شد.`
      );
      await loadProducts();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    }
  };

  const handleDelete = async (item: CommodityItem) => {
    setErrorMsg(null);
    setNotice(null);
    const token = getToken();
    if (!token) {
      setNotice(`حذف ${item.name} (نمایش نمونه)`);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/products/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message ?? "خطا در حذف کالا");
        return;
      }
      setNotice(`کالای «${item.name}» حذف شد.`);
      await loadProducts();
    } catch {
      setErrorMsg("خطا در ارتباط با سرور");
    }
  };

  return (
    <AppShell
      activeTab="more"
      userName={SAMPLE_USER.fullName}
      isOnline={SAMPLE_USER.isOnline}
    >
      <div className="space-y-3.5">
        {/* Toolbar */}
        <div className="grid grid-cols-[1.35fr_1fr_0.95fr] gap-1.5">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormName("");
              setErrorMsg(null);
              setShowCreateForm((prev) => !prev);
            }}
            className="flex items-center justify-center gap-1 rounded-xl bg-gold px-2 py-2.5 text-[10.5px] font-extrabold text-bg-primary hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>افزودن کالای جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setNotice("مدیریت گروه\u200cهای کالا (نمایش نمونه)")}
            className="flex items-center justify-center gap-1 rounded-xl bg-buy px-2 py-2.5 text-[10.5px] font-bold text-white hover:opacity-90 cursor-pointer"
          >
            <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>گروه{"\u200c"}های کالا</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveOrder()}
            className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 py-2.5 text-[10.5px] font-bold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>ذخیره ترتیب</span>
          </button>
        </div>

        {/* Count & Hint */}
        <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
          <h1 className="font-bold text-text-primary">
            تعداد کل کالاها: {formatFaNumber(items.filter((i) => i.isActive).length)} نماد فعال
          </h1>
          <span className="text-[10px] text-text-secondary">
            تغییر ترتیب با نگهداشتن یا دکمه{"\u200c"}ها
          </span>
        </div>

        {errorMsg ? (
          <div
            role="alert"
            className="rounded-xl border border-sell/45 bg-sell-soft px-3 py-2 text-xs font-bold text-sell"
          >
            {errorMsg}
          </div>
        ) : null}

        {showCreateForm ? (
          <section className="rounded-2xl border border-gold/35 bg-bg-card p-3.5 space-y-2.5">
            <h2 className="text-xs font-extrabold text-gold">افزودن کالای جدید</h2>
            <input
              type="text"
              placeholder="نام کالا"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
            />
            {groups.length > 0 ? (
              <select
                value={formGroupId}
                onChange={(e) => setFormGroupId(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="قیمت خرید"
                value={formBuy}
                onChange={(e) => setFormBuy(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
              <input
                type="number"
                placeholder="قیمت فروش"
                value={formSell}
                onChange={(e) => setFormSell(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
              <input
                type="number"
                placeholder="حداقل سفارش"
                value={formMin}
                onChange={(e) => setFormMin(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
              <input
                type="number"
                placeholder="حداکثر سفارش"
                value={formMax}
                onChange={(e) => setFormMax(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCreateSubmit()}
              className="w-full rounded-xl bg-gold py-2 text-xs font-extrabold text-bg-primary cursor-pointer"
            >
              {saving ? "در حال ثبت..." : "ثبت کالا"}
            </button>
          </section>
        ) : null}

        {notice ? (
          <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold-soft px-3 py-2 text-xs text-gold">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[11px] font-bold underline cursor-pointer"
            >
              بستن
            </button>
          </div>
        ) : null}

        {/* Seven Commodity Cards */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border-subtle bg-bg-card p-3.5 space-y-3"
            >
              {/* Top Row: Drag Handle + Name + Badge + 4 Control Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-text-muted"
                    aria-label="جابجایی"
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xs font-extrabold text-text-primary">
                      {item.name}
                    </h2>
                    <span className="mt-0.5 inline-block rounded-md border border-gold/25 bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-gold-t80">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* 4 Control Buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="انتقال به بالا"
                    title="انتقال به بالا"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-text-secondary hover:border-gold/40 hover:text-gold disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="انتقال به پایین"
                    title="انتقال به پایین"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-primary text-text-secondary hover:border-gold/40 hover:text-gold disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="ویرایش کالا"
                    title="ویرایش کالا"
                    onClick={() => startEdit(item)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/30 bg-gold-soft text-gold hover:bg-gold hover:text-bg-primary cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={item.isActive ? "غیرفعال کردن کالا" : "فعال کردن کالا"}
                    title={item.isActive ? "غیرفعال کردن" : "فعال کردن"}
                    onClick={() => void handleToggleStatus(item)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border cursor-pointer ${
                      item.isActive
                        ? "border-buy/30 bg-buy-soft text-buy"
                        : "border-border-subtle bg-bg-primary text-text-muted"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف کالا"
                    title="حذف کالا"
                    onClick={() => void handleDelete(item)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-sell/30 bg-sell-soft text-sell hover:bg-sell hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Buy & Sell Prices */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-buy/25 bg-buy-soft px-3 py-2">
                  <span className="block text-[10px] font-medium text-buy">
                    قیمت خرید (تومان)
                  </span>
                  <span className="tabular-nums-fa mt-0.5 block text-xs font-extrabold text-buy sm:text-sm">
                    {formatFaNumber(item.buyPrice)}
                  </span>
                </div>

                <div className="rounded-xl border border-sell/25 bg-sell-soft px-3 py-2">
                  <span className="block text-[10px] font-medium text-sell">
                    قیمت فروش (تومان)
                  </span>
                  <span className="tabular-nums-fa mt-0.5 block text-xs font-extrabold text-sell sm:text-sm">
                    {formatFaNumber(item.sellPrice)}
                  </span>
                </div>
              </div>

              {/* Order Limit */}
              <p className="rounded-lg bg-bg-primary/65 px-2.5 py-1.5 text-[11px] text-text-secondary">
                محدودیت سفارش: حداقل: {item.minLimit} | حداکثر:{" "}
                {item.maxLimit} •{" "}
                <span className={item.isActive ? "text-buy font-bold" : "text-sell font-bold"}>
                  {item.isActive ? "فعال" : "غیرفعال"}
                </span>
              </p>

              {editingId === item.id ? (
                <div className="space-y-2 border-t border-border-subtle pt-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      aria-label="قیمت خرید"
                      value={formBuy}
                      onChange={(e) => setFormBuy(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary"
                    />
                    <input
                      type="number"
                      aria-label="قیمت فروش"
                      value={formSell}
                      onChange={(e) => setFormSell(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary"
                    />
                    <input
                      type="number"
                      aria-label="حداقل سفارش"
                      value={formMin}
                      onChange={(e) => setFormMin(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary"
                    />
                    <input
                      type="number"
                      aria-label="حداکثر سفارش"
                      value={formMax}
                      onChange={(e) => setFormMax(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleEditSubmit(item.id)}
                      className="flex-1 rounded-xl bg-buy py-1.5 text-xs font-bold text-white cursor-pointer"
                    >
                      ذخیره تغییرات
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-xl border border-border-subtle px-3 py-1.5 text-xs text-text-secondary cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
