import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks.js";
import { useHarbor } from "../harbor.jsx";
import { BOATS, Field, Icon, Notice, PageHead, Skeleton, clock, hour12, dayName } from "../components.jsx";

const CHECK = ["Life jackets for everyone on board", "Fuel and engine checked", "Phone charged, number of Coast Guard saved (1554)", "Torch, whistle and first-aid kit", "Drinking water and food", "Tell family your landing point and return time", "Nets and ropes secured", "Compass or GPS working"];

export default function Planner() {
  const { id, harbor } = useHarbor();
  const wx = useApi(`/weather/?harbor=${id}`, { skip: !id });
  const [boat, setBoat] = useState("medium");
  const [day, setDay] = useState(0);
  const [start, setStart] = useState(5);
  const [dur, setDur] = useState(8);
  const [done, setDone] = useState({});
  const w = wx.data;
  const B = BOATS[boat];
  const dates = [...new Set((w?.hourly || []).map((h) => h.time.slice(0, 10)))].slice(0, 2);

  const plan = useMemo(() => {
    if (!w || !dates[day]) return null;
    const from = `${dates[day]}T${String(start).padStart(2, "0")}:00`;
    const i = w.hourly.findIndex((h) => h.time >= from);
    if (i < 0) return { empty: true };
    const hrs = w.hourly.slice(i, i + dur);
    if (!hrs.length) return { empty: true };
    const wave = Math.max(...hrs.map((h) => h.wave ?? 0)), gust = Math.max(...hrs.map((h) => h.gust ?? 0)), rain = Math.max(...hrs.map((h) => h.rain ?? 0));
    const over = (h) => (h.wave ?? 0) > B.wave || (h.gust ?? 0) > B.gust;
    const close = (h) => (h.wave ?? 0) > B.wave * 0.8 || (h.gust ?? 0) > B.gust * 0.8 || (h.rain ?? 0) >= 60;
    const bad = hrs.filter(over).length, mid = hrs.filter(close).length;
    const verdict = bad ? "NOGO" : mid ? "CAUTION" : "GO";
    const sunset = w.forecast.find((f) => f.date === dates[day])?.sunset;
    const end = hrs[hrs.length - 1].time;
    const reasons = [];
    if (bad) reasons.push(`Conditions exceed this boat's limits for ${bad} of ${hrs.length} hours (waves up to ${wave} m, gusts up to ${Math.round(gust)} km/h).`);
    else reasons.push(`Waves peak at ${wave} m and gusts at ${Math.round(gust)} km/h, within the limits for this boat.`);
    if (rain >= 60) reasons.push(`Rain chance reaches ${rain}%. Expect reduced visibility.`);
    if (sunset && end.slice(11, 16) > clock(sunset)) reasons.push(`Your trip ends after sunset (${clock(sunset)}). Plan to return earlier.`);
    return { hrs, verdict, reasons, wave, gust, rain };
  }, [w, day, start, dur, boat]);

  const V = { GO: ["Good to go", "safe"], CAUTION: ["Go with caution", "caution"], NOGO: ["Do not go", "danger"] };
  const checked = Object.values(done).filter(Boolean).length;

  return (
    <>
      <PageHead eyebrow="Trip planner" title="Plan your fishing trip" sub={`Check if your boat can safely go out from ${harbor?.name || "your harbor"} using the hourly prediction.`}>
        <Link className="btn ghost sm" to="/sea">View full forecast</Link>
      </PageHead>
      <div className="two-col planner">
        <section className="panel form-panel">
          <h2>Trip details</h2>
          <Field label="Boat type">
            <select value={boat} onChange={(e) => setBoat(e.target.value)}>{Object.entries(BOATS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</select>
          </Field>
          <small className="muted">Safe limit for this boat: waves up to {B.wave} m, gusts up to {B.gust} km/h.</small>
          <div className="two-f">
            <Field label="Day"><select value={day} onChange={(e) => setDay(+e.target.value)}>{dates.map((d, i) => <option key={d} value={i}>{dayName(d, i)}</option>)}</select></Field>
            <Field label="Leave at"><select value={start} onChange={(e) => setStart(+e.target.value)}>{Array.from({ length: 19 }, (_, i) => i + 3).map((h) => <option key={h} value={h}>{hour12(`2000-01-01T${String(h).padStart(2, "0")}:00`)}</option>)}</select></Field>
          </div>
          <Field label="Trip length"><select value={dur} onChange={(e) => setDur(+e.target.value)}>{[4, 6, 8, 10, 12, 16].map((d) => <option key={d} value={d}>{d} hours</option>)}</select></Field>
        </section>

        <section className="panel">
          {wx.loading && !w ? <Skeleton h={220} /> : !w ? <Notice kind="bad">{wx.error}</Notice> : !plan || plan.empty ? <div className="soft-empty">That start time has already passed or is outside the forecast. Pick a later time.</div> : (
            <>
              <div className={`plan-verdict ${V[plan.verdict][1]}`}>
                <span className="verdict-dot" /><div><small>Prediction for your trip</small><h2>{V[plan.verdict][0]}</h2></div>
              </div>
              <ul className="reasons">{plan.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <div className="hourstrip" aria-label="Hour by hour suitability">
                {plan.hrs.map((h) => {
                  const lvl = (h.wave ?? 0) > B.wave || (h.gust ?? 0) > B.gust ? "danger" : (h.wave ?? 0) > B.wave * 0.8 || (h.gust ?? 0) > B.gust * 0.8 || (h.rain ?? 0) >= 60 ? "caution" : "safe";
                  return <div key={h.time} className={`hr ${lvl}`} title={`${hour12(h.time)}: waves ${h.wave} m, gusts ${Math.round(h.gust ?? 0)} km/h, rain ${h.rain}%`}><small>{hour12(h.time).replace(" ", "")}</small><b>{h.wave ?? "–"}</b><em>m</em></div>;
                })}
              </div>
              <p className="fineprint">Each block shows the predicted wave height for that hour. Green is within limits, amber is close, red exceeds this boat's limits.</p>
            </>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><div><h2>Before you leave</h2><p className="muted">{checked} of {CHECK.length} checked</p></div><div className="progress"><i style={{ width: `${(checked / CHECK.length) * 100}%` }} /></div></div>
        <ul className="checklist">
          {CHECK.map((c) => <li key={c}><label><input type="checkbox" checked={!!done[c]} onChange={(e) => setDone({ ...done, [c]: e.target.checked })} /><span>{c}</span></label></li>)}
        </ul>
      </section>
    </>
  );
}
