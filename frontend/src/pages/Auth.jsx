import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useHarbor } from "../harbor.jsx";
import { Field, Icon, Notice } from "../components.jsx";

export default function Auth({ mode }) {
  const reg = mode === "register";
  const { login } = useAuth();
  const { harbors } = useHarbor();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ username: "", password: "", first_name: "", phone: "", town: "", address: "", role: "BUYER", harbor: "" });
  useEffect(() => setErr(""), [mode]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (reg) await api("/auth/register/", { method: "POST", body: { ...f, harbor: f.harbor || null } });
      const me = await login(f.username, f.password);
      nav(reg ? (me.role === "FISHERMAN" ? "/sell" : "/catch") : "/");
    } catch (x) { setErr(x.message === "No active account found with the given credentials" ? "Wrong username or password." : x.message); }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <h2>Your coast, connected.</h2>
        <ul>
          <li><Icon name="wave" size={20} /><div><b>Weather prediction</b><small>Hourly and 7-day sea forecast</small></div></li>
          <li><Icon name="tag" size={20} /><div><b>Harbor prices</b><small>Compare rates across harbors</small></div></li>
          <li><Icon name="fish" size={20} /><div><b>Fresh catch marketplace</b><small>Buy and sell directly</small></div></li>
          <li><Icon name="shield" size={20} /><div><b>Safety first</b><small>Trip planner and emergency contacts</small></div></li>
        </ul>
      </aside>
      <form onSubmit={submit} className="auth-form">
        <h1>{reg ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{reg ? "Join in a minute. It is free." : "Log in to manage orders and listings."}</p>
        {reg && (
          <>
            <div className="roles" role="radiogroup" aria-label="I am a">
              {[["BUYER", "I want to buy fish", "Compare prices and order fresh catch"], ["FISHERMAN", "I am a fisherman", "Post catch and report prices"]].map(([v, t, d]) => (
                <label key={v} className={`role ${f.role === v ? "on" : ""}`}>
                  <input type="radio" name="role" value={v} checked={f.role === v} onChange={set("role")} /><b>{t}</b><small>{d}</small>
                </label>
              ))}
            </div>
            <Field label="Your name"><input required autoComplete="name" value={f.first_name} onChange={set("first_name")} /></Field>
            <Field label="Phone number" hint="Shared only after a fisherman accepts an order."><input type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} /></Field>
            <div className="two-f">
              <Field label="Town / village" hint="Sellers see this when you request fish."><input autoComplete="address-level2" value={f.town} onChange={set("town")} placeholder="e.g. Colachel" /></Field>
              <Field label="Full address" hint="Shared only after a fisherman accepts."><input autoComplete="street-address" value={f.address} onChange={set("address")} placeholder="Door no., street, landmark" /></Field>
            </div>
            <Field label="Home harbor (optional)"><select value={f.harbor} onChange={set("harbor")}><option value="">Not set</option>{harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
          </>
        )}
        <Field label="Username"><input required autoComplete="username" value={f.username} onChange={set("username")} /></Field>
        <Field label="Password" hint={reg ? "At least 6 characters." : ""}>
          <div className="pw"><input required minLength={6} type={show ? "text" : "password"} autoComplete={reg ? "new-password" : "current-password"} value={f.password} onChange={set("password")} />
            <button type="button" className="ghost sm" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button></div>
        </Field>
        <Notice kind="bad">{err}</Notice>
        <button className="btn block" disabled={busy}>{busy ? "Please wait…" : reg ? "Sign up" : "Log in"}</button>
        <p className="muted center">{reg ? <>Have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
      </form>
    </div>
  );
}
