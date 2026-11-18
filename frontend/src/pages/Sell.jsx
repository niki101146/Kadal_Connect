import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { useHarbor } from "../harbor.jsx";
import { Empty, Field, SpeciesSelect, Notice, PageHead, Skeleton, Stat, caughtAgo, money } from "../components.jsx";

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function PostCatch({ harbors, species, harbor, prices, onDone }) {
  const [f, setF] = useState({ harbor, species: "", quantity_kg: "", price_per_kg: "", caught_on: today() });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ref = (() => { const r = prices.filter((p) => String(p.species) === String(f.species) && String(p.harbor) === String(f.harbor)); return r.length ? +r[0].price_per_kg : null; })();
  const total = (+f.quantity_kg || 0) * (+f.price_per_kg || 0);
  async function submit(e) {
    e.preventDefault(); setMsg(null);
    try { await api("/listings/", { method: "POST", body: f }); setMsg({ kind: "ok", text: "Your catch is live in the marketplace." }); setF({ ...f, quantity_kg: "", price_per_kg: "" }); onDone(); }
    catch (x) { setMsg({ kind: "bad", text: x.message }); }
  }
  return (
    <form onSubmit={submit} className="panel form-panel">
      <h2>Post your catch</h2>
      <Field label="Harbor"><select required value={f.harbor} onChange={set("harbor")}><option value="">Choose harbor</option>{harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
      <Field label="Fish" hint={ref ? `Latest reported price at this harbor: ${money(ref)}/kg` : ""}><SpeciesSelect required species={species} value={f.species} onChange={set("species")} /></Field>
      <div className="two-f">
        <Field label="Quantity (kg)"><input required type="number" min="1" step="0.5" value={f.quantity_kg} onChange={set("quantity_kg")} /></Field>
        <Field label="Price (₹ per kg)"><input required type="number" min="1" value={f.price_per_kg} onChange={set("price_per_kg")} placeholder={ref ? String(Math.round(ref)) : ""} /></Field>
      </div>
      <Field label="Caught on"><input required type="date" max={today()} value={f.caught_on} onChange={set("caught_on")} /></Field>
      {total > 0 && <p className="total">Estimated value <b>{money(total)}</b></p>}
      <button className="btn">Post catch</button>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
    </form>
  );
}

function ReportPrice({ harbors, species, harbor }) {
  const [f, setF] = useState({ harbor, species: "", price_per_kg: "" });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setMsg(null);
    try { await api("/prices/", { method: "POST", body: f }); setMsg({ kind: "ok", text: "Price shared with all harbors." }); setF({ ...f, price_per_kg: "" }); }
    catch (x) { setMsg({ kind: "bad", text: x.message }); }
  }
  return (
    <form onSubmit={submit} className="panel form-panel">
      <h2>Report today's price</h2>
      <p className="muted">Help everyone get a fair rate. Report what fish sold for at your harbor today.</p>
      <Field label="Harbor"><select required value={f.harbor} onChange={set("harbor")}><option value="">Choose harbor</option>{harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
      <Field label="Fish"><SpeciesSelect required species={species} value={f.species} onChange={set("species")} /></Field>
      <Field label="Price (₹ per kg)"><input required type="number" min="1" step="0.5" value={f.price_per_kg} onChange={set("price_per_kg")} /></Field>
      <button className="btn">Share price</button>
      <Notice kind={msg?.kind}>{msg?.text}</Notice>
    </form>
  );
}

export default function Sell() {
  const { user, ready } = useAuth();
  const { harbors, id } = useHarbor();
  const sp = useApi("/species/", { asList: true });
  const pr = useApi("/prices/", { asList: true });
  const mine = useApi("/listings/?mine=1", { skip: !user, asList: true });
  if (!ready) return <Skeleton />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "FISHERMAN") return <Empty icon="user" title="Selling is for fishermen">You are signed in as a buyer. <Link to="/register">Create a fisherman account</Link> to post catch.</Empty>;
  const harbor = user.harbor || id || "";
  const rows = mine.data || [];
  const open = rows.filter((l) => l.status === "OPEN");
  const kg = open.reduce((t, l) => t + Number(l.quantity_kg), 0);
  const value = open.reduce((t, l) => t + Number(l.quantity_kg) * Number(l.price_per_kg), 0);

  async function remove(l) {
    if (!window.confirm(`Remove ${l.species_name} (${Number(l.quantity_kg)} kg)?`)) return;
    await api(`/listings/${l.id}/`, { method: "DELETE" }); mine.reload();
  }
  return (
    <>
      <PageHead eyebrow="Fisherman dashboard" title="Sell your catch" sub="Post fish, share prices and manage your listings.">
        <Link className="btn ghost sm" to="/planner">Plan next trip</Link><Link className="btn sm" to="/orders">Buyer requests</Link>
      </PageHead>
      <div className="stats">
        <Stat icon="fish" label="Active listings" value={open.length} />
        <Stat icon="scale" label="Fish available" value={`${Math.round(kg)} kg`} />
        <Stat icon="tag" label="Estimated value" value={money(value)} />
        <Stat icon="check" label="Sold" value={rows.length - open.length} />
      </div>
      <div className="two-col">
        <PostCatch key={`p${harbor}`} harbors={harbors} species={sp.data || []} harbor={harbor} prices={pr.data || []} onDone={mine.reload} />
        <ReportPrice key={`r${harbor}`} harbors={harbors} species={sp.data || []} harbor={harbor} />
      </div>
      <h2 className="h2">Your listings</h2>
      {mine.loading ? <Skeleton h={100} /> : rows.length === 0 ? <div className="soft-empty">You have not posted any catch yet.</div> : (
        <div className="list">
          {rows.map((l) => (
            <div key={l.id} className="card row-card">
              <div><h3>{l.species_name} · {Number(l.quantity_kg)} kg</h3>
                <p className="muted">{l.harbor_name} · {money(l.price_per_kg)}/kg · {caughtAgo(l.caught_on)}</p></div>
              <div className="row actions"><span className={`status ${l.status.toLowerCase()}`}>{l.status === "OPEN" ? "Available" : "Sold"}</span>
                <button className="btn ghost sm" onClick={() => remove(l)}>Remove</button></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
