import { Link } from "react-router-dom";
import { useApi } from "../hooks.js";
import { useHarbor } from "../harbor.jsx";
import { useAuth } from "../auth.jsx";
import { Icon, Skeleton, Trend, Sparkline, trends, money, compass, hour12, dayName, wx, greeting, LEVEL } from "../components.jsx";
import ListingCard from "../ListingCard.jsx";

const Quick = ({ to, icon, title, sub }) => (
  <Link to={to} className="quick"><span className="quick-ic"><Icon name={icon} size={22} /></span><div><b>{title}</b><small>{sub}</small></div><Icon name="arrow-right" size={16} /></Link>
);

export default function Home() {
  const { id, harbor, harborError, reloadHarbors } = useHarbor();
  const { user } = useAuth();
  const on = !!id;
  const wxd = useApi(`/weather/?harbor=${id}`, { skip: !on });
  const werr = wxd.error || (!id && harborError ? `Cannot reach the server (${harborError})` : "");
  const al = useApi(`/alerts/?harbor=${id}`, { skip: !on, asList: true });
  const pr = useApi(`/prices/?harbor=${id}`, { skip: !on, asList: true });
  const ls = useApi("/listings/", { asList: true });
  const w = wxd.data;
  const movers = trends(pr.data || []).slice(0, 5);
  const hist = (sid) => (pr.data || []).filter((p) => p.species === sid).slice(0, 10).map((p) => +p.price_per_kg).reverse();
  const featured = (ls.data || []).slice(0, 3);
  const fisherman = user?.role === "FISHERMAN";
  const win = w?.best_windows?.[0];

  return (
    <div className="home">
      <section className="welcome">
        <div>
          <span className="eyebrow-s"><span className="live-dot" /> {harbor?.name || "Your harbor"} · live</span>
          <h1>{greeting()}{user ? `, ${user.first_name || user.username}` : ""}.</h1>
          <p className="muted">{fisherman ? "Check the sea, post your catch and track prices in one place." : "Check the sea, compare harbor prices and find fresh catch near you."}</p>
        </div>
        <div className="welcome-actions">
          {fisherman ? <Link className="btn" to="/sell"><Icon name="plus" size={18} /> Post catch</Link> : <Link className="btn" to="/catch"><Icon name="fish" size={18} /> Find fresh catch</Link>}
          <Link className="btn ghost" to="/planner"><Icon name="route" size={18} /> Plan a trip</Link>
        </div>
      </section>

      <section className="dash">
        <article className={`card sea-card ${w ? LEVEL[w.level].cls : ""}`}>
          <header><h2><Icon name="wave" size={18} /> Sea conditions</h2><Link to="/sea" className="text-link">Full forecast →</Link></header>
          {!w && !werr ? <Skeleton h={150} /> : w ? (
            <>
              <div className="sea-top"><div><span className="level-badge"><i />{LEVEL[w.level].label}</span><p>{w.advice}</p></div><div className="sea-temp"><span>{wx(w.code).icon}</span><b>{w.temp_c != null ? Math.round(w.temp_c) : "–"}°</b><small>{wx(w.code).label}</small></div></div>
              <div className="sea-stats"><div><small>Waves</small><b>{w.wave_height_m ?? "–"} m</b></div><div><small>Gusts</small><b>{w.gust_kmh ?? "–"} km/h</b></div><div><small>Wind</small><b>{compass(w.wind_dir)}</b></div><div><small>Rain</small><b>{w.rain_pct ?? "–"}%</b></div></div>
              <div className="next-hours" aria-label="Next hours prediction">{w.hourly.filter((_, i) => i % 3 === 0).slice(0, 8).map((h) => <div key={h.time} className={`nh ${LEVEL[h.level].cls}`}><small>{hour12(h.time)}</small><span>{wx(h.code).icon}</span><b>{h.wave ?? "–"}m</b></div>)}</div>
              <p className="predict"><Icon name="trend" size={16} /> <b>Prediction:</b> {w.trend?.text} {win && <>Best window {dayName(win.date, 0) === "Today" && win.date === w.hourly[0].time.slice(0, 10) ? "today" : "tomorrow"} {win.start}–{win.end}.</>}</p>
            </>
          ) : <p className="muted">{werr || "Choose a harbor to see conditions."} <button className="btn ghost sm" onClick={() => { reloadHarbors(); wxd.reload(); }}>Try again</button></p>}
        </article>

        <article className="card price-card">
          <header><h2><Icon name="tag" size={18} /> Price movers</h2><Link to="/prices" className="text-link">All prices →</Link></header>
          {pr.loading ? <Skeleton h={150} /> : movers.length === 0 ? <p className="muted">No prices reported for this harbor yet.</p> : (
            <ul className="mover-list">{movers.map((p) => <li key={p.id}><span className="mv-name">{p.name}</span><Sparkline values={hist(p.id)} w={70} h={24} /><b>{money(p.price)}<small>/kg</small></b><Trend price={p.price} prev={p.prev} /></li>)}</ul>
          )}
        </article>
      </section>

      {(al.data || []).map((a) => <article key={a.id} className={`alert ${a.severity.toLowerCase()}`}><Icon name="alert" /><div><strong>{a.title}</strong><p>{a.message}</p></div></article>)}

      <section className="quick-grid" aria-label="Quick actions">
        <Quick to="/sea" icon="wave" title="Weather prediction" sub="48-hour and 7-day outlook" />
        <Quick to="/planner" icon="route" title="Trip planner" sub="Go or no-go for your boat" />
        <Quick to="/prices" icon="trend" title="Harbor prices" sub="Compare and track rates" />
        <Quick to="/catch" icon="fish" title="Marketplace" sub="Buy and sell fresh catch" />
        <Quick to="/safety" icon="shield" title="Safety hub" sub="Emergency numbers & limits" />
        <Quick to="/orders" icon="bag" title="Orders" sub="Requests and pickups" />
      </section>

      {w && (
        <section className="block">
          <div className="section-heading"><div><h2>Next 7 days</h2><p className="muted">Predicted sea state and fishing score for {harbor?.name}.</p></div><Link className="text-link" to="/sea">Details →</Link></div>
          <div className="week">{w.forecast.map((d, i) => <Link to="/sea" key={d.date} className={`wk ${LEVEL[d.level].cls}`}><small>{dayName(d.date, i)}</small><span>{wx(d.code).icon}</span><b>{d.wave_max ?? "–"} m</b><em>{LEVEL[d.level].short}</em><div className="score"><i style={{ width: `${d.score}%` }} /></div></Link>)}</div>
        </section>
      )}

      <section className="block">
        <div className="section-heading"><div><h2>Fresh catch near you</h2><p className="muted">Latest listings from local fishermen.</p></div><Link className="text-link" to="/catch">Open marketplace →</Link></div>
        {ls.loading ? <Skeleton h={180} /> : featured.length === 0 ? <div className="soft-empty">No fresh catch is listed right now. Check back soon.</div> : <div className="grid">{featured.map((l) => <ListingCard key={l.id} l={l} />)}</div>}
      </section>

      <section className="block">
        <div className="section-heading"><div><h2>How Kadal Connect works</h2></div></div>
        <div className="journey-grid">
          <article className="journey"><span className="journey-label">For buyers</span><h3>Find fresh catch</h3><ol><li><span>1</span>Browse today's catch and compare prices</li><li><span>2</span>Choose fish and quantity, send a request</li><li><span>3</span>Coordinate pickup after the seller accepts</li></ol><Link className="text-link" to="/catch">Browse catch →</Link></article>
          <article className="journey"><span className="journey-label alt">For fishermen</span><h3>Reach more buyers</h3><ol><li><span>1</span>Check the prediction and plan your trip</li><li><span>2</span>Post catch with a clear per-kg price</li><li><span>3</span>Accept requests and report market prices</li></ol><Link className="text-link" to={fisherman ? "/sell" : "/register"}>{fisherman ? "Manage catch →" : "Start selling →"}</Link></article>
        </div>
      </section>

      {!user && <section className="cta-band"><div><h2>Join your coastal community</h2><p>Free for fishermen and buyers. Post catch, request fish and get sea updates.</p></div><div className="cta-actions"><Link className="btn light" to="/register">Create account <Icon name="arrow-right" /></Link><Link className="btn outline-light" to="/login">Log in</Link></div></section>}
    </div>
  );
}
