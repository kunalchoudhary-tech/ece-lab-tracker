import { useEffect, useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "https://ece-lab-tracker-1.onrender.com";

async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: { ...(body && { "Content-Type": "application/json" }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const CATS = { "": "All", fpga: "FPGA boards", automobile_sensor: "Automobile sensors", microcontroller: "Microcontrollers" };
const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "-");
const specText = (s = {}) => Object.entries(s).map(([k, v]) => `${k}: ${v}`).join("  |  ");

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ prn: "", name: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try { onAuth(await api(`/auth/${mode}`, { method: "POST", body: f })); }
    catch (x) { setErr(x.message); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <main className="auth">
      <div className="auth-pitch">
        <h1>ECE Lab Tracker</h1>
        <p>Reserve Basys 3 boards, automobile sensors and microcontrollers for your project. Collect from the lab within 24 hours of reserving.</p>
      </div>
      <form onSubmit={submit} className="auth-form">
        <h2>{mode === "login" ? "Log in with your PRN" : "Create your account"}</h2>
        <label>PRN<input value={f.prn} onChange={set("prn")} inputMode="numeric" maxLength={10} placeholder="1262242939" required /></label>
        {mode === "signup" && <label>Full name<input value={f.name} onChange={set("name")} required /></label>}
        <label>Password<input type="password" value={f.password} onChange={set("password")} minLength={6} required /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="primary">{mode === "login" ? "Log in" : "Sign up"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
      </form>
    </main>
  );
}

function Inventory({ token, toast, onReserved }) {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const load = useCallback(() => {
    const p = new URLSearchParams({ ...(cat && { category: cat }), ...(status && { status }), ...(q && { search: q }) });
    api(`/items?${p}`).then(setItems).catch((e) => toast(e.message, true));
  }, [cat, status, q, toast]);
  useEffect(load, [load]);
  const reserve = async (id) => {
    try { await api("/bookings", { method: "POST", token, body: { itemId: id } }); toast("Reserved. Collect it from the lab within 24 hours."); load(); onReserved(); }
    catch (e) { toast(e.message, true); load(); }
  };
  return (
    <section>
      <div className="filters">
        <div className="chips">{Object.entries(CATS).map(([k, v]) => (
          <button key={k} className={cat === k ? "chip on" : "chip"} onClick={() => setCat(k)}>{v}</button>))}</div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option><option value="available">Available</option><option value="reserved">Reserved</option>
          <option value="checked_out">Checked out</option><option value="maintenance">Maintenance</option>
        </select>
        <input type="search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!items.length && <p className="empty">No items match. Clear a filter to see more.</p>}
      <ul className="ledger">{items.map((i) => (
        <li key={i._id}>
          <span className="tag">{i.assetTag}</span>
          <div className="what"><strong>{i.name}</strong><small>{specText(i.specs)}</small></div>
          <span className={`pill ${i.status}`}>{i.status.replace("_", " ")}</span>
          <button className="primary sm" disabled={i.status !== "available"} onClick={() => reserve(i._id)}>Reserve</button>
        </li>))}
      </ul>
    </section>
  );
}

function Bookings({ token, admin, toast, tick }) {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => {
    api(admin ? "/bookings" : "/bookings/me", { token }).then(setRows).catch((e) => toast(e.message, true));
  }, [token, admin, toast]);
  useEffect(load, [load, tick]);
  const act = async (id, action, body) => {
    try { await api(`/bookings/${id}/${action}`, { method: "PATCH", token, body }); toast("Updated."); load(); }
    catch (e) { toast(e.message, true); }
  };
  if (!rows.length) return <p className="empty">{admin ? "No bookings yet." : "You have nothing reserved. Pick something from Inventory."}</p>;
  return (
    <ul className="ledger">{rows.map((b) => {
      const late = b.status === "checked_out" && b.dueDate && new Date(b.dueDate) < new Date();
      return (
        <li key={b._id}>
          <span className="tag">{b.item?.assetTag}</span>
          <div className="what">
            <strong>{b.item?.name}{admin && <> for {b.prn}</>}</strong>
            <small>{b.status === "reserved" ? `Collect by ${fmt(b.pickupBy)}` : b.status === "checked_out" ? `Due ${fmt(b.dueDate)}` : `Returned ${fmt(b.returnedAt)} (${b.condition})`}</small>
          </div>
          <span className={`pill ${late ? "overdue" : b.status}`}>{late ? "overdue" : b.status.replace("_", " ")}</span>
          {admin && b.status === "reserved" && <button className="primary sm" onClick={() => act(b._id, "pickup")}>Mark picked up</button>}
          {admin && b.status === "checked_out" && (<span className="btns">
            <button className="primary sm" onClick={() => act(b._id, "return", { condition: "good" })}>Return: good</button>
            <button className="danger sm" onClick={() => act(b._id, "return", { condition: "damaged" })}>Return: damaged</button></span>)}
        </li>);
    })}</ul>
  );
}

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem("session") || "null"));
  const [tab, setTab] = useState("inventory");
  const [msg, setMsg] = useState(null);
  const [tick, setTick] = useState(0);
  const toast = useCallback((text, bad) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3500); }, []);
  const auth = (s) => { localStorage.setItem("session", JSON.stringify(s)); setSession(s); };
  const logout = () => { localStorage.removeItem("session"); setSession(null); };
  if (!session) return <Auth onAuth={auth} />;
  const admin = session.user.role === "admin";
  const tabs = [["inventory", "Inventory"], ["mine", "My items"], ...(admin ? [["admin", "All bookings"]] : [])];
  return (
    <>
      <header className="top">
        <strong className="brand">ECE Lab Tracker</strong>
        <nav>{tabs.map(([k, v]) => <button key={k} className={tab === k ? "tab on" : "tab"} onClick={() => setTab(k)}>{v}</button>)}</nav>
        <span className="who">{session.user.name} ({session.user.prn}){admin && " - admin"}</span>
        <button className="link" onClick={logout}>Log out</button>
      </header>
      <main className="page">
        {tab === "inventory" && <Inventory token={session.token} toast={toast} onReserved={() => setTick((t) => t + 1)} />}
        {tab === "mine" && <Bookings token={session.token} toast={toast} tick={tick} />}
        {tab === "admin" && admin && <Bookings token={session.token} admin toast={toast} tick={tick} />}
      </main>
      {msg && <div className={msg.bad ? "toast bad" : "toast"} role="status">{msg.text}</div>}
    </>
  );
}
