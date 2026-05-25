"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onDone: () => void;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  type: "rect" | "circle" | "star";
  gravity: number;
}

interface BurstParticle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  alpha: number;
  size: number;
  trail: { x: number; y: number }[];
}

interface Burst { particles: BurstParticle[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b",
  "#cc5de8", "#20c997", "#f06595", "#a9e34b", "#74c0fc",
  "#ff6bd6", "#ffec99", "#63e6be", "#ffa94d", "#e599f7",
];

const BALLOON_COLORS = [
  "#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7",
  "#da77f2", "#ff922b", "#f06595", "#20c997",
  "#a9e34b", "#ffa94d",
];

const BURST_SCHEDULE = [0, 350, 750, 1250, 1800, 2500]; // ms after start
const DURATION = 4200; // total ms

// ── Component ─────────────────────────────────────────────────────────────────

export function BetSuccessCelebration({ onDone }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number>(0);
  const startRef   = useRef<number>(0);
  const onDoneRef  = useRef(onDone);
  const [alive, setAlive] = useState(true);

  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Confetti ─────────────────────────────────────────────────────────────
    const particles: Particle[] = Array.from({ length: 220 }, () => ({
      x:        Math.random() * (canvas.width ?? 1),
      y:        -Math.random() * (canvas.height ?? 1) * 0.6,
      vx:       (Math.random() - 0.5) * 3.5,
      vy:       Math.random() * 3.5 + 1.5,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size:     Math.random() * 9 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.22,
      type:     (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
      gravity:  0.07 + Math.random() * 0.06,
    }));

    // ── Fireworks ────────────────────────────────────────────────────────────
    const bursts: Burst[] = [];
    let burstIdx = 0;

    function spawnBurst() {
      const w = canvas!.width;
      const h = canvas!.height;
      const bx = w * (0.15 + Math.random() * 0.7);
      const by = h * (0.08 + Math.random() * 0.38);
      const primaryColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const count = 55 + Math.floor(Math.random() * 45);

      bursts.push({
        particles: Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const speed = 3.5 + Math.random() * 6;
          return {
            x: bx, y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: Math.random() > 0.45
              ? primaryColor
              : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            alpha: 1,
            size: Math.random() * 3.5 + 1.5,
            trail: [],
          };
        }),
      });
    }

