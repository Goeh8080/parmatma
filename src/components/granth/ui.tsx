import { useEffect, useState, type ReactNode } from "react";

export function MalaMark() {
  return (
    <svg className="mala" viewBox="0 0 48 48" aria-hidden="true">
      <circle className="mala-ring" cx="24" cy="24" r="15" />
      {Array.from({ length: 14 }, (_, index) => {
        const angle = (index / 14) * Math.PI * 2 - Math.PI / 2;
        const cx = (24 + Math.cos(angle) * 15).toFixed(2);
        const cy = (24 + Math.sin(angle) * 15).toFixed(2);
        return <circle key={index} className="mala-bead" cx={cx} cy={cy} r="2.15" />;
      })}
      <circle className="mala-guru" cx="24" cy="7.2" r="3.3" />
    </svg>
  );
}

export function ScrollRail() {
  const [thumb, setThumb] = useState({ top: 0, height: 80 });
  useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const view = window.innerHeight;
      const max = Math.max(1, scrollHeight - view);
      const track = Math.max(1, view - 16);
      const height = Math.max(72, Math.min(track, (view / Math.max(scrollHeight, view)) * track));
      const top = (window.scrollY / max) * (track - height);
      setThumb({ top: Number.isFinite(top) ? top : 0, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const jump = (clientY: number, rail: DOMRect) => {
    const ratio = Math.min(1, Math.max(0, (clientY - rail.top) / rail.height));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * Math.max(0, max) });
  };
  return (
    <div
      className="scroll-rail"
      aria-hidden="true"
      onPointerDown={(event) => {
        const rail = event.currentTarget.getBoundingClientRect();
        event.currentTarget.setPointerCapture(event.pointerId);
        jump(event.clientY, rail);
        const move = (next: PointerEvent) => jump(next.clientY, rail);
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    >
      <div className="scroll-thumb" style={{ height: thumb.height, transform: `translateY(${thumb.top}px)` }} />
    </div>
  );
}

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${index}-${line.slice(0, 12)}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  );
}

export function IconBox({
  tone,
  children,
  className,
}: {
  tone: "saffron" | "maroon" | "gold" | "plain";
  children: ReactNode;
  className?: string;
}) {
  return <span className={`icon-box tone-${tone} ${className ?? ""}`}>{children}</span>;
}
