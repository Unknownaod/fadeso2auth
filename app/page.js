"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./globals.css";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.fades.lol"
).replace(/\/+$/, "");

const SITE_URL = "https://developer.fades.lol";

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "applications", label: "Applications", icon: "apps" },
  { id: "documentation", label: "Documentation", icon: "book" },
];

const SCOPES = [
  { id: "openid", label: "OpenID", description: "Authenticate users and receive ID tokens." },
  { id: "profile", label: "Profile", description: "Access permitted basic profile information." },
  { id: "email", label: "Email", description: "Access the user's email address." },
];

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
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
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

function getClientId(client) {
  return client?.clientId || client?.client_id || client?.id || "";
}

function getRedirectUris(client) {
  const value =
    client?.redirectUris ??
    client?.redirect_uris ??
    client?.redirectURI ??
    [];

  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

function getClientName(client) {
  return client?.name || client?.clientName || client?.client_name || "Untitled application";
}

function formatDate(value) {
  if (!value) return "Recently created";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently created";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function AppIcon({ name, index = 0 }) {
  const initials = (name || "F").trim().slice(0, 1).toUpperCase();

  return (
    <div className={`fd-app-icon fd-app-icon-${index % 5}`}>
      {initials || "F"}
    </div>
  );
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

export default function DeveloperPage() {
  const [section, setSection] = useState("overview");
  const [clients, setClients] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdClient, setCreatedClient] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    redirectUris: "",
  });

  const loadClients = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch(`${API_URL}/oauth/clients`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401 || response.status === 403) {
        setApiStatus("online");
        setClients([]);
        setError("Sign in to Fades first, then return here to manage your developer applications.");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || `Could not load applications (${response.status}).`);
      }

      if (data.success === false) {
        throw new Error(data.error || data.message || "The API could not load your applications.");
      }

      const list = Array.isArray(data)
        ? data
        : data.clients || data.applications || data.data || [];

      if (!Array.isArray(list)) {
        throw new Error("The API returned an unexpected applications response.");
      }

      setClients(list);
      setApiStatus("online");
    } catch (err) {
      setApiStatus("offline");
      setError(err.message || "Could not connect to the Fades API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter((client) => {
      const text = [
        getClientName(client),
        getClientId(client),
        ...getRedirectUris(client),
      ].join(" ").toLowerCase();

      return text.includes(normalized);
    });
  }, [clients, query]);

  async function createApplication(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim();
    const redirectUris = form.redirectUris
      .split(/\r?\n/)
      .map((uri) => uri.trim())
      .filter(Boolean);

    if (!name) {
      setError("Enter an application name.");
      return;
    }

    if (redirectUris.length === 0) {
      setError("Add at least one redirect URI.");
      return;
    }

    for (const uri of redirectUris) {
      try {
        const parsed = new URL(uri);
        const isLocal =
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1";

        if (
          !["https:", ...(isLocal ? ["http:"] : [])].includes(parsed.protocol) ||
          parsed.username ||
          parsed.password ||
          parsed.hash
        ) {
          throw new Error();
        }
      } catch {
        setError(`This redirect URI is invalid or insecure: ${uri}`);
        return;
      }
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/oauth/clients`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, redirectUris }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
          data.message ||
          `Application creation failed (${response.status}).`
        );
      }

      const created =
        data.client ||
        data.application ||
        data.data ||
        data;

      setCreatedClient(created);
      setShowSecret(Boolean(
        created.clientSecret ||
        created.client_secret ||
        created.secret
      ));
      setShowCreate(false);
      setForm({ name: "", redirectUris: "" });
      setNotice("Application created. Save any client secret now if one was issued.");

      await loadClients(true);
    } catch (err) {
      setError(err.message || "Could not create the application.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteApplication(client) {
    const id = getClientId(client);
    if (!id) {
      setError("This application has no usable client ID.");
      setConfirmDelete(null);
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/oauth/clients/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json" },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.message || "Could not delete this application.");
      }

      setClients((current) =>
        current.filter((item) => getClientId(item) !== id)
      );
      setNotice("Application deleted.");
    } catch (err) {
      setError(err.message || "Could not delete the application.");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function copyValue(value, label = "Value") {
    if (!value) {
      setError(`${label} is not available in the API response.`);
      return;
    }

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
    setForm({ name: "", redirectUris: "" });
    setShowCreate(true);
  }

  function goTo(id) {
    setSection(id);
    setMobileNav(false);
    setError("");
    setNotice("");
  }

  const discoveryUrl = `${API_URL}/.well-known/openid-configuration`;
  const totalRedirects = clients.reduce(
    (sum, client) => sum + getRedirectUris(client).length,
    0
  );

  return (
    <main className="fd-shell">
      <div className="fd-background" aria-hidden="true">
        <div className="fd-aurora" />
        <div className="fd-orb fd-orb-one" />
        <div className="fd-orb fd-orb-two" />
        <div className="fd-orb fd-orb-three" />
        <div className="fd-grid" />
      </div>

      <aside className={`fd-sidebar ${mobileNav ? "fd-sidebar-open" : ""}`}>
        <a className="fd-brand" href="https://fades.lol">
          <span className="fd-logo">
            <img src="/logo.png" alt="" onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement.classList.add("fd-logo-fallback");
            }} />
            <span className="fd-logo-letter">F</span>
          </span>
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
        <a className="fd-nav-item fd-nav-link" href={discoveryUrl} target="_blank" rel="noreferrer">
          <Icon name="globe" size={18} />
          <span>OIDC discovery</span>
          <Icon name="external" size={13} />
        </a>
        <a className="fd-nav-item fd-nav-link" href={`${API_URL}/oauth/jwks`} target="_blank" rel="noreferrer">
          <Icon name="key" size={18} />
          <span>Public JWKS</span>
          <Icon name="external" size={13} />
        </a>
        <a className="fd-nav-item fd-nav-link" href="https://fades.lol" target="_blank" rel="noreferrer">
          <Icon name="external" size={18} />
          <span>Fades website</span>
        </a>

        <div className="fd-sidebar-bottom">
          <div className="fd-api-status">
            <span className={`fd-status-dot ${apiStatus}`} />
            <span>
              <strong>Fades API</strong>
              <small>
                {apiStatus === "online"
                  ? "Connection available"
                  : apiStatus === "checking"
                    ? "Checking connection…"
                    : "Connection unavailable"}
              </small>
            </span>
            <button
              className="fd-mini-button"
              onClick={() => loadClients(true)}
              disabled={refreshing}
              title="Refresh API connection"
            >
              <Icon name="refresh" size={15} />
            </button>
          </div>
          <div className="fd-sidebar-footer">
            <span>Fades Developer</span>
            <span>•</span>
            <span>OAuth & OIDC</span>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="fd-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
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
              <strong>{NAVIGATION.find((item) => item.id === section)?.label || "Overview"}</strong>
            </div>
          </div>
          <div className="fd-topbar-right">
            <span className="fd-environment"><i /> Production API</span>
            <a className="fd-topbar-link" href="https://fades.lol" target="_blank" rel="noreferrer">
              Fades account <Icon name="external" size={14} />
            </a>
            <div className="fd-user-avatar">F</div>
          </div>
        </header>

        <div className="fd-content">
          {error && (
            <div className="fd-alert fd-alert-error" role="alert">
              <Icon name="warning" size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss"><Icon name="close" size={15} /></button>
            </div>
          )}

          {notice && (
            <div className="fd-alert fd-alert-success" role="status">
              <Icon name="check" size={18} />
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss"><Icon name="close" size={15} /></button>
            </div>
          )}

          {section === "overview" && (
            <>
              <div className="fd-welcome">
                <div>
                  <div className="fd-eyebrow"><span className="fd-eyebrow-dot" /> THE FADES DEVELOPER PLATFORM</div>
                  <h1>Build with <span>Fades.</span></h1>
                  <p>Connect your applications to Fades accounts with OAuth 2.0 and OpenID Connect.</p>
                  <div className="fd-welcome-actions">
                    <button className="fd-primary-button" onClick={openCreate}>
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
                  <div className="fd-hero-core">
                    <span>F</span>
                    <i />
                  </div>
                  <div className="fd-hero-node fd-node-one"><Icon name="key" size={18} /></div>
                  <div className="fd-hero-node fd-node-two"><Icon name="shield" size={18} /></div>
                  <div className="fd-hero-node fd-node-three"><Icon name="terminal" size={18} /></div>
                </div>
              </div>

              <div className="fd-stats-grid">
                <StatCard icon="apps" label="Applications" value={loading ? "—" : clients.length} detail="Registered to your account" />
                <StatCard icon="globe" label="Redirect URIs" value={loading ? "—" : totalRedirects} detail="Configured callback addresses" />
                <StatCard icon="shield" label="Authorization" value="OAuth 2.0" detail="Authorization Code + PKCE" />
                <StatCard icon="key" label="Identity" value="OpenID Connect" detail="RS256 ID tokens and JWKS" />
              </div>

              <div className="fd-section-heading">
                <div>
                  <h2>Your applications</h2>
                  <p>Manage the apps that connect to Fades.</p>
                </div>
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
                    <p>Create an application to get a client ID and configure your OAuth redirect URI.</p>
                    <button className="fd-primary-button" onClick={openCreate}><Icon name="plus" size={16} /> Create your first app</button>
                  </div>
                ) : (
                  <div className="fd-app-list">
                    {clients.slice(0, 4).map((client, index) => (
                      <ApplicationRow
                        key={getClientId(client) || index}
                        client={client}
                        index={index}
                        onCopy={copyValue}
                        onDelete={setConfirmDelete}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="fd-bottom-grid">
                <div className="fd-panel fd-quickstart">
                  <div className="fd-panel-heading">
                    <div>
                      <span className="fd-panel-kicker">GET STARTED</span>
                      <h3>Make your first request</h3>
                    </div>
                    <span className="fd-heading-icon"><Icon name="terminal" size={19} /></span>
                  </div>
                  <p>Start by reading the OpenID Connect discovery document to learn which endpoints your integration can use.</p>
                  <CodeSnippet>{`GET ${discoveryUrl}`}</CodeSnippet>
                  <a className="fd-inline-link" href={discoveryUrl} target="_blank" rel="noreferrer">
                    Open discovery document <Icon name="external" size={14} />
                  </a>
                </div>

                <div className="fd-panel fd-security-panel">
                  <div className="fd-panel-heading">
                    <div>
                      <span className="fd-panel-kicker">SECURITY FIRST</span>
                      <h3>Protect your integration</h3>
                    </div>
                    <span className="fd-heading-icon fd-heading-icon-blue"><Icon name="shield" size={19} /></span>
                  </div>
                  <ul className="fd-security-list">
                    <li><Icon name="check" size={15} /> Use PKCE with S256</li>
                    <li><Icon name="check" size={15} /> Register exact redirect URIs</li>
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

          {section === "applications" && (
            <>
              <div className="fd-page-heading">
                <div>
                  <div className="fd-eyebrow">YOUR WORKSPACE</div>
                  <h1>Applications<span>.</span></h1>
                  <p>Manage client credentials and callback URLs for your integrations.</p>
                </div>
                <button className="fd-primary-button" onClick={openCreate}>
                  <Icon name="plus" size={17} /> New application
                </button>
              </div>

              <div className="fd-toolbar-panel">
                <div className="fd-search-box">
                  <Icon name="search" size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applications…" />
                  {query && <button onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={14} /></button>}
                </div>
                <button className="fd-secondary-button fd-refresh-button" onClick={() => loadClients(true)} disabled={refreshing}>
                  <Icon name="refresh" size={15} /> {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              <div className="fd-panel fd-applications-panel">
                <div className="fd-table-header">
                  <span>APPLICATION</span>
                  <span>CLIENT ID</span>
                  <span>REDIRECT URIS</span>
                  <span>CREATED</span>
                  <span />
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
                      <ApplicationRow
                        key={getClientId(client) || index}
                        client={client}
                        index={index}
                        onCopy={copyValue}
                        onDelete={setConfirmDelete}
                        expanded
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="fd-note">
                <Icon name="lock" size={17} />
                <span><strong>Keep your credentials private.</strong> Client secrets should never be embedded in browser-side JavaScript or committed to a public repository.</span>
              </div>
            </>
          )}

          {section === "documentation" && (
            <>
              <div className="fd-page-heading">
                <div>
                  <div className="fd-eyebrow">DEVELOPER RESOURCES</div>
                  <h1>Documentation<span>.</span></h1>
                  <p>The essentials for adding Fades authentication to your application.</p>
                </div>
              </div>

              <div className="fd-docs-hero">
                <div className="fd-docs-hero-icon"><Icon name="shield" size={28} /></div>
                <div>
                  <span className="fd-panel-kicker">AUTHENTICATION</span>
                  <h2>One account. Your application.</h2>
                  <p>Use the authorization code flow with PKCE to let people sign in with Fades without sharing their password with your application.</p>
                </div>
              </div>

              <div className="fd-docs-grid">
                <DocCard number="01" title="Register an application" description="Create an app and register its exact callback URL before sending users through authorization." icon="apps">
                  <button className="fd-inline-link fd-button-link" onClick={() => { goTo("applications"); openCreate(); }}>
                    Create application <Icon name="arrow" size={14} />
                  </button>
                </DocCard>
                <DocCard number="02" title="Discover endpoints" description="Read the provider metadata instead of hardcoding endpoints that may change.">
                  <CodeSnippet>{`GET ${discoveryUrl}`}</CodeSnippet>
                  <a className="fd-inline-link" href={discoveryUrl} target="_blank" rel="noreferrer">View discovery <Icon name="external" size={14} /></a>
                </DocCard>
                <DocCard number="03" title="Authorize with PKCE" description="Generate a verifier and S256 challenge, redirect the user, then exchange the one-time code on the token endpoint.">
                  <CodeSnippet>{`response_type=code\ncode_challenge_method=S256\nscope=openid profile email`}</CodeSnippet>
                </DocCard>
                <DocCard number="04" title="Validate ID tokens" description="Verify the RS256 signature using the public keys from JWKS, then validate issuer, audience, expiry and nonce when supplied.">
                  <CodeSnippet>{`GET ${API_URL}/oauth/jwks`}</CodeSnippet>
                  <a className="fd-inline-link" href={`${API_URL}/oauth/jwks`} target="_blank" rel="noreferrer">View JWKS <Icon name="external" size={14} /></a>
                </DocCard>
              </div>

              <div className="fd-section-heading">
                <div><h2>Provider endpoints</h2><p>Configured API addresses for your Fades integration.</p></div>
              </div>
              <div className="fd-panel fd-endpoints">
                {[
                  ["Discovery", discoveryUrl, "GET"],
                  ["Authorization", `${API_URL}/oauth/authorize`, "GET"],
                  ["Token", `${API_URL}/oauth/token`, "POST"],
                  ["UserInfo", `${API_URL}/oauth/userinfo`, "GET"],
                  ["JWKS", `${API_URL}/oauth/jwks`, "GET"],
                  ["Revocation", `${API_URL}/oauth/revoke`, "POST"],
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
                    <code>{scope.id}</code>
                    <h3>{scope.label}</h3>
                    <p>{scope.description}</p>
                  </div>
                ))}
              </div>

              <div className="fd-note fd-note-warning">
                <Icon name="warning" size={18} />
                <span><strong>Before production use:</strong> confirm these endpoints and discovery metadata are implemented by your API, and test token signatures, issuer/audience validation, redirect URI matching, PKCE, and refresh-token rotation. This portal does not replace server-side token validation.</span>
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

      {showCreate && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowCreate(false);
        }}>
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
            <form className="fd-create-form" onSubmit={createApplication}>
              <label>
                <span>Application name</span>
                <input
                  autoFocus
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="e.g. My awesome app"
                  required
                />
              </label>
              <label>
                <span>Redirect URIs</span>
                <textarea
                  value={form.redirectUris}
                  onChange={(event) => setForm((current) => ({ ...current, redirectUris: event.target.value }))}
                  placeholder={"https://example.com/auth/callback\nhttp://localhost:3000/auth/callback"}
                  rows={4}
                  required
                />
                <small>One URI per line. HTTPS is required except for localhost development. These must match exactly during authorization.</small>
              </label>
              <div className="fd-form-security">
                <Icon name="shield" size={17} />
                <span>Never use a wildcard redirect URI. Keep client secrets on your backend.</span>
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

      {createdClient && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCreatedClient(null);
        }}>
          <section className="fd-modal fd-created-modal" role="dialog" aria-modal="true" aria-labelledby="fd-created-title">
            <div className="fd-created-check"><Icon name="check" size={27} /></div>
            <h2 id="fd-created-title">Application created</h2>
            <p className="fd-created-subtitle">Your application has been registered with Fades.</p>
            <div className="fd-credential-field">
              <label>Application name</label>
              <div className="fd-credential-value">
                <span>{getClientName(createdClient)}</span>
              </div>
            </div>
            <CredentialField
              label="Client ID"
              value={getClientId(createdClient)}
              onCopy={copyValue}
            />
            {(
              createdClient.clientSecret ||
              createdClient.client_secret ||
              createdClient.secret
            ) && (
              <CredentialField
                label="Client secret"
                value={
                  createdClient.clientSecret ||
                  createdClient.client_secret ||
                  createdClient.secret
                }
                secret={!showSecret}
                onReveal={() => setShowSecret((value) => !value)}
                onCopy={copyValue}
              />
            )}
            <div className="fd-form-security">
              <Icon name="lock" size={17} />
              <span>If a client secret was issued, copy it now and store it securely. Never expose it in frontend code.</span>
            </div>
            <div className="fd-modal-actions">
              <button className="fd-secondary-button" onClick={() => setCreatedClient(null)}>Close</button>
              <button className="fd-primary-button" onClick={() => {
                setCreatedClient(null);
                setSection("applications");
              }}>View applications <Icon name="arrow" size={15} /></button>
            </div>
          </section>
        </div>
      )}

      {confirmDelete && (
        <div className="fd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setConfirmDelete(null);
        }}>
          <section className="fd-modal fd-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="fd-delete-title">
            <div className="fd-delete-icon"><Icon name="trash" size={23} /></div>
            <h2 id="fd-delete-title">Delete this application?</h2>
            <p>Delete <strong>{getClientName(confirmDelete)}</strong>? Integrations using this client may stop working. This action cannot be undone.</p>
            <div className="fd-modal-actions">
              <button className="fd-secondary-button" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="fd-danger-button" onClick={() => deleteApplication(confirmDelete)}>Delete application</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ApplicationRow({ client, index, onCopy, onDelete, expanded = false }) {
  const id = getClientId(client);
  const name = getClientName(client);
  const redirects = getRedirectUris(client);
  const createdAt = client.createdAt || client.created_at || client.created || client.createdAtMs;

  return (
    <div className={`fd-app-row ${expanded ? "fd-app-row-expanded" : ""}`}>
      <div className="fd-app-identity">
        <AppIcon name={name} index={index} />
        <div className="fd-app-identity-copy">
          <strong>{name}</strong>
          <span>{redirects.length} redirect {redirects.length === 1 ? "URI" : "URIs"}</span>
        </div>
      </div>
      <div className="fd-app-client-id">
        <code title={id}>{id || "Not provided"}</code>
        <button className="fd-icon-button" onClick={() => onCopy(id, "Client ID")} title="Copy client ID" aria-label="Copy client ID"><Icon name="copy" size={14} /></button>
      </div>
      <div className="fd-app-redirects">
        {redirects.length ? (
          <>
            <code title={redirects[0]}>{redirects[0]}</code>
            {redirects.length > 1 && <span className="fd-more-uris">+{redirects.length - 1} more</span>}
          </>
        ) : <span className="fd-muted">No redirect URIs returned</span>}
      </div>
      <div className="fd-app-date">{formatDate(createdAt)}</div>
      <div className="fd-app-actions">
        <button className="fd-icon-button" onClick={() => onDelete(client)} title="Delete application" aria-label={`Delete ${name}`}><Icon name="trash" size={15} /></button>
      </div>
      {expanded && (
        <div className="fd-app-expanded-details">
          <div className="fd-expanded-label">Registered redirect URIs</div>
          {redirects.length ? redirects.map((uri) => (
            <div className="fd-redirect-item" key={uri}>
              <code>{uri}</code>
              <button className="fd-icon-button" onClick={() => onCopy(uri, "Redirect URI")} aria-label="Copy redirect URI"><Icon name="copy" size={14} /></button>
            </div>
          )) : <span className="fd-muted">No redirect URIs available.</span>}
        </div>
      )}
    </div>
  );
}

function CredentialField({ label, value, secret = false, onReveal, onCopy }) {
  const displayed = secret ? "••••••••••••••••••••••••" : value;

  return (
    <div className="fd-credential-field">
      <label>{label}</label>
      <div className="fd-credential-value">
        <code>{displayed || "Not returned by API"}</code>
        {secret && onReveal && (
          <button className="fd-icon-button" onClick={onReveal} title="Reveal client secret" aria-label="Reveal client secret">
            <Icon name="user" size={15} />
          </button>
        )}
        <button className="fd-icon-button" onClick={() => onCopy(value, label)} title={`Copy ${label}`} aria-label={`Copy ${label}`}>
          <Icon name="copy" size={15} />
        </button>
      </div>
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
