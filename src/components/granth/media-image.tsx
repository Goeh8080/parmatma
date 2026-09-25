import { useEffect, useState } from "react";
import { readImage, saveGalleryItem, writeImage } from "@/lib/granth/db";
import { mediaPath, mediaUrl } from "@/lib/granth/media";
import { ping, saveBlob } from "@/lib/granth/files";

type SaveMeta = {
  title: string;
  text: string;
  topic: string;
  granth: string;
};

type MediaImageProps = {
  path: string | null | undefined;
  alt: string;
  className?: string;
  onClick?: () => void;
  onView?: () => void;
  save?: SaveMeta | null;
};

export function MediaImage({ path, alt, className, onClick, onView, save }: MediaImageProps) {
  const normalized = mediaPath(path);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!normalized) return;
    let blobUrl: string | null = null;
    let cancel = false;
    void (async () => {
      try {
        const blob = await readImage(normalized);
        if (cancel) return;
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          setSrc(blobUrl);
          return;
        }
      } catch {
        /* network fallback */
      }
      if (!cancel) setSrc(mediaUrl(normalized));
    })();
    return () => {
      cancel = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [normalized]);

  if (!normalized) return null;
  if (!src) return <div className={`img-skeleton ${className ?? ""}`} aria-hidden="true" />;

  const onSave = async () => {
    if (!save) return;
    try {
      let blob = await readImage(normalized);
      if (!blob) {
        const response = await fetch(mediaUrl(normalized));
        if (!response.ok) throw new Error("image");
        blob = await response.blob();
        await writeImage(normalized, blob);
      }
      const fileName = normalized.split("/").pop() || "image.jpg";
      await saveGalleryItem({
        id: `img-${normalized}`,
        kind: "image",
        title: save.title,
        text: save.text,
        topic: save.topic,
        granth: save.granth,
        folderId: "",
        createdAt: Date.now(),
        size: blob.size,
        fileName,
        blob,
      });
      saveBlob(blob, fileName);
      ping("Image saved");
    } catch {
      ping("Download failed");
    }
  };

  return (
    <span className={`shot ${className ?? ""}`}>
      <img src={src} alt={alt} className="shot-img" loading="lazy" onClick={onClick} />
      {onView ? (
        <button
          className="shot-view"
          type="button"
          aria-label="ग्रंथ का चित्र देखें"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      ) : null}
      {save ? (
        <button
          className="shot-save"
          type="button"
          aria-label="चित्र सेव करें"
          onClick={(event) => {
            event.stopPropagation();
            void onSave();
          }}
        >
          ↓
        </button>
      ) : null}
    </span>
  );
}
