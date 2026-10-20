"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Lang = "ar" | "tr";
type Restaurant = { id: string; name_ar: string; name_tr: string; image_url: string | null; rating: number; delivery_minutes: number; delivery_fee: number; is_open: boolean };
type Category = { id: string; name_ar: string; name_tr: string; icon: string | null };
const TX = {
  ar: { search: "ابحث عن مطعم أو أكل...", cats: "التصنيفات", near: "المطاعم القريبة", min: "دقيقة", fee: "توصيل", open: "مفتوح", closed: "مغلق", empty: "لا توجد مطاعم بعد. أضفها من لوحة التحكم." },
  tr: { search: "Restoran veya yemek ara...", cats: "Kategoriler", near: "Yakındaki restoranlar", min: "dk", fee: "Teslimat", open: "Açık", closed: "Kapalı", empty: "Henüz restoran yok. Yönetim panelinden ekleyin." },
};

export default function Home() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [list, setList] = useState<Restaurant[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const l = localStorage.getItem("xo_lang") as Lang | null;
    if (l) pick(l, false);
    supabase.from("restaurants").select("*").eq("is_active", true).order("rating", { ascending: false }).then(({ data }) => setList((data as Restaurant[]) ?? []));
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats((data as Category[]) ?? []));
  }, []);

  function pick(l: Lang, store = true) {
    setLang(l);
    if (store) localStorage.setItem("xo_lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }

  if (!lang) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <img src="/logo.png" alt="XO Delivery" className="w-48" />
      <button onClick={() => pick("ar")} className="w-full max-w-xs rounded-2xl bg-xo py-3 font-bold text-white">العربية</button>
      <button onClick={() => pick("tr")} className="w-full max-w-xs rounded-2xl border py-3 font-bold">Türkçe</button>
    </main>
  );

  const t = TX[lang];
  const name = (r: Restaurant | Category) => (lang === "ar" ? r.name_ar : r.name_tr);
  const shown = list.filter((r) => name(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-3">
      <header className="flex items-center justify-between"><img src="/logo.png" alt="XO" className="h-12" />
        <button className="rounded-full border px-3 py-1 text-sm" onClick={() => pick(lang === "ar" ? "tr" : "ar")}>{lang === "ar" ? "Türkçe" : "العربية"}</button></header>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="my-3 w-full rounded-2xl border bg-[var(--card)] p-3" />
      <h2 className="mb-2 font-bold">{t.cats}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">{cats.map((c) => (
        <div key={c.id} className="shrink-0 text-center text-xs"><div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl border bg-[var(--card)] text-2xl">{c.icon}</div>{name(c)}</div>))}</div>
      <h2 className="mb-2 mt-4 font-bold">{t.near}</h2>
      {shown.length === 0 && <p className="text-sm opacity-60">{t.empty}</p>}
      {shown.map((r) => (
        <article key={r.id} className="mb-3 overflow-hidden rounded-2xl border bg-[var(--card)]">
          <div className="flex h-32 items-center justify-center bg-orange-500/10 text-6xl">{r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : "🍽️"}</div>
          <div className="p-3"><div className="flex justify-between"><b>{name(r)}</b><span>⭐ {r.rating}</span></div>
            <div className="mt-1 flex justify-between text-sm opacity-70"><span>⏱ {r.delivery_minutes} {t.min} · {t.fee} {r.delivery_fee} ₺</span><span>{r.is_open ? t.open : t.closed}</span></div></div>
        </article>))}
    </main>
  );
}
