// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const ST = [["created", "جديد"], ["confirmed", "مؤكد"], ["preparing", "قيد التحضير"], ["picked_up", "السائق استلم"], ["on_the_way", "في الطريق"], ["delivered", "تم التوصيل"], ["cancelled", "ملغي"]];
const inp = "mb-2 w-full rounded-xl border bg-[var(--card)] p-2";
const card = "mb-3 rounded-2xl border bg-[var(--card)] p-3";

function Crud({ table, fields, defaults, sortKey = "name_ar", say }) {
  const [rows, setRows] = useState([]);
  const load = async () => { const { data } = await supabase.from(table).select("*").order(sortKey); setRows(data || []); };
  useEffect(() => { load(); }, [table]);
  const set = (id, k, v) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const save = async (r) => {
    const p = {};
    fields.forEach((f) => { let v = r[f.k]; if (f.t === "num") v = v === "" || v == null ? null : Number(v); if (f.t === "sel" && v === "") v = null; p[f.k] = v; });
    const { error } = await supabase.from(table).update(p).eq("id", r.id);
    say(error ? error.message : "✓ تم الحفظ");
  };
  const del = async (r) => { if (!confirm("متأكد من الحذف؟")) return; const { error } = await supabase.from(table).delete().eq("id", r.id); if (error) say(error.message); else load(); };
  const add = async () => { const { error } = await supabase.from(table).insert(defaults); if (error) say(error.message); else load(); };
  const up = async (r, k, file) => {
    if (!file) return;
    const path = `${table}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { say(error.message); return; }
    set(r.id, k, supabase.storage.from("images").getPublicUrl(path).data.publicUrl);
    say("تم رفع الصورة، اضغط حفظ");
  };
  return (
    <div>
      <button className="mb-3 rounded-xl bg-xo px-4 py-2 text-white" onClick={add}>➕ إضافة</button>
      {rows.map((r) => (
        <div key={r.id} className={card}>
          {fields.map((f) => (
            <label key={f.k} className="block text-xs opacity-70">{f.l}
              {f.t === "bool" ? <div><button className="mb-2 rounded-xl border px-3 py-1 text-sm" onClick={() => set(r.id, f.k, !r[f.k])}>{r[f.k] ? "✅ نعم" : "❌ لا"}</button></div>
                : f.t === "img" ? <div className="mb-2">{r[f.k] && <img src={r[f.k]} alt="" className="mb-1 h-20 rounded-lg object-cover" />}<input type="file" accept="image/*" onChange={(e) => up(r, f.k, e.target.files[0])} /></div>
                : f.t === "sel" ? <select className={inp} value={r[f.k] || ""} onChange={(e) => set(r.id, f.k, e.target.value)}><option value="">—</option>{(f.o || []).map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
                : f.t === "area" ? <textarea className={inp} rows={2} value={r[f.k] || ""} onChange={(e) => set(r.id, f.k, e.target.value)} />
                : <input className={inp} type={f.t === "num" ? "number" : "text"} step="any" value={r[f.k] ?? ""} onChange={(e) => set(r.id, f.k, e.target.value)} />}
            </label>))}
          <div className="flex gap-2"><button className="flex-1 rounded-xl bg-green-600 py-2 text-white" onClick={() => save(r)}>💾 حفظ</button><button className="rounded-xl border px-4" onClick={() => del(r)}>🗑</button></div>
        </div>))}
    </div>
  );
}

function Orders({ say }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("");
  const [hist, setHist] = useState({});
  const load = async () => { const { data } = await supabase.from("orders").select("*, restaurants(name_ar), order_items(name,qty,price)").order("created_at", { ascending: false }).limit(100); setRows(data || []); };
  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, []);
  const upd = async (o, patch) => { const { error } = await supabase.from("orders").update(patch).eq("id", o.id); say(error ? error.message : "✓ تم"); load(); };
  const showHist = async (o) => { const { data } = await supabase.from("order_status_history").select("*").eq("order_id", o.id).order("created_at"); setHist({ ...hist, [o.id]: data || [] }); };
  const shown = rows.filter((o) => (!fs || o.status === fs) && (`${o.tracking_number} ${o.phone} ${o.customer_name}`).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input className={inp} placeholder="بحث: رقم التتبع / هاتف / اسم" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className={inp} value={fs} onChange={(e) => setFs(e.target.value)}><option value="">كل الحالات</option>{ST.map((s) => <option key={s[0]} value={s[0]}>{s[1]}</option>)}</select>
      {shown.map((o) => (
        <div key={o.id} className={card}>
          <div className="flex justify-between"><b className="font-mono text-xo">{o.tracking_number}</b><b>{o.total} ₺</b></div>
          <div className="text-sm">{o.restaurants?.name_ar} · {o.customer_name} · <a className="text-xo" href={"tel:" + o.phone}>{o.phone}</a></div>
          <div className="text-sm opacity-70">{o.address}{o.notes ? " — " + o.notes : ""}</div>
          {o.lat != null && <a className="text-sm font-bold text-xo" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${o.lat},${o.lng}`}>📍 فتح موقع الزبون على الخريطة</a>}
          <div className="my-1 text-xs opacity-70">{(o.order_items || []).map((i) => `${i.qty}× ${i.name}`).join("، ")}</div>
          <select className={inp} value={o.status} onChange={(e) => upd(o, { status: e.target.value })}>{ST.map((s) => <option key={s[0]} value={s[0]}>{s[1]}</option>)}</select>
          <textarea className={inp} rows={1} placeholder="ملاحظات الإدارة" defaultValue={o.admin_notes || ""} onBlur={(e) => e.target.value !== (o.admin_notes || "") && upd(o, { admin_notes: e.target.value })} />
          <div className="flex gap-2"><button className="rounded-xl border px-3 py-1 text-sm" onClick={() => showHist(o)}>🕘 السجل</button>{o.status !== "cancelled" && <button className="rounded-xl border px-3 py-1 text-sm text-red-500" onClick={() => confirm("إلغاء الطلب؟") && upd(o, { status: "cancelled" })}>إلغاء الطلب</button>}</div>
          {hist[o.id] && <div className="mt-2 text-xs">{hist[o.id].map((h) => <div key={h.id}>{ST.find((s) => s[0] === h.status)?.[1]} — {new Date(h.created_at).toLocaleString("ar")}</div>)}</div>}
        </div>))}
    </div>
  );
}

