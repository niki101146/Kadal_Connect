import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import { HarborProvider } from "./harbor.jsx";
import "./styles.css";

// Shows the real error on screen instead of a blank white page if any component crashes while rendering.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Kadal Connect crashed:", error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: "60px auto", padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <h2>Something went wrong on this page</h2>
        <p>Please reload. If it keeps happening, send this message to the developer:</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#fbeaea", padding: 12, borderRadius: 8 }}>{String(this.state.error?.stack || this.state.error)}</pre>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter><AuthProvider><HarborProvider><App /></HarborProvider></AuthProvider></BrowserRouter>
  </ErrorBoundary>
);