import { useMemo, useState } from "react";
import { useApi, useStored } from "../hooks.js";
import { useHarbor } from "../harbor.jsx";
import ListingCard from "../ListingCard.jsx";
import { Empty, Notice, SpeciesSelect, PageHead, Skeleton, Icon, Segmented, Stat, money } from "../components.jsx";

export default function Market() {
  const { harbors } = useHarbor();
  const sp = useApi("/species/", { asList: true });
  const [harbor, setHarbor] = useState("");
  const [species, setSpecies] = useState("");
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [fresh, setFresh] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [view, setView] = useStored("kadal_view", "grid");
  const [saved, setSaved] = useStored("kadal_saved", []);
  const qs = new URLSearchParams(Object.entries({ harbor, species }).filter(([, v]) => v)).toString();
  const ls = useApi(`/listings/?${qs}`, { asList: true });
  const toggle = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const items = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const a = [...(ls.data || [])].filter((l) =>
      `${l.species_name} ${l.harbor_name} ${l.seller_name || ""}`.toLowerCase().includes(search.toLowerCase()) &&
      (!maxPrice || +l.price_per_kg <= +maxPrice) && (!fresh || l.caught_on >= today) && (!onlySaved || saved.includes(l.id)));
    if (sort === "low") a.sort((x, y) => x.price_per_kg - y.price_per_kg);
    if (sort === "high") a.sort((x, y) => y.price_per_kg - x.price_per_kg);
    if (sort === "big") a.sort((x, y) => y.quantity_kg - x.quantity_kg);
    return a;
  }, [ls.data, sort, search, maxPrice, fresh, onlySaved, saved]);

  const all = ls.data || [];
  const totalKg = all.reduce((t, l) => t + Number(l.quantity_kg), 0);
  const avg = all.length ? all.reduce((t, l) => t + Number(l.price_per_kg), 0) / all.length : 0;
  const filtered = harbor || species || search || maxPrice || fresh || onlySaved;
  const clear = () => { setHarbor(""); setSpecies(""); setSearch(""); setMaxPrice(""); setFresh(false); setOnlySaved(false); };

  return (
    <>
      <PageHead eyebrow="Marketplace" title="Fresh catch from local fishermen" sub="Browse today's catch, compare per-kg prices and send a request directly to the seller." />
      <div className="stats">
        <Stat icon="fish" label="Listings" value={all.length} sub="available now" />
        <Stat icon="scale" label="Total available" value={`${Math.round(totalKg)} kg`} sub="across harbors" />
        <Stat icon="tag" label="Average price" value={avg ? money(avg) + "/kg" : "–"} sub="across listings" />
        <Stat icon="heart" label="Saved" value={saved.length} sub="your shortlist" />
      </div>
      <div className="toolbar">
        <label className="searchbox"><Icon name="search" size={18} /><span className="sr">Search</span><input type="search" placeholder="Search fish, harbor or seller" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <SpeciesSelect species={sp.data || []} value={species} onChange={(e) => setSpecies(e.target.value)} allLabel="All fish" aria-label="Filter by fish" />
        <select value={harbor} onChange={(e) => setHarbor(e.target.value)} aria-label="Filter by harbor"><option value="">All harbors</option>{harbors.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort listings">
          <option value="new">Recently added</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="big">Most quantity</option>
        </select>
        <input className="maxprice" type="number" min="0" placeholder="Max ₹/kg" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price per kg" />
        <Segmented label="Layout" value={view} onChange={setView} options={[["grid", "Grid"], ["list", "List"]]} />
      </div>
      <div className="chips" role="group" aria-label="Quick filters">
                <button className={`chipbtn toggle ${fresh ? "on" : ""}`} onClick={() => setFresh(!fresh)}>Caught today</button>
        <button className={`chipbtn toggle ${onlySaved ? "on" : ""}`} onClick={() => setOnlySaved(!onlySaved)}><Icon name="heart" size={14} /> Saved</button>
        {filtered && <button className="chipbtn clear" onClick={clear}>Clear filters</button>}
      </div>
      <p className="count">{items.length} {items.length === 1 ? "listing" : "listings"} found</p>
      <Notice kind="bad">{ls.error}</Notice>
      {ls.loading ? <Skeleton h={220} /> : items.length === 0 ?
        <Empty title="No matching catch found">Try another search or clear a filter. New catch is posted throughout the day.</Empty> :
        <div className={view === "list" ? "list-view" : "grid"}>{items.map((l) => <ListingCard key={l.id} l={l} view={view} saved={saved.includes(l.id)} onSave={toggle} />)}</div>}
    </>
  );
}
