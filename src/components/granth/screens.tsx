import {
  ClipboardList,
  Image as ImageIcon,
  Landmark,
  Library,
  PenLine,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { rankBySearch } from "@/lib/granth/search";
import { readImage, saveGalleryItem, writeImage } from "@/lib/granth/db";
import { mediaPath, mediaUrl, youtubeId } from "@/lib/granth/media";
import { deliverFile, ping } from "@/lib/granth/files";
import { useGranth } from "@/lib/granth/store";
import type { AppRoute, Granth, Praman, Topic } from "@/lib/granth/types";
import { MediaImage } from "./media-image";
import { IconBox, RichText } from "./ui";

function useSlice(resetKey: string, total: number, step = 18) {
  const [count, setCount] = useState(step);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setCount(step);
  }, [resetKey, step]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCount((value) => Math.min(total, value + step));
        }
      },
      { rootMargin: "640px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [resetKey, step, total]);
  return { count: Math.min(count, total), ref };
}

async function shareLink(title: string, hash: string) {
  const url = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    window.dispatchEvent(new CustomEvent("granth-toast", { detail: "लिंक कॉपी हो गया" }));
  } catch {
    window.prompt("यह लिंक कॉपी करें", url);
  }
}

export function Dashboard({ go }: { go: (hash: string) => void }) {
  const topics = useGranth((state) => state.topics.length);
  const granths = useGranth((state) => state.granths.length);
  const pramans = useGranth((state) => state.pramans.length);
  return (
    <section>
      <header className="page-header">
        <div className="page-title">
          <IconBox tone="saffron">
            <Landmark />
          </IconBox>
          <div>
            <h2>Dashboard</h2>
            <p className="subtitle">Overview of your Granth collection</p>
          </div>
        </div>
      </header>
      <div className="dash-grid">
        <button className="dash-card" type="button" onClick={() => go("#/topics")}>
          <IconBox tone="saffron" className="dash-glyph">
            <ClipboardList />
          </IconBox>
          <div>
            <div className="dash-num">{topics || "—"}</div>
            <div className="dash-lbl">Topics</div>
          </div>
        </button>
        <button className="dash-card" type="button" onClick={() => go("#/granths")}>
          <IconBox tone="maroon" className="dash-glyph">
            <Library />
          </IconBox>
          <div>
            <div className="dash-num">{granths || "—"}</div>
            <div className="dash-lbl">Granths</div>
          </div>
        </button>
        <button className="dash-card" type="button" onClick={() => go("#/pramans")}>
          <IconBox tone="gold" className="dash-glyph">
            <ImageIcon />
          </IconBox>
          <div>
            <div className="dash-num">{pramans || "—"}</div>
            <div className="dash-lbl">प्रमाण</div>
          </div>
        </button>
      </div>
      <article className="note-card">
        <h3>सत साहेब जी</h3>
        <p>
          जो प्रमाण समय पर याद नहीं रहते, यह ग्रंथ प्रबंधन उन्हें विषय और ग्रंथ के साथ एक जगह रखता है। पहली बार
          इंटरनेट पर खुलते ही विषय, ग्रंथ और प्रमाण इस डिवाइस पर सेव हो जाते हैं — उसके बाद ऐप बिना नेट के खुलता है।
        </p>
        <p>
          संपर्क:{" "}
          <a href="mailto:sadgranthpraman@gmail.com">sadgranthpraman@gmail.com</a>
        </p>
      </article>
    </section>
  );
}

export function TopicScreen({ go }: { go: (hash: string) => void }) {
  const topics = useGranth((state) => state.topics);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    return rankBySearch(topics, query, (topic) => [topic.title, topic.description]).sort((a, b) =>
      query.trim() ? 0 : Number(a.position) - Number(b.position),
    );
  }, [topics, query]);
  const { count, ref } = useSlice(query, filtered.length, 24);
  const total = filtered.length;
  return (
    <section>
      <header className="page-header">
        <div className="page-title">
          <IconBox tone="saffron">
            <ClipboardList />
          </IconBox>
          <div>
            <h2>Topics</h2>
            <p className="subtitle">विषय / प्रश्नोत्तरी</p>
          </div>
        </div>
        <form
          className="search-row"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            className="form-control"
            value={query}
            lang="hi"
            placeholder="विषय खोजें — mans, गीता, मृत्यु"
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </header>
      <div className="card-grid">
        {filtered.slice(0, count).map((topic, index) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            index={index + 1}
            total={total}
            onOpen={() => go(`#/pramans?topic=${topic.id}`)}
            onShare={() => void shareLink(topic.title, `#/pramans?topic=${topic.id}`)}
          />
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty title="कोई विषय नहीं" body="सिंक पूरा होने पर विषय यहाँ दिखेंगे।" />
      ) : null}
      <div ref={ref} className="scroll-sentinel" />
    </section>
  );
}

