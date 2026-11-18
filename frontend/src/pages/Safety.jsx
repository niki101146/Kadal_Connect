import { Link } from "react-router-dom";
import { Icon, PageHead, BOATS } from "../components.jsx";

const CONTACTS = [["112", "National emergency", "Police, fire and ambulance"], ["1554", "Coast Guard", "Sea rescue and distress"], ["1077", "Disaster control room", "District flood and cyclone help"], ["1093", "Fisheries helpline", "Fisheries Department assistance"]];
const SIGNS = [["Sea turns rough suddenly", "Head back to the nearest landing point right away. Do not wait to finish the net."], ["Dark clouds and shifting wind", "These often come before squalls. Return early and tell others nearby."], ["Engine failure", "Drop anchor if drifting toward rocks, show a light or cloth, and call 1554."], ["Person overboard", "Throw a float, slow the boat, keep eyes on them and call for help immediately."]];

export default function Safety() {
  return (
    <>
      <PageHead eyebrow="Safety hub" title="Stay safe at sea" sub="Emergency numbers, boat limits and what to do when conditions change." />
      <div className="contacts">
        {CONTACTS.map(([n, t, d]) => <a key={n} href={`tel:${n}`} className="contact"><span className="contact-ic"><Icon name="phone" size={20} /></span><div><b>{n}</b><strong>{t}</strong><small>{d}</small></div></a>)}
      </div>
      <h2 className="h2">Safe limits by boat type</h2>
      <div className="table-wrap"><table className="tbl"><thead><tr><th>Boat</th><th>Max wave height</th><th>Max gusts</th></tr></thead>
        <tbody>{Object.values(BOATS).map((b) => <tr key={b.label}><td>{b.label}</td><td>{b.wave} m</td><td>{b.gust} km/h</td></tr>)}</tbody></table></div>
      <p className="fineprint">These are general guidelines. Boat condition, crew experience and local knowledge matter. Official advice always comes first.</p>
      <h2 className="h2">If something goes wrong</h2>
      <div className="two-col">{SIGNS.map(([t, d]) => <article key={t} className="panel tight"><h3><Icon name="shield" size={18} /> {t}</h3><p className="muted">{d}</p></article>)}</div>
      <section className="cta-band"><div><h2>Check today's prediction</h2><p>See hourly waves, wind and rain before you decide.</p></div><Link className="btn light" to="/planner">Plan a trip <Icon name="arrow-right" /></Link></section>
    </>
  );
}
