import {
  ClipboardList,
  Image as ImageIcon,
  Images,
  Landmark,
  Library,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deliverFile, type ToastPayload } from "@/lib/granth/files";
import { useGranth } from "@/lib/granth/store";
import type { AppRoute, Panel } from "@/lib/granth/types";
import { Dashboard, GranthScreen, Lightbox, PramanScreen, TopicScreen } from "./screens";
import { GalleryScreen } from "./gallery";
import { MalaMark, ScrollRail } from "./ui";

const NAV: Array<{ panel: Panel; hash: string; label: string; icon: typeof Landmark }> = [
  { panel: "dashboard", hash: "#/dashboard", label: "Dashboard", icon: Landmark },
  { panel: "topics", hash: "#/topics", label: "Topics", icon: ClipboardList },
  { panel: "granths", hash: "#/granths", label: "Granths", icon: Library },
  { panel: "pramans", hash: "#/pramans", label: "प्रमाण", icon: ImageIcon },
];

function parseHash(hash: string): AppRoute {
  const raw = hash.replace(/^#/, "") || "/dashboard";
  const [pathPart, queryPart] = raw.split("?");
  const path = pathPart || "/dashboard";
  const params = new URLSearchParams(queryPart ?? "");
  const topicId = params.get("topic") || undefined;
  const granthId = params.get("granth") || undefined;
  const pramanId = params.get("id") || undefined;
  if (path.startsWith("/gallery")) return { panel: "gallery" };
  if (path.startsWith("/topics")) return { panel: "topics" };
  if (path.startsWith("/granths")) return { panel: "granths" };
  if (path.startsWith("/pramans")) return { panel: "pramans", topicId, granthId, pramanId };
  return { panel: "dashboard" };
}

function formatWhen(stamp: number | null): string {
  if (!stamp) return "";
  return new Intl.DateTimeFormat("hi-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(stamp);
}

export function GranthApp() {
  const boot = useGranth((state) => state.boot);
  const sync = useGranth((state) => state.sync);
  const savePages = useGranth((state) => state.savePages);
  const topics = useGranth((state) => state.topics.length);
  const granths = useGranth((state) => state.granths.length);
  const pramans = useGranth((state) => state.pramans.length);
  const status = useGranth((state) => state.status);
  const syncedAt = useGranth((state) => state.syncedAt);
  const online = useGranth((state) => state.online);
  const error = useGranth((state) => state.error);
  const images = useGranth((state) => state.images);
  const [route, setRoute] = useState<AppRoute>({ panel: "dashboard" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [shots, setShots] = useState<string[] | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const read = () => setRoute(parseHash(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    void boot();
    const onOnline = () => {
      useGranth.setState({ online: true });
    };
    const onOffline = () => {
      useGranth.setState({
        online: false,
        status: useGranth.getState().syncedAt ? "offline" : "error",
      });
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [boot]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const toastTimer = useRef<number | null>(null);
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      setToast(detail);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), detail.file ? 14000 : 2400);
    };
    window.addEventListener("granth-toast", onToast);
    return () => window.removeEventListener("granth-toast", onToast);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [route.panel, route.topicId, route.granthId, route.pramanId]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (hash: string) => {
    if (window.location.hash === hash) {
      setRoute(parseHash(hash));
      window.scrollTo({ top: 0 });
      return;
    }
    window.location.hash = hash;
  };

  const imageLabel = images.total
    ? images.running
      ? `पेज सेव हो रहे हैं ${images.done}/${images.total}`
      : images.done >= images.total
        ? "सभी पेज इस डिवाइस पर सेव हैं"
        : `सेव पेज ${images.done}/${images.total}`
    : status === "syncing"
      ? "सूची सेव हो रही है…"
      : "";

  return (
    <div className="app-root">
      <header className="mast">
        <div className="mast-gold" />
        <div className="mast-row">
          <div className="brand-row">
            <button className="brand" type="button" onClick={() => go("#/dashboard")}>
              <span className="logo-icon">
                <MalaMark />
              </span>
              <h1>ग्रंथ प्रबंधन</h1>
            </button>
            <button className="gallery-btn" type="button" aria-label="Gallery" onClick={() => go("#/gallery")}>
              <Images />
            </button>
          </div>
          <div className="stats-bar">
            <button type="button" className="stat-item" onClick={() => go("#/topics")}>
              <span className="stat-num">{topics || "—"}</span>
              <span className="stat-label">विषय / प्रश्नोत्तरी</span>
            </button>
            <button type="button" className="stat-item" onClick={() => go("#/granths")}>
              <span className="stat-num">{granths || "—"}</span>
              <span className="stat-label">पवित्र ग्रन्थ</span>
            </button>
            <button type="button" className="stat-item" onClick={() => go("#/pramans")}>
              <span className="stat-num">{pramans || "—"}</span>
              <span className="stat-label">नए प्रमाण</span>
            </button>
          </div>
        </div>
      </header>

      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        type="button"
        aria-label={menuOpen ? "मेनू बंद करें" : "मेनू खोलें"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav className={menuOpen ? "open" : ""}>
        <ul className="nav-menu">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = route.panel === item.panel;
            return (
              <li key={item.panel}>
                <button
                  type="button"
                  className={`nav-btn ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => go(item.hash)}
                >
                  <Icon /> {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`sync-strip ${status}`}>
        <p>
          <span className={`dot ${online ? "on" : "off"}`} />
          {status === "syncing"
            ? "ऑनलाइन सिंक हो रहा है — सूची डिवाइस पर लिखी जा रही है"
            : error
              ? error
              : !online
                ? "इंटरनेट नहीं · सेव किया डेटा चल रहा है"
                : `ऑफलाइन तैयार${syncedAt ? ` · ${formatWhen(syncedAt)}` : ""}`}
          {imageLabel ? ` · ${imageLabel}` : ""}
        </p>
        <button
          className="sync-btn"
          type="button"
          onClick={() => {
            void sync().then(() => savePages());
          }}
          disabled={status === "syncing"}
        >
          <RefreshCw className={status === "syncing" ? "spin" : ""} />
          सिंक
        </button>
      </div>

      <main>
        {status === "booting" && topics + granths + pramans === 0 ? (
          <div className="loading">
            <div className="spinner" />
            <p>सेव की हुई प्रति खोली जा रही है…</p>
          </div>
        ) : null}
        {error && status === "error" && topics + granths + pramans === 0 ? (
          <div className="empty">
            <h3>अभी खाली है</h3>
            <p>{error}</p>
          </div>
        ) : null}
        {route.panel === "dashboard" ? <Dashboard go={go} /> : null}
        {route.panel === "topics" ? <TopicScreen go={go} /> : null}
        {route.panel === "granths" ? <GranthScreen go={go} onOpen={setShots} /> : null}
        {route.panel === "pramans" ? <PramanScreen route={route} go={go} onOpen={setShots} /> : null}
        {route.panel === "gallery" ? <GalleryScreen /> : null}
      </main>

      <ScrollRail />
      {showTop ? (
        <button className="to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Top
        </button>
      ) : null}
      {toast ? (
        <div className="toast show">
          <span>{toast.message}</span>
          {toast.file ? (
            <button
              type="button"
              onClick={() => {
                if (toast.file) void deliverFile(toast.file.blob, toast.file.name);
              }}
            >
              डाउनलोड
            </button>
          ) : null}
        </div>
      ) : null}
      {shots ? <Lightbox paths={shots} onClose={() => setShots(null)} /> : null}
    </div>
  );
}
