// @ts-nocheck
"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import Admin from "./Admin";

const STEPS = ["created", "confirmed", "preparing", "picked_up", "on_the_way", "delivered"];
const T = {
  ar: { home: "الرئيسية", search: "البحث", favs: "المفضلة", cart: "السلة", account: "حسابي", ph: "ابحث عن مطعم...", cats: "التصنيفات", near: "المطاعم", min: "دقيقة", fee: "توصيل", open: "مفتوح", closed: "مغلق", empty: "لا توجد نتائج", add: "أضف", sub: "المجموع", delivery: "رسوم التوصيل", total: "الإجمالي", name: "الاسم", phone: "رقم الهاتف", address: "العنوان", notes: "ملاحظات", pay: "طريقة الدفع", cod: "💵 الدفع عند الاستلام", place: "تأكيد الطلب", emptyCart: "السلة فاضية", back: "→ رجوع", login: "دخول", register: "إنشاء حساب", email: "البريد الإلكتروني", pass: "كلمة المرور (6 أحرف على الأقل)", full: "الاسم الكامل", logout: "تسجيل خروج", orders: "طلباتي", track: "تتبع طلب", trackNo: "رقم التتبع", go: "تتبع", steps: ["تم إنشاء الطلب", "تم تأكيد الطلب", "المطعم يحضّر الطلب", "السائق استلم الطلب", "الطلب في الطريق", "تم التوصيل"], cancelled: "تم إلغاء الطلب", nf: "لم يتم العثور على الطلب", fill: "عبّي الاسم والهاتف", added: "تمت الإضافة ✓", noFav: "ما أضفت مفضلات بعد", hello: "اطلب أكلك المفضل", hsub: "توصيل سريع من XO", closedMsg: "المطعم مغلق حالياً", noMenu: "لا توجد منتجات بعد", loc: "📍 حدّد موقعي (GPS)", locOk: "✅ تم تحديد موقعك", locErr: "تعذر تحديد الموقع. فعّل خدمات الموقع للمتصفح ثم أعد المحاولة", locNeed: "حدّد موقعك بالـ GPS أولاً", addrD: "تفاصيل إضافية (المبنى، الطابق، علامة مميزة) - اختياري", mailMsg: "تم إنشاء الحساب. إذا وصلك بريد تأكيد افتحه ثم سجّل دخول." },
  tr: { home: "Ana Sayfa", search: "Ara", favs: "Favoriler", cart: "Sepet", account: "Hesabım", ph: "Restoran ara...", cats: "Kategoriler", near: "Restoranlar", min: "dk", fee: "Teslimat", open: "Açık", closed: "Kapalı", empty: "Sonuç yok", add: "Ekle", sub: "Ara toplam", delivery: "Teslimat ücreti", total: "Toplam", name: "Ad", phone: "Telefon", address: "Adres", notes: "Notlar", pay: "Ödeme yöntemi", cod: "💵 Kapıda ödeme", place: "Siparişi onayla", emptyCart: "Sepet boş", back: "← Geri", login: "Giriş", register: "Hesap oluştur", email: "E-posta", pass: "Şifre (en az 6 karakter)", full: "Ad soyad", logout: "Çıkış yap", orders: "Siparişlerim", track: "Sipariş takibi", trackNo: "Takip numarası", go: "Takip et", steps: ["Sipariş oluşturuldu", "Sipariş onaylandı", "Restoran hazırlıyor", "Kurye siparişi aldı", "Sipariş yolda", "Teslim edildi"], cancelled: "Sipariş iptal edildi", nf: "Sipariş bulunamadı", fill: "Ad ve telefonu doldurun", added: "Eklendi ✓", noFav: "Henüz favori yok", hello: "Favori yemeğini sipariş et", hsub: "XO ile hızlı teslimat", closedMsg: "Restoran şu an kapalı", noMenu: "Henüz ürün yok", loc: "📍 Konumumu belirle (GPS)", locOk: "✅ Konumunuz belirlendi", locErr: "Konum alınamadı. Tarayıcıda konum servislerini açıp tekrar deneyin", locNeed: "Önce GPS ile konumunuzu belirleyin", addrD: "Ek bilgi (bina, kat, tarif) - isteğe bağlı", mailMsg: "Hesap oluşturuldu. Onay e-postası geldiyse açın, sonra giriş yapın." },
};
const money = (n) => `${Number(n) % 1 ? Number(n).toFixed(2) : Number(n)} ₺`;
const inp = "mb-2 w-full rounded-xl border bg-[var(--card)] p-3";
const btn = "w-full rounded-2xl bg-xo py-3 font-bold text-white disabled:opacity-50";