function Products({ say }) {
  const [rs, setRs] = useState(null);
  useEffect(() => { supabase.from("restaurants").select("id,name_ar").order("name_ar").then(({ data }) => setRs(data || [])); }, []);
  if (!rs) return null;
  if (!rs.length) return <p>أضف مطعم أولاً.</p>;
  const o = rs.map((r) => [r.id, r.name_ar]);
  return <Crud table="products" say={say} defaults={{ restaurant_id: rs[0].id, name_ar: "منتج جديد", name_tr: "Yeni ürün", price: 100 }}
    fields={[{ k: "restaurant_id", l: "المطعم", t: "sel", o }, { k: "name_ar", l: "الاسم بالعربي" }, { k: "name_tr", l: "الاسم بالتركي" }, { k: "description_ar", l: "الوصف بالعربي", t: "area" }, { k: "description_tr", l: "الوصف بالتركي", t: "area" }, { k: "price", l: "السعر ₺", t: "num" }, { k: "image_url", l: "الصورة", t: "img" }, { k: "is_available", l: "متوفر", t: "bool" }]} />;
}

function Restaurants({ say }) {
  const [cs, setCs] = useState(null);
  useEffect(() => { supabase.from("categories").select("id,name_ar").order("sort_order").then(({ data }) => setCs(data || [])); }, []);
  if (!cs) return null;
  return <Crud table="restaurants" say={say} defaults={{ name_ar: "مطعم جديد", name_tr: "Yeni Restoran" }}
    fields={[{ k: "name_ar", l: "الاسم بالعربي" }, { k: "name_tr", l: "الاسم بالتركي" }, { k: "description_ar", l: "الوصف بالعربي", t: "area" }, { k: "description_tr", l: "الوصف بالتركي", t: "area" }, { k: "category_id", l: "التصنيف", t: "sel", o: cs.map((c) => [c.id, c.name_ar]) }, { k: "image_url", l: "الصورة", t: "img" }, { k: "delivery_minutes", l: "وقت التوصيل (دقيقة)", t: "num" }, { k: "delivery_fee", l: "رسوم التوصيل ₺", t: "num" }, { k: "rating", l: "التقييم", t: "num" }, { k: "is_open", l: "مفتوح الآن", t: "bool" }, { k: "is_active", l: "ظاهر في التطبيق", t: "bool" }]} />;
}

