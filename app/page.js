"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./globals.css";

/* =========================================================
   CONFIG — mirrors the API router (routes/oauth.js)
   ========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.fades.lol"
).replace(/\/+$/, "");

const OAUTH_URL = `${API_URL}/oauth`;
// The API serves discovery under /oauth/.well-known/…
const DISCOVERY_URL = `${OAUTH_URL}/.well-known/openid-configuration`;
const JWKS_URL = `${OAUTH_URL}/jwks`;

const LIMITS = { apps: 20, redirectUris: 10, nameLength: 60 };

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "applications", label: "Applications", icon: "apps" },
  { id: "documentation", label: "Documentation", icon: "book" },
  { id: "account", label: "Account", icon: "user" },
];

const SCOPES = [
  { id: "openid", label: "OpenID", description: "Authenticate users and receive ID tokens. Required for UserInfo." },
  { id: "profile", label: "Profile", description: "Display name, username and avatar." },
  { id: "email", label: "Email", description: "Email address and verification status." },
];

const LIFETIMES = [
  { id: "60 seconds", label: "Authorization code", description: "Single use. Exchange it immediately with your PKCE verifier." },
  { id: "1 hour", label: "Access token", description: "Bearer token for the UserInfo endpoint." },
  { id: "30 days", label: "Refresh token", description: "Rotated on every use. The previous token stops working." },
  { id: "5 minutes", label: "ID token", description: "RS256 JWT issued only with the authorization code exchange." },
];

/* =========================================================
   ICONS
   ========================================================= */

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    apps: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h7M8 10h7" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 2 2-2 2 2 2-3 3-2-2-3 3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>,
    terminal: <><path d="m4 6 6 6-6 6M12 18h8" /></>,
    warning: <><path d="M12 3 2.8 19h18.4z" /><path d="M12 9v4M12 16h.01" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 17 5l3 2M4 17l3 2a7 7 0 0 0 11.5-4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    logout: <><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M9 12h11" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grid}
    </svg>
  );
}

/* =========================================================
   API HELPERS
   ========================================================= */

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    ok: response.ok && data.success !== false,
    data,
  };
}

function errorOf(result, fallback) {
  const value = result?.data?.error || result?.data?.message;
  return typeof value === "string" && value ? value : fallback;
}

// /auth/me may return the user directly or wrapped.
function pickUser(data) {
  const user = data?.user || data?.account || data;
  if (!user || typeof user !== "object") return null;
  if (!(user.id || user.username || user.email)) return null;
  return user;
}

function userLabel(user) {
  return user?.displayName || user?.username || user?.email || "Account";
}

function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function validateRedirectUri(uri) {
  try {
    const parsed = new URL(uri);
    const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    const okProtocol =
      parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocal);
    return okProtocol && !parsed.username && !parsed.password && !parsed.hash;
  } catch {
    return false;
  }
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Background() {
  return (
    <div className="fd-background" aria-hidden="true">
      <div className="fd-aurora" />
      <div className="fd-orb fd-orb-one" />
      <div className="fd-orb fd-orb-two" />
      <div className="fd-orb fd-orb-three" />
      <div className="fd-grid" />
    </div>
  );
}

function Logo() {
  return (
    <span className="fd-logo">
      <img
        src="/logo.png"
        alt=""
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.parentElement.classList.add("fd-logo-fallback");
        }}
      />
      <span className="fd-logo-letter">F</span>
    </span>
  );
}