function parse(p) {
  if (p.startsWith("/admin")) return { v: "admin" };
  if (p.startsWith("/track-order")) return { v: "track", id: decodeURIComponent(p.split("/")[2] || "") };
  if (p.startsWith("/r/")) return { v: "rest", id: p.split("/")[2] };
  const m = { "/search": "search", "/favorites": "favs", "/cart": "cart", "/account": "account" };
  return { v: m[p] || "home" };
}

function RCard({ c, r }) {
  const t = c.t;
  return (
    <article onClick={() => c.go("/r/" + r.id)} className="relative mb-3 cursor-pointer overflow-hidden rounded-2xl border bg-[var(--card)]">
      <div className="flex h-32 items-center justify-center bg-orange-500/10 text-6xl">{r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : "🍽️"}</div>
      <button onClick={(e) => { e.stopPropagation(); c.toggleFav(r.id); }} className="absolute end-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] text-xl">{c.favs.includes(r.id) ? "❤️" : "🤍"}</button>
      <div className="p-3">
        <div className="flex justify-between"><b>{c.nm(r)}</b><span>⭐ {r.rating}</span></div>
        <div className="mt-1 flex justify-between text-sm opacity-70"><span>⏱ {r.delivery_minutes} {t.min} · {t.fee} {money(r.delivery_fee)}</span><span>{r.is_open ? t.open : t.closed}</span></div>
      </div>
    </article>
  );
}

function Browse({ c, mode }) {
  const t = c.t;
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState("");
  const [ld, setLd] = useState(true);
  useEffect(() => {
    supabase.from("restaurants").select("*").eq("is_active", true).order("rating", { ascending: false }).then(({ data }) => { setList(data || []); setLd(false); });
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats(data || []));
  }, []);
  let shown = list.filter((r) => (!cat || r.category_id === cat) && c.nm(r).toLowerCase().includes(q.toLowerCase()));
  if (mode === "favs") shown = shown.filter((r) => c.favs.includes(r.id));
  return (
    <div>
      {mode === "search" && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} className={inp} />}
      {mode === "home" && (<>
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-400 p-5 text-white"><div className="text-xl font-extrabold">{t.hello}</div><div className="text-sm opacity-90">{t.hsub}</div></div>
        <h2 className="mb-2 font-bold">{t.cats}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">{cats.map((k) => (
          <div key={k.id} onClick={() => setCat(cat === k.id ? null : k.id)} className="shrink-0 cursor-pointer text-center text-xs">
            <div className={"mb-1 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-[var(--card)] text-2xl " + (cat === k.id ? "border-xo" : "")}>{k.image_url ? <img src={k.image_url} alt="" className="h-full w-full object-cover" /> : k.icon}</div>{c.nm(k)}</div>))}</div>
        <h2 className="mb-2 mt-4 font-bold">{t.near}</h2>
      </>)}
      {mode === "favs" && <h2 className="mb-2 font-bold">❤️ {t.favs}</h2>}
      {ld && [1, 2].map((i) => <div key={i} className="mb-3 h-44 animate-pulse rounded-2xl bg-gray-500/20" />)}
      {!ld && shown.length === 0 && <p className="text-sm opacity-60">{mode === "favs" ? t.noFav : t.empty}</p>}
      {shown.map((r) => <RCard key={r.id} c={c} r={r} />)}
    </div>
  );
}

