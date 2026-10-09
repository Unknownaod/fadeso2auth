"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api-fades.lol";

const HOME_URL = "fades://newtab";

const SEARCH_ENGINES = {
  google: {
    name: "Google",
    short: "G",
    url: "https://www.google.com/search?q=",
  },
  bing: {
    name: "Bing",
    short: "B",
    url: "https://www.bing.com/search?q=",
  },
  duckduckgo: {
    name: "DuckDuckGo",
    short: "D",
    url: "https://duckduckgo.com/?q=",
  },
  brave: {
    name: "Brave",
    short: "B",
    url: "https://search.brave.com/search?q=",
  },
};

const DEFAULT_BOOKMARKS = [
  {
    id: "fades",
    title: "Fades",
    url: "https://fades.lol",
  },
  {
    id: "mail",
    title: "Fades Mail",
    url: "https://mail.fades.lol",
  },
];

function getStoredSearchEngine() {
  if (typeof window === "undefined") return "google";

  return (
    localStorage.getItem("fades.searchEngine") ||
    "google"
  );
}

function looksLikeUrl(value) {
  const input = value.trim();

  if (!input) return false;

  if (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("fades://") ||
    input.startsWith("about:")
  ) {
    return true;
  }

  if (
    input.includes(".") &&
    !input.includes(" ")
  ) {
    return true;
  }

  return false;
}

function makeNavigationUrl(value, searchEngine) {
  const input = value.trim();

  if (!input) return HOME_URL;

  if (
    input.startsWith("http://") ||
    input.startsWith("https://") ||
    input.startsWith("fades://") ||
    input.startsWith("about:")
  ) {
    return input;
  }

  if (looksLikeUrl(input)) {
    return `https://${input}`;
  }

  const engine =
    SEARCH_ENGINES[searchEngine] ||
    SEARCH_ENGINES.google;

  return `${engine.url}${encodeURIComponent(input)}`;
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function getPageTitle(url) {
  if (url === HOME_URL) return "New Tab";

  const hostname = getHostname(url);

  if (!hostname) return "New Tab";

  return hostname.replace(/^www\./, "");
}

function Favicon({ url, size = 16 }) {
  const [failed, setFailed] = useState(false);

  if (
    failed ||
    !url ||
    url.startsWith("fades://")
  ) {
    return (
      <span
        className="faviconFallback"
        style={{
          width: size,
          height: size,
        }}
      >
        F
      </span>
    );
  }

  const hostname = getHostname(url);

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        hostname
      )}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="favicon"
      onError={() => setFailed(true)}
    />
  );
}

function Icon({ name, size = 18 }) {
  const icons = {
    back: (
      <>
        <path d="M15 6l-6 6 6 6" />
        <path d="M9 12h10" />
      </>
    ),

    forward: (
      <>
        <path d="M9 6l6 6-6 6" />
        <path d="M15 12H5" />
      </>
    ),

    reload: (
      <>
        <path d="M20 11a8 8 0 0 0-14.9-3" />
        <path d="M5 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.9 3" />
        <path d="M19 20v-4h-4" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="M16 16l4 4" />
      </>
    ),

    star: (
      <path d="M12 3.5l2.65 5.38 5.94.86-4.3 4.2 1.01 5.92L12 17.07l-5.3 2.79 1.01-5.92-4.3-4.2 5.94-.86L12 3.5z" />
    ),

    lock: (
      <>
        <rect x="5" y="9" width="14" height="11" rx="2" />
        <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      </>
    ),

    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c2.2 2.2 3.2 5 3.2 8.5s-1 6.3-3.2 8.5c-2.2-2.2-3.2-5-3.2-8.5s1-6.3 3.2-8.5z" />
      </>
    ),

    bookmark: (
      <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.8L6 21V4.5z" />
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    download: (
      <>
        <path d="M12 4v10" />
        <path d="M8 11l4 4 4-4" />
        <path d="M5 20h14" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.6h.5A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.5V14h-.5a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.8-3.5 3.1-5.2 7-5.2s6.2 1.7 7 5.2" />
      </>
    ),

    menu: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),

    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </>
    ),

    shield: (
      <path d="M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6l7-3z" />
    ),

    check: <path d="M5 12l4 4L19 6" />,
  };

  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

