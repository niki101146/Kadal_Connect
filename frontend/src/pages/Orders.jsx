import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { Empty, Icon, PageHead, Skeleton, Stat, money, timeAgo } from "../components.jsx";

const TABS = [["ALL", "All"], ["PENDING", "Pending"], ["ACCEPTED", "Accepted"], ["REJECTED", "Declined"]];
const STEPS = ["Requested", "Seller review", "Pickup"];

function Steps({ status }) {
  const at = status === "PENDING" ? 1 : status === "ACCEPTED" ? 3 : 1;
  return (
    <ol className={`steps ${status === "REJECTED" ? "rejected" : ""}`} aria-label="Order progress">
      {STEPS.map((s, i) => <li key={s} className={i < at ? "done" : i === at ? "now" : ""}><i>{i < at ? <Icon name="check" size={12} /> : i + 1}</i>{status === "REJECTED" && i === 1 ? "Declined" : s}</li>)}
    </ol>
  );
}

export default function Orders() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState("ALL");
  const od = useApi("/orders/", { skip: !user, asList: true });
  if (!ready) return <Skeleton />;
  if (!user) return <Navigate to="/login" />;
  const respond = (id, accept) => api(`/orders/${id}/respond/`, { method: "POST", body: { accept } }).then(od.reload);
  const all = od.data || [];
  const count = (s) => all.filter((o) => o.status === s).length;
  const shown = all.filter((o) => tab === "ALL" || o.status === tab);
  const worth = all.filter((o) => o.status === "ACCEPTED").reduce((t, o) => t + o.quantity_kg * o.listing_info.price_per_kg, 0);

  return (
    <>
      <PageHead eyebrow="Orders" title="Your orders" sub={user.role === "FISHERMAN" ? "Requests from buyers for your catch." : "Your requests to fishermen."} />
      <div className="stats">
        <Stat icon="bag" label="Total" value={all.length} />
        <Stat icon="clock" label="Pending" value={count("PENDING")} tone={count("PENDING") ? "warn" : ""} />
        <Stat icon="check" label="Accepted" value={count("ACCEPTED")} tone="up" />
        <Stat icon="tag" label="Accepted value" value={money(worth)} />
      </div>
      <div className="chips">{TABS.map(([k, label]) => <button key={k} className={`chipbtn ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{label}{k !== "ALL" && ` (${count(k)})`}</button>)}</div>
      {od.loading ? <Skeleton h={120} /> : shown.length === 0 ? (
        <Empty icon="bag" title="No orders here">{user.role === "BUYER" ? <>Find fish you like in <Link to="/catch">Fresh catch</Link>.</> : "New requests will appear here."}</Empty>
      ) : (
        <div className="list">
          {shown.map((o) => {
            const iAmSeller = o.listing_info.seller === user.id;
            const phone = iAmSeller ? o.buyer_phone : o.seller_phone;
            return (
              <article key={o.id} className="card order">
                <header><div><h3>{o.listing_info.species_name} · {Number(o.quantity_kg)} kg</h3><p className="muted">{o.listing_info.harbor_name} · {money(o.listing_info.price_per_kg)}/kg · {timeAgo(o.created_at)}</p></div>
                  <div className="order-total"><b>{money(o.quantity_kg * o.listing_info.price_per_kg)}</b><span className={`status ${o.status.toLowerCase()}`}>{o.status === "REJECTED" ? "Declined" : o.status[0] + o.status.slice(1).toLowerCase()}</span></div></header>
                <Steps status={o.status} />
                <div className="party">
                  {iAmSeller ? (
                    <>
                      <p><Icon name="user" size={15} /> <b>{o.buyer_name || "Buyer"}</b>{o.buyer_town && <span className="muted"> · {o.buyer_town}</span>}</p>
                      {o.note && <p className="quote">“{o.note}”</p>}
                      {o.status === "ACCEPTED"
                        ? <p><Icon name="pin" size={15} /> Deliver to: <b>{o.buyer_address || "No address given"}</b></p>
                        : <p className="muted small-note">Phone and full address are shown once you accept.</p>}
                    </>
                  ) : (
                    <>
                      <p><Icon name="user" size={15} /> Seller: <b>{o.listing_info.seller_name}</b><span className="muted"> · {o.listing_info.harbor_name} harbor</span></p>
                      {o.delivery_address && <p className="muted small-note"><Icon name="pin" size={14} /> Your address: {o.delivery_address}</p>}
                    </>
                  )}
                </div>
                {iAmSeller && o.status === "PENDING" && (
                  <div className="row actions"><button className="btn" onClick={() => respond(o.id, true)}>Accept</button><button className="btn ghost" onClick={() => respond(o.id, false)}>Decline</button></div>
                )}
                {o.status === "ACCEPTED" && (phone ? <a className="btn ghost call" href={`tel:${phone}`}><Icon name="phone" size={18} /> Call {phone}</a> : <p className="muted">No phone number was added to the account.</p>)}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
