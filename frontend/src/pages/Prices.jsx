import { useMemo, useState } from "react";
import { useApi, useStored } from "../hooks.js";
import { useHarbor } from "../harbor.jsx";
import { Empty, Icon, Notice, PageHead, Segmented, Skeleton, Sparkline, Stat, Trend, money, timeAgo } from "../components.jsx";

export default function Prices() {
  const { harbors, id, harbor: mine } = useHarbor();
  const pr = useApi("/prices/", { asList: true });
  const sp = useApi("/species/", { asList: true });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("az");
  const [view, setView] = useStored("kadal_price_view", "cards");

  const board = useMemo(() => {
    const latest = new Map(), prev = new Map(), hist = new Map();
    const recs = pr.data || [];
    recs.forEach((p) => {
      const k = `${p.species}-${p.harbor}`;
      if (!latest.has(k)) latest.set(k, p); else if (!prev.has(k)) prev.set(k, +p.price_per_kg);
      const hk = `${p.species}-${p.harbor}`;
      if (!hist.has(hk)) hist.set(hk, []);
      hist.get(hk).push(+p.price_per_kg);
    });
    const out = (sp.data || []).map((s) => {
      const rows = harbors
        .map((h) => { const p = latest.get(`${s.id}-${h.id}`); return p ? { h, price: +p.price_per_kg, prev: prev.get(`${s.id}-${h.id}`) ?? null, at: p.created_at } : null; })
        .filter(Boolean).sort((a, b) => b.price - a.price);
      const avg = rows.length ? rows.reduce((t, r) => t + r.price, 0) / rows.length : 0;
      const prevAvg = rows.filter((r) => r.prev != null).length ? rows.reduce((t, r) => t + (r.prev ?? r.price), 0) / rows.length : avg;
      return { ...s, rows, avg, change: avg - prevAvg, hist: (hist.get(`${s.id}-${id}`) || hist.get(`${s.id}-${rows[0]?.h.id}`) || []).slice(0, 14).reverse() };
    }).filter((s) => s.rows.length && `${s.name} ${s.name_ta}`.toLowerCase().includes(q.toLowerCase()));
    if (sort === "high") return out.sort((a, b) => b.avg - a.avg);
    if (sort === "low") return out.sort((a, b) => a.avg - b.avg);
    if (sort === "move") return out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [pr.data, sp.data, harbors, id, q, sort]);

  const gainer = [...board].sort((a, b) => b.change - a.change)[0];
  const faller = [...board].sort((a, b) => a.change - b.change)[0];
  const spread = [...board].filter((s) => s.rows.length > 1).sort((a, b) => (b.rows[0].price - b.rows.at(-1).price) - (a.rows[0].price - a.rows.at(-1).price))[0];

  return (
    <>
      <PageHead eyebrow="Market intelligence" title="Harbor prices" sub="Latest ₹ per kg at every harbor. Sell where it is highest, buy where it is lowest." />
      <div className="stats">
        <Stat icon="fish" label="Fish tracked" value={board.length} sub={`${harbors.length} harbors`} />
        <Stat icon="up" label="Biggest rise" value={gainer && gainer.change > 0 ? gainer.name : "–"} sub={gainer && gainer.change > 0 ? `+${money(gainer.change)}/kg` : "No rise reported"} tone="up" />
        <Stat icon="down" label="Biggest drop" value={faller && faller.change < 0 ? faller.name : "–"} sub={faller && faller.change < 0 ? `−${money(Math.abs(faller.change))}/kg` : "No drop reported"} tone="down" />
        <Stat icon="trend" label="Widest harbor gap" value={spread ? spread.name : "–"} sub={spread ? `${money(spread.rows[0].price - spread.rows.at(-1).price)}/kg difference` : ""} />
      </div>
      <div className="toolbar">
        <label className="searchbox"><Icon name="search" size={18} /><span className="sr">Search fish</span>
          <input type="search" placeholder="Search fish in English or Tamil" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="az">Name, A to Z</option><option value="high">Highest average price</option><option value="low">Lowest average price</option><option value="move">Biggest price movement</option>
        </select>
        <Segmented label="Layout" value={view} onChange={setView} options={[["cards", "Cards"], ["table", "Table"]]} />
      </div>
      <Notice kind="bad">{pr.error || sp.error}</Notice>
      {pr.loading ? <Skeleton h={260} /> : board.length === 0 ? <Empty icon="tag" title="No prices found">Try a different search, or ask a fisherman to report today's price.</Empty> : view === "table" ? (
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Fish</th>{harbors.map((h) => <th key={h.id} className={String(h.id) === String(id) ? "mine" : ""}>{h.name}</th>)}<th>Average</th><th>Trend</th></tr></thead>
          <tbody>{board.map((s) => (
            <tr key={s.id}><td><b>{s.name}</b>{s.name_ta && <small className="ta"> {s.name_ta}</small>}</td>
              {harbors.map((h) => { const r = s.rows.find((x) => x.h.id === h.id); return <td key={h.id} className={String(h.id) === String(id) ? "mine" : ""}>{r ? <>{money(r.price)} <Trend price={r.price} prev={r.prev} /></> : "–"}</td>; })}
              <td><b>{money(s.avg)}</b></td><td><Sparkline values={s.hist} /></td></tr>))}</tbody>
        </table></div>
      ) : (
        <div className="grid board-grid">
          {board.map((s) => {
            const max = s.rows[0].price, min = s.rows.at(-1).price, base = min - (max - min) * 0.5;
            const newest = s.rows.reduce((m, r) => (r.at > m ? r.at : m), s.rows[0].at);
            const myRow = s.rows.find((r) => String(r.h.id) === String(id));
            return (
              <article key={s.id} className="card board">
                <header>
                  <div className="fish"><h3>{s.name}</h3>{s.name_ta && <span className="ta">{s.name_ta}</span>}</div>
                  <div className="avg"><b>{money(s.avg)}</b><small>average / kg</small></div>
                </header>
                <div className="board-meta"><Sparkline values={s.hist} w={120} h={34} /><span className={`pill ${s.change > 0 ? "up" : s.change < 0 ? "down" : ""}`}>{s.change > 0 ? "▲" : s.change < 0 ? "▼" : "•"} {s.change ? money(Math.abs(s.change)) : "No change"}</span></div>
                <p className="spread">{s.rows.length > 1 ? `${money(min)} to ${money(max)} across ${s.rows.length} harbors` : "Reported at 1 harbor"} · updated {timeAgo(newest)}</p>
                {myRow && mine && <p className="vs-mine">{mine.name}: <b>{money(myRow.price)}</b> ({myRow.price >= s.avg ? "above" : "below"} average by {money(Math.abs(myRow.price - s.avg))})</p>}
                <ul>
                  {s.rows.map((r, i) => (
                    <li key={r.h.id} className={String(r.h.id) === String(id) ? "mine" : ""} title={`Reported ${timeAgo(r.at)}`}>
                      <span className="hn">{r.h.name}
                        {i === 0 && s.rows.length > 1 && <em className="tag best">Best to sell</em>}
                        {i === s.rows.length - 1 && s.rows.length > 1 && <em className="tag low">Cheapest</em>}
                      </span>
                      <span className="bar" aria-hidden="true"><i style={{ width: `${max === min ? 100 : ((r.price - base) / (max - base)) * 100}%` }} /></span>
                      <b className="pv">{money(r.price)}</b>
                      <Trend price={r.price} prev={r.prev} />
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