    // ── Draw helpers ─────────────────────────────────────────────────────────
    function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      const spikes = 5;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? r : r * 0.38;
        const angle  = (i * Math.PI) / spikes - Math.PI / 2;
        i === 0
          ? ctx.moveTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle))
          : ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    function loop(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const fade    = Math.max(0, 1 - Math.max(0, elapsed - (DURATION - 900)) / 900);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Trigger scheduled bursts
      while (burstIdx < BURST_SCHEDULE.length && elapsed >= BURST_SCHEDULE[burstIdx]) {
        spawnBurst();
        burstIdx++;
      }

      // Draw firework bursts
      for (const burst of bursts) {
        for (const p of burst.particles) {
          // Store trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.shift();

          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += 0.10;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha = Math.max(0, p.alpha - 0.016);

          if (p.alpha <= 0) continue;

          // Trail glow
          for (let t = 0; t < p.trail.length; t++) {
            const pt = p.trail[t]!;
            ctx!.save();
            ctx!.globalAlpha = (t / p.trail.length) * p.alpha * 0.35 * fade;
            ctx!.fillStyle   = p.color;
            ctx!.beginPath();
            ctx!.arc(pt.x, pt.y, p.size * (t / p.trail.length), 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }

          // Head
          ctx!.save();
          ctx!.globalAlpha = p.alpha * fade;
          ctx!.fillStyle   = p.color;
          ctx!.shadowColor = p.color;
          ctx!.shadowBlur  = 6;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.restore();
        }
      }

      // Draw confetti
      for (const p of particles) {
        p.x        += p.vx;
        p.y        += p.vy;
        p.vy       += p.gravity;
        p.rotation += p.rotSpeed;
        p.vx       *= 0.996;

        // Recycle when offscreen bottom
        if (p.y > (canvas!.height ?? 0) + 25) {
          p.y  = -20;
          p.x  = Math.random() * (canvas!.width ?? 1);
          p.vy = Math.random() * 3 + 1.5;
        }

        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.fillStyle   = p.color;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);

        if (p.type === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.type === "star") {
          drawStar(ctx!, 0, 0, p.size / 2);
        } else {
          // Elongated rectangle (ribbon-like)
          ctx!.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
        }
        ctx!.restore();
      }

      if (elapsed < DURATION) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setAlive(false);
        onDoneRef.current();
      }
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // run once on mount

  if (!alive) return null;

  // ── Balloons ──────────────────────────────────────────────────────────────
  const balloons = Array.from({ length: 11 }, (_, i) => ({
    color:  BALLOON_COLORS[i % BALLOON_COLORS.length]!,
    left:   `${5 + (i * 9) % 88}%`,
    delay:  `${(i * 0.22) % 1.6}s`,
    dur:    `${3.2 + (i * 0.15) % 1.2}s`,
    size:   42 + (i * 9) % 28,
    swayDur:`${0.9 + (i * 0.13) % 0.7}s`,
  }));

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* ── Canvas (confetti + fireworks) ── */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* ── Balloons ── */}
      {balloons.map((b, i) => (
        <div
          key={i}
          className="absolute bottom-[-20px]"
          style={{
            left: b.left,
            animation: `balloon-rise ${b.dur} cubic-bezier(0.25,0.46,0.45,0.94) ${b.delay} forwards`,
          }}
        >
          <svg
            width={b.size}
            height={Math.round(b.size * 1.32)}
            viewBox="0 0 40 53"
            style={{
              animation: `balloon-sway ${b.swayDur} ease-in-out ${b.delay} infinite alternate`,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
            }}
          >
            {/* Balloon body */}
            <ellipse cx="20" cy="18" rx="16" ry="18" fill={b.color} opacity="0.93"/>
            {/* Highlight */}
            <ellipse cx="13.5" cy="10" rx="5" ry="6.5" fill="white" opacity="0.22"/>
            <ellipse cx="13" cy="8"  rx="2.5" ry="3"   fill="white" opacity="0.18"/>
            {/* Knot */}
            <polygon points="17.5,35 22.5,35 20,39.5" fill={b.color}/>
            {/* String */}
            <path
              d="M20,39.5 Q15,44 18,53"
              stroke="#94a3b8"
              strokeWidth="1.1"
              fill="none"
              strokeLinecap="round"
            />
            {/* "Good Luck!" text */}
            <text
              x="20" y="18"
              textAnchor="middle"
              fontSize="6"
              fontWeight="800"
              fill="white"
              fontFamily="system-ui,sans-serif"
              opacity="0.95"
            >
              Good
            </text>
            <text
              x="20" y="26"
              textAnchor="middle"
              fontSize="6"
              fontWeight="800"
              fill="white"
              fontFamily="system-ui,sans-serif"
              opacity="0.95"
            >
              Luck!
            </text>
          </svg>
        </div>
      ))}

      {/* ── Center success message ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5"
        style={{ animation: `celebration-fade ${DURATION}ms ease forwards` }}
      >
        {/* Big emoji */}
        <div
          className="text-8xl select-none"
          style={{ animation: "bounce-in 0.65s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          🎉
        </div>

        {/* Card */}
        <div
          className="bg-black/65 backdrop-blur-xl rounded-3xl px-10 py-6 text-center
                     border border-white/10 shadow-2xl"
          style={{ animation: "bounce-in 0.65s 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <p className="text-white font-black text-3xl tracking-tight mb-2">
            Bet Placed! 🍀
          </p>
          <p className="text-green-400 font-semibold text-base">
            Good Luck! May the odds be in your favour.
          </p>
        </div>

        {/* Emoji row */}
        <div
          className="flex gap-3 text-3xl select-none"
          style={{ animation: "bounce-in 0.65s 0.32s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {["🎊","✨","🌟","✨","🎊"].map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
