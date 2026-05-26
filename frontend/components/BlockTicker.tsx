"use client";

import { useEffect, useRef, useState } from "react";
import { useBlockNumber } from "wagmi";
import { Activity } from "lucide-react";

/**
 * BlockTicker — Live Arc Network block counter in the Header.
 * Flashes green on every new block to signal on-chain activity.
 */
export function BlockTicker() {
  const { data: block } = useBlockNumber({ watch: true, chainId: 5042002 });

  const [display, setDisplay] = useState<bigint | undefined>();
  const [flash,   setFlash]   = useState(false);
  const prevRef               = useRef<bigint | undefined>(undefined);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (block === undefined) return;
    if (prevRef.current === block)  return;

    prevRef.current = block;
    setDisplay(block);
    setFlash(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlash(false), 600);
  }, [block]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!display) return null;

  return (
    <div
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                 bg-surface-2 border border-border text-[11px] font-mono
                 transition-colors duration-200 select-none"
    >
      {/* Pulsing activity dot */}
      <Activity
        size={10}
        className={`transition-colors duration-400 ${flash ? "text-green-400" : "text-gray-700"}`}
      />

      {/* Block number — flashes green, fades back to gray */}
      <span
        key={display.toString()} // re-mounts on each new block for animation
        className={`${flash ? "animate-ticker-flash" : "text-gray-600"}`}
      >
        #{display.toLocaleString()}
      </span>
    </div>
  );
}