function Avatar({ user, size = 32, className = "" }) {
  const [broken, setBroken] = useState(false);
  const initial = userLabel(user).trim().slice(0, 1).toUpperCase() || "F";

  return (
    <div
      className={`fd-user-avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
    >
      {user?.avatar && !broken ? (
        <img src={user.avatar} alt="" onError={() => setBroken(true)} />
      ) : (
        initial
      )}
    </div>
  );
}

function AppIcon({ name, index = 0 }) {
  const initial = (name || "F").trim().slice(0, 1).toUpperCase();
  return <div className={`fd-app-icon fd-app-icon-${index % 5}`}>{initial || "F"}</div>;
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="fd-stat-card">
      <div className="fd-stat-top">
        <span className="fd-stat-icon"><Icon name={icon} size={18} /></span>
        <span className="fd-stat-label">{label}</span>
      </div>
      <div className="fd-stat-value">{value}</div>
      <div className="fd-stat-detail">{detail}</div>
    </div>
  );
}

function CodeSnippet({ children }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fd-code-snippet">
      <code>{children}</code>
      <button className="fd-icon-button" onClick={copyCode} title="Copy code" aria-label="Copy code">
        <Icon name={copied ? "check" : "copy"} size={15} />
      </button>
    </div>
  );
}

function DocCard({ number, title, description, icon = "terminal", children }) {
  return (
    <article className="fd-doc-card">
      <div className="fd-doc-card-top">
        <span className="fd-doc-number">{number}</span>
        <span className="fd-doc-card-icon"><Icon name={icon} size={19} /></span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children && <div className="fd-doc-card-footer">{children}</div>}
    </article>
  );
}

function CredentialField({ label, value, secret = false, onReveal, onCopy }) {
  const displayed = secret ? "••••••••••••••••••••••••" : value;

  return (
    <div className="fd-credential-field">
      <label>{label}</label>
      <div className="fd-credential-value">
        <code>{displayed || "Not returned by API"}</code>
        {onReveal && (
          <button
            className="fd-icon-button"
            onClick={onReveal}
            title={secret ? "Reveal" : "Hide"}
            aria-label={secret ? `Reveal ${label}` : `Hide ${label}`}
          >
            <Icon name={secret ? "eye" : "eyeOff"} size={15} />
          </button>
        )}
        <button className="fd-icon-button" onClick={() => onCopy(value, label)} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
          <Icon name="copy" size={15} />
        </button>
      </div>
    </div>
  );
}

function ApplicationRow({ client, index, onCopy, onDelete, expanded = false }) {
  const redirects = Array.isArray(client.redirectUris) ? client.redirectUris : [];

  return (
    <div className={`fd-app-row ${expanded ? "fd-app-row-expanded" : ""}`}>
      <div className="fd-app-identity">
        <AppIcon name={client.name} index={index} />
        <div className="fd-app-identity-copy">
          <strong>
            {client.name || "Untitled application"}
            <span className={`fd-badge ${client.public ? "fd-badge-blue" : ""}`}>
              {client.public ? "Public" : "Confidential"}
            </span>
          </strong>
          <span>{redirects.length} redirect {redirects.length === 1 ? "URI" : "URIs"}</span>
        </div>
      </div>
      <div className="fd-app-client-id">
        <code title={client.id}>{client.id}</code>
        <button className="fd-icon-button" onClick={() => onCopy(client.id, "Client ID")} title="Copy client ID" aria-label="Copy client ID"><Icon name="copy" size={14} /></button>
      </div>
      <div className="fd-app-redirects">
        {redirects.length ? (
          <>
            <code title={redirects[0]}>{redirects[0]}</code>
            {redirects.length > 1 && <span className="fd-more-uris">+{redirects.length - 1} more</span>}
          </>
        ) : <span className="fd-muted">No redirect URIs</span>}
      </div>
      <div className="fd-app-date">{formatDate(client.createdAt)}</div>
      <div className="fd-app-actions">
        <button className="fd-icon-button" onClick={() => onDelete({ type: "app", item: client })} title="Delete application" aria-label={`Delete ${client.name}`}><Icon name="trash" size={15} /></button>
      </div>
      {expanded && (
        <div className="fd-app-expanded-details">
          <div className="fd-expanded-label">Registered redirect URIs</div>
          {redirects.map((uri) => (
            <div className="fd-redirect-item" key={uri}>
              <code>{uri}</code>
              <button className="fd-icon-button" onClick={() => onCopy(uri, "Redirect URI")} aria-label="Copy redirect URI"><Icon name="copy" size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   AUTH SCREEN (shown when not signed in)
   ========================================================= */

function AuthScreen({ onAuthed, notice, initialError }) {
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [info, setInfo] = useState(notice || "");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    identifier: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  useEffect(() => { setError(initialError || ""); }, [initialError]);
  useEffect(() => { setInfo(notice || ""); }, [notice]);

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  function switchMode(next) {
    setMode(next);
    setError("");
    setInfo("");
    setShowPassword(false);
  }

  async function finish() {
    const me = await request("/auth/me");
    const user = me.ok ? pickUser(me.data) : null;

    if (!user) {
      throw new Error("Signed in, but the session cookie was not accepted. Check that the API allows credentials from this origin.");
    }

    onAuthed(user);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    let path;
    let body;

    if (mode === "signin") {
      const id = form.identifier.trim();
      if (!id || !form.password) {
        setError("Enter your username or email and your password.");
        return;
      }
      path = "/auth/login";
      // Sends the identifier as username, and as email when it looks like one.
      body = {
        username: id,
        identifier: id,
        ...(id.includes("@") ? { email: id } : {}),
        password: form.password,
      };
    } else {
      const username = form.username.trim();
      const email = form.email.trim();
      if (username.length < 3) return setError("Choose a username with at least 3 characters.");
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
      if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
      path = "/auth/signup";
      body = { username, email, password: form.password };
    }

    setBusy(true);

    try {
      const result = await request(path, { method: "POST", body });

      if (!result.ok) {
        throw new Error(errorOf(result, mode === "signin" ? "Sign in failed." : "Could not create your account."));
      }

      const direct = pickUser(result.data);
      if (direct && mode === "signin") {
        // Confirm the cookie actually works before entering the portal.
        await finish();
      } else {
        try {
          await finish();
        } catch (err) {
          if (mode === "signup") {
            setMode("signin");
            setForm((current) => ({ ...current, identifier: body.username, password: "", confirm: "" }));
            setInfo("Account created. Sign in to continue.");
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="fd-shell fd-auth-shell">
      <Background />

      <div className="fd-auth-wrap">
        <a className="fd-auth-brand" href="https://fades.lol">
          <Logo />
          <span className="fd-brand-copy">
            <strong>fades<span>.</span></strong>
            <small>DEVELOPER PLATFORM</small>
          </span>
        </a>

        <section className="fd-auth-card" aria-labelledby="fd-auth-title">
          <div className="fd-auth-tabs" role="tablist">
            <button role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")} type="button">Sign in</button>
            <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")} type="button">Create account</button>
          </div>

          <div className="fd-auth-title">
            <h1 id="fd-auth-title">{mode === "signin" ? "Welcome back" : "Create your Fades account"}</h1>
            <p>
              {mode === "signin"
                ? "Sign in with your Fades account to manage your developer applications."
                : "One Fades account for everything, including the developer platform."}
            </p>
          </div>

          {error && (
            <div className="fd-alert fd-alert-error" role="alert">
              <Icon name="warning" size={17} /><span>{error}</span>
            </div>
          )}
          {info && !error && (
            <div className="fd-alert fd-alert-success" role="status">
              <Icon name="check" size={17} /><span>{info}</span>
            </div>
          )}

          <form className="fd-create-form" onSubmit={submit} noValidate>
            {mode === "signin" ? (
              <label>
                <span>Username or email</span>
                <input autoFocus autoComplete="username" value={form.identifier} onChange={set("identifier")} placeholder="you@example.com" />
              </label>
            ) : (
              <>
                <label>
                  <span>Username</span>
                  <input autoFocus autoComplete="username" value={form.username} onChange={set("username")} placeholder="yourname" />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </label>
              </>
            )}

            <label>
              <span>Password</span>
              <div className="fd-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder={mode === "signin" ? "Your password" : "At least 8 characters"}
                />
                <button type="button" className="fd-icon-button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <label>
                <span>Confirm password</span>
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat your password" />
              </label>
            )}

            <button type="submit" className="fd-primary-button fd-auth-submit" disabled={busy}>
              {busy ? (
                <><span className="fd-button-spinner" /> {mode === "signin" ? "Signing in…" : "Creating account…"}</>
              ) : (
                <>{mode === "signin" ? "Sign in" : "Create account"} <Icon name="arrow" size={16} /></>
              )}
            </button>
          </form>

          <p className="fd-auth-switch">
            {mode === "signin" ? "New to Fades?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>

        <div className="fd-auth-foot">
          <Icon name="lock" size={14} /> Your session is stored in a secure cookie on {API_URL.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function DeveloperPage() {
  // undefined = checking session, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");

  const [section, setSection] = useState("overview");
  const [clients, setClients] = useState([]);
  const [grants, setGrants] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdClient, setCreatedClient] = useState(null);
  const [secretHidden, setSecretHidden] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: "app" | "grant", item }
  const [form, setForm] = useState({ name: "", redirectUris: "", isPublic: false });

  /* ---------- session ---------- */

  const expireSession = useCallback(() => {
    setUser(null);
    setClients([]);
    setGrants([]);
    setCreatedClient(null);
    setShowCreate(false);
    setConfirm(null);
    setAuthNotice("Your session expired. Sign in again to continue.");
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const result = await request("/auth/me");
      setApiStatus("online");
      setUser(result.ok ? pickUser(result.data) : null);
    } catch {
      setApiStatus("offline");
      setAuthError("Can't reach the Fades API. Check your connection and refresh.");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function signOut() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* the cookie is cleared server-side when reachable */
    }
    setUser(null);
    setClients([]);
    setGrants([]);
    setSection("overview");
    setAuthNotice("You've been signed out.");
    setAuthError("");
  }

  /* ---------- data ---------- */

  const loadClients = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await request("/oauth/clients");
      setApiStatus("online");

      if (result.status === 401) return expireSession();
      if (!result.ok) throw new Error(errorOf(result, `Could not load applications (${result.status}).`));

      const list = Array.isArray(result.data.clients) ? result.data.clients : [];
      setClients(list);
    } catch (err) {
      setApiStatus("offline");
      setError(err.message || "Could not connect to the Fades API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [expireSession]);

  const loadGrants = useCallback(async () => {
    setGrantsLoading(true);
    try {
      const result = await request("/oauth/grants");
      if (result.status === 401) return expireSession();
      if (!result.ok) throw new Error(errorOf(result, "Could not load connected apps."));
      setGrants(Array.isArray(result.data.apps) ? result.data.apps : []);
    } catch (err) {
      setError(err.message || "Could not load connected apps.");
    } finally {
      setGrantsLoading(false);
    }
  }, [expireSession]);

  useEffect(() => {
    if (user) {
      loadClients();
      loadGrants();
    }
  }, [user, loadClients, loadGrants]);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter((client) =>
      [client.name, client.id, ...(client.redirectUris || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [clients, query]);

  /* ---------- actions ---------- */

  async function createApplication(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim().slice(0, LIMITS.nameLength);
    const redirectUris = [
      ...new Set(
        form.redirectUris.split(/\r?\n/).map((uri) => uri.trim()).filter(Boolean)
      ),
    ];

    if (!name) return setError("Give your app a name.");
    if (clients.length >= LIMITS.apps) return setError(`You can have up to ${LIMITS.apps} apps.`);
    if (redirectUris.length === 0) return setError("Add at least one redirect URI.");
    if (redirectUris.length > LIMITS.redirectUris) return setError(`Add at most ${LIMITS.redirectUris} redirect URIs.`);

    const bad = redirectUris.find((uri) => !validateRedirectUri(uri));
    if (bad) return setError(`This redirect URI is invalid or insecure: ${bad}`);

    setCreating(true);

    try {
      const result = await request("/oauth/clients", {
        method: "POST",
        body: { name, redirectUris, public: form.isPublic },
      });

      if (result.status === 401) return expireSession();
      if (!result.ok) throw new Error(errorOf(result, `Application creation failed (${result.status}).`));

      // The API returns { clientId, clientSecret } — the secret is shown once.
      setCreatedClient({
        id: result.data.clientId,
        name,
        secret: result.data.clientSecret || null,
        public: form.isPublic,
      });
      setSecretHidden(true);
      setShowCreate(false);
      setForm({ name: "", redirectUris: "", isPublic: false });
      await loadClients(true);
    } catch (err) {
      setError(err.message || "Could not create the application.");
    } finally {
      setCreating(false);
    }
  }

  async function runConfirmed() {
    const current = confirm;
    if (!current) return;

    setError("");
    setNotice("");

    try {
      if (current.type === "app") {
        const id = current.item.id;
        const result = await request(`/oauth/clients/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (result.status === 401) return expireSession();
        if (!result.ok) throw new Error(errorOf(result, "Could not delete this application."));
        setClients((list) => list.filter((item) => item.id !== id));
        setNotice("Application deleted.");
      } else {
        const id = current.item.clientId;
        const result = await request(`/oauth/grants/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (result.status === 401) return expireSession();
        if (!result.ok) throw new Error(errorOf(result, "Could not disconnect this app."));
        setGrants((list) => list.filter((item) => item.clientId !== id));
        setNotice("App disconnected from your account.");
      }
    } catch (err) {
      setError(err.message || "That didn't work. Try again.");
    } finally {
      setConfirm(null);
    }
  }

  async function copyValue(value, label = "Value") {
    if (!value) return setError(`${label} is not available.`);

    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied to clipboard.`);
    } catch {
      setError("Clipboard access failed. Select and copy the value manually.");
    }
  }

  function openCreate() {
    setError("");
    setNotice("");
    setForm({ name: "", redirectUris: "", isPublic: false });
    setShowCreate(true);
  }

  function goTo(id) {
    setSection(id);
    setMobileNav(false);
    setError("");
    setNotice("");
  }

  /* ---------- gates ---------- */

  if (user === undefined) {
    return (
      <main className="fd-shell fd-auth-shell">
        <Background />
        <div className="fd-splash"><span className="fd-spinner" /> Checking your session…</div>
      </main>
    );
  }

  if (user === null) {
    return (
      <AuthScreen
        notice={authNotice}
        initialError={authError}
        onAuthed={(next) => {
          setAuthNotice("");
          setAuthError("");
          setApiStatus("online");
          setLoading(true);
          setUser(next);
        }}
      />
    );
  }

  /* ---------- signed in ---------- */

  const totalRedirects = clients.reduce((sum, c) => sum + (c.redirectUris?.length || 0), 0);
  const atLimit = clients.length >= LIMITS.apps;

  return (
    <main className="fd-shell">
      <Background />

      <aside className={`fd-sidebar ${mobileNav ? "fd-sidebar-open" : ""}`}>
        <a className="fd-brand" href="https://fades.lol">
          <Logo />
          <span className="fd-brand-copy">
            <strong>fades<span>.</span></strong>
            <small>DEVELOPER PLATFORM</small>
          </span>
        </a>

        <div className="fd-workspace-label">WORKSPACE</div>
        <nav className="fd-nav" aria-label="Main navigation">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              className={`fd-nav-item ${section === item.id ? "active" : ""}`}
              onClick={() => goTo(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.id === "applications" && clients.length > 0 && (
                <span className="fd-nav-count">{clients.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="fd-sidebar-divider" />

        <div className="fd-workspace-label">DEVELOPER RESOURCES</div>
        <a className="fd-nav-item fd-nav-link" href={DISCOVERY_URL} target="_blank" rel="noreferrer">
          <Icon name="globe" size={18} /><span>OIDC discovery</span><Icon name="external" size={13} />
        </a>
        <a className="fd-nav-item fd-nav-link" href={JWKS_URL} target="_blank" rel="noreferrer">
          <Icon name="key" size={18} /><span>Public JWKS</span><Icon name="external" size={13} />
        </a>
        <a className="fd-nav-item fd-nav-link" href="https://fades.lol" target="_blank" rel="noreferrer">
          <Icon name="external" size={18} /><span>Fades website</span>
        </a>

        <div className="fd-sidebar-bottom">
          <div className="fd-sidebar-user">
            <Avatar user={user} size={34} />
            <span>
              <strong>{userLabel(user)}</strong>
              <small>{user.email || (user.username ? `@${user.username}` : "Signed in")}</small>
            </span>
            <button className="fd-mini-button" onClick={signOut} title="Sign out" aria-label="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>

          <div className="fd-api-status">
            <span className={`fd-status-dot ${apiStatus}`} />
            <span>
              <strong>Fades API</strong>
              <small>
                {apiStatus === "online" ? "Connected" : apiStatus === "checking" ? "Checking…" : "Connection unavailable"}
              </small>
            </span>
            <button className="fd-mini-button" onClick={() => { loadClients(true); loadGrants(); }} disabled={refreshing} title="Refresh" aria-label="Refresh">
              <Icon name="refresh" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button className="fd-mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNav(false)} />
      )}

      <section className="fd-main">
        <header className="fd-topbar">
          <div className="fd-topbar-left">
            <button className="fd-mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">
              <Icon name="menu" size={20} />
            </button>
            <div className="fd-breadcrumb">
              <span>Developer</span>
              <span className="fd-breadcrumb-slash">/</span>
              <strong>{NAVIGATION.find((item) => item.id === section)?.label}</strong>
            </div>
          </div>
          <div className="fd-topbar-right">
            <span className="fd-environment"><i /> Production API</span>
            <button className="fd-topbar-account" onClick={() => goTo("account")} aria-label="Open account">
              <span className="fd-topbar-name">{userLabel(user)}</span>
              <Avatar user={user} size={32} />
            </button>
          </div>
        </header>

        <div className="fd-content">
          {error && (
            <div className="fd-alert fd-alert-error" role="alert">
              <Icon name="warning" size={18} /><span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss"><Icon name="close" size={15} /></button>
            </div>
          )}
          {notice && (
            <div className="fd-alert fd-alert-success" role="status">
              <Icon name="check" size={18} /><span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss"><Icon name="close" size={15} /></button>
            </div>
          )}

          {/* ================= OVERVIEW ================= */}
          {section === "overview" && (
            <>
              <div className="fd-welcome">
                <div>
                  <div className="fd-eyebrow"><span className="fd-eyebrow-dot" /> THE FADES DEVELOPER PLATFORM</div>
                  <h1>Build with <span>Fades.</span></h1>
                  <p>Welcome, {userLabel(user)}. Connect your applications to Fades accounts with OAuth 2.0 and OpenID Connect.</p>
                  <div className="fd-welcome-actions">
                    <button className="fd-primary-button" onClick={openCreate} disabled={atLimit}>
                      <Icon name="plus" size={17} /> Create application
                    </button>
                    <button className="fd-secondary-button" onClick={() => goTo("documentation")}>
                      Explore documentation <Icon name="arrow" size={16} />
                    </button>
                  </div>
                </div>
                <div className="fd-hero-art" aria-hidden="true">
                  <div className="fd-hero-orbit fd-orbit-one" />
                  <div className="fd-hero-orbit fd-orbit-two" />
                  <div className="fd-hero-orbit fd-orbit-three" />
                  <div className="fd-hero-core"><span>F</span><i /></div>
                  <div className="fd-hero-node fd-node-one"><Icon name="key" size={18} /></div>
                  <div className="fd-hero-node fd-node-two"><Icon name="shield" size={18} /></div>
                  <div className="fd-hero-node fd-node-three"><Icon name="terminal" size={18} /></div>
                </div>
              </div>

              <div className="fd-stats-grid">
                <StatCard icon="apps" label="Applications" value={loading ? "—" : `${clients.length} / ${LIMITS.apps}`} detail="Registered to your account" />
                <StatCard icon="globe" label="Redirect URIs" value={loading ? "—" : totalRedirects} detail="Configured callback addresses" />
                <StatCard icon="shield" label="Authorization" value="OAuth 2.0" detail="Authorization Code + PKCE (S256)" />
                <StatCard icon="key" label="Identity" value="OpenID Connect" detail="RS256 ID tokens and JWKS" />
              </div>

              <div className="fd-section-heading">
                <div><h2>Your applications</h2><p>Manage the apps that connect to Fades.</p></div>
                <button className="fd-text-button" onClick={() => goTo("applications")}>
                  View all <Icon name="arrow" size={15} />
                </button>
              </div>

              <div className="fd-panel">
                {loading ? (
                  <div className="fd-loading"><span className="fd-spinner" /> Loading applications…</div>
                ) : clients.length === 0 ? (
                  <div className="fd-empty-state">
                    <div className="fd-empty-icon"><Icon name="apps" size={25} /></div>
                    <h3>Your first integration starts here.</h3>
                    <p>Create an application to get a client ID and register your OAuth redirect URIs.</p>
                    <button className="fd-primary-button" onClick={openCreate}><Icon name="plus" size={16} /> Create your first app</button>
                  </div>
                ) : (
                  <div className="fd-app-list">
                    {clients.slice(0, 4).map((client, index) => (
                      <ApplicationRow key={client.id} client={client} index={index} onCopy={copyValue} onDelete={setConfirm} />
                    ))}
                  </div>
                )}
              </div>

              <div className="fd-bottom-grid">
                <div className="fd-panel fd-quickstart">
                  <div className="fd-panel-heading">
                    <div><span className="fd-panel-kicker">GET STARTED</span><h3>Make your first request</h3></div>
                    <span className="fd-heading-icon"><Icon name="terminal" size={19} /></span>
                  </div>
                  <p>Read the OpenID Connect discovery document to learn which endpoints your integration can use.</p>
                  <CodeSnippet>{`GET ${DISCOVERY_URL}`}</CodeSnippet>
                  <a className="fd-inline-link" href={DISCOVERY_URL} target="_blank" rel="noreferrer">
                    Open discovery document <Icon name="external" size={14} />
                  </a>
                </div>

                <div className="fd-panel fd-security-panel">
                  <div className="fd-panel-heading">
                    <div><span className="fd-panel-kicker">SECURITY FIRST</span><h3>Protect your integration</h3></div>
                    <span className="fd-heading-icon fd-heading-icon-blue"><Icon name="shield" size={19} /></span>
                  </div>
                  <ul className="fd-security-list">
                    <li><Icon name="check" size={15} /> PKCE with S256 is required for every app</li>
                    <li><Icon name="check" size={15} /> Redirect URIs must match exactly</li>
                    <li><Icon name="check" size={15} /> Keep confidential secrets on your server</li>
                    <li><Icon name="check" size={15} /> Validate ID tokens against the JWKS</li>
                  </ul>
                  <button className="fd-inline-link fd-button-link" onClick={() => goTo("documentation")}>
                    Read security guidance <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= APPLICATIONS ================= */}
          {section === "applications" && (
            <>
              <div className="fd-page-heading">
                <div>
                  <div className="fd-eyebrow">YOUR WORKSPACE</div>
                  <h1>Applications<span>.</span></h1>
                  <p>Manage client credentials and callback URLs for your integrations. {clients.length} of {LIMITS.apps} used.</p>
                </div>
                <button className="fd-primary-button" onClick={openCreate} disabled={atLimit}>
                  <Icon name="plus" size={17} /> New application
                </button>
              </div>

              <div className="fd-toolbar-panel">
                <div className="fd-search-box">
                  <Icon name="search" size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, client ID or redirect URI…" />
                  {query && <button onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={14} /></button>}
                </div>
                <button className="fd-secondary-button fd-refresh-button" onClick={() => loadClients(true)} disabled={refreshing}>
                  <Icon name="refresh" size={15} /> {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              <div className="fd-panel fd-applications-panel">
                <div className="fd-table-header">
                  <span>APPLICATION</span><span>CLIENT ID</span><span>REDIRECT URIS</span><span>CREATED</span><span />
                </div>
                {loading ? (
                  <div className="fd-loading"><span className="fd-spinner" /> Loading applications…</div>
                ) : filteredClients.length === 0 ? (
                  <div className="fd-empty-state fd-empty-compact">
                    <div className="fd-empty-icon"><Icon name="search" size={23} /></div>
                    <h3>{query ? "No matching applications" : "No applications yet"}</h3>
                    <p>{query ? "Try another search term." : "Create an application to begin integrating with Fades."}</p>
                    {!query && <button className="fd-primary-button" onClick={openCreate}><Icon name="plus" size={16} /> Create application</button>}
                  </div>
                ) : (
                  <div className="fd-app-list">
                    {filteredClients.map((client, index) => (
                      <ApplicationRow key={client.id} client={client} index={index} onCopy={copyValue} onDelete={setConfirm} expanded />
                    ))}
                  </div>
                )}
              </div>

              <div className="fd-note">
                <Icon name="lock" size={17} />
                <span><strong>Client secrets are shown once.</strong> Fades stores only a hash, so a lost secret can't be recovered. Delete the app and register a new one if you lose it.</span>
              </div>
            </>
          )}

          {/* ================= DOCUMENTATION ================= */}
          {section === "documentation" && (
            <>
              <div className="fd-page-heading">
                <div>
                  <div className="fd-eyebrow">DEVELOPER RESOURCES</div>
                  <h1>Documentation<span>.</span></h1>
                  <p>The essentials for adding Sign in with Fades to your application.</p>
                </div>
              </div>

              <div className="fd-docs-hero">
                <div className="fd-docs-hero-icon"><Icon name="shield" size={28} /></div>
                <div>
                  <span className="fd-panel-kicker">AUTHENTICATION</span>
                  <h2>One account. Your application.</h2>
                  <p>Use the authorization code flow with PKCE so people can sign in with Fades without sharing their password with your application.</p>
                </div>
              </div>

              <div className="fd-docs-grid">
                <DocCard number="01" title="Register an application" description="Create an app and register its exact callback URLs. Choose public for browser or mobile apps (no secret), or confidential for server apps." icon="apps">
                  <button className="fd-inline-link fd-button-link" onClick={() => { goTo("applications"); openCreate(); }}>
                    Create application <Icon name="arrow" size={14} />
                  </button>
                </DocCard>
                <DocCard number="02" title="Discover endpoints" description="Read the provider metadata instead of hardcoding endpoints.">
                  <CodeSnippet>{`GET ${DISCOVERY_URL}`}</CodeSnippet>
                </DocCard>
                <DocCard number="03" title="Send the user to authorize" description="Generate a random verifier, hash it with SHA-256 (base64url) for the challenge, and redirect. The verifier must be 43–128 characters." icon="link">
                  <CodeSnippet>{`GET ${OAUTH_URL}/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://example.com/callback
  &response_type=code
  &scope=openid profile email
  &state=RANDOM_STATE
  &nonce=RANDOM_NONCE
  &code_challenge=BASE64URL_SHA256(VERIFIER)
  &code_challenge_method=S256`}</CodeSnippet>
                </DocCard>
                <DocCard number="04" title="Exchange the code" description="Post the code within 60 seconds. Confidential apps authenticate with client_secret_post or HTTP Basic; public apps send only client_id.">
                  <CodeSnippet>{`POST ${OAUTH_URL}/token
grant_type=authorization_code
code=AUTH_CODE
redirect_uri=https://example.com/callback
code_verifier=VERIFIER
client_id=YOUR_CLIENT_ID
client_secret=YOUR_SECRET   # confidential only`}</CodeSnippet>
                </DocCard>
                <DocCard number="05" title="Validate ID tokens" description="Verify the RS256 signature with the JWKS, then check issuer, audience, expiry and your nonce." icon="shield">
                  <CodeSnippet>{`GET ${JWKS_URL}`}</CodeSnippet>
                  <a className="fd-inline-link" href={JWKS_URL} target="_blank" rel="noreferrer">View JWKS <Icon name="external" size={14} /></a>
                </DocCard>
                <DocCard number="06" title="Refresh and revoke" description="Refreshing rotates the refresh token and returns a new access token (no new ID token — call UserInfo). Revoke with client authentication.">
                  <CodeSnippet>{`POST ${OAUTH_URL}/token
grant_type=refresh_token
refresh_token=REFRESH_TOKEN

POST ${OAUTH_URL}/revoke
token=ACCESS_OR_REFRESH_TOKEN`}</CodeSnippet>
                </DocCard>
              </div>

              <div className="fd-section-heading">
                <div><h2>Provider endpoints</h2><p>Live addresses for your Fades integration.</p></div>
              </div>
              <div className="fd-panel fd-endpoints">
                {[
                  ["Discovery", DISCOVERY_URL, "GET"],
                  ["Authorization", `${OAUTH_URL}/authorize`, "GET"],
                  ["Token", `${OAUTH_URL}/token`, "POST"],
                  ["UserInfo", `${OAUTH_URL}/userinfo`, "GET"],
                  ["JWKS", JWKS_URL, "GET"],
                  ["Revocation", `${OAUTH_URL}/revoke`, "POST"],
                ].map(([label, url, method]) => (
                  <div className="fd-endpoint-row" key={label}>
                    <span className={`fd-method fd-method-${method.toLowerCase()}`}>{method}</span>
                    <span className="fd-endpoint-label">{label}</span>
                    <code>{url}</code>
                    <button className="fd-icon-button" onClick={() => copyValue(url, `${label} URL`)} aria-label={`Copy ${label} URL`}><Icon name="copy" size={15} /></button>
                  </div>
                ))}
              </div>

              <div className="fd-section-heading">
                <div><h2>Available scopes</h2><p>Request only the information your application actually needs.</p></div>
              </div>
              <div className="fd-scopes-grid">
                {SCOPES.map((scope) => (
                  <div className="fd-scope-card" key={scope.id}>
                    <code>{scope.id}</code><h3>{scope.label}</h3><p>{scope.description}</p>
                  </div>
                ))}
              </div>

              <div className="fd-section-heading">
                <div><h2>Token lifetimes</h2><p>How long each credential stays valid.</p></div>
              </div>
              <div className="fd-lifetimes-grid">
                {LIFETIMES.map((item) => (
                  <div className="fd-scope-card" key={item.label}>
                    <code>{item.id}</code><h3>{item.label}</h3><p>{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="fd-note">
                <Icon name="shield" size={18} />
                <span><strong>Always validate on your server.</strong> This portal doesn't replace server-side validation of token signatures, issuer, audience, expiry and nonce.</span>
              </div>
            </>
          )}

          {/* ================= ACCOUNT ================= */}
          {section === "account" && (
            <>
              <div className="fd-page-heading">
                <div>
                  <div className="fd-eyebrow">YOUR FADES ACCOUNT</div>
                  <h1>Account<span>.</span></h1>
                  <p>The Fades account you're signed in with, and the apps that can access it.</p>
                </div>
              </div>

              <div className="fd-panel fd-profile-card">
                <Avatar user={user} size={64} className="fd-profile-avatar" />
                <div className="fd-profile-copy">
                  <h2>{userLabel(user)}</h2>
                  <div className="fd-profile-meta">
                    {user.username && <span><Icon name="user" size={14} /> @{user.username}</span>}
                    {user.email && (
                      <span>
                        <Icon name="mail" size={14} /> {user.email}
                        {user.emailVerified === true && <em className="fd-badge fd-badge-green">Verified</em>}
                        {user.emailVerified === false && <em className="fd-badge">Unverified</em>}
                      </span>
                    )}
                  </div>
                </div>
                <button className="fd-secondary-button" onClick={signOut}>
                  <Icon name="logout" size={16} /> Sign out
                </button>
              </div>

              <div className="fd-section-heading">
                <div>
                  <h2>Connected apps</h2>
                  <p>Apps you've signed in to with Fades. Disconnecting revokes their access and refresh tokens.</p>
                </div>
                <button className="fd-text-button" onClick={loadGrants} disabled={grantsLoading}>
                  <Icon name="refresh" size={14} /> Refresh
                </button>
              </div>

              <div className="fd-panel">
                {grantsLoading && grants.length === 0 ? (
                  <div className="fd-loading"><span className="fd-spinner" /> Loading connected apps…</div>
                ) : grants.length === 0 ? (
                  <div className="fd-empty-state fd-empty-compact">
                    <div className="fd-empty-icon"><Icon name="link" size={23} /></div>
                    <h3>No connected apps</h3>
                    <p>When you sign in to an app with Fades, it will show up here so you can manage its access.</p>
                  </div>
                ) : (
                  <div className="fd-app-list">
                    {grants.map((grant, index) => (
                      <div className="fd-grant-row" key={grant.clientId}>
                        <div className="fd-app-identity">
                          <AppIcon name={grant.name} index={index} />
                          <div className="fd-app-identity-copy">
                            <strong>{grant.name}</strong>
                            <span>Connected {formatDate(grant.since)}</span>
                          </div>
                        </div>
                        <div className="fd-grant-scopes">
                          {(grant.scopes || []).map((scope) => <code key={scope}>{scope}</code>)}
                        </div>
                        <button className="fd-danger-button fd-danger-small" onClick={() => setConfirm({ type: "grant", item: grant })}>
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <footer className="fd-footer">
            <span>© {new Date().getFullYear()} Fades</span>
            <span className="fd-footer-links">
              <a href="https://fades.lol" target="_blank" rel="noreferrer">Fades</a>
              <a href="https://fades.lol" target="_blank" rel="noreferrer">Privacy</a>
              <a href="https://fades.lol" target="_blank" rel="noreferrer">Terms</a>
            </span>
            <span className="fd-footer-build"><i /> Developer Platform</span>
          </footer>
        </div>
      </section>

      {/* ---------- create application ---------- */}
      {showCreate && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
          <section className="fd-modal" role="dialog" aria-modal="true" aria-labelledby="fd-create-title">
            <div className="fd-modal-top">
              <div className="fd-modal-icon"><Icon name="apps" size={22} /></div>
              <button className="fd-icon-button" onClick={() => setShowCreate(false)} aria-label="Close dialog"><Icon name="close" size={18} /></button>
            </div>
            <div className="fd-modal-title">
              <span className="fd-panel-kicker">NEW INTEGRATION</span>
              <h2 id="fd-create-title">Create an application</h2>
              <p>Register an application that will use Fades for authentication.</p>
            </div>
            {error && (
              <div className="fd-alert fd-alert-error" role="alert">
                <Icon name="warning" size={17} /><span>{error}</span>
              </div>
            )}
            <form className="fd-create-form" onSubmit={createApplication}>
              <label>
                <span>Application name</span>
                <input autoFocus maxLength={LIMITS.nameLength} value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. My awesome app" required />
              </label>
              <label>
                <span>Redirect URIs</span>
                <textarea
                  value={form.redirectUris}
                  onChange={(e) => setForm((c) => ({ ...c, redirectUris: e.target.value }))}
                  placeholder={"https://example.com/auth/callback\nhttp://localhost:3000/auth/callback"}
                  rows={4}
                  required
                />
                <small>One per line, up to {LIMITS.redirectUris}. HTTPS is required except for localhost. These must match exactly during authorization.</small>
              </label>

              <div className="fd-client-type">
                <button type="button" className={!form.isPublic ? "active" : ""} onClick={() => setForm((c) => ({ ...c, isPublic: false }))}>
                  <Icon name="lock" size={16} />
                  <strong>Confidential</strong>
                  <small>Server-side app. Issued a client secret.</small>
                </button>
                <button type="button" className={form.isPublic ? "active" : ""} onClick={() => setForm((c) => ({ ...c, isPublic: true }))}>
                  <Icon name="globe" size={16} />
                  <strong>Public</strong>
                  <small>Browser or mobile app. No secret, PKCE only.</small>
                </button>
              </div>

              <div className="fd-modal-actions">
                <button type="button" className="fd-secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="fd-primary-button" disabled={creating}>
                  {creating ? <><span className="fd-button-spinner" /> Creating…</> : <><Icon name="plus" size={16} /> Create application</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ---------- created ---------- */}
      {createdClient && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreatedClient(null); }}>
          <section className="fd-modal fd-created-modal" role="dialog" aria-modal="true" aria-labelledby="fd-created-title">
            <div className="fd-created-check"><Icon name="check" size={27} /></div>
            <h2 id="fd-created-title">Application created</h2>
            <p className="fd-created-subtitle">{createdClient.name} has been registered with Fades.</p>

            <CredentialField label="Client ID" value={createdClient.id} onCopy={copyValue} />

            {createdClient.secret ? (
              <>
                <CredentialField
                  label="Client secret"
                  value={createdClient.secret}
                  secret={secretHidden}
                  onReveal={() => setSecretHidden((v) => !v)}
                  onCopy={copyValue}
                />
                <div className="fd-form-security fd-form-warning">
                  <Icon name="warning" size={17} />
                  <span><strong>This is the only time you'll see this secret.</strong> Copy it now and store it on your backend. Never put it in frontend code.</span>
                </div>
              </>
            ) : (
              <div className="fd-form-security">
                <Icon name="shield" size={17} />
                <span>This is a public client, so no secret was issued. Use PKCE with S256 for every authorization request.</span>
              </div>
            )}

            <div className="fd-modal-actions">
              <button className="fd-secondary-button" onClick={() => setCreatedClient(null)}>Close</button>
              <button className="fd-primary-button" onClick={() => { setCreatedClient(null); setSection("applications"); }}>
                View applications <Icon name="arrow" size={15} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ---------- confirm (delete app / disconnect grant) ---------- */}
      {confirm && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirm(null); }}>
          <section className="fd-modal fd-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="fd-delete-title">
            <div className="fd-delete-icon"><Icon name="trash" size={23} /></div>
            <h2 id="fd-delete-title">{confirm.type === "app" ? "Delete this application?" : "Disconnect this app?"}</h2>
            <p>
              {confirm.type === "app" ? (
                <>Delete <strong>{confirm.item.name}</strong>? Its client ID stops working and all tokens issued to it are revoked. This can't be undone.</>
              ) : (
                <>Disconnect <strong>{confirm.item.name}</strong> from your account? It will lose access immediately and need your approval to connect again.</>
              )}
            </p>
            <div className="fd-modal-actions">
              <button className="fd-secondary-button" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="fd-danger-button" onClick={runConfirmed}>
                {confirm.type === "app" ? "Delete application" : "Disconnect"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