function TopicCard({
  topic,
  index,
  total,
  onOpen,
  onShare,
}: {
  topic: Topic;
  index: number;
  total: number;
  onOpen: () => void;
  onShare: () => void;
}) {
  const proofs = Number(topic.praman_count) || 0;
  return (
    <article className="card">
      <div className="card-header">
        <h3 className="card-title">
          <button type="button" onClick={onOpen}>
            {topic.position}. <RichText text={topic.title} />
          </button>
        </h3>
      </div>
      {topic.description ? (
        <p className="card-desc">
          <RichText text={topic.description} />
        </p>
      ) : null}
      <div className="card-meta">
        {proofs > 0 ? (
          <button className="pill pill-maroon" type="button" onClick={onOpen}>
            <ImageIcon /> {proofs} प्रमाण
          </button>
        ) : null}
        {proofs > 0 ? (
          <button className="pill" type="button" onClick={onOpen}>
            <Library /> {index}/{total}
          </button>
        ) : null}
        <button className="pill" type="button" onClick={onShare}>
          <Share2 /> Share
        </button>
      </div>
    </article>
  );
}

export function GranthScreen({
  go,
  onOpen,
}: {
  go: (hash: string) => void;
  onOpen: (paths: string[]) => void;
}) {
  const granths = useGranth((state) => state.granths);
  const [query, setQuery] = useState("");
  const [cols, setCols] = useState<1 | 2 | 3>(1);
  useEffect(() => {
    const saved = Number(localStorage.getItem("granth-cols"));
    if (saved === 1 || saved === 2 || saved === 3) setCols(saved);
  }, []);
  const filtered = useMemo(() => {
    return rankBySearch(granths, query, (granth) => [granth.title, granth.author, granth.description]).sort(
      (a, b) => (query.trim() ? 0 : Number(a.position) - Number(b.position)),
    );
  }, [granths, query]);
  const step = cols === 1 ? 8 : cols === 2 ? 12 : 18;
  const { count, ref } = useSlice(`${query}|${cols}`, filtered.length, step);
  const pickCols = (next: 1 | 2 | 3) => {
    setCols(next);
    localStorage.setItem("granth-cols", String(next));
  };
  return (
    <section>
      <header className="page-header">
        <div className="page-title">
          <IconBox tone="maroon">
            <Library />
          </IconBox>
          <div>
            <h2>Granths</h2>
            <p className="subtitle">Sacred texts and scriptures</p>
          </div>
        </div>
        <div className="granth-tools">
          <div className="grid-switch" role="group" aria-label="ग्रंथ ग्रिड">
            {([1, 2, 3] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={cols === size ? "active" : ""}
                aria-pressed={cols === size}
                onClick={() => pickCols(size)}
              >
                {size}×{size}
              </button>
            ))}
          </div>
          <form className="search-row" onSubmit={(event) => event.preventDefault()}>
            <input
              className="form-control"
              value={query}
              lang="hi"
              placeholder="ग्रंथ का नाम — gita, kabir"
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
        </div>
      </header>
      <div className={`card-grid granth-grid cols-${cols}`}>
        {filtered.slice(0, count).map((granth, index) => (
          <GranthCard
            key={granth.id}
            granth={granth}
            index={index + 1}
            total={filtered.length}
            onOpen={() => go(`#/pramans?granth=${granth.id}`)}
            onShare={() => void shareLink(granth.title, `#/pramans?granth=${granth.id}`)}
            onImage={() => {
              const paths = [granth.imagePath, granth.editorImagePath].map(mediaPath).filter(Boolean) as string[];
              if (paths.length) onOpen(paths);
            }}
          />
        ))}
      </div>
      {filtered.length === 0 ? <Empty title="कोई ग्रंथ नहीं" body="सिंक के बाद पवित्र ग्रंथ यहाँ खुलेंगे।" /> : null}
      <div ref={ref} className="scroll-sentinel" />
    </section>
  );
}