export default function Admin() {
  const [st, setSt] = useState("load");
  const [tab, setTab] = useState("orders");
  const [f, setF] = useState({ email: "", pass: "" });
  const [msg, setMsg] = useState("");
  const say = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const check = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSt("out"); return; }
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    setSt(data?.role === "admin" ? "ok" : "nope");
  };
  useEffect(() => { check(); }, []);
  const login = async () => { const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.pass }); if (error) say(error.message); else check(); };
  if (st === "load") return <p className="p-6">...</p>;
  if (st !== "ok") return (
    <main className="mx-auto max-w-sm p-6" dir="rtl">
      <img src="/logo.png" alt="XO" className="mx-auto mb-4 w-40" />
      {st === "nope" && <p className="mb-3 rounded-xl bg-red-500/15 p-3 text-red-500">هذا الحساب ليس أدمن.</p>}
      <input className={inp} type="email" placeholder="البريد الإلكتروني" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={inp} type="password" placeholder="كلمة المرور" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} />
      <button className="w-full rounded-2xl bg-xo py-3 font-bold text-white" onClick={login}>دخول لوحة التحكم</button>
      {msg && <p className="mt-3 text-center text-sm">{msg}</p>}
    </main>);
  const tabs = [["orders", "📦 الطلبات"], ["rests", "🏪 المطاعم"], ["prods", "🍔 المنتجات"], ["cats", "🗂 التصنيفات"]];
  return (
    <main className="mx-auto max-w-xl p-4 pb-20" dir="rtl">
      <div className="mb-3 flex items-center justify-between"><b className="text-lg">لوحة تحكم XO</b><button className="text-sm text-xo" onClick={() => { location.href = "/"; }}>الموقع</button></div>
      <div className="mb-3 flex gap-2 overflow-x-auto">{tabs.map((t) => <button key={t[0]} onClick={() => setTab(t[0])} className={"shrink-0 rounded-full px-3 py-1 text-sm " + (tab === t[0] ? "bg-xo text-white" : "border")}>{t[1]}</button>)}</div>
      {tab === "orders" && <Orders say={say} />}
      {tab === "rests" && <Restaurants say={say} />}
      {tab === "prods" && <Products say={say} />}
      {tab === "cats" && <Crud table="categories" sortKey="sort_order" say={say} defaults={{ name_ar: "تصنيف جديد", name_tr: "Yeni Kategori", icon: "🍽️" }} fields={[{ k: "name_ar", l: "الاسم بالعربي" }, { k: "name_tr", l: "الاسم بالتركي" }, { k: "icon", l: "الأيقونة (إيموجي)" }, { k: "image_url", l: "صورة بدل الأيقونة", t: "img" }, { k: "sort_order", l: "الترتيب", t: "num" }]} />}
      {msg && <div className="fixed left-1/2 top-4 z-50 max-w-[90%] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white">{msg}</div>}
    </main>
  );
}
