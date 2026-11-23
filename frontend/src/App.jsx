import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { HarborPicker, Icon } from "./components.jsx";
import Home from "./pages/Home.jsx";
import Sea from "./pages/Sea.jsx";
import Planner from "./pages/Planner.jsx";
import Safety from "./pages/Safety.jsx";
import Prices from "./pages/Prices.jsx";
import Market from "./pages/Market.jsx";
import Sell from "./pages/Sell.jsx";
import Orders from "./pages/Orders.jsx";
import Account from "./pages/Account.jsx";
import Auth from "./pages/Auth.jsx";
import Chatbot from "./Chatbot.jsx";

const Logo = () => <Link to="/" className="brand"><span className="brand-mark"><Icon name="anchor" size={20} /></span><span className="brand-words">Kadal Connect<small>Coastal community network</small></span></Link>;

export default function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [now, setNow] = useState(new Date());
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const [menu, setMenu] = useState(false);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    const esc = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [menu]);
  const tabs = user?.role === "FISHERMAN"
    ? [["/", "home", "Home"], ["/sea", "wave", "Sea"], ["/sell", "plus", "Sell"], ["/orders", "bag", "Orders"]]
    : [["/", "home", "Home"], ["/sea", "wave", "Sea"], ["/prices", "tag", "Prices"], ["/catch", "fish", "Catch"]];
  const items = [
    ["/", "home", "Home", true], ["/sea", "wave", "Sea forecast"], ["/planner", "route", "Trip planner"], ["/prices", "tag", "Prices"],
    ["/catch", "fish", "Marketplace"], ["/safety", "shield", "Safety"],
    ...(user?.role === "FISHERMAN" ? [["/sell", "plus", "Sell your catch"]] : []),
    ...(user ? [["/orders", "bag", "Orders"], ["/account", "user", "Account"]] : [["/login", "user", "Log in"], ["/register", "plus", "Create account"]]),
  ];
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <div className="utility">
        <div className="utility-in">
          <span>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="utility-sos"><Icon name="phone" size={14} /> Emergency <a href="tel:112">112</a> · Coast Guard <a href="tel:1554">1554</a></span>
        </div>
      </div>
      <header className="top">
        <div className="top-in">
          <Logo />
          <nav className="links" aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/sea">Sea forecast</NavLink>
            <NavLink to="/planner">Trip planner</NavLink>
            <NavLink to="/prices">Prices</NavLink>
            <NavLink to="/catch">Marketplace</NavLink>
            <NavLink to="/safety">Safety</NavLink>
            {user?.role === "FISHERMAN" && <NavLink to="/sell">Sell</NavLink>}
            {user && <NavLink to="/orders">Orders</NavLink>}
          </nav>
          <HarborPicker />
          <button type="button" className="menu-btn" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(!menu)}><Icon name={menu ? "x" : "menu"} size={24} /></button>
          {user ? <Link className="btn ghost sm hide-sm" to="/account">{user.first_name || user.username}</Link>
                : <Link className="btn sm hide-sm" to="/login">Log in</Link>}
        </div>
      </header>
      <div className={`drawer-backdrop ${menu ? "open" : ""}`} onClick={() => setMenu(false)} aria-hidden="true" />
      <nav id="mobile-menu" className={`drawer ${menu ? "open" : ""}`} aria-label="Menu" aria-hidden={!menu}>
        <div className="drawer-head"><b>Menu</b><button type="button" onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="x" size={20} /></button></div>
        <ul>
          {items.map(([to, icon, label, end]) => (
            <li key={to}><NavLink to={to} end={!!end} tabIndex={menu ? 0 : -1}><Icon name={icon} size={20} />{label}</NavLink></li>
          ))}
        </ul>
        <div className="drawer-sos"><Icon name="phone" size={15} /> Emergency <a href="tel:112">112</a> · Coast Guard <a href="tel:1554">1554</a></div>
      </nav>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sea" element={<Sea />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/catch" element={<Market />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="*" element={<p className="muted">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Logo /><p>Sea forecasts, fair prices and fresh catch for coastal communities.</p></div>
          <div className="footer-col"><b>Tools</b><Link to="/sea">Sea forecast</Link><Link to="/planner">Trip planner</Link><Link to="/prices">Harbor prices</Link></div>
          <div className="footer-col"><b>Marketplace</b><Link to="/catch">Fresh catch</Link><Link to="/register">Create account</Link><Link to="/orders">Orders</Link></div>
          <div className="footer-col"><b>Emergency</b><a href="tel:112">112 · Emergency</a><a href="tel:1554">1554 · Coast Guard</a><a href="tel:1077">1077 · Disaster control</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Kadal Connect</span><span>Forecasts are guidance only. Always follow official Coast Guard and Fisheries Department instructions.</span></div>
      </footer>
      <Chatbot />
      <nav className="tabs" aria-label="Quick navigation">
        {tabs.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === "/"}><Icon name={icon} size={21} /><span>{label}</span></NavLink>)}
        <button type="button" className={menu ? "on" : ""} onClick={() => setMenu(true)} aria-label="Open full menu"><Icon name="menu" size={21} /><span>More</span></button>
      </nav>
    </>
  );
}