function Rest({ c, id }) {
  const t = c.t;
  const [r, setR] = useState(null);
  const [ps, setPs] = useState([]);
  useEffect(() => {
    supabase.from("restaurants").select("*").eq("id", id).single().then(({ data }) => setR(data));
    supabase.from("products").select("*").eq("restaurant_id", id).eq("is_available", true).order("name_ar").then(({ data }) => setPs(data || []));
  }, [id]);
  if (!r) return <div className="h-44 animate-pulse rounded-2xl bg-gray-500/20" />;
  return (
    <div>
      <button className="mb-2 text-xo" onClick={() => c.go("/")}>{t.back}</button>
      <div className="mb-3 overflow-hidden rounded-2xl border bg-[var(--card)]">
        <div className="flex h-40 items-center justify-center bg-orange-500/10 text-7xl">{r.image_url ? <img src={r.image_url} alt="" className="h-full w-full object-cover" /> : "🍽️"}</div>
        <div className="p-3"><div className="flex justify-between"><b className="text-lg">{c.nm(r)}</b><span>⭐ {r.rating}</span></div>
          <div className="text-sm opacity-70">⏱ {r.delivery_minutes} {t.min} · {t.fee} {money(r.delivery_fee)}</div>
          {(c.lang === "ar" ? r.description_ar : r.description_tr) && <p className="mt-1 text-sm">{c.lang === "ar" ? r.description_ar : r.description_tr}</p>}
          {!r.is_open && <p className="mt-1 font-bold text-red-500">{t.closedMsg}</p>}</div>
      </div>
      {ps.length === 0 && <p className="text-sm opacity-60">{t.noMenu}</p>}
      {ps.map((p) => {
        const it = c.cart.items.find((i) => i.id === p.id);
        return (
          <div key={p.id} className="mb-2 flex items-center gap-3 rounded-2xl border bg-[var(--card)] p-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-500/10 text-3xl">{p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : "🍽️"}</div>
            <div className="min-w-0 flex-1"><b>{c.nm(p)}</b>{(c.lang === "ar" ? p.description_ar : p.description_tr) && <div className="truncate text-xs opacity-60">{c.lang === "ar" ? p.description_ar : p.description_tr}</div>}<div className="text-sm">{money(p.price)}</div></div>
            {it ? (<div className="flex items-center gap-2"><button className="h-8 w-8 rounded-full bg-xo text-white" onClick={() => c.qty(p.id, -1)}>−</button><b>{it.q}</b><button className="h-8 w-8 rounded-full bg-xo text-white" onClick={() => c.qty(p.id, 1)}>+</button></div>)
              : <button disabled={!r.is_open} className="h-9 w-9 rounded-full bg-xo text-xl text-white disabled:opacity-40" onClick={() => c.addItem(r, p)}>+</button>}
          </div>
        );
      })}
    </div>
  );
}

