import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RefreshCw, c as Library, d as Image, f as FolderPlus, i as Share2, l as Landmark, o as PenLine, p as ClipboardList, r as Trash2, s as Menu, t as X, u as Images } from "../_libs/lucide-react.mjs";
import { i as youtubeId, n as mediaPath, r as mediaUrl } from "./router-DDqPdInV.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as fontkit } from "../_libs/pako+pdf-lib__fontkit.mjs";
import { n as rgb, t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-hZ5QHP05.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DB_NAME = "granth-offline";
var DB_VERSION = 2;
function openDb() {
	if (typeof indexedDB === "undefined") return Promise.reject(/* @__PURE__ */ new Error("offline store unavailable"));
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
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("idb open failed"));
	});
}
function txDone(tx) {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error ?? /* @__PURE__ */ new Error("idb tx failed"));
		tx.onabort = () => reject(tx.error ?? /* @__PURE__ */ new Error("idb tx aborted"));
	});
}
async function readCatalog() {
	const tx = (await openDb()).transaction("meta", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("meta").get("catalog");
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	if (!value || !Array.isArray(value.topics)) return null;
	return value;
}
async function writeCatalog(catalog) {
	const tx = (await openDb()).transaction("meta", "readwrite");
	tx.objectStore("meta").put(catalog, "catalog");
	await txDone(tx);
}
async function readImage(path) {
	const tx = (await openDb()).transaction("images", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("images").get(path);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	return value ?? null;
}
async function hasImage(path) {
	const tx = (await openDb()).transaction("images", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("images").count(path);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	return value > 0;
}
async function writeImage(path, blob) {
	const tx = (await openDb()).transaction("images", "readwrite");
	tx.objectStore("images").put(blob, path);
	await txDone(tx);
}
async function countImages() {
	const tx = (await openDb()).transaction("images", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("images").count();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	return value;
}
async function listFolders() {
	const tx = (await openDb()).transaction("folders", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("folders").getAll();
		request.onsuccess = () => resolve(request.result ?? []);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	return value.sort((a, b) => a.name.localeCompare(b.name, "hi"));
}
async function saveFolder(folder) {
	const tx = (await openDb()).transaction("folders", "readwrite");
	tx.objectStore("folders").put(folder);
	await txDone(tx);
}
async function removeFolder(id) {
	const tx = (await openDb()).transaction(["folders", "gallery"], "readwrite");
	tx.objectStore("folders").delete(id);
	const gallery = tx.objectStore("gallery");
	const items = await new Promise((resolve, reject) => {
		const request = gallery.getAll();
		request.onsuccess = () => resolve(request.result ?? []);
		request.onerror = () => reject(request.error);
	});
	for (const item of items) if (item.folderId === id) gallery.put({
		...item,
		folderId: ""
	});
	await txDone(tx);
}
async function listGallery() {
	const tx = (await openDb()).transaction("gallery", "readonly");
	const value = await new Promise((resolve, reject) => {
		const request = tx.objectStore("gallery").getAll();
		request.onsuccess = () => resolve(request.result ?? []);
		request.onerror = () => reject(request.error);
	});
	await txDone(tx);
	return value.sort((a, b) => b.createdAt - a.createdAt);
}
async function saveGalleryItem(item) {
	const tx = (await openDb()).transaction("gallery", "readwrite");
	tx.objectStore("gallery").put(item);
	await txDone(tx);
}
async function removeGalleryItem(id) {
	const tx = (await openDb()).transaction("gallery", "readwrite");
	tx.objectStore("gallery").delete(id);
	await txDone(tx);
}
var bootOnce = null;
var saveToken = 0;
async function pullList(request) {
	const response = await fetch(`/api/granth?request=${request}`);
	if (!response.ok) throw new Error(`${request} failed`);
	const body = await response.json();
	if (!body.success || !Array.isArray(body.data)) throw new Error(`${request} empty`);
	return body.data;
}
function collectImagePaths(catalog) {
	const paths = [];
	const push = (value) => {
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
async function cacheImage(path) {
	if (await hasImage(path)) return true;
	const response = await fetch(mediaUrl(path));
	if (!response.ok) return false;
	const blob = await response.blob();
	if (!blob.type.startsWith("image/") || blob.size < 32) return false;
	await writeImage(path, blob);
	return true;
}
var useGranth = create((set, get) => ({
	topics: [],
	granths: [],
	pramans: [],
	syncedAt: null,
	status: "booting",
	online: true,
	error: null,
	images: {
		done: 0,
		total: 0,
		running: false
	},
	booted: false,
	boot: () => {
		if (bootOnce) return bootOnce;
		bootOnce = (async () => {
			const online = typeof navigator === "undefined" ? true : navigator.onLine;
			set({
				online,
				booted: true
			});
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
						images: {
							done: saved,
							total: collectImagePaths(cached).length,
							running: false
						}
					});
				}
			} catch {}
			if (online) {
				await get().sync();
				get().savePages();
			} else if (!get().syncedAt) set({
				status: "offline",
				error: "पहली बार इंटरनेट चाहिए, फिर ऐप ऑफलाइन चलेगा।"
			});
		})();
		return bootOnce;
	},
	sync: async () => {
		if (typeof navigator !== "undefined" && !navigator.onLine) {
			set({
				online: false,
				status: get().syncedAt ? "offline" : "error"
			});
			return;
		}
		set({
			status: "syncing",
			online: true,
			error: null
		});
		try {
			const [topics, granths, pramans] = await Promise.all([
				pullList("getTopics"),
				pullList("getGranths"),
				pullList("getPramans")
			]);
			const catalog = {
				topics,
				granths,
				pramans,
				syncedAt: Date.now()
			};
			await writeCatalog(catalog);
			const saved = await countImages().catch(() => 0);
			set({
				topics,
				granths,
				pramans,
				syncedAt: catalog.syncedAt,
				status: "ready",
				error: null,
				images: {
					done: saved,
					total: collectImagePaths(catalog).length,
					running: get().images.running
				}
			});
		} catch {
			const hasCache = Boolean(get().syncedAt);
			set({
				status: hasCache ? "ready" : "error",
				error: hasCache ? "नया डेटा नहीं मिला। सेव की हुई कॉपी चल रही है।" : "डेटा नहीं आ पाया। इंटरनेट चेक करके फिर सिंक करें।"
			});
		}
	},
	savePages: () => {
		const paths = collectImagePaths({
			topics: get().topics,
			granths: get().granths,
			pramans: get().pramans,
			syncedAt: get().syncedAt ?? Date.now()
		});
		if (!paths.length) return;
		const token = ++saveToken;
		set({ images: {
			done: get().images.done,
			total: paths.length,
			running: true
		} });
		(async () => {
			const pending = [];
			let done = 0;
			for (const path of paths) {
				if (token !== saveToken) return;
				if (await hasImage(path)) done += 1;
				else pending.push(path);
			}
			if (token !== saveToken) return;
			set({ images: {
				done,
				total: paths.length,
				running: pending.length > 0
			} });
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
					} catch {}
					done += 1;
					if (token === saveToken && (done % 3 === 0 || done === paths.length)) set({ images: {
						done,
						total: paths.length,
						running: done < paths.length
					} });
				}
			};
			await Promise.all([worker(), worker()]);
			if (token === saveToken) set({ images: {
				done: paths.length,
				total: paths.length,
				running: false
			} });
		})();
	}
}));
var MATRAS = /[\u093e\u093f\u0940\u0941\u0942\u0943\u0944\u0947\u0948\u094b\u094c\u0902\u0901\u094d\u093c\u200c\u200d]/g;
var CLUSTERS = [
	[
		"मांस",
		"mans",
		"maans",
		"maas",
		"meat"
	],
	[
		"मृत्यु",
		"मरण",
		"मौत",
		"mrityu",
		"mrutyu",
		"maran",
		"death"
	],
	[
		"ब्रह्मा",
		"ब्रह्म",
		"brahma",
		"brahm",
		"bramha",
		"brahmaa"
	],
	[
		"कृष्ण",
		"krishna",
		"krishan",
		"kishan"
	],
	[
		"कबीर",
		"kabir",
		"kabeer"
	],
	[
		"गीता",
		"gita",
		"geeta"
	],
	[
		"मोक्ष",
		"मुक्ति",
		"moksh",
		"moksha"
	],
	[
		"तीर्थ",
		"teerth",
		"tirth"
	],
	[
		"राम",
		"raam",
		"ram"
	],
	[
		"शिव",
		"shiv",
		"shiva"
	],
	[
		"वेद",
		"ved",
		"veda"
	]
];
var CONS = {
	क: "k",
	ख: "kh",
	ग: "g",
	घ: "gh",
	ङ: "ng",
	च: "ch",
	छ: "chh",
	ज: "j",
	झ: "jh",
	ञ: "ny",
	ट: "t",
	ठ: "th",
	ड: "d",
	ढ: "dh",
	ण: "n",
	त: "t",
	थ: "th",
	द: "d",
	ध: "dh",
	न: "n",
	प: "p",
	फ: "ph",
	ब: "b",
	भ: "bh",
	म: "m",
	य: "y",
	र: "r",
	ल: "l",
	व: "v",
	श: "sh",
	ष: "sh",
	स: "s",
	ह: "h",
	क्ष: "ksh",
	त्र: "tr",
	ज्ञ: "gy"
};
var VOWEL_SIGN = {
	"ा": "a",
	"ि": "i",
	"ी": "i",
	"ु": "u",
	"ू": "u",
	"ृ": "ri",
	"े": "e",
	"ै": "e",
	"ो": "o",
	"ौ": "o",
	"ं": "n",
	"ँ": "n",
	"्": "",
	"़": ""
};
var INDEP = {
	अ: "a",
	आ: "a",
	इ: "i",
	ई: "i",
	उ: "u",
	ऊ: "u",
	ए: "e",
	ऐ: "e",
	ओ: "o",
	औ: "o",
	ऋ: "ri"
};
function normalizeText(value) {
	return value.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function stripMatras(value) {
	return normalizeText(value).replace(MATRAS, "");
}
function romanize(value) {
	const text = normalizeText(value);
	let out = "";
	const chars = [...text];
	for (let i = 0; i < chars.length; i += 1) {
		const ch = chars[i] ?? "";
		const next = chars[i + 1] ?? "";
		const pair = ch + next;
		if (CONS[pair]) {
			out += CONS[pair];
			i += 1;
			if ((chars[i + 1] ?? "") === "्") {
				i += 1;
				continue;
			}
			const sign = chars[i + 1] ?? "";
			if (VOWEL_SIGN[sign] !== void 0) {
				out += VOWEL_SIGN[sign];
				i += 1;
			} else if (ch !== " " && !INDEP[ch]) out += "a";
			continue;
		}
		if (CONS[ch]) {
			out += CONS[ch];
			if (next === "्") {
				i += 1;
				continue;
			}
			if (VOWEL_SIGN[next] !== void 0) {
				out += VOWEL_SIGN[next];
				i += 1;
			} else out += "a";
			continue;
		}
		if (VOWEL_SIGN[ch] !== void 0) {
			out += VOWEL_SIGN[ch];
			continue;
		}
		if (INDEP[ch]) {
			out += INDEP[ch];
			continue;
		}
		if (ch === " ") out += " ";
		else if (/[a-z0-9]/.test(ch)) out += ch;
	}
	return out.replace(/\s+/g, " ").trim();
}
function transliterateQuery(query) {
	const base = normalizeText(query);
	const forms = /* @__PURE__ */ new Set([
		base,
		romanize(base),
		stripMatras(base)
	]);
	for (const cluster of CLUSTERS) if (cluster.some((term) => {
		const n = normalizeText(term);
		return base.includes(n) || n.includes(base) || romanize(term) === romanize(base);
	})) for (const term of cluster) {
		forms.add(normalizeText(term));
		forms.add(romanize(term));
	}
	return [...forms].filter((item) => item.length > 0);
}
function levenshtein(a, b) {
	if (a === b) return 0;
	if (!a.length) return b.length;
	if (!b.length) return a.length;
	const row = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i += 1) {
		let prev = i - 1;
		row[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const temp = row[j] ?? 0;
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, prev + cost);
			prev = temp;
		}
	}
	return row[b.length] ?? 0;
}
function fuzzyMatch(query, text) {
	const q = romanize(query);
	const t = romanize(text);
	if (!q || !t) return 0;
	if (t.includes(q) || stripMatras(text).includes(stripMatras(query))) return 1;
	const limit = q.length <= 4 ? 1 : 2;
	if (levenshtein(q, t) <= limit) return .8;
	return t.split(" ").some((token) => levenshtein(q, token) <= limit || token.startsWith(q)) ? .7 : 0;
}
function calculateRelevance(query, fields) {
	const raw = query.trim();
	if (!raw) return 1;
	const forms = transliterateQuery(raw);
	let best = 0;
	const blob = fields.filter(Boolean).join("\n");
	const norm = normalizeText(blob);
	const roman = romanize(blob);
	const bare = stripMatras(blob);
	for (const form of forms) {
		if (!form) continue;
		if (norm.includes(form)) best = Math.max(best, form === normalizeText(raw) ? 100 : 72);
		if (bare.includes(stripMatras(form))) best = Math.max(best, 68);
		if (roman.includes(romanize(form))) best = Math.max(best, 80);
		const fuzzy = fuzzyMatch(form, blob);
		if (fuzzy) best = Math.max(best, Math.round(fuzzy * 60));
	}
	return best;
}
function rankBySearch(rows, query, fields) {
	const q = query.trim();
	if (!q) return rows;
	return rows.map((row) => ({
		row,
		score: calculateRelevance(q, fields(row))
	})).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.row);
}
var fontPromise = null;
function loadFont() {
	fontPromise ??= fetch("/fonts/NotoSansDevanagari-Regular.ttf").then((response) => {
		if (!response.ok) throw new Error("font missing");
		return response.arrayBuffer();
	});
	return fontPromise;
}
function wrapLines(font, text, size, maxWidth) {
	const lines = [];
	for (const paragraph of text.split(/\n/)) {
		const words = paragraph.split(/\s+/).filter(Boolean);
		if (!words.length) {
			lines.push("");
			continue;
		}
		let line = "";
		for (const word of words) {
			const next = line ? `${line} ${word}` : word;
			if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
			else {
				if (line) lines.push(line);
				line = word;
			}
		}
		if (line) lines.push(line);
	}
	return lines;
}
async function imagePng(blob) {
	if (blob.type === "image/png") return new Uint8Array(await blob.arrayBuffer());
	if (blob.type === "image/jpeg") return new Uint8Array(await blob.arrayBuffer());
	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
	const png = await new Promise((resolve, reject) => {
		canvas.toBlob((value) => value ? resolve(value) : reject(/* @__PURE__ */ new Error("png")), "image/png");
	});
	return new Uint8Array(await png.arrayBuffer());
}
async function buildCardPdf(input) {
	const doc = await PDFDocument.create();
	doc.registerFontkit(fontkit);
	const font = await doc.embedFont(await loadFont(), { subset: true });
	const ink = rgb(.24, .12, 0);
	const maroon = rgb(.48, .12, .18);
	const margin = 40;
	const pageWidth = 595;
	const pageHeight = 842;
	let page = doc.addPage([pageWidth, pageHeight]);
	let y = 802;
	const newPage = () => {
		page = doc.addPage([pageWidth, pageHeight]);
		y = 802;
		return page;
	};
	const writeLines = (text, size, color, gap = 4) => {
		for (const line of wrapLines(font, text, size, 515)) {
			if (y < margin + size) newPage();
			page.drawText(line || " ", {
				x: margin,
				y,
				size,
				font,
				color
			});
			y -= size + gap;
		}
	};
	writeLines(input.title || "ग्रंथ", 16, maroon, 6);
	if (input.subtitle) writeLines(input.subtitle, 11, rgb(.75, .42, .08), 8);
	if (input.imageBlob && input.imageBlob.size > 32) try {
		const bytes = await imagePng(input.imageBlob);
		const image = input.imageBlob.type === "image/jpeg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
		const scale = Math.min(515 / image.width, 420 / image.height, 1);
		const w = image.width * scale;
		const h = image.height * scale;
		if (y - h < margin) newPage();
		y -= h;
		page.drawImage(image, {
			x: margin,
			y,
			width: w,
			height: h
		});
		y -= 16;
	} catch {
		writeLines("(चित्र इस पेज पर नहीं जुड़ सका)", 10, ink);
	}
	if (input.body) writeLines(input.body, 12, ink, 5);
	if (input.meta) {
		y -= 8;
		writeLines(input.meta, 10, maroon, 4);
	}
	const bytes = await doc.save();
	return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
}
function saveBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function ping(message) {
	window.dispatchEvent(new CustomEvent("granth-toast", { detail: message }));
}
function MediaImage({ path, alt, className, onClick, save }) {
	const normalized = mediaPath(path);
	const [src, setSrc] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!normalized) return;
		let blobUrl = null;
		let cancel = false;
		(async () => {
			try {
				const blob = await readImage(normalized);
				if (cancel) return;
				if (blob) {
					blobUrl = URL.createObjectURL(blob);
					setSrc(blobUrl);
					return;
				}
			} catch {}
			if (!cancel) setSrc(mediaUrl(normalized));
		})();
		return () => {
			cancel = true;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [normalized]);
	if (!normalized) return null;
	if (!src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `img-skeleton ${className ?? ""}`,
		"aria-hidden": "true"
	});
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
				blob
			});
			saveBlob(blob, fileName);
			ping("Image saved");
		} catch {
			ping("Download failed");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `shot ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt,
			className: "shot-img",
			loading: "lazy",
			onClick
		}), save ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: "shot-save",
			type: "button",
			"aria-label": "चित्र सेव करें",
			onClick: () => void onSave(),
			children: "↓"
		}) : null]
	});
}
function MalaMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "mala",
		viewBox: "0 0 48 48",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "mala-ring",
				cx: "24",
				cy: "24",
				r: "15"
			}),
			Array.from({ length: 14 }, (_, index) => {
				const angle = index / 14 * Math.PI * 2 - Math.PI / 2;
				const cx = (24 + Math.cos(angle) * 15).toFixed(2);
				const cy = (24 + Math.sin(angle) * 15).toFixed(2);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					className: "mala-bead",
					cx,
					cy,
					r: "2.15"
				}, index);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "mala-guru",
				cx: "24",
				cy: "7.2",
				r: "3.3"
			})
		]
	});
}
function RichText({ text }) {
	const lines = text.split("\n");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [index > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}) : null, line] }, `${index}-${line.slice(0, 12)}`)) });
}
function IconBox({ tone, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `icon-box tone-${tone} ${className ?? ""}`,
		children
	});
}
function useSlice(resetKey, total, step = 18) {
	const [count, setCount] = (0, import_react.useState)(step);
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setCount(step);
	}, [resetKey, step]);
	(0, import_react.useEffect)(() => {
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) setCount((value) => Math.min(total, value + step));
		}, { rootMargin: "640px" });
		observer.observe(node);
		return () => observer.disconnect();
	}, [
		resetKey,
		step,
		total
	]);
	return {
		count: Math.min(count, total),
		ref
	};
}
async function shareLink(title, hash) {
	const url = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
	if (navigator.share) try {
		await navigator.share({
			title,
			url
		});
		return;
	} catch {
		return;
	}
	try {
		await navigator.clipboard.writeText(url);
		window.dispatchEvent(new CustomEvent("granth-toast", { detail: "लिंक कॉपी हो गया" }));
	} catch {
		window.prompt("यह लिंक कॉपी करें", url);
	}
}
function Dashboard({ go }) {
	const topics = useGranth((state) => state.topics.length);
	const granths = useGranth((state) => state.granths.length);
	const pramans = useGranth((state) => state.pramans.length);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "page-header",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
					tone: "saffron",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Dashboard" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subtitle",
					children: "Overview of your Granth collection"
				})] })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "dash-grid",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "dash-card",
					type: "button",
					onClick: () => go("#/topics"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
						tone: "saffron",
						className: "dash-glyph",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-num",
						children: topics || "—"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-lbl",
						children: "Topics"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "dash-card",
					type: "button",
					onClick: () => go("#/granths"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
						tone: "maroon",
						className: "dash-glyph",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-num",
						children: granths || "—"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-lbl",
						children: "Granths"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "dash-card",
					type: "button",
					onClick: () => go("#/pramans"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
						tone: "gold",
						className: "dash-glyph",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-num",
						children: pramans || "—"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dash-lbl",
						children: "Pramans"
					})] })]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "note-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "सत साहेब जी" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "जो प्रमाण समय पर याद नहीं रहते, यह ग्रंथ प्रबंधन उन्हें विषय और ग्रंथ के साथ एक जगह रखता है। पहली बार इंटरनेट पर खुलते ही विषय, ग्रंथ और प्रमाण इस डिवाइस पर सेव हो जाते हैं — उसके बाद ऐप बिना नेट के खुलता है।" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"संपर्क:",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "mailto:sadgranthpraman@gmail.com",
						children: "sadgranthpraman@gmail.com"
					})
				] })
			]
		})
	] });
}
function TopicScreen({ go }) {
	const topics = useGranth((state) => state.topics);
	const [query, setQuery] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		return rankBySearch(topics, query, (topic) => [topic.title, topic.description]).sort((a, b) => query.trim() ? 0 : Number(a.position) - Number(b.position));
	}, [topics, query]);
	const { count, ref } = useSlice(query, filtered.length, 24);
	const total = filtered.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
					tone: "saffron",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Topics" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subtitle",
					children: "विषय / प्रश्नोत्तरी"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				className: "search-row",
				onSubmit: (event) => {
					event.preventDefault();
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "form-control",
					value: query,
					lang: "hi",
					placeholder: "विषय खोजें — mans, गीता, मृत्यु",
					onChange: (event) => setQuery(event.target.value)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "card-grid",
			children: filtered.slice(0, count).map((topic, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicCard, {
				topic,
				index: index + 1,
				total,
				onOpen: () => go(`#/pramans?topic=${topic.id}`),
				onShare: () => void shareLink(topic.title, `#/pramans?topic=${topic.id}`)
			}, topic.id))
		}),
		filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			title: "कोई विषय नहीं",
			body: "सिंक पूरा होने पर विषय यहाँ दिखेंगे।"
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "scroll-sentinel"
		})
	] });
}
function TopicCard({ topic, index, total, onOpen, onShare }) {
	const proofs = Number(topic.praman_count) || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-header",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "card-title",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpen,
						children: [
							topic.position,
							". ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: topic.title })
						]
					})
				})
			}),
			topic.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "card-desc",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: topic.description })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-meta",
				children: [
					proofs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill pill-maroon",
						type: "button",
						onClick: onOpen,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {}),
							" ",
							proofs,
							" Pramans"
						]
					}) : null,
					proofs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill",
						type: "button",
						onClick: onOpen,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {}),
							" ",
							index,
							"/",
							total
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill",
						type: "button",
						onClick: onShare,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {}), " Share"]
					})
				]
			})
		]
	});
}
function GranthScreen({ go, onOpen }) {
	const granths = useGranth((state) => state.granths);
	const [query, setQuery] = (0, import_react.useState)("");
	const [cols, setCols] = (0, import_react.useState)(1);
	(0, import_react.useEffect)(() => {
		const saved = Number(localStorage.getItem("granth-cols"));
		if (saved === 1 || saved === 2 || saved === 3) setCols(saved);
	}, []);
	const filtered = (0, import_react.useMemo)(() => {
		return rankBySearch(granths, query, (granth) => [
			granth.title,
			granth.author,
			granth.description
		]).sort((a, b) => query.trim() ? 0 : Number(a.position) - Number(b.position));
	}, [granths, query]);
	const step = cols === 1 ? 8 : cols === 2 ? 12 : 18;
	const { count, ref } = useSlice(`${query}|${cols}`, filtered.length, step);
	const pickCols = (next) => {
		setCols(next);
		localStorage.setItem("granth-cols", String(next));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
					tone: "maroon",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Granths" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subtitle",
					children: "Sacred texts and scriptures"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "granth-tools",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid-switch",
					role: "group",
					"aria-label": "ग्रंथ ग्रिड",
					children: [
						1,
						2,
						3
					].map((size) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: cols === size ? "active" : "",
						"aria-pressed": cols === size,
						onClick: () => pickCols(size),
						children: [
							size,
							"×",
							size
						]
					}, size))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					className: "search-row",
					onSubmit: (event) => event.preventDefault(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "form-control",
						value: query,
						lang: "hi",
						placeholder: "ग्रंथ का नाम — gita, kabir",
						onChange: (event) => setQuery(event.target.value)
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `card-grid granth-grid cols-${cols}`,
			children: filtered.slice(0, count).map((granth, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GranthCard, {
				granth,
				index: index + 1,
				total: filtered.length,
				onOpen: () => go(`#/pramans?granth=${granth.id}`),
				onShare: () => void shareLink(granth.title, `#/pramans?granth=${granth.id}`),
				onImage: () => {
					const paths = [granth.imagePath, granth.editorImagePath].map(mediaPath).filter(Boolean);
					if (paths.length) onOpen(paths);
				}
			}, granth.id))
		}),
		filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			title: "कोई ग्रंथ नहीं",
			body: "सिंक के बाद पवित्र ग्रंथ यहाँ खुलेंगे।"
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "scroll-sentinel"
		})
	] });
}
async function downloadCardPdf(title, subtitle, body, meta, image, id, topic = "", granth = "") {
	try {
		ping("PDF बन रहा है…");
		const path = mediaPath(image);
		let imageBlob = null;
		if (path) {
			imageBlob = await readImage(path);
			if (!imageBlob) {
				const response = await fetch(mediaUrl(path));
				if (response.ok) {
					imageBlob = await response.blob();
					await writeImage(path, imageBlob);
				}
			}
		}
		const blob = await buildCardPdf({
			title,
			subtitle,
			body,
			meta,
			imageBlob,
			fileName: `${id}.pdf`
		});
		const fileName = `${id}.pdf`;
		await saveGalleryItem({
			id: `pdf-${id}`,
			kind: "pdf",
			title,
			text: body,
			topic,
			granth: granth || subtitle,
			folderId: "",
			createdAt: Date.now(),
			size: blob.size,
			fileName,
			blob
		});
		saveBlob(blob, fileName);
		ping("PDF downloaded");
	} catch {
		ping("Download failed");
	}
}
function GranthCard({ granth, index, total, onOpen, onShare, onImage }) {
	const proofs = Number(granth.pramanCount) || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card granth-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-header",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "card-title",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onOpen,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: granth.title })
					})
				})
			}),
			granth.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "author",
				type: "button",
				onClick: onOpen,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, {}),
					" ",
					granth.author
				]
			}) : null,
			granth.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "card-desc",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: granth.description })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaImage, {
				path: granth.imagePath,
				alt: granth.title,
				className: "cover",
				onClick: onImage,
				save: {
					title: granth.title,
					text: granth.description,
					topic: "",
					granth: granth.title
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-meta",
				children: [
					proofs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill pill-maroon",
						type: "button",
						onClick: onOpen,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {}),
							" ",
							proofs,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pill-word",
								children: " Pramans"
							})
						]
					}) : null,
					proofs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill",
						type: "button",
						onClick: onOpen,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {}),
							" ",
							index,
							"/",
							total
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill",
						type: "button",
						onClick: onShare,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {}), " Share"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "pill pill-maroon",
						type: "button",
						onClick: () => void downloadCardPdf(granth.title, granth.author, granth.description, `${granth.pramanCount} Pramans`, granth.imagePath, `granth-${granth.id}`, "", granth.title),
						children: "PDF"
					})
				]
			})
		]
	});
}
function PramanScreen({ route, go, onOpen }) {
	const pramans = useGranth((state) => state.pramans);
	const topics = useGranth((state) => state.topics);
	const granths = useGranth((state) => state.granths);
	const [query, setQuery] = (0, import_react.useState)("");
	const [cols, setCols] = (0, import_react.useState)(1);
	(0, import_react.useEffect)(() => {
		const saved = Number(localStorage.getItem("praman-cols"));
		if (saved === 1 || saved === 2) setCols(saved);
	}, []);
	const topic = topics.find((item) => item.id === route.topicId);
	const granth = granths.find((item) => item.id === route.granthId);
	const filtered = (0, import_react.useMemo)(() => {
		return pramans.filter((praman) => {
			if (route.topicId && praman.topic_id !== route.topicId) return false;
			if (route.granthId && praman.granth_id !== route.granthId) return false;
			if (route.pramanId && praman.id !== route.pramanId) return false;
			return true;
		});
	}, [
		pramans,
		route.granthId,
		route.pramanId,
		route.topicId
	]);
	const ranked = (0, import_react.useMemo)(() => rankBySearch(filtered, query, (praman) => [
		praman.title,
		praman.description,
		praman.topic_title,
		praman.granth_title,
		praman.granth_auther
	]), [filtered, query]);
	const resetKey = `${query}|${cols}|${route.topicId ?? ""}|${route.granthId ?? ""}|${route.pramanId ?? ""}`;
	const step = cols === 1 ? 8 : 12;
	const { count, ref } = useSlice(resetKey, ranked.length, step);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
					tone: "gold",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Pramans" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subtitle",
					children: "शास्त्र प्रमाण"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "granth-tools",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid-switch",
					role: "group",
					"aria-label": "प्रमाण ग्रिड",
					children: [1, 2].map((size) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: cols === size ? "active" : "",
						onClick: () => {
							setCols(size);
							localStorage.setItem("praman-cols", String(size));
						},
						children: [
							size,
							"×",
							size
						]
					}, size))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					className: "search-row",
					onSubmit: (event) => event.preventDefault(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "form-control",
						value: query,
						lang: "hi",
						placeholder: "प्रमाण खोजें — mans, मृत्यु",
						onChange: (event) => setQuery(event.target.value)
					})
				})]
			})]
		}),
		topic || granth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "filter-banner",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [topic ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "विषय:" }),
				" ",
				topic.title
			] }) : null, granth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "ग्रंथ:" }),
				" ",
				granth.title
			] }) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "pill",
				type: "button",
				onClick: () => go("#/pramans"),
				children: "सभी प्रमाण"
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `card-grid praman-grid cols-${cols}`,
			children: ranked.slice(0, count).map((praman, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramanCard, {
				praman,
				index: index + 1,
				total: ranked.length,
				onOpen,
				onTopic: () => go(`#/pramans?topic=${praman.topic_id}`),
				onGranth: () => go(`#/pramans?granth=${praman.granth_id}`),
				onShare: () => void shareLink(praman.title, `#/pramans?id=${praman.id}`)
			}, praman.id))
		}),
		ranked.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
			title: "कोई प्रमाण नहीं",
			body: "इस चयन में प्रमाण नहीं मिले, या सिंक अभी चल रहा है।"
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: "scroll-sentinel"
		})
	] });
}
function PramanCard({ praman, index, total, onOpen, onTopic, onGranth, onShare }) {
	const [play, setPlay] = (0, import_react.useState)(false);
	const video = youtubeId(praman.youtube_url);
	const shots = [
		praman.image_path,
		praman.granth_image,
		praman.editorImagePath
	].map(mediaPath).filter((value) => Boolean(value));
	const start = Number(praman.youtube_start) || 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "card praman-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "praman-body",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "thumb-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaImage, {
								path: praman.granth_image,
								alt: "",
								className: "thumb",
								onClick: () => onOpen(shots),
								save: {
									title: praman.granth_title,
									text: praman.title,
									topic: praman.topic_title,
									granth: praman.granth_title
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaImage, {
								path: praman.editorImagePath,
								alt: "",
								className: "thumb",
								onClick: () => onOpen(shots)
							}),
							praman.is_favorate === "1" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "fav",
								children: "मुख्य"
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "card-title",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: praman.title })
					}),
					praman.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "card-desc",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: praman.description })
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaImage, {
				path: praman.image_path,
				alt: praman.title,
				className: "proof",
				onClick: () => onOpen(shots),
				save: {
					title: praman.title,
					text: praman.description,
					topic: praman.topic_title,
					granth: praman.granth_title
				}
			}),
			video ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "video-block",
				children: [
					play ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
						title: praman.title,
						src: `https://www.youtube.com/embed/${video}${start ? `?start=${start}` : ""}`,
						allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
						allowFullScreen: true
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "pill pill-maroon",
						type: "button",
						onClick: () => setPlay(true),
						children: ["वीडियो चलाएँ ", start ? `(${start}s)` : ""]
					}),
					praman.youtube_desc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "card-desc",
						children: praman.youtube_desc
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "fine",
						children: "वीडियो चलाने के लिए इंटरनेट चाहिए। पेज की तस्वीर ऑफलाइन रहती है।"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "praman-body",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-meta",
					children: [
						praman.topic_title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "pill pill-topic",
							type: "button",
							onClick: onTopic,
							children: praman.topic_title
						}) : null,
						praman.granth_title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "pill",
							type: "button",
							onClick: onGranth,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {}),
								" ",
								praman.granth_title
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "pill",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {}),
								" ",
								index,
								"/",
								total
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "pill",
							type: "button",
							onClick: onShare,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {}), " Share"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "pill pill-maroon",
							type: "button",
							onClick: () => void downloadCardPdf(praman.title, praman.granth_title, praman.description, praman.topic_title, praman.image_path, `praman-${praman.id}`, praman.topic_title, praman.granth_title),
							children: "PDF"
						})
					]
				})
			})
		]
	});
}
function Empty({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "empty",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: body })]
	});
}
function Lightbox({ paths, onClose }) {
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lightbox",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "प्रमाण चित्र",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "lightbox-close",
			type: "button",
			onClick: onClose,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {}), " बंद"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "lightbox-scroll",
			children: paths.map((path) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaImage, {
				path,
				alt: "प्रमाण",
				className: "lightbox-img"
			}, path))
		})]
	});
}
function BlobView({ blob, alt, className }) {
	const [src, setSrc] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const url = URL.createObjectURL(blob);
		setSrc(url);
		return () => URL.revokeObjectURL(url);
	}, [blob]);
	if (!src) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className,
		alt,
		src
	});
}
function GalleryScreen() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [folders, setFolders] = (0, import_react.useState)([]);
	const [folderId, setFolderId] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [cols, setCols] = (0, import_react.useState)(2);
	const [open, setOpen] = (0, import_react.useState)(null);
	const reload = async () => {
		const [nextItems, nextFolders] = await Promise.all([listGallery(), listFolders()]);
		setItems(nextItems);
		setFolders(nextFolders);
	};
	(0, import_react.useEffect)(() => {
		const saved = Number(localStorage.getItem("gallery-cols"));
		if (saved === 1 || saved === 2) setCols(saved);
		reload();
	}, []);
	const visible = (0, import_react.useMemo)(() => {
		return rankBySearch(items.filter((item) => folderId ? item.folderId === folderId : true), query, (item) => [
			item.title,
			item.text,
			item.topic,
			item.granth,
			item.fileName
		]);
	}, [
		folderId,
		items,
		query
	]);
	const addFolder = async () => {
		const name = window.prompt("फोल्डर का नाम");
		if (!name?.trim()) return;
		await saveFolder({
			id: `f-${Date.now()}`,
			name: name.trim()
		});
		await reload();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-title",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBox, {
					tone: "gold",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Gallery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "subtitle",
					children: "सेव चित्र और PDF"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "granth-tools",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid-switch",
					role: "group",
					"aria-label": "गैलरी ग्रिड",
					children: [1, 2].map((size) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: cols === size ? "active" : "",
						onClick: () => {
							setCols(size);
							localStorage.setItem("gallery-cols", String(size));
						},
						children: [
							size,
							"×",
							size
						]
					}, size))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					className: "search-row",
					onSubmit: (event) => event.preventDefault(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "form-control",
						value: query,
						lang: "hi",
						placeholder: "गैलरी खोजें — mans, गीता",
						onChange: (event) => setQuery(event.target.value)
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "folder-row",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `pill ${folderId === "" ? "pill-maroon" : ""}`,
					onClick: () => setFolderId(""),
					children: "सभी"
				}),
				folders.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `pill ${folderId === folder.id ? "pill-maroon" : ""}`,
					onClick: () => setFolderId(folder.id),
					children: folder.name
				}, folder.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "pill",
					onClick: () => void addFolder(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, {}), " फोल्डर"]
				}),
				folderId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pill",
					onClick: () => {
						const folder = folders.find((item) => item.id === folderId);
						const name = window.prompt("नया नाम", folder?.name ?? "");
						if (!name?.trim() || !folder) return;
						saveFolder({
							...folder,
							name: name.trim()
						}).then(reload);
					},
					children: "नाम बदलें"
				}) : null,
				folderId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pill",
					onClick: () => void removeFolder(folderId).then(() => {
						setFolderId("");
						return reload();
					}),
					children: "फोल्डर हटाएँ"
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `card-grid gallery-grid cols-${cols}`,
			children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "card gallery-card",
				children: [
					item.kind === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlobView, {
						className: "cover",
						alt: item.title,
						blob: item.blob
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "pdf-tile",
						onClick: () => saveBlob(item.blob, item.fileName),
						children: "PDF"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "card-title",
						children: item.title
					}),
					item.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "card-desc",
						children: item.text
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "fine",
						children: [
							item.granth || item.topic,
							" · ",
							new Date(item.createdAt).toLocaleDateString("hi-IN")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "pill",
								onClick: () => setOpen(item),
								children: "खोलें"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "pill",
								onClick: () => saveBlob(item.blob, item.fileName),
								children: "Share"
							}),
							folders.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "form-control folder-select",
								value: item.folderId,
								onChange: (event) => {
									saveGalleryItem({
										...item,
										folderId: event.target.value
									}).then(reload);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "कोई फोल्डर नहीं"
								}), folders.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: folder.id,
									children: folder.name
								}, folder.id))]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "pill",
								onClick: () => void removeGalleryItem(item.id).then(() => {
									ping("हटा दिया");
									return reload();
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {}), " हटाएँ"]
							})
						]
					})
				]
			}, item.id))
		}),
		visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "empty",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "अभी खाली है" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "किसी चित्र के ↓ या कार्ड के PDF बटन से यहाँ सेव होगा।" })]
		}) : null,
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lightbox",
			role: "dialog",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "lightbox-close",
				type: "button",
				onClick: () => setOpen(null),
				children: "बंद"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lightbox-scroll",
				children: [open.kind === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlobView, {
					className: "lightbox-img",
					alt: open.title,
					blob: open.blob
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "note-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: open.title }),
						open.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: open.text }) : null,
						open.topic ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["विषय: ", open.topic] }) : null,
						open.granth ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["ग्रंथ: ", open.granth] }) : null
					]
				})]
			})]
		}) : null
	] });
}
var NAV = [
	{
		panel: "dashboard",
		hash: "#/dashboard",
		label: "Dashboard",
		icon: Landmark
	},
	{
		panel: "topics",
		hash: "#/topics",
		label: "Topics",
		icon: ClipboardList
	},
	{
		panel: "granths",
		hash: "#/granths",
		label: "Granths",
		icon: Library
	},
	{
		panel: "pramans",
		hash: "#/pramans",
		label: "Pramans",
		icon: Image
	}
];
function parseHash(hash) {
	const [pathPart, queryPart] = (hash.replace(/^#/, "") || "/dashboard").split("?");
	const path = pathPart || "/dashboard";
	const params = new URLSearchParams(queryPart ?? "");
	const topicId = params.get("topic") || void 0;
	const granthId = params.get("granth") || void 0;
	const pramanId = params.get("id") || void 0;
	if (path.startsWith("/gallery")) return { panel: "gallery" };
	if (path.startsWith("/topics")) return { panel: "topics" };
	if (path.startsWith("/granths")) return { panel: "granths" };
	if (path.startsWith("/pramans")) return {
		panel: "pramans",
		topicId,
		granthId,
		pramanId
	};
	return { panel: "dashboard" };
}
function formatWhen(stamp) {
	if (!stamp) return "";
	return new Intl.DateTimeFormat("hi-IN", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	}).format(stamp);
}
function GranthApp() {
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
	const [route, setRoute] = (0, import_react.useState)({ panel: "dashboard" });
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [shots, setShots] = (0, import_react.useState)(null);
	const [toast, setToast] = (0, import_react.useState)(null);
	const [showTop, setShowTop] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const read = () => setRoute(parseHash(window.location.hash));
		read();
		window.addEventListener("hashchange", read);
		return () => window.removeEventListener("hashchange", read);
	}, []);
	(0, import_react.useEffect)(() => {
		boot();
		const onOnline = () => {
			useGranth.setState({ online: true });
		};
		const onOffline = () => {
			useGranth.setState({
				online: false,
				status: useGranth.getState().syncedAt ? "offline" : "error"
			});
		};
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);
		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	}, [boot]);
	(0, import_react.useEffect)(() => {
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/sw.js").catch(() => void 0);
	}, []);
	(0, import_react.useEffect)(() => {
		const onToast = (event) => {
			setToast(event.detail);
			window.setTimeout(() => setToast(null), 2200);
		};
		window.addEventListener("granth-toast", onToast);
		return () => window.removeEventListener("granth-toast", onToast);
	}, []);
	(0, import_react.useEffect)(() => {
		window.scrollTo({ top: 0 });
		setMenuOpen(false);
	}, [
		route.panel,
		route.topicId,
		route.granthId,
		route.pramanId
	]);
	(0, import_react.useEffect)(() => {
		const onScroll = () => setShowTop(window.scrollY > 480);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	const go = (hash) => {
		if (window.location.hash === hash) {
			setRoute(parseHash(hash));
			window.scrollTo({ top: 0 });
			return;
		}
		window.location.hash = hash;
	};
	const imageLabel = images.total ? images.running ? `पेज सेव हो रहे हैं ${images.done}/${images.total}` : images.done >= images.total ? "सभी पेज इस डिवाइस पर सेव हैं" : `सेव पेज ${images.done}/${images.total}` : status === "syncing" ? "सूची सेव हो रही है…" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-root",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mast",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mast-gold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mast-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "brand-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "brand",
							type: "button",
							onClick: () => go("#/dashboard"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "logo-icon",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MalaMark, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "ग्रंथ प्रबंधन" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "gallery-btn",
							type: "button",
							"aria-label": "Gallery",
							onClick: () => go("#/gallery"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, {})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "stats-bar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "stat-item",
								onClick: () => go("#/topics"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-num",
									children: topics || "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-label",
									children: "विषय / प्रश्नोत्तरी"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "stat-item",
								onClick: () => go("#/granths"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-num",
									children: granths || "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-label",
									children: "पवित्र ग्रन्थ"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "stat-item",
								onClick: () => go("#/pramans"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-num",
									children: pramans || "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "stat-label",
									children: "नए प्रमाण"
								})]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: `hamburger ${menuOpen ? "open" : ""}`,
				type: "button",
				"aria-label": menuOpen ? "मेनू बंद करें" : "मेनू खोलें",
				"aria-expanded": menuOpen,
				onClick: () => setMenuOpen((open) => !open),
				children: menuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: menuOpen ? "open" : "",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "nav-menu",
					children: NAV.map((item) => {
						const Icon = item.icon;
						const active = route.panel === item.panel;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `nav-btn ${active ? "active" : ""}`,
							"aria-current": active ? "page" : void 0,
							onClick: () => go(item.hash),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {}),
								" ",
								item.label
							]
						}) }, item.panel);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `sync-strip ${status}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `dot ${online ? "on" : "off"}` }),
					status === "syncing" ? "ऑनलाइन सिंक हो रहा है — सूची डिवाइस पर लिखी जा रही है" : error ? error : !online ? "इंटरनेट नहीं · सेव किया डेटा चल रहा है" : `ऑफलाइन तैयार${syncedAt ? ` · ${formatWhen(syncedAt)}` : ""}`,
					imageLabel ? ` · ${imageLabel}` : ""
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "sync-btn",
					type: "button",
					onClick: () => {
						sync().then(() => savePages());
					},
					disabled: status === "syncing",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: status === "syncing" ? "spin" : "" }), "सिंक"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
				status === "booting" && topics + granths + pramans === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "loading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "सेव की हुई प्रति खोली जा रही है…" })]
				}) : null,
				error && status === "error" && topics + granths + pramans === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "empty",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "अभी खाली है" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error })]
				}) : null,
				route.panel === "dashboard" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, { go }) : null,
				route.panel === "topics" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopicScreen, { go }) : null,
				route.panel === "granths" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GranthScreen, {
					go,
					onOpen: setShots
				}) : null,
				route.panel === "pramans" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PramanScreen, {
					route,
					go,
					onOpen: setShots
				}) : null,
				route.panel === "gallery" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GalleryScreen, {}) : null
			] }),
			showTop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "to-top",
				type: "button",
				onClick: () => window.scrollTo({
					top: 0,
					behavior: "smooth"
				}),
				children: "Top"
			}) : null,
			toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "toast show",
				children: toast
			}) : null,
			shots ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbox, {
				paths: shots,
				onClose: () => setShots(null)
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GranthApp, {});
}
//#endregion
export { Home as component };
