import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks.js";
import { useHarbor } from "../harbor.jsx";
import { Icon, Verdict, Skeleton, Notice, PageHead, Segmented, SeriesChart, compass, clock, dayName, dayLong, hour12, wx, LEVEL } from "../components.jsx";

const Metric = ({ icon, label, value, sub }) => (
  <div className="metric"><span className="metric-ic"><Icon name={icon} size={18} /></span><small>{label}</small><b>{value}</b>{sub && <em>{sub}</em>}</div>
);
const SERIES = {
  wave: { label: "Waves", field: "wave", unit: "m", caution: 1.5, danger: 2.5 },
  wind: { label: "Wind gusts", field: "gust", unit: "km/h", caution: 35, danger: 50 },
  rain: { label: "Rain chance", field: "rain", unit: "%", bars: true },
  tide: { label: "Tide level", field: "tide", unit: "m", signed: true },
};

export default function Sea() {
  const { id } = useHarbor();
  const wxd = useApi(`/weather/?harbor=${id}`, { skip: !id });
  const al = useApi(`/alerts/?harbor=${id}`, { skip: !id, asList: true });
  const [series, setSeries] = useState("wave");
  const [range, setRange] = useState(24);
  const [sel, setSel] = useState(0);
  const w = wxd.data;
  const S = SERIES[series];
  const hours = (w?.hourly || []).slice(0, range);
  const h = hours[Math.min(sel, hours.length - 1)];
  const now = w?.hourly?.[0];
  const today = w?.forecast?.[0];

  return (
    <>
      <PageHead eyebrow="Weather prediction" title="Sea forecast & prediction" sub="Live conditions, hour-by-hour prediction for 48 hours and a 7-day outlook for your harbor.">
        <button className="btn ghost sm" onClick={wxd.reload} disabled={wxd.loading}><Icon name="refresh" size={16} /> Refresh</button>
        <Link className="btn sm" to="/planner"><Icon name="route" size={16} /> Plan a trip</Link>
      </PageHead>

      {wxd.loading && !w ? <Skeleton h={220} /> : w ? <Verdict w={w} /> : <Notice kind="bad">{wxd.error}</Notice>}

      {w && (
        <>
          <div className="metrics">
            <Metric icon="wave" label="Wave height" value={`${w.wave_height_m ?? "–"} m`} sub={`Period ${w.wave_period_s ?? "–"} s`} />
            <Metric icon="compass" label="Waves from" value={compass(w.wave_dir)} sub={now?.swell != null ? `Swell ${now.swell} m` : null} />
            <Metric icon="wind" label="Wind" value={`${w.wind_kmh ?? "–"} km/h`} sub={`From ${compass(w.wind_dir)}`} />
            <Metric icon="wind" label="Gusts" value={`${w.gust_kmh ?? "–"} km/h`} sub={w.gust_kmh >= 35 ? "Strong" : "Moderate"} />
            <Metric icon="thermo" label="Air temp" value={`${w.temp_c ?? "–"}°C`} sub={wx(w.code).label} />
            <Metric icon="drop" label="Humidity" value={`${w.humidity ?? "–"}%`} sub={`Cloud ${w.cloud_pct ?? "–"}%`} />
            <Metric icon="gauge" label="Pressure" value={`${w.pressure_hpa != null ? Math.round(w.pressure_hpa) : "–"} hPa`} sub={w.pressure_hpa < 1006 ? "Low, unsettled" : "Normal"} />
            <Metric icon="eye" label="Visibility" value={now?.vis_km != null ? `${now.vis_km} km` : "–"} sub={`Rain today ${w.rain_pct ?? "–"}%`} />
          </div>

          <section className="panel">
            <div className="panel-head">
              <div><h2>Hourly prediction</h2><p className="muted">Move over the chart to read any hour. Shaded zones show caution and danger levels.</p></div>
              <div className="panel-tools">
                <Segmented label="Forecast type" value={series} onChange={(v) => { setSeries(v); }} options={Object.entries(SERIES).map(([k, s]) => [k, s.label])} />
                <Segmented label="Range" value={range} onChange={(v) => { setRange(v); setSel(0); }} options={[[24, "24 h"], [48, "48 h"]]} />
              </div>
            </div>
            <SeriesChart hours={hours} {...S} sel={Math.min(sel, hours.length - 1)} onSel={setSel} />
            {h && (
              <div className={`readout ${LEVEL[h.level].cls}`}>
                <div><small>{new Date(h.time).toLocaleDateString("en-IN", { weekday: "short" })} · {hour12(h.time)}</small><b>{wx(h.code).icon} {wx(h.code).label}</b></div>
                <div><small>Waves</small><b>{h.wave ?? "–"} m</b></div>
                <div><small>Gusts</small><b>{h.gust != null ? Math.round(h.gust) : "–"} km/h</b></div>
                <div><small>Rain</small><b>{h.rain ?? "–"}%</b></div>
                <div><small>Temp</small><b>{h.temp != null ? Math.round(h.temp) : "–"}°C</b></div>
                <div><small>Sea state</small><b>{LEVEL[h.level].short}</b></div>
              </div>
            )}
          </section>

          <div className="two-col">
            <section className="panel">
              <h2>Best fishing windows</h2>
              <p className="muted">Calm, low-rain daylight hours predicted for the next 2 days.</p>
              {w.best_windows?.length ? (
                <ul className="windows">
                  {w.best_windows.map((b) => (
                    <li key={b.date}><span className="win-ic"><Icon name="check" size={16} /></span><div><b>{dayLong(b.date)}</b><small>{b.start} – {b.end} · {b.hours} hours</small></div><Link to="/planner" className="text-link">Plan →</Link></li>
                  ))}
                </ul>
              ) : <div className="soft-empty">No calm daylight window is predicted in the next 2 days. Stay ashore or check again later.</div>}
              {today && <div className="sun-row"><span><Icon name="sunrise" size={18} /> Sunrise <b>{clock(today.sunrise)}</b></span><span><Icon name="sun" size={18} /> Sunset <b>{clock(today.sunset)}</b></span><span>UV <b>{today.uv ?? "–"}</b></span></div>}
            </section>
            <section className="panel">
              <h2>What to expect</h2>
              <p className="muted">{w.trend?.text}</p>
              <ul className="tips">
                {w.level === "DANGER" && <li className="bad"><Icon name="alert" size={16} /> Do not go to sea. Secure boats and nets.</li>}
                {w.level === "CAUTION" && <li className="warn"><Icon name="alert" size={16} /> Small boats should stay in. Larger boats should return early.</li>}
                {w.level === "SAFE" && <li className="ok"><Icon name="check" size={16} /> Conditions are suitable. Still carry life jackets and a charged phone.</li>}
                {(w.rain_pct ?? 0) >= 60 && <li className="warn"><Icon name="rain" size={16} /> Rain is likely today ({w.rain_pct}%). Visibility may drop.</li>}
                {w.gust_kmh >= 35 && <li className="warn"><Icon name="wind" size={16} /> Gusty wind. Expect choppy water and drifting.</li>}
                <li><Icon name="clock" size={16} /> Plan to be back before sunset at {clock(today?.sunset)}.</li>
              </ul>
            </section>
          </div>

          <section>
            <h2 className="h2">7-day outlook</h2>
            <div className="days">
              {w.forecast.map((d, i) => (
                <article key={d.date} className={`day ${LEVEL[d.level].cls}`}>
                  <header><strong>{dayName(d.date, i)}</strong><span className="day-ic" title={wx(d.code).label}>{wx(d.code).icon}</span></header>
                  <span className="day-level">{LEVEL[d.level].label}</span>
                  <dl>
                    <div><dt>Waves</dt><dd>{d.wave_max ?? "–"} m</dd></div>
                    <div><dt>Gusts</dt><dd>{d.gust_max != null ? Math.round(d.gust_max) : "–"} km/h</dd></div>
                    <div><dt>Rain</dt><dd>{d.rain ?? "–"}%</dd></div>
                    <div><dt>Temp</dt><dd>{d.temp_min != null ? Math.round(d.temp_min) : "–"}–{d.temp_max != null ? Math.round(d.temp_max) : "–"}°</dd></div>
                  </dl>
                  <div className="score" title="Fishing comfort score"><i style={{ width: `${d.score}%` }} /></div>
                  <small>Fishing score {d.score}/100</small>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <h2 className="h2">Alerts for this harbor</h2>
      {(al.data || []).length === 0 && <div className="soft-empty">No active alerts. Official warnings appear here as soon as they are posted.</div>}
      {(al.data || []).map((a) => (
        <article key={a.id} className={`alert ${a.severity.toLowerCase()}`}><Icon name="alert" /><div><strong>{a.title}</strong><p>{a.message}</p></div></article>
      ))}

      <h2 className="h2">How we rate the sea</h2>
      <div className="three">
        <div className="legend safe"><b>Safe to fish</b><p>Waves under 1.5 m and gusts under 35 km/h.</p></div>
        <div className="legend caution"><b>Go with caution</b><p>Waves 1.5–2.5 m or gusts 35–50 km/h. Small boats should stay in.</p></div>
        <div className="legend danger"><b>Stay ashore</b><p>Waves above 2.5 m or gusts above 50 km/h. Do not go to sea.</p></div>
      </div>
      <p className="fineprint">Forecast data from Open-Meteo marine and weather models, refreshed every 10 minutes. Predictions can change quickly. Always follow Coast Guard and Fisheries Department instructions.</p>
    </>
  );
}
