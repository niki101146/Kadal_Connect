import { useRef } from "react";
import { useHarbor } from "./harbor.jsx";

const PATHS = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  wave: "M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2",
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8h.01",
  fish: "M2 12c3-5 8-6 12-3l6-3v12l-6-3c-4 3-9 2-12-3zM7.5 11h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  bag: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0",
  plus: "M12 5v14M5 12h14",
  pin: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  wind: "M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15.5 8.5l-2 5-5 2 2-5z",
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M5 12l7 7 7-7",
  alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  scale: "M12 3v18M5 21h14M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z",
  check: "M5 12l5 5 9-10",
  "shopping-bag": "M5 8h14l-1 13H6L5 8zM9 8a3 3 0 0 1 6 0",
  ship: "M3 17l2 3h14l2-3M4 16l2-8h12l2 8-8 4-8-4zM12 8V3h5v5M8 12h.01M12 12h.01M16 12h.01",
  "map-pin": "M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  cloud: "M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z",
  rain: "M7 15a4 4 0 0 1-.5-8A6 6 0 0 1 18 6a4.5 4.5 0 0 1 0 9M8 19l-1 2M12 19l-1 2M16 19l-1 2",
  thermo: "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z",
  gauge: "M12 21a9 9 0 1 1 9-9M12 12l4-4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1-6.1L3.2 9.5l6.1-.9z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5h.01",
  heart: "M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z",
  refresh: "M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5",
  anchor: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8v14M5 12H3a9 9 0 0 0 18 0h-2M8 12h8",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  x: "M6 6l12 12M18 6L6 18",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  sunrise: "M12 3v4M5 12H2M22 12h-3M7 8L5 6M17 8l2-2M6 18a6 6 0 0 1 12 0M2 21h20",
  menu: "M4 6h16M4 12h16M4 18h16",
  tide: "M2 10c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M12 14v7M9 18l3 3 3-3",
};
export const Icon = ({ name, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name] || PATHS.info} /></svg>
);

export const LEVEL = {
  SAFE: { label: "Safe to fish", short: "Safe", cls: "safe" },
  CAUTION: { label: "Go with caution", short: "Caution", cls: "caution" },
  DANGER: { label: "Stay ashore", short: "Danger", cls: "danger" },
};
export const BOATS = {
  small: { label: "Small country boat / catamaran", wave: 1.0, gust: 30 },
  medium: { label: "Fibre (FRP) boat with outboard", wave: 1.5, gust: 35 },
  large: { label: "Mechanised boat / trawler", wave: 2.5, gust: 50 },
};
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const compass = (d) => (d == null ? "–" : DIRS[Math.round(d / 45) % 8]);
export const clock = (iso) => (iso ? iso.slice(11, 16) : "–");
export const hour12 = (iso) => {
  const h = +iso.slice(11, 13);
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};
export const money = (n) => `₹${Math.round(Number(n))}`;
export const dayName = (iso, i) =>
  i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(iso + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
export const dayLong = (iso) => new Date(iso + "T00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
export function caughtAgo(dateStr) {
  const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(dateStr + "T00:00")) / 864e5);
  return d <= 0 ? "Caught today" : d === 1 ? "Caught yesterday" : `Caught ${d} days ago`;
}
export const freshness = (dateStr) => {
  const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(dateStr + "T00:00")) / 864e5);
  return d <= 0 ? "fresh" : d === 1 ? "good" : "older";
};
export function timeAgo(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}
export const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "K";
export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
// WMO weather code -> label + emoji
export function wx(code) {
  if (code == null) return { label: "–", icon: "🌊" };
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code <= 2) return { label: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code <= 48) return { label: "Fog", icon: "🌫️" };
  if (code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code <= 82) return { label: "Showers", icon: "🌦️" };
  return { label: "Thunderstorm", icon: "⛈️" };
}
// latest + previous price per fish, from a newest-first list of price records
export function trends(prices) {
  const m = new Map();
  prices.forEach((p) => {
    const e = m.get(p.species);
    if (!e) m.set(p.species, { id: p.species, name: p.species_name, price: +p.price_per_kg, prev: null, at: p.created_at });
    else if (e.prev == null) e.prev = +p.price_per_kg;
  });
  return [...m.values()];
}

