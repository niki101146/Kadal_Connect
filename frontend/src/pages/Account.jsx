import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useHarbor } from "../harbor.jsx";
import { useApi } from "../hooks.js";
import { Field, Icon, Notice, PageHead, Skeleton, Stat, initials } from "../components.jsx";

function ContactForm({ user, save }) {
  const [f, setF] = useState({ phone: user.phone || "", town: user.town || "", address: user.address || "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await save(f); setMsg({ kind: "ok", text: "Contact details saved." }); } catch (x) { setMsg({ kind: "bad", text: x.message }); }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="panel form-panel">
      <h2>Contact &amp; address</h2>
      <p className="muted">Sellers see your name and town when you request fish. Your phone number and full address are shared only after the seller accepts.</p>
      <div className="two-f">
        <Field label="Phone number"><input type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Town / village"><input autoComplete="address-level2" value={f.town} onChange={set("town")} /></Field>
      </div>
      <Field label="Full address"><input autoComplete="street-address" value={f.address} onChange={set("address")} placeholder="Door no., street, landmark" /></Field>
      <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save details"}</button>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
    </form>
  );
}

export default function Account() {
  const { user, ready, logout, updateProfile } = useAuth();
  const { harbors } = useHarbor();
  const od = useApi("/orders/", { skip: !user, asList: true });
  const nav = useNavigate();
  if (!ready) return <Skeleton />;
  if (!user) return <Navigate to="/login" />;
  const harbor = harbors.find((h) => h.id === user.harbor);
  const orders = od.data || [];
  const fisherman = user.role === "FISHERMAN";
  return (
    <>
      <PageHead eyebrow="Account" title="Your profile" />
      <section className="profile">
        <span className="avatar xl">{initials(user.first_name || user.username)}</span>
        <div><h2>{user.first_name || user.username}</h2><p className="muted">@{user.username}</p>
          <div className="profile-tags"><span className="chip good">{fisherman ? "Fisherman" : "Buyer"}</span><span className="chip"><Icon name="pin" size={13} /> {harbor ? harbor.name : "No home harbor"}</span><span className="chip"><Icon name="phone" size={13} /> {user.phone || "No phone"}</span>{user.town && <span className="chip"><Icon name="pin" size={13} /> {user.town}</span>}</div></div>
      </section>
      <div className="stats">
        <Stat icon="bag" label="Orders" value={orders.length} />
        <Stat icon="clock" label="Pending" value={orders.filter((o) => o.status === "PENDING").length} />
        <Stat icon="check" label="Accepted" value={orders.filter((o) => o.status === "ACCEPTED").length} />
      </div>
      <div className="quick-grid">
        {fisherman && <Link className="quick" to="/sell"><span className="quick-ic"><Icon name="plus" size={22} /></span><div><b>Sell your catch</b><small>Post fish and report prices</small></div><Icon name="arrow-right" size={16} /></Link>}
        <Link className="quick" to="/orders"><span className="quick-ic"><Icon name="bag" size={22} /></span><div><b>Orders</b><small>Requests and pickups</small></div><Icon name="arrow-right" size={16} /></Link>
        <Link className="quick" to="/planner"><span className="quick-ic"><Icon name="route" size={22} /></span><div><b>Trip planner</b><small>Check sea before you go</small></div><Icon name="arrow-right" size={16} /></Link>
        <Link className="quick" to="/safety"><span className="quick-ic"><Icon name="shield" size={22} /></span><div><b>Safety hub</b><small>Emergency numbers</small></div><Icon name="arrow-right" size={16} /></Link>
      </div>
      <ContactForm key={user.id} user={user} save={updateProfile} />
      <button className="btn ghost" onClick={() => { logout(); nav("/"); }}>Log out</button>
    </>
  );
}
