import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api.js";
import { useAuth } from "./auth.jsx";
import { Icon, Notice, caughtAgo, freshness, initials, money } from "./components.jsx";

export default function ListingCard({ l, saved, onSave, view = "grid" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [addr, setAddr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const max = Number(l.quantity_kg);
  const total = (Number(qty) || 0) * Number(l.price_per_kg);
  const fr = freshness(l.caught_on);

  async function send() {
    setBusy(true); setMsg(null);
    try {
      await api("/orders/", { method: "POST", body: { listing: l.id, quantity_kg: qty, delivery_address: addr || user.address || "", note } });
      setMsg({ kind: "ok", text: "Request sent. Track it under Orders." }); setOpen(false); setQty(""); setNote("");
    } catch (e) { setMsg({ kind: "bad", text: e.message }); }
    setBusy(false);
  }

  return (
    <article className={`card listing ${view}`}>
      <header>
        <div><h3>{l.species_name}</h3><span className={`fresh ${fr}`}><i />{caughtAgo(l.caught_on)}</span></div>
        {onSave && <button className={`save ${saved ? "on" : ""}`} onClick={() => onSave(l.id)} aria-pressed={!!saved} aria-label={saved ? "Remove from saved" : "Save this catch"}><Icon name="heart" size={18} /></button>}
      </header>
      <p className="price">{money(l.price_per_kg)}<small>/kg</small></p>
      <ul className="meta">
        <li><Icon name="scale" size={15} /> {max} kg available</li>
        <li><Icon name="pin" size={15} /> {l.harbor_name}</li>
      </ul>
      <div className="seller"><span className="avatar">{initials(l.seller_name || "F")}</span><div><b>{l.seller_name || "Fisherman"}</b><small>Local fisherman</small></div></div>
      {!user && <Link className="btn ghost block" to="/login">Log in to request</Link>}
      {user?.role === "FISHERMAN" && <p className="muted small-note">Sign in as a buyer to request catch.</p>}
      {user?.role === "BUYER" && !open && <button className="btn block" onClick={() => setOpen(true)}>Request this catch</button>}
      {open && (
        <div className="req">
          <div className="chips tight">{[5, 10, 25].filter((q) => q <= max).map((q) => <button key={q} type="button" className={`chipbtn ${+qty === q ? "on" : ""}`} onClick={() => setQty(String(q))}>{q} kg</button>)}<button type="button" className="chipbtn" onClick={() => setQty(String(max))}>All {max} kg</button></div>
          <input type="number" min="1" max={max} step="0.5" autoFocus placeholder={`Quantity in kg (max ${max})`} value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity in kg" />
          <input value={addr} onChange={(e) => setAddr(e.target.value)} maxLength={255} autoComplete="street-address" placeholder={user.address ? `Delivery address (default: ${user.address})` : "Delivery / pickup address"} aria-label="Delivery address" />
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Message to seller (optional)" aria-label="Message to seller" />
          <p className="small-note muted">The seller sees your name{user.town ? ` and town (${user.town})` : ""}. Your phone and address are shared only after they accept.</p>
          <p className="total">{total ? <>Estimated total <b>{money(total)}</b></> : "Enter how many kilos you need"}</p>
          <div className="row actions"><button className="btn" disabled={busy || !qty || +qty > max} onClick={send}>{busy ? "Sending…" : "Send request"}</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button></div>
        </div>
      )}
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
    </article>
  );
}
