import "regenerator-runtime/runtime";
import { PDFDocument } from "pdf-lib";

export type CardPdfInput = {
  title: string;
  subtitle?: string;
  body?: string;
  meta?: string;
  imageBlob?: Blob | null;
  fileName: string;
};

export type BookPage = {
  title: string;
  subtitle?: string;
  body?: string;
  meta?: string;
  imageBlob?: Blob | null;
  cover?: boolean;
};

const PAGE_W = 1080;
const PAGE_H = 1528;
const MARGIN = 64;

type Pen = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y: number;
};

function newPen(): Pen {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.textBaseline = "top";
  return { canvas, ctx, y: MARGIN };
}

function breakWords(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word];
  const parts: string[] = [];
  let chunk = "";
  for (const ch of word) {
    const next = chunk + ch;
    if (ctx.measureText(next).width <= maxWidth) chunk = next;
    else {
      if (chunk) parts.push(chunk);
      chunk = ch;
    }
  }
  if (chunk) parts.push(chunk);
  return parts.length ? parts : [word];
}

async function jpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("jpeg"))), "image/jpeg", 0.86);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function paintCard(input: BookPage): Promise<HTMLCanvasElement[]> {
  await document.fonts.load("600 54px 'Noto Sans Devanagari'");
  await document.fonts.ready;
  const pages: Pen[] = [newPen()];
  const maxWidth = PAGE_W - MARGIN * 2;
  const current = () => pages[pages.length - 1] as Pen;
  const nextPage = () => {
    pages.push(newPen());
  };
  const write = (text: string, font: string, color: string, size: number, gap: number) => {
    const pen = () => current();
    pen().ctx.font = font;
    pen().ctx.fillStyle = color;
    const lineHeight = size + gap;
    const chunks = text
      .split(/\n/)
      .flatMap((paragraph) => {
        const words = paragraph.split(/\s+/).filter(Boolean).flatMap((word) => breakWords(pen().ctx, word, maxWidth));
        return words.length ? [words] : [[]];
      });
    for (const words of chunks) {
      if (!words.length) {
        current().y += lineHeight * 0.45;
        continue;
      }
      let line = "";
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (pen().ctx.measureText(next).width <= maxWidth) {
          line = next;
          continue;
        }
        if (current().y + lineHeight > PAGE_H - MARGIN) nextPage();
        current().ctx.font = font;
        current().ctx.fillStyle = color;
        current().ctx.fillText(line, MARGIN, current().y);
        current().y += lineHeight;
        line = word;
      }
      if (line) {
        if (current().y + lineHeight > PAGE_H - MARGIN) nextPage();
        current().ctx.font = font;
        current().ctx.fillStyle = color;
        current().ctx.fillText(line, MARGIN, current().y);
        current().y += lineHeight;
      }
    }
  };

  write(input.title || "ग्रंथ", "600 54px 'Noto Sans Devanagari'", "#7b1f2e", 54, 16);
  if (input.subtitle) write(input.subtitle, "500 32px 'Noto Sans Devanagari'", "#c06a10", 32, 18);
  if (input.imageBlob && input.imageBlob.size > 32) {
    try {
      const bitmap = await createImageBitmap(input.imageBlob);
      const maxH = input.cover ? 860 : 700;
      const scale = Math.min(maxWidth / bitmap.width, maxH / bitmap.height, 1);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      if (current().y + h > PAGE_H - MARGIN) nextPage();
      const x = MARGIN + (maxWidth - w) / 2;
      current().ctx.drawImage(bitmap, x, current().y, w, h);
      current().y += h + 28;
      bitmap.close();
    } catch {
      write("चित्र इस पेज पर नहीं जुड़ सका", "400 28px 'Noto Sans Devanagari'", "#4a2c0a", 28, 10);
    }
  }
  if (input.body) write(input.body, "400 30px 'Noto Sans Devanagari'", "#3d1f00", 30, 12);
  if (input.meta) {
    current().y += 12;
    write(input.meta, "600 28px 'Noto Sans Devanagari'", "#7b1f2e", 28, 10);
  }
  return pages.map((pen) => pen.canvas);
}

export async function buildBookPdf(pages: BookPage[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  const source = pages.length ? pages : [{ title: "कोई प्रमाण नहीं" }];
  for (const input of source) {
    for (const canvas of await paintCard(input)) {
      const image = await doc.embedJpg(await jpeg(canvas));
      const page = doc.addPage([595.28, 841.89]);
      page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
  }
  const bytes = await doc.save();
  return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
}

export async function buildCardPdf(input: CardPdfInput): Promise<Blob> {
  return buildBookPdf([input]);
}
