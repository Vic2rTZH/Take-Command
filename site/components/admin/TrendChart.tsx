"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

type Point = { day: string; value: number };

const W = 560;
const H = 200;
const PAD = { l: 36, r: 12, t: 30, b: 26 };

function niceMax(v: number): number {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function fmtDay(day: string, long = false): string {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", long ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Single-series daily line chart with a crosshair tooltip. Arrow keys move the crosshair when focused. */
export default function TrendChart({ data, label, color }: { data: Point[]; label: string; color: string }) {
  const [active, setActive] = useState<number | null>(null);
  const n = data.length;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const ticks = [0, max / 2, max];
  const labelIdx = n <= 1 ? [0] : Array.from(new Set([0, Math.floor((n - 1) / 2), n - 1]));

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = n <= 1 ? 0 : Math.round(((px - PAD.l) / iw) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      setActive((cur) => Math.min(n - 1, Math.max(0, (cur ?? (step > 0 ? -1 : n)) + step)));
    } else if (e.key === "Escape") {
      setActive(null);
    }
  }

  if (n === 0) return <p className="empty">No data yet.</p>;
  const a = active !== null ? data[active] : null;

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label} per day. Use the left and right arrow keys to read each day.`}
        tabIndex={0}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((cur) => cur ?? n - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#b4bdca">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill="#b4bdca">
            {fmtDay(data[i].day)}
          </text>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {n === 1 ? <circle cx={x(0)} cy={y(data[0].value)} r={4} fill={color} /> : null}
        {a && active !== null ? (
          <g>
            <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + ih} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
            <circle cx={x(active)} cy={y(a.value)} r={5} fill={color} stroke="#121c2d" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      {a && active !== null ? (
        <div className="tip" style={{ left: `${Math.min(88, Math.max(12, (x(active) / W) * 100))}%` }} aria-live="polite">
          <strong>{a.value.toLocaleString("en-GB")}</strong>
          {fmtDay(a.day, true)}
        </div>
      ) : null}
    </div>
  );
}
