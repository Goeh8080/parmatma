import { create } from "zustand";
import { countImages, hasImage, readCatalog, readImage, writeCatalog, writeImage } from "./db";
import { mediaPath, mediaUrl } from "./media";
import type { ApiEnvelope, Catalog, Granth, Praman, Topic } from "./types";

export type SyncStatus = "booting" | "syncing" | "ready" | "offline" | "error";

type ImageJob = {
  done: number;
  total: number;
  running: boolean;
};

type GranthState = {
  topics: Topic[];
  granths: Granth[];
  pramans: Praman[];
  syncedAt: number | null;
  status: SyncStatus;
  online: boolean;
  error: string | null;
  images: ImageJob;
  booted: boolean;
  boot: () => Promise<void>;
  sync: () => Promise<void>;
  savePages: () => void;
};

let bootOnce: Promise<void> | null = null;
let saveToken = 0;

async function pullList<T>(request: string): Promise<T[]> {
  const response = await fetch(`/api/granth?request=${request}`);
  if (!response.ok) throw new Error(`${request} failed`);
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!body.success || !Array.isArray(body.data)) throw new Error(`${request} empty`);
  return body.data;
}

function collectImagePaths(catalog: Catalog): string[] {
  const paths: string[] = [];
  const push = (value: string | null | undefined) => {
    const path = mediaPath(value);
    if (path) paths.push(path);
  };
  for (const granth of catalog.granths) {
    push(granth.imagePath);
    push(granth.editorImagePath);
  }
  for (const praman of catalog.pramans) {
    push(praman.image_path);
    push(praman.granth_image);
    push(praman.editorImagePath);
  }
  return [...new Set(paths)];
}

async function cacheImage(path: string): Promise<boolean> {
  if (await hasImage(path)) return true;
  const response = await fetch(mediaUrl(path));
  if (!response.ok) return false;
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size < 32) return false;
  await writeImage(path, blob);
  return true;
}

export const useGranth = create<GranthState>((set, get) => ({
  topics: [],
  granths: [],
  pramans: [],
  syncedAt: null,
  status: "booting",
  online: true,
  error: null,
  images: { done: 0, total: 0, running: false },
  booted: false,
  boot: () => {
    if (bootOnce) return bootOnce;
    bootOnce = (async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      set({ online, booted: true });
      try {
        const cached = await readCatalog();
        if (cached) {
          const saved = await countImages().catch(() => 0);
          set({
            topics: cached.topics,
            granths: cached.granths,
            pramans: cached.pramans,
            syncedAt: cached.syncedAt,
            status: online ? "ready" : "offline",
            images: { done: saved, total: collectImagePaths(cached).length, running: false },
          });
        }
      } catch {
        /* first run has no store */
      }
      if (online) {
        await get().sync();
        get().savePages();
      } else if (!get().syncedAt) {
        set({ status: "offline", error: "पहली बार इंटरनेट चाहिए, फिर ऐप ऑफलाइन चलेगा।" });
      }
    })();
    return bootOnce;
  },
  sync: async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ online: false, status: get().syncedAt ? "offline" : "error" });
      return;
    }
    set({ status: "syncing", online: true, error: null });
    try {
      const [topics, granths, pramans] = await Promise.all([
        pullList<Topic>("getTopics"),
        pullList<Granth>("getGranths"),
        pullList<Praman>("getPramans"),
      ]);
      const catalog: Catalog = { topics, granths, pramans, syncedAt: Date.now() };
      await writeCatalog(catalog);
      const saved = await countImages().catch(() => 0);
      set({
        topics,
        granths,
        pramans,
        syncedAt: catalog.syncedAt,
        status: "ready",
        error: null,
        images: { done: saved, total: collectImagePaths(catalog).length, running: get().images.running },
      });
    } catch {
      const hasCache = Boolean(get().syncedAt);
      set({
        status: hasCache ? "ready" : "error",
        error: hasCache
          ? "नया डेटा नहीं मिला। सेव की हुई कॉपी चल रही है।"
          : "डेटा नहीं आ पाया। इंटरनेट चेक करके फिर सिंक करें।",
      });
    }
  },
  savePages: () => {
    const catalog: Catalog = {
      topics: get().topics,
      granths: get().granths,
      pramans: get().pramans,
      syncedAt: get().syncedAt ?? Date.now(),
    };
    const paths = collectImagePaths(catalog);
    if (!paths.length) return;
    const token = ++saveToken;
    set({ images: { done: get().images.done, total: paths.length, running: true } });
    void (async () => {
      const pending: string[] = [];
      let done = 0;
      for (const path of paths) {
        if (token !== saveToken) return;
        if (await hasImage(path)) done += 1;
        else pending.push(path);
      }
      if (token !== saveToken) return;
      set({ images: { done, total: paths.length, running: pending.length > 0 } });
      let cursor = 0;
      const worker = async () => {
        while (token === saveToken) {
          const index = cursor;
          cursor += 1;
          if (index >= pending.length) return;
          const path = pending[index];
          if (!path) return;
          try {
            await cacheImage(path);
          } catch {
            /* keep going — text library still works */
          }
          done += 1;
          if (token === saveToken && (done % 3 === 0 || done === paths.length)) {
            set({ images: { done, total: paths.length, running: done < paths.length } });
          }
        }
      };
      await Promise.all([worker(), worker()]);
      if (token === saveToken) {
        set({ images: { done: paths.length, total: paths.length, running: false } });
      }
    })();
  },
}));

export async function cachedObjectUrl(path: string): Promise<string | null> {
  const blob = await readImage(path);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
