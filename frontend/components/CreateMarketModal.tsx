"use client";

import { useState, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  X, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Upload, ImageIcon,
  Coins, Trophy, Newspaper, TrendingUp, Percent, BarChart3,
  Globe, Building2, Flame, Landmark,
} from "lucide-react";
import { contractConfig } from "@/lib/contracts";
import { useI18n } from "@/lib/i18nContext";
import type { Category } from "@/lib/types";
import { ALL_CATEGORIES } from "@/lib/categories";

const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY ?? "";
const MAX_SIZE_MB = 5;

async function validateImageFile(file: File): Promise<string | null> {
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return `File too large. Max ${MAX_SIZE_MB}MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB).`;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (height > width * 1.15)
        resolve(`Portrait image detected (${width}×${height}px). Please use a landscape image.`);
      else if (width < 300)
        resolve(`Image too small (${width}px wide). Minimum width is 300px.`);
      else
        resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("Could not read image."); };
    img.src = url;
  });
}

// ─── Category icon resolver ────────────────────────────────────────────────────

function CategoryIcon({ name, size = 14 }: { name: string; size?: number }) {
  const p = { size, strokeWidth: 1.8 };
  switch (name) {
    case "Coins":      return <Coins      {...p} />;
    case "Trophy":     return <Trophy     {...p} />;
    case "Newspaper":  return <Newspaper  {...p} />;
    case "TrendingUp": return <TrendingUp {...p} />;
    case "Percent":    return <Percent    {...p} />;
    case "BarChart3":  return <BarChart3  {...p} />;
    case "Globe":      return <Globe      {...p} />;
    case "Building2":  return <Building2  {...p} />;
    case "Flame":      return <Flame      {...p} />;
    case "Landmark":   return <Landmark   {...p} />;
    default:           return <Globe      {...p} />;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { onClose: () => void; onSuccess?: () => void; }

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateMarketModal({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [question,  setQuestion]  = useState("");
  const [options,   setOptions]   = useState(["", ""]);
  const [endTime,   setEndTime]   = useState("");
  const [category,  setCategory]  = useState<Category>(0);
  const [imageUrl,  setImageUrl]  = useState("");
  const [preview,   setPreview]   = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  function addOption() {
    if (options.length < 8) setOptions([...options, ""]);
  }
  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }
  function setOption(i: number, val: string) {
    setOptions(options.map((o, idx) => (idx === i ? val : o)));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validErr = await validateImageFile(file);
    if (validErr) { setUploadErr(validErr); if (fileInputRef.current) fileInputRef.current.value = ""; return; }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadErr("");
    setImageUrl("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: form });
      const json = await res.json();
      if (json.success) {
        setImageUrl(json.data.url);
      } else {
        setUploadErr("Upload failed: " + (json.error?.message ?? "unknown error"));
        setPreview("");
      }
    } catch {
      setUploadErr("Upload failed. Check your connection.");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImageUrl(""); setPreview(""); setUploadErr("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCreate() {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2 || !endTime) return;
    const endUnix = BigInt(Math.floor(new Date(endTime).getTime() / 1000));
    writeContract({
      ...contractConfig,
      functionName: "createMarket",
      args: [question.trim(), validOptions, endUnix, category, imageUrl.trim()],
    });
  }

  const canSubmit =
    question.trim().length > 0 &&
    options.filter((o) => o.trim()).length >= 2 &&
    endTime !== "" &&
    !isPending && !isConfirming && !uploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-1 border border-border rounded-2xl w-full max-w-lg
                      shadow-2xl animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-white font-bold text-lg">{t("createTitle")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createQuestion")}
            </label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("createQuestionPlaceholder")}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-white
                         text-sm focus:outline-none focus:border-arc-600/60 placeholder:text-gray-600
                         resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createOptions")} ({options.length}/8)
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`${t("createOptionPlaceholder")} ${i + 1}`}
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5
                             text-white text-sm focus:outline-none focus:border-arc-600/60
                             placeholder:text-gray-600"
                />
                <button
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  className="p-2 text-gray-600 hover:text-red-400 disabled:opacity-20
                             disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {options.length < 8 && (
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-sm text-arc-400 hover:text-arc-300
                           transition-colors mt-1"
              >
                <Plus size={15} />
                {t("createAddOption")}
              </button>
            )}
          </div>

          {/* End Time */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createEndTime")}
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5
                         text-white text-sm focus:outline-none focus:border-arc-600/60
                         [color-scheme:dark]"
            />
          </div>

          {/* ── Category picker ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createCategory")}
            </label>

            {/* Selected category preview chip */}
            {(() => {
              const sel = ALL_CATEGORIES.find((c) => c.value === category)!;
              return (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${sel.active}`}>
                  <CategoryIcon name={sel.iconName} size={12} />
                  {sel.label}
                  <span className="opacity-50 text-[10px]">· {sel.subtitle}</span>
                </div>
              );
            })()}

            {/* Scrollable 2-col grid */}
            <div
              className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5
                         [&::-webkit-scrollbar]:w-1
                         [&::-webkit-scrollbar-track]:bg-transparent
                         [&::-webkit-scrollbar-thumb]:bg-surface-3
                         [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value as Category)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left
                                transition-all duration-150
                                ${isSelected
                                  ? cat.active
                                  : "bg-surface-2 border-border text-gray-400 hover:text-white hover:border-gray-500"}`}
                  >
                    <span className={`shrink-0 ${isSelected ? "" : cat.color}`}>
                      <CategoryIcon name={cat.iconName} size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-tight truncate">
                        {cat.label}
                      </div>
                      <div className={`text-[10px] leading-tight truncate mt-0.5
                                       ${isSelected ? "opacity-60" : "text-gray-600"}`}>
                        {cat.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createImageUrl")}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  {uploading ? (
                    <span className="flex items-center gap-1.5 text-xs text-white">
                      <Loader2 size={12} className="animate-spin" /> Uploading…
                    </span>
                  ) : imageUrl ? (
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 size={12} /> Uploaded
                    </span>
                  ) : null}
                  <button
                    onClick={clearImage}
                    className="ml-auto flex items-center gap-1 text-xs text-white/70
                               hover:text-white bg-black/40 rounded-lg px-2 py-1 transition-colors"
                  >
                    <X size={11} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-6
                           bg-surface-2 border border-dashed border-border rounded-xl
                           text-gray-500 hover:text-gray-300 hover:border-arc-600/50
                           transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={18} />
                  <Upload size={16} />
                </div>
                <span className="text-sm">Click to choose a file</span>
                <span className="text-xs text-gray-600">PNG · JPG · WEBP · max 5MB · landscape only</span>
              </button>
            )}

            {!preview && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="…or paste an image URL"
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5
                           text-white text-sm focus:outline-none focus:border-arc-600/60
                           placeholder:text-gray-600"
              />
            )}

            {uploadErr && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle size={12} /> {uploadErr}
              </p>
            )}
          </div>

          {/* Status */}
          {isSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-600/10
                            border border-green-600/30 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} /> Market created successfully!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-600/10
                            border border-red-600/30 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              <span className="truncate">
                {error.message.includes("reason:")
                  ? error.message.split("reason:")[1]?.trim().split("\n")[0]
                  : error.message.split("\n")[0]}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="btn-ghost flex-1">{t("createCancel")}</button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {(isPending || isConfirming)
              ? <><Loader2 size={15} className="animate-spin" />{t("createCreating")}</>
              : t("createCreate")}
          </button>
        </div>
      </div>
    </div>
  );
}