export default function HomePage() {
  const [tabs, setTabs] = useState([
    {
      id: 1,
      title: "New Tab",
      url: HOME_URL,
      history: [HOME_URL],
      historyIndex: 0,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState(1);
  const [address, setAddress] = useState("");

  const [searchEngine, setSearchEngine] =
    useState("google");

  const [bookmarks, setBookmarks] = useState(
    DEFAULT_BOOKMARKS
  );

  const [history, setHistory] = useState([]);
  const [downloads, setDownloads] = useState([]);

  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);

  const [apiStatus, setApiStatus] =
    useState("checking");

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchEngineOpen, setSearchEngineOpen] =
    useState(false);

  const [panel, setPanel] = useState(null);
  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const addressRef = useRef(null);

  const activeTab =
    tabs.find((tab) => tab.id === activeTabId) ||
    tabs[0];

  const currentEngine =
    SEARCH_ENGINES[searchEngine] ||
    SEARCH_ENGINES.google;

  const bookmarked =
    activeTab &&
    activeTab.url !== HOME_URL &&
    bookmarks.some(
      (item) => item.url === activeTab.url
    );

  useEffect(() => {
    const engine = getStoredSearchEngine();

    if (SEARCH_ENGINES[engine]) {
      setSearchEngine(engine);
    }

    checkAPI();
    loadAccount();
  }, []);

  useEffect(() => {
    if (!activeTab) return;

    setAddress(
      activeTab.url === HOME_URL
        ? ""
        : activeTab.url
    );
  }, [activeTabId]);

  useEffect(() => {
    function keyboard(event) {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "l") {
        event.preventDefault();

        addressRef.current?.focus();
        addressRef.current?.select();

        return;
      }

      if (mod && event.key.toLowerCase() === "t") {
        event.preventDefault();
        newTab();

        return;
      }

      if (mod && event.key.toLowerCase() === "w") {
        event.preventDefault();
        closeTab(activeTabId);

        return;
      }

      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        toggleBookmark();

        return;
      }

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();

        return;
      }

      if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        goForward();

        return;
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchEngineOpen(false);
        setPanel(null);
      }
    }

    window.addEventListener(
      "keydown",
      keyboard
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyboard
      );
  }, [
    activeTabId,
    tabs,
    bookmarks,
  ]);

  async function checkAPI() {
    try {
      const response = await fetch(
        `${API_URL}/health`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setApiStatus(
        data.success ? "online" : "offline"
      );
    } catch {
      setApiStatus("offline");
    }
  }

  async function api(path) {
    const response = await fetch(
      `${API_URL}${path}`,
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error();
    }

    return response.json();
  }

  async function loadAccount() {
    try {
      const accountResponse =
        await api("/account");

      if (
        !accountResponse?.success ||
        !accountResponse?.user
      ) {
        return;
      }

      setAccount(accountResponse.user);

      const results =
        await Promise.allSettled([
          api("/profile"),
          api("/settings"),
          api("/bookmarks"),
          api("/history"),
          api("/downloads"),
        ]);

      const [
        profileResult,
        settingsResult,
        bookmarksResult,
        historyResult,
        downloadsResult,
      ] = results;

      if (
        profileResult.status === "fulfilled" &&
        profileResult.value?.success
      ) {
        setProfile(
          profileResult.value.profile
        );
      }

      if (
        settingsResult.status === "fulfilled" &&
        settingsResult.value?.success
      ) {
        setSettings(
          settingsResult.value.settings
        );

        const remoteEngine =
          settingsResult.value.settings
            ?.defaultSearchEngine;

        if (
          typeof remoteEngine === "string" &&
          SEARCH_ENGINES[remoteEngine]
        ) {
          setSearchEngine(remoteEngine);
          localStorage.setItem(
            "fades.searchEngine",
            remoteEngine
          );
        }
      }

      if (
        bookmarksResult.status ===
          "fulfilled" &&
        bookmarksResult.value?.success
      ) {
        const remote =
          bookmarksResult.value.bookmarks ||
          bookmarksResult.value.data;

        if (
          Array.isArray(remote) &&
          remote.length
        ) {
          setBookmarks(remote);
        }
      }

      if (
        historyResult.status ===
          "fulfilled" &&
        historyResult.value?.success
      ) {
        const remote =
          historyResult.value.history ||
          historyResult.value.items;

        if (Array.isArray(remote)) {
          setHistory(remote);
        }
      }

      if (
        downloadsResult.status ===
          "fulfilled" &&
        downloadsResult.value?.success
      ) {
        const remote =
          downloadsResult.value.downloads ||
          downloadsResult.value.items;

        if (Array.isArray(remote)) {
          setDownloads(remote);
        }
      }
    } catch {
      // Local mode is still available.
    }
  }

  function newTab() {
    const id =
      Date.now() +
      Math.random();

    const tab = {
      id,
      title: "New Tab",
      url: HOME_URL,
      history: [HOME_URL],
      historyIndex: 0,
    };

    setTabs((current) => [
      ...current,
      tab,
    ]);

    setActiveTabId(id);
    setAddress("");
  }

  function closeTab(id) {
    if (tabs.length === 1) {
      newTab();
      setTabs((current) =>
        current.filter(
          (tab) => tab.id !== id
        )
      );
      return;
    }

    const index = tabs.findIndex(
      (tab) => tab.id === id
    );

    const remaining = tabs.filter(
      (tab) => tab.id !== id
    );

    setTabs(remaining);

    if (id === activeTabId) {
      const next =
        remaining[index - 1] ||
        remaining[index] ||
        remaining[0];

      setActiveTabId(next.id);
    }
  }

  function navigate(value) {
    const url = makeNavigationUrl(
      value,
      searchEngine
    );

    if (!activeTab) return;

    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== activeTabId) {
          return tab;
        }

        const newHistory = [
          ...tab.history.slice(
            0,
            tab.historyIndex + 1
          ),
          url,
        ];

        return {
          ...tab,
          url,
          title: getPageTitle(url),
          history: newHistory,
          historyIndex:
            newHistory.length - 1,
        };
      })
    );

    setAddress(
      url === HOME_URL ? "" : url
    );

    if (!url.startsWith("fades://")) {
      setHistory((current) => [
        {
          id: Date.now(),
          url,
          title: getPageTitle(url),
          visitedAt:
            new Date().toISOString(),
        },
        ...current.filter(
          (item) => item.url !== url
        ),
      ].slice(0, 200));
    }

    /*
      IMPORTANT:

      This is where your Tauri browser command
      should eventually be called.

      Example:

      await invoke("navigate_browser", {
        url
      });

      That allows the actual browser engine
      underneath this UI to navigate.
    */
  }

  function submitAddress(event) {
    event.preventDefault();
    navigate(address);
  }

  function goBack() {
    if (
      !activeTab ||
      activeTab.historyIndex <= 0
    ) {
      return;
    }

    const index =
      activeTab.historyIndex - 1;

    const url =
      activeTab.history[index];

    setTabs((current) =>
      current.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url,
              title: getPageTitle(url),
              historyIndex: index,
            }
          : tab
      )
    );

    setAddress(
      url === HOME_URL ? "" : url
    );
  }

  function goForward() {
    if (
      !activeTab ||
      activeTab.historyIndex >=
        activeTab.history.length - 1
    ) {
      return;
    }

    const index =
      activeTab.historyIndex + 1;

    const url =
      activeTab.history[index];

    setTabs((current) =>
      current.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url,
              title: getPageTitle(url),
              historyIndex: index,
            }
          : tab
      )
    );

    setAddress(
      url === HOME_URL ? "" : url
    );
  }

  function reload() {
    if (!activeTab) return;

    /*
      Connect this to the actual Tauri
      webview reload command.

      Example:

      invoke("reload_browser");
    */
  }

  function toggleBookmark() {
    if (
      !activeTab ||
      activeTab.url === HOME_URL
    ) {
      return;
    }

    if (bookmarked) {
      setBookmarks((current) =>
        current.filter(
          (item) =>
            item.url !== activeTab.url
        )
      );

      return;
    }

    setBookmarks((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        title: getPageTitle(
          activeTab.url
        ),
        url: activeTab.url,
      },
    ]);
  }

  function selectSearchEngine(id) {
    if (!SEARCH_ENGINES[id]) return;

    setSearchEngine(id);

    localStorage.setItem(
      "fades.searchEngine",
      id
    );

    setSearchEngineOpen(false);
  }

  function openBookmark(url) {
    navigate(url);
    setPanel(null);
  }

  function renderNewTab() {
    return (
      <div className="newTab">
        <div className="backgroundGrid" />
        <div className="ambientGlow glowOne" />
        <div className="ambientGlow glowTwo" />

        <div className="newTabCenter">
          <div className="fadesLogo">
            F
          </div>

          <h1>
            Welcome to{" "}
            <span>Fades.</span>
          </h1>

          <p className="subtitle">
            The browser built around you.
          </p>

          <form
            className="mainSearch"
            onSubmit={submitAddress}
          >
            <div className="searchIcon">
              <Icon
                name="search"
                size={21}
              />
            </div>

            <input
              ref={addressRef}
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value
                )
              }
              placeholder="Search or enter a URL"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="searchEngineWrapper">
              <button
                type="button"
                className="searchEngineButton"
                onClick={() =>
                  setSearchEngineOpen(
                    (value) => !value
                  )
                }
              >
                <span className="engineLetter">
                  {currentEngine.short}
                </span>

                <span>
                  {currentEngine.name}
                </span>

                <span className="engineChevron">
                  ⌄
                </span>
              </button>

              {searchEngineOpen && (
                <div className="searchEngineMenu">
                  {Object.entries(
                    SEARCH_ENGINES
                  ).map(
                    ([id, engine]) => (
                      <button
                        key={id}
                        type="button"
                        className={
                          id === searchEngine
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          selectSearchEngine(
                            id
                          )
                        }
                      >
                        <span className="engineIcon">
                          {engine.short}
                        </span>

                        <span>
                          {engine.name}
                        </span>

                        {id ===
                          searchEngine && (
                          <Icon
                            name="check"
                            size={14}
                          />
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="shortcutGrid">
            {bookmarks
              .slice(0, 5)
              .map((bookmark) => (
                <button
                  key={bookmark.id}
                  className="shortcut"
                  onClick={() =>
                    openBookmark(
                      bookmark.url
                    )
                  }
                >
                  <span className="shortcutIcon">
                    <Favicon
                      url={bookmark.url}
                      size={18}
                    />
                  </span>

                  <span>
                    {bookmark.title}
                  </span>
                </button>
              ))}

            <button
              className="shortcut"
              onClick={() =>
                addressRef.current?.focus()
              }
            >
              <span className="shortcutIcon plus">
                <Icon
                  name="plus"
                  size={17}
                />
              </span>

              <span>Add shortcut</span>
            </button>
          </div>

          <div className="newTabFooter">
            <div>
              <span
                className={
                  apiStatus === "online"
                    ? "statusOnline"
                    : "statusOffline"
                }
              />
              {apiStatus === "online"
                ? "Fades Cloud connected"
                : "Fades Cloud offline"}
            </div>

            <div>
              <span>{history.length}</span>
              History
            </div>

            <div>
              <span>{bookmarks.length}</span>
              Bookmarks
            </div>
          </div>
        </div>

        <div className="newTabBottom">
          <span>
            {currentEngine.name} Search
          </span>

          <span>
            Fades Browser
          </span>
        </div>
      </div>
    );
  }

  function renderWebPage() {
    return (
      <div className="browserPage">
        <div className="pageLoading" />

        <div className="sitePlaceholder">
          <div className="siteIcon">
            <Favicon
              url={activeTab.url}
              size={30}
            />
          </div>

          <h2>
            {getHostname(activeTab.url)}
          </h2>

          <p>
            {activeTab.url}
          </p>

          <div className="siteMessage">
            <Icon
              name="globe"
              size={19}
            />

            <div>
              <strong>
                Fades Browser
              </strong>

              <span>
                This is the browser surface.
                Your Tauri webview should render
                the actual website here.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="browser">
      <div className="browserChrome">
        <div className="tabBar">
          <div className="windowButtons">
            <span className="windowClose" />
            <span className="windowMinimize" />
            <span className="windowMaximize" />
          </div>

          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${
                  tab.id === activeTabId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTabId(
                    tab.id
                  )
                }
              >
                <Favicon
                  url={tab.url}
                  size={14}
                />

                <span className="tabName">
                  {tab.title}
                </span>

                <span
                  className="tabClose"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  ×
                </span>
              </button>
            ))}

            <button
              className="newTabButton"
              onClick={newTab}
            >
              <Icon
                name="plus"
                size={16}
              />
            </button>
          </div>

          <button
            className="topProfile"
            onClick={() =>
              setPanel(
                panel === "account"
                  ? null
                  : "account"
              )
            }
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt=""
              />
            ) : (
              "F"
            )}
          </button>

          <button
            className="topMenu"
            onClick={() =>
              setMenuOpen(
                (value) => !value
              )
            }
          >
            <Icon
              name="menu"
              size={18}
            />
          </button>
        </div>

        <div className="toolbar">
          <div className="navButtons">
            <button
              disabled={
                activeTab.historyIndex <=
                0
              }
              onClick={goBack}
            >
              <Icon
                name="back"
                size={18}
              />
            </button>

            <button
              disabled={
                activeTab.historyIndex >=
                activeTab.history.length -
                  1
              }
              onClick={goForward}
            >
              <Icon
                name="forward"
                size={18}
              />
            </button>

            <button onClick={reload}>
              <Icon
                name="reload"
                size={17}
              />
            </button>
          </div>

          <form
            className="addressBar"
            onSubmit={submitAddress}
          >
            <div className="addressIcon">
              {activeTab.url.startsWith(
                "https://"
              ) ? (
                <Icon
                  name="lock"
                  size={14}
                />
              ) : (
                <Icon
                  name="globe"
                  size={15}
                />
              )}
            </div>

            <input
              ref={addressRef}
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value
                )
              }
              onFocus={(event) =>
                event.currentTarget.select()
              }
              placeholder="Search or enter address"
              autoComplete="off"
              spellCheck={false}
            />

            <button
              type="button"
              className={
                bookmarked
                  ? "addressBookmark active"
                  : "addressBookmark"
              }
              onClick={
                toggleBookmark
              }
            >
              <Icon
                name="star"
                size={16}
              />
            </button>
          </form>

          <div className="toolbarActions">
            <button
              onClick={() =>
                setPanel(
                  panel === "bookmarks"
                    ? null
                    : "bookmarks"
                )
              }
            >
              <Icon
                name="bookmark"
                size={17}
              />
            </button>

            <button
              onClick={() =>
                setPanel(
                  panel === "history"
                    ? null
                    : "history"
                )
              }
            >
              <Icon
                name="history"
                size={17}
              />
            </button>

            <button
              onClick={() =>
                setPanel(
                  panel === "downloads"
                    ? null
                    : "downloads"
                )
              }
            >
              <Icon
                name="download"
                size={17}
              />
            </button>

            <button
              onClick={() =>
                setSettingsOpen(true)
              }
            >
              <Icon
                name="settings"
                size={17}
              />
            </button>
          </div>
        </div>

        <div className="bookmarkBar">
          <button
            onClick={newTab}
            className="bookmarkItem"
          >
            <span className="fadesMini">
              F
            </span>
            New Tab
          </button>

          {bookmarks
            .slice(0, 7)
            .map((bookmark) => (
              <button
                key={bookmark.id}
                className="bookmarkItem"
                onClick={() =>
                  openBookmark(
                    bookmark.url
                  )
                }
              >
                <Favicon
                  url={bookmark.url}
                  size={13}
                />
                {bookmark.title}
              </button>
            ))}
        </div>
      </div>

      <div className="viewport">
        {activeTab.url === HOME_URL
          ? renderNewTab()
          : renderWebPage()}
      </div>

      {panel && (
        <div className="floatingPanel">
          <div className="panelHeader">
            <strong>
              {panel === "bookmarks"
                ? "Bookmarks"
                : panel === "history"
                  ? "History"
                  : panel ===
                      "downloads"
                    ? "Downloads"
                    : "Fades Account"}
            </strong>

            <button
              onClick={() =>
                setPanel(null)
              }
            >
              <Icon
                name="close"
                size={16}
              />
            </button>
          </div>

          {panel === "account" && (
            <div className="accountPanel">
              <div className="largeAvatar">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt=""
                  />
                ) : (
                  "F"
                )}
              </div>

              <strong>
                {account?.displayName ||
                  account?.username ||
                  "Fades User"}
              </strong>

              <span>
                {account?.email ||
                  "Not signed in"}
              </span>

              <div className="cloudStatus">
                <span
                  className={
                    apiStatus ===
                    "online"
                      ? "statusOnline"
                      : "statusOffline"
                  }
                />

                {apiStatus ===
                "online"
                  ? "Fades Cloud connected"
                  : "Local mode"}
              </div>

              <button
                className="manageButton"
                onClick={() =>
                  (window.location.href =
                    "https://fades.lol")
                }
              >
                Manage account
              </button>
            </div>
          )}

          {panel === "bookmarks" && (
            <div className="panelList">
              {bookmarks.length ===
              0 ? (
                <div className="empty">
                  No bookmarks yet.
                </div>
              ) : (
                bookmarks.map(
                  (bookmark) => (
                    <button
                      key={
                        bookmark.id
                      }
                      className="panelListItem"
                      onClick={() =>
                        openBookmark(
                          bookmark.url
                        )
                      }
                    >
                      <Favicon
                        url={
                          bookmark.url
                        }
                        size={16}
                      />

                      <div>
                        <strong>
                          {
                            bookmark.title
                          }
                        </strong>

                        <span>
                          {
                            bookmark.url
                          }
                        </span>
                      </div>
                    </button>
                  )
                )
              )}
            </div>
          )}

          {panel === "history" && (
            <div className="panelList">
              {history.length ===
              0 ? (
                <div className="empty">
                  No history yet.
                </div>
              ) : (
                history
                  .slice(0, 50)
                  .map((item) => (
                    <button
                      key={
                        item.id
                      }
                      className="panelListItem"
                      onClick={() =>
                        openBookmark(
                          item.url
                        )
                      }
                    >
                      <Favicon
                        url={
                          item.url
                        }
                        size={16}
                      />

                      <div>
                        <strong>
                          {
                            item.title
                          }
                        </strong>

                        <span>
                          {item.url}
                        </span>
                      </div>
                    </button>
                  ))
              )}
            </div>
          )}

          {panel === "downloads" && (
            <div className="panelList">
              {downloads.length ===
              0 ? (
                <div className="empty">
                  No downloads yet.
                </div>
              ) : (
                downloads.map(
                  (item, index) => (
                    <div
                      className="downloadItem"
                      key={
                        item.id ||
                        index
                      }
                    >
                      <Icon
                        name="download"
                        size={17}
                      />

                      <div>
                        <strong>
                          {item.filename ||
                            item.name ||
                            "Download"}
                        </strong>

                        <span>
                          {item.status ||
                            "Completed"}
                        </span>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
      )}

      {menuOpen && (
        <div className="browserMenu">
          <button
            onClick={() => {
              newTab();
              setMenuOpen(false);
            }}
          >
            <Icon
              name="plus"
              size={16}
            />
            New tab
            <kbd>Ctrl T</kbd>
          </button>

          <button
            onClick={() => {
              setPanel("history");
              setMenuOpen(false);
            }}
          >
            <Icon
              name="history"
              size={16}
            />
            History
          </button>

          <button
            onClick={() => {
              setPanel("bookmarks");
              setMenuOpen(false);
            }}
          >
            <Icon
              name="bookmark"
              size={16}
            />
            Bookmarks
          </button>

          <button
            onClick={() => {
              setPanel("downloads");
              setMenuOpen(false);
            }}
          >
            <Icon
              name="download"
              size={16}
            />
            Downloads
          </button>

          <div className="menuDivider" />

          <button
            onClick={() => {
              setSettingsOpen(true);
              setMenuOpen(false);
            }}
          >
            <Icon
              name="settings"
              size={16}
            />
            Settings
          </button>
        </div>
      )}

      {settingsOpen && (
        <div className="settingsOverlay">
          <div className="settings">
            <div className="settingsTop">
              <div>
                <small>
                  FADES BROWSER
                </small>
                <h2>Settings</h2>
              </div>

              <button
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
              >
                <Icon
                  name="close"
                  size={18}
                />
              </button>
            </div>

            <div className="settingsBody">
              <aside>
                <button className="selected">
                  General
                </button>
                <button>
                  Search
                </button>
                <button>
                  Privacy
                </button>
                <button>
                  Sync
                </button>
                <button>
                  Appearance
                </button>
                <button>
                  Downloads
                </button>
              </aside>

              <section>
                <div className="settingsSection">
                  <h3>
                    Search
                  </h3>

                  <p>
                    Choose which search engine
                    Fades uses when you type a
                    search into the address bar.
                  </p>

                  <div className="engineSettings">
                    {Object.entries(
                      SEARCH_ENGINES
                    ).map(
                      ([id, engine]) => (
                        <button
                          key={id}
                          className={
                            searchEngine ===
                            id
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            selectSearchEngine(
                              id
                            )
                          }
                        >
                          <span>
                            {
                              engine.short
                            }
                          </span>

                          <strong>
                            {
                              engine.name
                            }
                          </strong>

                          {searchEngine ===
                            id && (
                            <Icon
                              name="check"
                              size={15}
                            />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="settingsSection">
                  <h3>
                    Fades Cloud
                  </h3>

                  <p>
                    Browser data synchronization
                    and account connectivity.
                  </p>

                  <div className="cloudCard">
                    <span
                      className={
                        apiStatus ===
                        "online"
                          ? "statusOnline"
                          : "statusOffline"
                      }
                    />

                    <div>
                      <strong>
                        {apiStatus ===
                        "online"
                          ? "Connected"
                          : "Offline"}
                      </strong>

                      <span>
                        {API_URL}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="settingsSection">
                  <h3>
                    Privacy
                  </h3>

                  <div className="privacyRow">
                    <div>
                      <strong>
                        Do Not Track
                      </strong>
                      <span>
                        Ask websites not to track
                        your browsing.
                      </span>
                    </div>

                    <span className="toggle enabled">
                      <span />
                    </span>
                  </div>

                  <div className="privacyRow">
                    <div>
                      <strong>
                        HTTPS-only mode
                      </strong>
                      <span>
                        Prefer secure connections
                        when available.
                      </span>
                    </div>

                    <span className="toggle enabled">
                      <span />
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}