function CartView({ c }) {
  const t = c.t;
  const [f, setF] = useState({ name: "", phone: "", address: "", notes: "", lat: null, lng: null });
  const [busy, setBusy] = useState(false);
  useEffect(() => { try { setF((x) => ({ ...x, ...JSON.parse(localStorage.getItem("xo_info") || "{}") })); } catch {} }, []);
  const sub = c.cart.items.reduce((s, i) => s + i.price * i.q, 0);
  if (!c.cart.items.length) return <p className="mt-16 text-center text-5xl">🛒<br /><span className="text-base opacity-70">{t.emptyCart}</span></p>;
  const getLoc = () => {
    if (!navigator.geolocation) { c.toast(t.locErr); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setF((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })),
      () => c.toast(t.locErr),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };
  async function place() {
    if (!f.name.trim() || !f.phone.trim()) { c.toast(t.fill); return; }
    if (f.lat == null) { c.toast(t.locNeed); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("create_order", { p_restaurant: c.cart.rid, p_items: c.cart.items.map((i) => ({ id: i.id, q: i.q })), p_name: f.name, p_phone: f.phone, p_address: f.address || "", p_lat: f.lat, p_lng: f.lng, p_notes: f.notes || null });
    setBusy(false);
    if (error) { c.toast(error.message); return; }
    localStorage.setItem("xo_info", JSON.stringify({ name: f.name, phone: f.phone, address: f.address }));
    try { const o = JSON.parse(localStorage.getItem("xo_orders") || "[]"); localStorage.setItem("xo_orders", JSON.stringify([data, ...o].slice(0, 20))); } catch {}
    c.saveCart({ rid: null, fee: 0, rname: "", items: [] });
    c.go("/track-order/" + data);
  }
  return (
    <div>
      <h2 className="mb-2 font-bold">🛒 {c.cart.rname}</h2>
      {c.cart.items.map((i) => (
        <div key={i.id} className="mb-2 flex items-center gap-3 rounded-2xl border bg-[var(--card)] p-3">
          <div className="flex-1"><b>{c.lang === "ar" ? i.n_ar : i.n_tr}</b><div className="text-sm opacity-70">{money(i.price * i.q)}</div></div>
          <button className="h-8 w-8 rounded-full bg-xo text-white" onClick={() => c.qty(i.id, -1)}>−</button><b>{i.q}</b><button className="h-8 w-8 rounded-full bg-xo text-white" onClick={() => c.qty(i.id, 1)}>+</button>
        </div>))}
      <div className="my-3 rounded-2xl border bg-[var(--card)] p-3">
        <div className="flex justify-between"><span>{t.sub}</span><span>{money(sub)}</span></div>
        <div className="flex justify-between"><span>{t.delivery}</span><span>{money(c.cart.fee)}</span></div>
        <div className="mt-1 flex justify-between text-lg font-bold"><span>{t.total}</span><span>{money(sub + Number(c.cart.fee))}</span></div>
      </div>
      <input className={inp} placeholder={t.name} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={inp} placeholder={t.phone} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <button type="button" onClick={getLoc} className={"mb-2 w-full rounded-xl border-2 p-3 font-bold " + (f.lat != null ? "border-green-600 text-green-600" : "border-xo text-xo")}>{f.lat != null ? t.locOk : t.loc}</button>
      <input className={inp} placeholder={t.addrD} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      <textarea className={inp} rows={2} placeholder={t.notes} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <div className="mb-3 rounded-xl border border-xo p-3">{t.pay}: {t.cod}</div>
      <button className={btn} disabled={busy} onClick={place}>{t.place}</button>
    </div>
  );
}

function Track({ c, id }) {
  const t = c.t;
  const [o, setO] = useState(undefined);
  const load = useCallback(async () => { if (!id) return; const { data } = await supabase.rpc("get_order_by_tracking", { tn: id }); setO(data || null); }, [id]);
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);
  if (o === undefined) return <div className="h-40 animate-pulse rounded-2xl bg-gray-500/20" />;
  if (o === null) return <p className="mt-10 text-center">{t.nf}</p>;
  const idx = STEPS.indexOf(o.status);
  return (
    <div>
      <button className="mb-2 text-xo" onClick={() => c.go("/")}>{t.back}</button>
      <div className="mb-3 rounded-2xl border bg-[var(--card)] p-4"><div className="text-sm opacity-70">{t.trackNo}</div><div className="text-2xl font-extrabold tracking-wider text-xo">{o.tracking_number}</div><div className="mt-1 text-sm">{c.lang === "ar" ? o.restaurant : o.restaurant_tr} · {money(o.total)}</div></div>
      {o.status === "cancelled" ? <p className="rounded-2xl bg-red-500/15 p-4 font-bold text-red-500">{t.cancelled}</p> : (
        <div className="rounded-2xl border bg-[var(--card)] p-4">{t.steps.map((s, i) => {
          const done = i < idx || o.status === "delivered"; const act = i === idx && o.status !== "delivered";
          return (<div key={i} className={"flex items-center gap-3 py-2 " + (done || act ? "" : "opacity-40")}>
            <span className={"flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs " + (done ? "border-green-600 bg-green-600 text-white" : act ? "animate-pulse border-xo" : "")}>{done ? "✓" : ""}</span><span className={act ? "font-bold" : ""}>{s}</span></div>);
        })}</div>)}
    </div>
  );
}