async function loadShot(path: string | null | undefined): Promise<Blob | null> {
  const safe = mediaPath(path);
  if (!safe) return null;
  const cached = await readImage(safe);
  if (cached && cached.size > 32) return cached;
  const response = await fetch(mediaUrl(safe));
  if (!response.ok) return null;
  const blob = await response.blob();
  if (blob.size > 32) await writeImage(safe, blob);
  return blob.size > 32 ? blob : null;
}

function pdfName(title: string, fallback: string) {
  const clean = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  return `${clean || fallback}.pdf`;
}

async function publishPdf(blob: Blob, fileName: string, item: {
  id: string;
  title: string;
  text: string;
  topic: string;
  granth: string;
}) {
  await saveGalleryItem({
    id: item.id,
    kind: "pdf",
    title: item.title,
    text: item.text,
    topic: item.topic,
    granth: item.granth,
    folderId: "",
    createdAt: Date.now(),
    size: blob.size,
    fileName,
    blob,
  });
  await deliverFile(blob, fileName);
  ping({ message: "PDF गैलरी और डाउनलोड में सेव हो गई", file: { blob, name: fileName } });
}

async function downloadCardPdf(
  title: string,
  subtitle: string,
  body: string,
  meta: string,
  image: string,
  id: string,
  topic = "",
  granth = "",
) {
  try {
    ping("PDF बन रहा है…");
    const imageBlob = await loadShot(image);
    const { buildCardPdf } = await import("@/lib/granth/pdf");
    const blob = await buildCardPdf({ title, subtitle, body, meta, imageBlob, fileName: `${id}.pdf` });
    await publishPdf(blob, pdfName(title, id), { id: `pdf-${id}`, title, text: body, topic, granth: granth || subtitle });
  } catch (error) {
    console.error(error);
    ping(error instanceof Error ? `PDF नहीं बन सकी: ${error.message}` : "PDF नहीं बन सकी");
  }
}

async function downloadGranthBook(granth: Granth) {
  try {
    const proofs = useGranth
      .getState()
      .pramans.filter((praman) => praman.granth_id === granth.id)
      .sort((a, b) => Number(a.id) - Number(b.id));
    ping(proofs.length ? `PDF बन रही है — 1 आवरण + ${proofs.length} प्रमाण` : "PDF बन रही है…");
    const cover = await loadShot(granth.imagePath);
    const pages = [
      {
        title: granth.title,
        subtitle: granth.author,
        body: granth.description,
        meta: `${proofs.length} प्रमाण`,
        imageBlob: cover,
        cover: true,
      },
    ];
    for (const praman of proofs) {
      pages.push({
        title: praman.title,
        subtitle: praman.topic_title,
        body: praman.description,
        meta: [praman.granth_title, praman.granth_auther].filter(Boolean).join(" · "),
        imageBlob: await loadShot(praman.image_path),
        cover: false,
      });
    }
    const { buildBookPdf } = await import("@/lib/granth/pdf");
    const blob = await buildBookPdf(pages);
    const text = [granth.description, ...proofs.map((praman) => praman.title)].filter(Boolean).join("\n");
    await publishPdf(blob, pdfName(granth.title, `granth-${granth.id}`), {
      id: `pdf-granth-${granth.id}`,
      title: granth.title,
      text,
      topic: "",
      granth: granth.title,
    });
  } catch (error) {
    console.error(error);
    ping(error instanceof Error ? `PDF नहीं बन सकी: ${error.message}` : "PDF नहीं बन सकी");
  }
}

