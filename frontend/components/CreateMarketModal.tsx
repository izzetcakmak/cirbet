"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { X, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { contractConfig } from "@/lib/contracts";
import { useI18n } from "@/lib/i18nContext";

const CATEGORIES = [
  { value: 0, label: "Crypto" },
  { value: 1, label: "Sports" },
  { value: 2, label: "General" },
] as const;

interface Props { onClose: () => void; onSuccess?: () => void; }

export function CreateMarketModal({ onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [question, setQuestion]   = useState("");
  const [options,  setOptions]    = useState(["", ""]);
  const [endTime,  setEndTime]    = useState("");
  const [category, setCategory]   = useState<0 | 1 | 2>(0);
  const [imageUrl, setImageUrl]   = useState("");

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
    !isPending && !isConfirming;

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

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

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

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createCategory")}
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value as 0 | 1 | 2)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                    ${category === c.value
                      ? "bg-arc-600 border-arc-600 text-white"
                      : "bg-surface-2 border-border text-gray-400 hover:text-white hover:border-arc-600/40"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              {t("createImageUrl")}
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5
                         text-white text-sm focus:outline-none focus:border-arc-600/60
                         placeholder:text-gray-600"
            />
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
              <span className="truncate">{error.message.split("\n")[0]}</span>
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