function Account({ c }) {
  const t = c.t;
  const [u, setU] = useState(null);
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", pass: "", full: "" });
  const [orders, setOrders] = useState([]);
  const [local, setLocal] = useState([]);
  const [num, setNum] = useState("");
  useEffect(() => {
    try { setLocal(JSON.parse(localStorage.getItem("xo_orders") || "[]")); } catch {}
    supabase.auth.getUser().then(({ data }) => setU(data.user));
    const { data: s } = supabase.auth.onAuthStateChange((_e, sess) => setU(sess?.user || null));
    return () => s.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (u) supabase.from("orders").select("tracking_number,total,status").order("created_at", { ascending: false }).then(({ data }) => setOrders(data || [])); }, [u]);
  async function submit() {
    const r = mode === "login" ? await supabase.auth.signInWithPassword({ email: f.email, password: f.pass }) : await supabase.auth.signUp({ email: f.email, password: f.pass, options: { data: { full_name: f.full } } });
    if (r.error) c.toast(r.error.message); else if (mode === "register" && !r.data.session) c.toast(t.mailMsg);
  }
  return (
    <div>
      <h2 className="mb-3 font-bold">👤 {t.account}</h2>
      {!u ? (<div className="mb-4 rounded-2xl border bg-[var(--card)] p-4">
        <div className="mb-3 flex gap-2"><button className={"flex-1 rounded-xl py-2 " + (mode === "login" ? "bg-xo text-white" : "border")} onClick={() => setMode("login")}>{t.login}</button><button className={"flex-1 rounded-xl py-2 " + (mode === "register" ? "bg-xo text-white" : "border")} onClick={() => setMode("register")}>{t.register}</button></div>
        {mode === "register" && <input className={inp} placeholder={t.full} value={f.full} onChange={(e) => setF({ ...f, full: e.target.value })} />}
        <input className={inp} type="email" placeholder={t.email} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={inp} type="password" placeholder={t.pass} value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} />
        <button className={btn} onClick={submit}>{mode === "login" ? t.login : t.register}</button></div>)
        : (<div className="mb-4 flex items-center justify-between rounded-2xl border bg-[var(--card)] p-4"><span className="truncate">{u.email}</span><button className="rounded-xl border px-3 py-1" onClick={() => supabase.auth.signOut()}>{t.logout}</button></div>)}
      <div className="mb-4 rounded-2xl border bg-[var(--card)] p-4"><b>{t.track}</b>
        <div className="mt-2 flex gap-2"><input className={inp + " !mb-0"} placeholder="XO-XXXXXX" value={num} onChange={(e) => setNum(e.target.value)} /><button className="rounded-xl bg-xo px-4 text-white" onClick={() => num.trim() && c.go("/track-order/" + num.trim().toUpperCase())}>{t.go}</button></div></div>
      <h3 className="mb-2 font-bold">{t.orders}</h3>
      {(u ? orders.map((o) => o.tracking_number) : local).map((n) => <div key={n} onClick={() => c.go("/track-order/" + n)} className="mb-2 cursor-pointer rounded-xl border bg-[var(--card)] p-3 font-mono font-bold text-xo">{n}</div>)}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(null);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState({ v: "home" });
  const [cart, setCart] = useState({ rid: null, fee: 0, rname: "", items: [] });
  const [favs, setFavs] = useState([]);
  const [msg, setMsg] = useState("");
  const applyLang = (l) => { setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; };
  useEffect(() => {
    const l = localStorage.getItem("xo_lang"); if (l) applyLang(l);
    try { const ct = JSON.parse(localStorage.getItem("xo_cart") || "null"); if (ct) setCart(ct); setFavs(JSON.parse(localStorage.getItem("xo_favs") || "[]")); } catch {}
    setRoute(parse(location.pathname));
    const f = () => setRoute(parse(location.pathname));
    addEventListener("popstate", f); setReady(true);
    return () => removeEventListener("popstate", f);
  }, []);
  if (!ready) return null;
  if (route.v === "admin") return <Admin />;
  if (!lang) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <img src="/logo.png" alt="XO Delivery" className="w-48" />
      <button className={btn + " max-w-xs"} onClick={() => { localStorage.setItem("xo_lang", "ar"); applyLang("ar"); }}>العربية</button>
      <button className="w-full max-w-xs rounded-2xl border py-3 font-bold" onClick={() => { localStorage.setItem("xo_lang", "tr"); applyLang("tr"); }}>Türkçe</button>
    </main>);
  const t = T[lang];
  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const go = (p) => { history.pushState({}, "", p); setRoute(parse(p)); scrollTo(0, 0); };
  const saveCart = (ct) => { setCart(ct); localStorage.setItem("xo_cart", JSON.stringify(ct)); };
  const c = {
    lang, t, go, toast, cart, favs, saveCart,
    nm: (o) => (lang === "ar" ? o.name_ar : o.name_tr),
    toggleFav: (id) => { const n = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]; setFavs(n); localStorage.setItem("xo_favs", JSON.stringify(n)); },
    addItem: (r, p) => {
      const base = cart.rid === r.id ? cart : { rid: r.id, fee: r.delivery_fee, rname: lang === "ar" ? r.name_ar : r.name_tr, items: [] };
      const ex = base.items.find((i) => i.id === p.id);
      saveCart({ ...base, items: ex ? base.items.map((i) => (i.id === p.id ? { ...i, q: i.q + 1 } : i)) : [...base.items, { id: p.id, n_ar: p.name_ar, n_tr: p.name_tr, price: p.price, q: 1 }] });
      toast(t.added);
    },
    qty: (id, d) => { const items = cart.items.map((i) => (i.id === id ? { ...i, q: i.q + d } : i)).filter((i) => i.q > 0); saveCart({ ...cart, rid: items.length ? cart.rid : null, items }); },
  };
  const count = cart.items.reduce((s, i) => s + i.q, 0);
  const nav = [["/", "🏠", t.home, "home"], ["/search", "🔎", t.search, "search"], ["/favorites", "❤️", t.favs, "favs"], ["/cart", "🛒", t.cart + (count ? ` (${count})` : ""), "cart"], ["/account", "👤", t.account, "account"]];
  return (
    <div>
      <main className="mx-auto max-w-xl px-4 pb-28 pt-3">
        <header className="mb-3 flex items-center justify-between"><img src="/logo.png" alt="XO" className="h-12 cursor-pointer" onClick={() => go("/")} /><button className="rounded-full border px-3 py-1 text-sm" onClick={() => { const l = lang === "ar" ? "tr" : "ar"; localStorage.setItem("xo_lang", l); applyLang(l); }}>{lang === "ar" ? "Türkçe" : "العربية"}</button></header>
        {route.v === "home" && <Browse c={c} mode="home" />}
        {route.v === "search" && <Browse c={c} mode="search" />}
        {route.v === "favs" && <Browse c={c} mode="favs" />}
        {route.v === "rest" && <Rest c={c} id={route.id} />}
        {route.v === "cart" && <CartView c={c} />}
        {route.v === "track" && <Track c={c} id={route.id} />}
        {route.v === "account" && <Account c={c} />}
      </main>
      {msg && <div className="fixed left-1/2 top-4 z-50 max-w-[90%] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white">{msg}</div>}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-[var(--card)] pb-[env(safe-area-inset-bottom)] pt-2">
        {nav.map((n) => (<button key={n[0]} onClick={() => go(n[0])} className={"flex-1 py-1 text-center text-[11px] " + (route.v === n[3] ? "font-bold text-xo" : "opacity-60")}><span className="block text-2xl">{n[1]}</span>{n[2]}</button>))}
      </nav>
    </div>
  );
}