function GranthCard({
  granth,
  index,
  total,
  onOpen,
  onShare,
  onImage,
}: {
  granth: Granth;
  index: number;
  total: number;
  onOpen: () => void;
  onShare: () => void;
  onImage: () => void;
}) {
  const proofs = Number(granth.pramanCount) || 0;
  return (
    <article className="card granth-card" onClick={onOpen}>
      <div className="card-header">
        <h3 className="card-title">
          <span>
            <RichText text={granth.title} />
          </span>
        </h3>
      </div>
      {granth.author ? (
        <p className="author">
          <PenLine /> {granth.author}
        </p>
      ) : null}
      {granth.description ? (
        <p className="card-desc">
          <RichText text={granth.description} />
        </p>
      ) : null}
      <MediaImage
        path={granth.imagePath}
        alt={granth.title}
        className="cover"
        onView={onImage}
        save={{ title: granth.title, text: granth.description, topic: "", granth: granth.title }}
      />
      <div className="card-meta">
        {proofs > 0 ? (
          <span className="pill pill-maroon">
            <ImageIcon /> {proofs} <span className="pill-word">प्रमाण</span>
          </span>
        ) : null}
        <span className="pill">
          <Library /> {index}/{total}
        </span>
        <button
          className="pill"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onShare();
          }}
        >
          <Share2 /> Share
        </button>
        <button
          className="pill pill-maroon"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void downloadGranthBook(granth);
          }}
        >
          PDF
        </button>
      </div>
    </article>
  );
}

export function PramanScreen({
  route,
  go,
  onOpen,
}: {
  route: AppRoute;
  go: (hash: string) => void;
  onOpen: (paths: string[]) => void;
}) {
  const pramans = useGranth((state) => state.pramans);
  const topics = useGranth((state) => state.topics);
  const granths = useGranth((state) => state.granths);
  const [query, setQuery] = useState("");
  const [cols, setCols] = useState<1 | 2>(1);
  useEffect(() => {
    const saved = Number(localStorage.getItem("praman-cols"));
    if (saved === 1 || saved === 2) setCols(saved);
  }, []);
  const topic = topics.find((item) => item.id === route.topicId);
  const granth = granths.find((item) => item.id === route.granthId);
  const filtered = useMemo(() => {
    return pramans.filter((praman) => {
      if (route.topicId && praman.topic_id !== route.topicId) return false;
      if (route.granthId && praman.granth_id !== route.granthId) return false;
      if (route.pramanId && praman.id !== route.pramanId) return false;
      return true;
    });
  }, [pramans, route.granthId, route.pramanId, route.topicId]);
  const ranked = useMemo(
    () =>
      rankBySearch(filtered, query, (praman) => [
        praman.title,
        praman.description,
        praman.topic_title,
        praman.granth_title,
        praman.granth_auther,
      ]),
    [filtered, query],
  );
  const resetKey = `${query}|${cols}|${route.topicId ?? ""}|${route.granthId ?? ""}|${route.pramanId ?? ""}`;
  const step = cols === 1 ? 8 : 12;
  const { count, ref } = useSlice(resetKey, ranked.length, step);

  return (
    <section>
      <header className="page-header">
        <div className="page-title">
          <IconBox tone="gold">
            <ImageIcon />
          </IconBox>
          <div>
            <h2>प्रमाण</h2>
            <p className="subtitle">शास्त्र प्रमाण</p>
          </div>
        </div>
        <div className="granth-tools">
          <div className="grid-switch" role="group" aria-label="प्रमाण ग्रिड">
            {([1, 2] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={cols === size ? "active" : ""}
                onClick={() => {
                  setCols(size);
                  localStorage.setItem("praman-cols", String(size));
                }}
              >
                {size}×{size}
              </button>
            ))}
          </div>
          <form className="search-row" onSubmit={(event) => event.preventDefault()}>
            <input
              className="form-control"
              value={query}
              lang="hi"
              placeholder="प्रमाण खोजें — mans, मृत्यु"
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
        </div>
      </header>
      {topic || granth ? (
        <div className="filter-banner">
          <p>
            {topic ? (
              <>
                <b>विषय:</b> {topic.title}
              </>
            ) : null}
            {granth ? (
              <>
                <b>ग्रंथ:</b> {granth.title}
              </>
            ) : null}
          </p>
          <button className="pill" type="button" onClick={() => go("#/pramans")}>
            सभी प्रमाण
          </button>
        </div>
      ) : null}
      <div className={`card-grid praman-grid cols-${cols}`}>
        {ranked.slice(0, count).map((praman, index) => (
          <PramanCard
            key={praman.id}
            praman={praman}
            index={index + 1}
            total={ranked.length}
            onOpen={onOpen}
            onTopic={() => go(`#/pramans?topic=${praman.topic_id}`)}
            onGranth={() => go(`#/pramans?granth=${praman.granth_id}`)}
            onShare={() => void shareLink(praman.title, `#/pramans?id=${praman.id}`)}
          />
        ))}
      </div>
      {ranked.length === 0 ? (
        <Empty title="कोई प्रमाण नहीं" body="इस चयन में प्रमाण नहीं मिले, या सिंक अभी चल रहा है।" />
      ) : null}
      <div ref={ref} className="scroll-sentinel" />
    </section>
  );
}