export function Trend({ price, prev }) {
  if (prev == null || prev === price) return <span className="trend flat" title="No change since the last report">–</span>;
  const up = price > prev;
  return <span className={`trend ${up ? "up" : "down"}`}><Icon name={up ? "up" : "down"} size={13} />{money(Math.abs(price - prev))}</span>;
}

export function Sparkline({ values, w = 96, h = 30, up }) {
  if (!values || values.length < 2) return <span className="spark-none">–</span>;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${h - 3 - ((v - lo) / span) * (h - 6)}`).join(" ");
  const rising = up ?? values[values.length - 1] >= values[0];
  return (
    <svg className={`spark ${rising ? "up" : "down"}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline points={pts} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HarborPicker() {
  const { harbors, id, setId } = useHarbor();
  return (
    <label className="picker">
      <Icon name="pin" size={17} /><span className="sr">Harbor</span>
      <select value={id} onChange={(e) => setId(e.target.value)}>
        {harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
      </select>
    </label>
  );
}

// Dropdown of every sea fish, grouped by type (pelagic, reef, prawns…) so a long list stays easy to scan.
export function SpeciesSelect({ species = [], value, onChange, placeholder = "Choose fish", required, allLabel, ...rest }) {
  const groups = species.reduce((m, s) => { const k = s.category || "Other"; (m[k] = m[k] || []).push(s); return m; }, {});
  return (
    <select required={required} value={value} onChange={onChange} {...rest}>
      <option value="">{allLabel || placeholder}</option>
      {Object.entries(groups).map(([cat, rows]) => (
        <optgroup key={cat} label={cat}>
          {rows.map((s) => <option key={s.id} value={s.id}>{s.name}{s.name_ta ? ` · ${s.name_ta}` : ""}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export const Skeleton = ({ h = 120 }) => <div className="skel" style={{ height: h }} aria-busy="true" />;
export const Notice = ({ kind = "info", children }) => children ? <p className={`notice ${kind}`} role="status">{children}</p> : null;
export const Field = ({ label, hint, children }) => (
  <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
);
export function Empty({ icon = "fish", title, children }) {
  return <div className="empty"><span className="empty-ic"><Icon name={icon} size={28} /></span><h3>{title}</h3><p>{children}</p></div>;
}
export const PageHead = ({ title, sub, eyebrow, children }) => (
  <div className="pagehead"><div>{eyebrow && <span className="eyebrow-s">{eyebrow}</span>}<h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>{children && <div className="pagehead-actions">{children}</div>}</div>
);
export const Stat = ({ icon, label, value, sub, tone }) => (
  <div className={`stat ${tone || ""}`}><span className="stat-ic"><Icon name={icon} size={18} /></span><div><small>{label}</small><b>{value}</b>{sub && <em>{sub}</em>}</div></div>
);
export const Segmented = ({ value, onChange, options, label }) => (
  <div className="seg" role="group" aria-label={label}>
    {options.map(([v, t]) => <button key={v} type="button" className={value === v ? "on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{t}</button>)}
  </div>
);

/* ---------- Sea-state verdict banner ---------- */
export function Verdict({ w, compact }) {
  const L = LEVEL[w.level];
  const win = w.best_windows?.[0];
  return (
    <section className={`verdict ${L.cls} ${compact ? "compact" : ""}`}>
      <div className="verdict-main">
        <p className="verdict-where"><Icon name="pin" size={15} /> {w.harbor.name} · updated {w.updated ? clock(w.updated) : "now"}</p>
        <h2 className="verdict-title"><span className="verdict-dot" />{L.label}</h2>
        <p className="verdict-advice">{w.advice}</p>
      </div>
      {!compact && (
        <div className="verdict-side">
          {w.trend && <div><small>Prediction</small><b className={`trend-${w.trend.direction.toLowerCase()}`}>{w.trend.direction === "WORSENING" ? "Getting rougher" : w.trend.direction === "IMPROVING" ? "Calming down" : "Holding steady"}</b><span>{w.trend.text}</span></div>}
          {win && <div><small>Best fishing window</small><b>{dayName(win.date, win.date === w.hourly?.[0]?.time.slice(0, 10) ? 0 : 1)} {win.start}–{win.end}</b><span>{win.hours} calm hours</span></div>}
        </div>
      )}
    </section>
  );
}

/* ---------- Interactive hourly chart ---------- */
export function SeriesChart({ hours, field, unit, caution, danger, bars, signed, sel, onSel, digits = 1 }) {
  const ref = useRef(null);
  const n = hours.length;
  const vals = hours.map((h) => h[field]);
  if (n < 2 || vals.every((v) => v == null)) return <p className="muted chart-empty">This forecast is not available for this harbor right now.</p>;
  const W = 760, H = 230, L = 44, R = 14, T = 14, B = 30;
  const nums = vals.map((v) => v ?? 0);
  let hi = Math.max(...nums, danger ? danger * 1.08 : 0, bars ? 100 : 0) * (bars ? 1 : 1.12) || 1;
  let lo = signed ? Math.min(...nums) - 0.15 : 0;
  if (signed) hi = Math.max(...nums) + 0.15;
  const x = (i) => L + (i / (n - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = nums.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1)} ${y(lo)} L${x(0)} ${y(lo)}Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    onSel(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };
  const bw = (W - L - R) / n - 2;
  return (
    <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${field} forecast`} onPointerMove={move} onPointerDown={move}>
      {caution != null && danger != null && <>
        <rect x={L} y={y(Math.min(danger, hi))} width={W - L - R} height={Math.max(0, y(caution) - y(Math.min(danger, hi)))} className="band-warn" />
        <rect x={L} y={T} width={W - L - R} height={Math.max(0, y(danger) - T)} className="band-bad" />
      </>}
      {ticks.map((t, k) => <g key={k}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" /><text x={L - 8} y={y(t) + 4} className="ax" textAnchor="end">{t.toFixed(unit === "%" || unit === "km/h" ? 0 : 1)}</text></g>)}
      {caution != null && <line x1={L} x2={W - R} y1={y(caution)} y2={y(caution)} className="thr warn" />}
      {danger != null && <line x1={L} x2={W - R} y1={y(danger)} y2={y(danger)} className="thr bad" />}
      {bars ? nums.map((v, i) => <rect key={i} x={x(i) - bw / 2} y={y(v)} width={Math.max(2, bw)} height={Math.max(0, y(0) - y(v))} rx="2" className={`bar ${v >= 60 ? "wet" : ""}`} />)
            : <><path d={area} className="area" /><path d={line} className="ln" fill="none" /></>}
      {hours.map((h, i) => (i % 6 === 0 || h.time.slice(11, 13) === "00") && (
        <text key={i} x={x(i)} y={H - 8} className="ax" textAnchor="middle">{h.time.slice(11, 13) === "00" ? new Date(h.time.slice(0, 10) + "T00:00").toLocaleDateString("en-IN", { weekday: "short" }) : hour12(h.time).replace(" ", "")}</text>
      ))}
      {hours.map((h, i) => h.time.slice(11, 13) === "00" && i > 0 && <line key={`d${i}`} x1={x(i)} x2={x(i)} y1={T} y2={H - B} className="daysep" />)}
      <text x={W - R} y={T + 10} className="ax unit" textAnchor="end">{unit}</text>
      {sel != null && <g><line x1={x(sel)} x2={x(sel)} y1={T} y2={H - B} className="cursor" />{!bars && <circle cx={x(sel)} cy={y(nums[sel])} r="5" className="cursor-dot" />}</g>}
    </svg>
  );
}
