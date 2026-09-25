import type { Catalog, GalleryFolder, GalleryItem } from "./types";

const DB_NAME = "granth-offline";
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("offline store unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("images")) db.createObjectStore("images");
      if (!db.objectStoreNames.contains("gallery")) db.createObjectStore("gallery", { keyPath: "id" });
      if (!db.objectStoreNames.contains("folders")) db.createObjectStore("folders", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("idb tx aborted"));
  });
}

export async function readCatalog(): Promise<Catalog | null> {
  const db = await openDb();
  const tx = db.transaction("meta", "readonly");
  const value = await new Promise<Catalog | undefined>((resolve, reject) => {
    const request = tx.objectStore("meta").get("catalog");
    request.onsuccess = () => resolve(request.result as Catalog | undefined);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  if (!value || !Array.isArray(value.topics)) return null;
  return value;
}

export async function writeCatalog(catalog: Catalog): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put(catalog, "catalog");
  await txDone(tx);
}

export async function readImage(path: string): Promise<Blob | null> {
  const db = await openDb();
  const tx = db.transaction("images", "readonly");
  const value = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = tx.objectStore("images").get(path);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  return value ?? null;
}

export async function hasImage(path: string): Promise<boolean> {
  const db = await openDb();
  const tx = db.transaction("images", "readonly");
  const value = await new Promise<number>((resolve, reject) => {
    const request = tx.objectStore("images").count(path);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  return value > 0;
}

export async function writeImage(path: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("images", "readwrite");
  tx.objectStore("images").put(blob, path);
  await txDone(tx);
}

export async function countImages(): Promise<number> {
  const db = await openDb();
  const tx = db.transaction("images", "readonly");
  const value = await new Promise<number>((resolve, reject) => {
    const request = tx.objectStore("images").count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  return value;
}

export async function listFolders(): Promise<GalleryFolder[]> {
  const db = await openDb();
  const tx = db.transaction("folders", "readonly");
  const value = await new Promise<GalleryFolder[]>((resolve, reject) => {
    const request = tx.objectStore("folders").getAll();
    request.onsuccess = () => resolve((request.result as GalleryFolder[]) ?? []);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  return value.sort((a, b) => a.name.localeCompare(b.name, "hi"));
}

export async function saveFolder(folder: GalleryFolder): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("folders", "readwrite");
  tx.objectStore("folders").put(folder);
  await txDone(tx);
}

export async function removeFolder(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["folders", "gallery"], "readwrite");
  tx.objectStore("folders").delete(id);
  const gallery = tx.objectStore("gallery");
  const items = await new Promise<GalleryItem[]>((resolve, reject) => {
    const request = gallery.getAll();
    request.onsuccess = () => resolve((request.result as GalleryItem[]) ?? []);
    request.onerror = () => reject(request.error);
  });
  for (const item of items) {
    if (item.folderId === id) gallery.put({ ...item, folderId: "" });
  }
  await txDone(tx);
}

export async function listGallery(): Promise<GalleryItem[]> {
  const db = await openDb();
  const tx = db.transaction("gallery", "readonly");
  const value = await new Promise<GalleryItem[]>((resolve, reject) => {
    const request = tx.objectStore("gallery").getAll();
    request.onsuccess = () => resolve((request.result as GalleryItem[]) ?? []);
    request.onerror = () => reject(request.error);
  });
  await txDone(tx);
  return value.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("gallery", "readwrite");
  tx.objectStore("gallery").put(item);
  await txDone(tx);
}

export async function removeGalleryItem(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("gallery", "readwrite");
  tx.objectStore("gallery").delete(id);
  await txDone(tx);
}