function PramanCard({
  praman,
  index,
  total,
  onOpen,
  onTopic,
  onGranth,
  onShare,
}: {
  praman: Praman;
  index: number;
  total: number;
  onOpen: (paths: string[]) => void;
  onTopic: () => void;
  onGranth: () => void;
  onShare: () => void;
}) {
  const [play, setPlay] = useState(false);
  const video = youtubeId(praman.youtube_url);
  const shots = [praman.image_path, praman.granth_image, praman.editorImagePath]
    .map(mediaPath)
    .filter((value): value is string => Boolean(value));
  const start = Number(praman.youtube_start) || 0;
  return (
    <article className="card praman-card">
      <div className="praman-body">
        <div className="thumb-row">
          <MediaImage
            path={praman.granth_image}
            alt=""
            className="thumb"
            onClick={() => onOpen(shots)}
            save={{ title: praman.granth_title, text: praman.title, topic: praman.topic_title, granth: praman.granth_title }}
          />
          <MediaImage
            path={praman.editorImagePath}
            alt=""
            className="thumb"
            onClick={() => onOpen(shots)}
          />
          {praman.is_favorate === "1" ? <span className="fav">मुख्य</span> : null}
        </div>
        <h3 className="card-title">
          <RichText text={praman.title} />
        </h3>
        {praman.description ? (
          <p className="card-desc">
            <RichText text={praman.description} />
          </p>
        ) : null}
      </div>
      <MediaImage
        path={praman.image_path}
        alt={praman.title}
        className="proof"
        onClick={() => onOpen(shots)}
        save={{ title: praman.title, text: praman.description, topic: praman.topic_title, granth: praman.granth_title }}
      />
      {video ? (
        <div className="video-block">
          {play ? (
            <iframe
              title={praman.title}
              src={`https://www.youtube.com/embed/${video}${start ? `?start=${start}` : ""}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button className="pill pill-maroon" type="button" onClick={() => setPlay(true)}>
              वीडियो चलाएँ {start ? `(${start}s)` : ""}
            </button>
          )}
          {praman.youtube_desc ? <p className="card-desc">{praman.youtube_desc}</p> : null}
          <p className="fine">वीडियो चलाने के लिए इंटरनेट चाहिए। पेज की तस्वीर ऑफलाइन रहती है।</p>
        </div>
      ) : null}
      <div className="praman-body">
        <div className="card-meta">
          {praman.topic_title ? (
            <button className="pill pill-topic" type="button" onClick={onTopic}>
              {praman.topic_title}
            </button>
          ) : null}
          {praman.granth_title ? (
            <button className="pill" type="button" onClick={onGranth}>
              <Library /> {praman.granth_title}
            </button>
          ) : null}
          <span className="pill">
            <Library /> {index}/{total}
          </span>
          <button className="pill" type="button" onClick={onShare}>
            <Share2 /> Share
          </button>
          <button
            className="pill pill-maroon"
            type="button"
            onClick={() =>
              void downloadCardPdf(
                praman.title,
                praman.granth_title,
                praman.description,
                praman.topic_title,
                praman.image_path,
                `praman-${praman.id}`,
                praman.topic_title,
                praman.granth_title,
              )
            }
          >
            PDF
          </button>
        </div>
      </div>
    </article>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function Lightbox({ paths, onClose }: { paths: string[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="प्रमाण चित्र">
      <button className="lightbox-close" type="button" onClick={onClose}>
        <X /> बंद
      </button>
      <div className="lightbox-scroll">
        {paths.map((path) => (
          <MediaImage key={path} path={path} alt="प्रमाण" className="lightbox-img" />
        ))}
      </div>
    </div>
  );
}
