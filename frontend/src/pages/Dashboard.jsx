import { useEffect, useState } from "react";
import { api, list } from "../api.js";

export default function Dashboard() {
  const [harbors, setHarbors] = useState([]);
  const [harbor, setHarbor] = useState("");
  const [wx, setWx] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => { api("/auth/harbors/").then((h) => { setHarbors(h); if (h[0]) setHarbor(h[0].id); }).catch((e) => setErr(e.message)); }, []);
  useEffect(() => {
    if (!harbor) return;
    setErr(""); setWx(null);
    api(`/weather/?harbor=${harbor}`).then(setWx).catch((e) => setErr(e.message));
    api(`/alerts/?harbor=${harbor}`).then(setAlerts);
    api(`/prices/?harbor=${harbor}`).then((d) => {
      const seen = new Set();
      setPrices(list(d).filter((p) => !seen.has(p.species) && seen.add(p.species)));
    });
  }, [harbor]);

  return (
    <>
      <div className="row">
        <h1>Sea today</h1>
        <select value={harbor} onChange={(e) => setHarbor(e.target.value)} aria-label="Harbor">
          {harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      {wx && (
        <section className={`verdict ${wx.level.toLowerCase()}`}>
          <p className="level">{wx.level === "SAFE" ? "Safe to fish" : wx.level === "CAUTION" ? "Go with caution" : "Stay ashore"}</p>
          <p>{wx.advice}</p>
          <dl>
            <div><dt>Waves</dt><dd>{wx.wave_height_m} m</dd></div>
            <div><dt>Wind gusts</dt><dd>{wx.gust_kmh} km/h</dd></div>
            <div><dt>Wave period</dt><dd>{wx.wave_period_s} s</dd></div>
            <div><dt>Air</dt><dd>{wx.temp_c}°C</dd></div>
          </dl>
        </section>
      )}
      <h2>Alerts</h2>
      {alerts.length === 0 && <p className="muted">No active alerts for this harbor.</p>}
      {alerts.map((a) => (
        <article key={a.id} className={`alert ${a.severity.toLowerCase()}`}>
          <strong>{a.title}</strong><p>{a.message}</p>
        </article>
      ))}
      <h2>Prices at this harbor</h2>
      <table>
        <thead><tr><th>Fish</th><th>₹ per kg</th></tr></thead>
        <tbody>{prices.map((p) => <tr key={p.id}><td>{p.species_name}</td><td>{Number(p.price_per_kg)}</td></tr>)}</tbody>
      </table>
    </>
  );
}
