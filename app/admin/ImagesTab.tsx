"use client";

import { useEffect, useState, useCallback, Fragment } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type TargetRow = {
  id: number;
  entity_type: string;
  entity_key: string;
  role: string;
  label: string | null;
  current_asset_id: number | null;
  asset_origin: string | null;
  asset_governance: string | null;
  asset_lifecycle: string | null;
  local_path: string | null;
  source_url: string | null;
};

type Stats = {
  targets: { total: number; by_type: Record<string, number> };
  assets: {
    total: number;
    by_governance: Record<string, number>;
    by_lifecycle: Record<string, number>;
    by_origin: Record<string, number>;
  };
  recent_targets: TargetRow[];
};

type AssetRow = {
  id: number;
  target_id: number;
  source_url: string | null;
  local_path: string | null;
  alt_text: string | null;
  origin: string;
  governance_status: string;
  lifecycle_status: string;
  review_note: string | null;
  cleanup_after: string | null;
  created_at: string;
};

type AssetHistory = {
  target: { id: number; entity_type: string; entity_key: string; role: string; current_asset_id: number | null };
  assets: AssetRow[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const ENTITY_TYPES = ["article", "category", "subcategory", "discover", "entity"] as const;

const ENTITY_TYPE_LABELS: Record<string, string> = {
  article: "Стаття", category: "Категорія", subcategory: "Підкатегорія",
  discover: "Добірка", entity: "Подарунок",
};

const GOVERNANCE_COLORS: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-800",
  approved:       "bg-green-100  text-green-800",
  rejected:       "bg-red-100    text-red-800",
};

const LIFECYCLE_COLORS: Record<string, string> = {
  active:            "bg-blue-100   text-blue-800",
  historical:        "bg-gray-100   text-gray-700",
  cleanup_candidate: "bg-orange-100 text-orange-800",
  deleted:           "bg-red-50     text-red-500",
};

const ORIGIN_LABELS: Record<string, string> = {
  aliexpress: "AliExpress", replicate: "Replicate AI",
  manual_upload: "Вручну (файл)", manual_url: "Вручну (URL)",
};

const ENTITY_KEY_HINT: Record<string, string> = {
  article:     "числовий id статті (наприклад: 42)",
  category:    "slug категорії (наприклад: tovary-dlya-domu)",
  subcategory: "cat_slug/sub_slug (наприклад: tovary-dlya-domu/usb-gadzhety)",
  discover:    "slug добірки (наприклад: usb-gadzhety-dlya-domu)",
  entity:      "slug подарунку (наприклад: podarunky-tekhnolubam)",
};

// ── Small components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  );
}

// ── Public page URL helpers ───────────────────────────────────────────────────

function resolvePublicUrl(t: TargetRow): string | null {
  if (t.entity_type === "category")    return `/kategoriyi/${t.entity_key}`;
  if (t.entity_type === "subcategory") return `/kategoriyi/${t.entity_key}`;
  if (t.entity_type === "discover")    return `/discover/${t.entity_key}`;
  if (t.entity_type === "entity")      return `/podarunky/${t.entity_key}`;
  return null; // article: entity_key is numeric id — cannot derive slug
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImagesTab({ initialFilter = "" }: { initialFilter?: string }) {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [statsError, setStatsError]     = useState<string | null>(null);

  // Create target form
  const [showCreate, setShowCreate]     = useState(false);
  const [createType, setCreateType]     = useState<string>("article");
  const [createKey, setCreateKey]       = useState("");
  const [createBusy, setCreateBusy]     = useState(false);
  const [createMsg, setCreateMsg]       = useState<string | null>(null);

  // Asset history panel (expanded target)
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [history, setHistory]           = useState<AssetHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Upload form state
  const [uploadMode, setUploadMode]     = useState<"file" | "url" | null>(null);
  const [urlInput, setUrlInput]         = useState("");
  const [fileInput, setFileInput]       = useState<File | null>(null);
  const [uploadBusy, setUploadBusy]     = useState(false);
  const [uploadMsg, setUploadMsg]       = useState<string | null>(null);

  // Review form state
  const [reviewNote, setReviewNote]     = useState("");
  const [reviewBusy, setReviewBusy]     = useState(false);
  const [reviewError, setReviewError]   = useState<string | null>(null);

  // History load error
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Search/filter
  const [search, setSearch]             = useState(initialFilter);

  // Regeneration (Replicate)
  type ActiveJob = { id: number; job_status: string; error_message?: string | null };
  const [regenMode, setRegenMode]       = useState(false);
  const [regenPrompt, setRegenPrompt]   = useState("");
  const [regenBusy, setRegenBusy]       = useState(false);
  const [regenError, setRegenError]     = useState<string | null>(null);
  const [activeJob, setActiveJob]       = useState<ActiveJob | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadStats = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/images/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Stats) => { setStats(data); setStatsError(null); })
      .catch(() => setStatsError("Не вдалося завантажити статистику зображень"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const loadHistory = useCallback((targetId: number) => {
    setHistoryLoading(true);
    setHistory(null);
    setHistoryError(null);
    setUploadMode(null);
    setUploadMsg(null);
    fetch(`/api/admin/images/assets/by-target?target_id=${targetId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: AssetHistory) => setHistory(data))
      .catch(() => setHistoryError("Не вдалося завантажити версії зображень"))
      .finally(() => setHistoryLoading(false));
  }, []);

  function toggleExpand(targetId: number) {
    // Clear regen state whenever the expanded target changes
    setRegenMode(false);
    setRegenPrompt("");
    setRegenError(null);
    setActiveJob(null);
    if (expandedId === targetId) {
      setExpandedId(null);
      setHistory(null);
    } else {
      setExpandedId(targetId);
      loadHistory(targetId);
    }
  }

  // ── Create target ─────────────────────────────────────────────────────────

  async function handleCreateTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!createKey.trim()) { setCreateMsg("Введіть entity_key"); return; }
    setCreateBusy(true);
    setCreateMsg(null);
    try {
      const r = await fetch("/api/admin/images/targets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_type: createType, entity_key: createKey.trim() }),
      });
      const data = await r.json() as { id?: number; created?: boolean; error?: string };
      if (!r.ok) { setCreateMsg(data.error ?? "Помилка"); return; }
      setCreateMsg(data.created ? `✓ Target #${data.id} створено` : `Target #${data.id} вже існував`);
      setCreateKey("");
      loadStats();
    } finally {
      setCreateBusy(false);
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!fileInput || !expandedId) return;
    setUploadBusy(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("target_id", String(expandedId));
      fd.append("file", fileInput);
      const r = await fetch("/api/admin/images/assets/upload", { method: "POST", body: fd });
      const data = await r.json() as { asset_id?: number; error?: string };
      if (!r.ok) { setUploadMsg(data.error ?? "Помилка"); return; }
      setUploadMsg(`✓ Asset #${data.asset_id} збережено — очікує перевірки`);
      setFileInput(null);
      setUploadMode(null);
      loadHistory(expandedId);
      loadStats();
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleUploadUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim() || !expandedId) return;
    setUploadBusy(true);
    setUploadMsg(null);
    try {
      const r = await fetch("/api/admin/images/assets/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: expandedId, source_url: urlInput.trim() }),
      });
      const data = await r.json() as { asset_id?: number; error?: string };
      if (!r.ok) { setUploadMsg(data.error ?? "Помилка"); return; }
      setUploadMsg(`✓ Asset #${data.asset_id} збережено — очікує перевірки`);
      setUrlInput("");
      setUploadMode(null);
      loadHistory(expandedId);
      loadStats();
    } finally {
      setUploadBusy(false);
    }
  }

  // ── Review ────────────────────────────────────────────────────────────────

  async function handleReview(assetId: number, action: "approve" | "reject") {
    setReviewBusy(true);
    setReviewError(null);
    try {
      const r = await fetch("/api/admin/images/assets/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId, action, review_note: reviewNote || undefined }),
      });
      if (r.ok && expandedId) {
        setReviewNote("");
        loadHistory(expandedId);
        loadStats();
      } else if (!r.ok) {
        const data = await r.json() as { error?: string };
        setReviewError(data.error ?? "Помилка при оновленні статусу");
      }
    } finally {
      setReviewBusy(false);
    }
  }

  // ── Regenerate (Replicate) ────────────────────────────────────────────────

  async function handleStartRegen() {
    if (!expandedId) return;
    setRegenBusy(true);
    setRegenError(null);
    try {
      const r = await fetch("/api/admin/images/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: expandedId,
          prompt_override: regenPrompt.trim() || undefined,
        }),
      });
      const data = await r.json() as { job_id?: number; error?: string };
      if (!r.ok) {
        setRegenError(data.error ?? "Помилка запуску регенерації");
        return;
      }
      setActiveJob({ id: data.job_id!, job_status: "running" });
      setRegenMode(false);
      setRegenPrompt("");
    } finally {
      setRegenBusy(false);
    }
  }

  // Poll active job every 3 seconds while it is running
  useEffect(() => {
    if (!activeJob || activeJob.job_status === "succeeded" || activeJob.job_status === "failed") return;
    const jobId = activeJob.id;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/admin/images/jobs/${jobId}`);
        if (!r.ok) return;
        const data = await r.json() as { job_status: string; asset_id?: number; error_message?: string | null };
        setActiveJob({ id: jobId, job_status: data.job_status, error_message: data.error_message });
        if (data.job_status === "succeeded") {
          if (expandedId) { loadHistory(expandedId); loadStats(); }
        }
      } catch { /* ignore network errors — keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.job_status, expandedId, loadHistory, loadStats]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Зображення</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ручне керування image targets та assets. Регенерація через Replicate — Step 5.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateMsg(null); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showCreate ? "✕ Скасувати" : "+ Додати target"}
        </button>
      </div>

      {/* ── Create target form ── */}
      {showCreate && (
        <form
          onSubmit={handleCreateTarget}
          className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-indigo-800">Новий image target</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-indigo-700">Тип сутності</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-indigo-700">
                Entity key — {ENTITY_KEY_HINT[createType]}
              </label>
              <input
                type="text"
                value={createKey}
                onChange={(e) => setCreateKey(e.target.value)}
                placeholder={createType === "article" ? "42" : "slug-тут"}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createBusy ? "Збереження..." : "Створити target"}
            </button>
            {createMsg && <span className="text-sm text-indigo-800">{createMsg}</span>}
          </div>
        </form>
      )}

      {loading && <div className="py-16 text-center text-gray-400">Завантаження...</div>}

      {statsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {statsError}
        </div>
      )}

      {stats && (
        <div className="space-y-8">
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Об'єктів (targets)" value={stats.targets.total} sub="entities with image slots" />
            <StatCard label="Зображень (assets)" value={stats.assets.total} sub="total versions stored" />
            <StatCard label="Схвалено" value={stats.assets.by_governance["approved"] ?? 0} sub="governance: approved" />
            <StatCard label="Активних" value={stats.assets.by_lifecycle["active"] ?? 0} sub="lifecycle: active" />
          </div>

          {/* ── Breakdown panels ── */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Targets — тип</h3>
              {Object.keys(ENTITY_TYPE_LABELS).map((type) => (
                <div key={type} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-gray-600">{ENTITY_TYPE_LABELS[type]}</span>
                  <span className="font-medium text-gray-900">{stats.targets.by_type[type] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Assets — статус перевірки</h3>
              {(["pending_review", "approved", "rejected"] as const).map((status) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <Badge text={status} colorClass={GOVERNANCE_COLORS[status]} />
                  <span className="text-sm font-medium text-gray-900">{stats.assets.by_governance[status] ?? 0}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Assets — lifecycle</h3>
              {(["active", "historical", "cleanup_candidate", "deleted"] as const).map((status) => (
                <div key={status} className="flex items-center justify-between py-1">
                  <Badge text={status} colorClass={LIFECYCLE_COLORS[status]} />
                  <span className="text-sm font-medium text-gray-900">{stats.assets.by_lifecycle[status] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Origin summary ── */}
          {stats.assets.total > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Assets — походження</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(ORIGIN_LABELS).map(([key, label]) => (
                  <div key={key} className="text-center">
                    <p className="text-xl font-bold text-gray-900">{stats.assets.by_origin[key] ?? 0}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Targets table ── */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-gray-900">
                Останні targets
                {stats.targets.total === 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">(таблиця порожня)</span>
                )}
              </h3>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук по label, key, типу..."
                className="w-64 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>

            {stats.targets.total === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <p className="text-sm text-gray-400">
                  Немає жодного image target. Натисніть &quot;+ Додати target&quot; вгорі.
                </p>
              </div>
            ) : (() => {
                const q = search.trim().toLowerCase();
                const visibleTargets = q
                  ? stats.recent_targets.filter((t) =>
                      (t.label ?? "").toLowerCase().includes(q) ||
                      t.entity_key.toLowerCase().includes(q) ||
                      t.entity_type.toLowerCase().includes(q) ||
                      (ENTITY_TYPE_LABELS[t.entity_type] ?? "").toLowerCase().includes(q)
                    )
                  : stats.recent_targets;
                if (visibleTargets.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
                      <p className="text-sm text-gray-400">Нічого не знайдено за запитом &quot;{search}&quot;</p>
                    </div>
                  );
                }
                return (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Тип</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Key / Label</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Asset</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Статус</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Зображення</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visibleTargets.map((t) => (
                      <Fragment key={t.id}>
                        <tr className={`hover:bg-gray-50 ${expandedId === t.id ? "bg-indigo-50" : ""}`}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.id}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {ENTITY_TYPE_LABELS[t.entity_type] ?? t.entity_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {t.label && (
                              <p className="text-sm font-medium text-gray-900 leading-snug">{t.label}</p>
                            )}
                            <p className="font-mono text-xs text-gray-400">{t.entity_key}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {t.current_asset_id != null ? `#${t.current_asset_id}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {t.asset_governance ? (
                              <Badge
                                text={t.asset_governance}
                                colorClass={GOVERNANCE_COLORS[t.asset_governance] ?? "bg-gray-100 text-gray-600"}
                              />
                            ) : (
                              <span className="text-xs text-gray-300">no asset</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {t.local_path ? (
                              <span className="text-xs text-green-700">✓ local</span>
                            ) : t.source_url ? (
                              <span className="text-xs text-blue-600">↗ external</span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => toggleExpand(t.id)}
                                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                              >
                                {expandedId === t.id ? "▲ Згорнути" : "⚙ Версії"}
                              </button>
                              {(() => {
                                const pageUrl = resolvePublicUrl(t);
                                if (pageUrl) {
                                  return (
                                    <a
                                      href={pageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                    >
                                      ↗ Сторінка
                                    </a>
                                  );
                                }
                                if (t.entity_type === "article") {
                                  return (
                                    <a
                                      href={`/admin?tab=articles&edit=${t.entity_key}`}
                                      className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                    >
                                      ✏ Редактор
                                    </a>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded asset panel ── */}
                        {expandedId === t.id && (
                          <tr key={`${t.id}-panel`}>
                            <td colSpan={7} className="bg-gray-50 px-6 py-5">
                              {historyLoading && (
                                <p className="text-sm text-gray-400">Завантаження версій...</p>
                              )}

                              {/* C2: history load failure */}
                              {!historyLoading && historyError && (
                                <p className="text-sm text-red-500">{historyError}</p>
                              )}

                              {!historyLoading && history && (
                                <div className="space-y-4">
                                  {/* Upload + regen controls */}
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => { setUploadMode(uploadMode === "file" ? null : "file"); setUploadMsg(null); }}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      ↑ Завантажити файл
                                    </button>
                                    <button
                                      onClick={() => { setUploadMode(uploadMode === "url" ? null : "url"); setUploadMsg(null); }}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      🔗 Вставити URL
                                    </button>
                                    <button
                                      onClick={() => { setRegenMode((v) => !v); setRegenError(null); setUploadMode(null); }}
                                      className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                                    >
                                      ✨ Regenerate AI
                                    </button>
                                  </div>

                                  {/* Regen form */}
                                  {regenMode && !activeJob && (
                                    <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 space-y-2">
                                      <p className="text-xs font-medium text-purple-800">AI-регенерація через Replicate (flux-dev)</p>
                                      <input
                                        type="text"
                                        value={regenPrompt}
                                        onChange={(e) => setRegenPrompt(e.target.value)}
                                        placeholder="Свій промпт (залиш порожнім для авто)"
                                        className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs"
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={handleStartRegen}
                                          disabled={regenBusy}
                                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                                        >
                                          {regenBusy ? "Запуск..." : "Запустити генерацію"}
                                        </button>
                                        {regenError && <span className="text-xs text-red-500">{regenError}</span>}
                                      </div>
                                    </div>
                                  )}

                                  {/* Active job status */}
                                  {activeJob && (
                                    <div className={`rounded-lg border px-4 py-3 text-xs space-y-1 ${
                                      activeJob.job_status === "succeeded" ? "border-green-200 bg-green-50" :
                                      activeJob.job_status === "failed"    ? "border-red-200 bg-red-50" :
                                      "border-purple-100 bg-purple-50"
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">Job #{activeJob.id}</span>
                                        <span className={`rounded-full px-2 py-0.5 font-medium ${
                                          activeJob.job_status === "succeeded" ? "bg-green-100 text-green-800" :
                                          activeJob.job_status === "failed"    ? "bg-red-100 text-red-800" :
                                          "bg-purple-100 text-purple-800"
                                        }`}>
                                          {activeJob.job_status === "running" ? "⏳ running…" :
                                           activeJob.job_status === "succeeded" ? "✓ succeeded" :
                                           activeJob.job_status === "failed" ? "✕ failed" :
                                           activeJob.job_status}
                                        </span>
                                      </div>
                                      {activeJob.job_status === "succeeded" && (
                                        <p className="text-green-700">Зображення створено — знайдеш нижче зі статусом &quot;pending_review&quot;</p>
                                      )}
                                      {activeJob.error_message && (
                                        <p className="text-red-600">{activeJob.error_message}</p>
                                      )}
                                      {(activeJob.job_status === "succeeded" || activeJob.job_status === "failed") && (
                                        <button
                                          onClick={() => setActiveJob(null)}
                                          className="text-xs text-gray-400 underline"
                                        >
                                          Сховати
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* File upload form */}
                                  {uploadMode === "file" && (
                                    <form onSubmit={handleUploadFile} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
                                        className="text-xs"
                                      />
                                      <button
                                        type="submit"
                                        disabled={!fileInput || uploadBusy}
                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                      >
                                        {uploadBusy ? "Збереження..." : "Зберегти"}
                                      </button>
                                    </form>
                                  )}

                                  {/* URL form */}
                                  {uploadMode === "url" && (
                                    <form onSubmit={handleUploadUrl} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                                      <input
                                        type="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                                      />
                                      <button
                                        type="submit"
                                        disabled={!urlInput.trim() || uploadBusy}
                                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                      >
                                        {uploadBusy ? "Збереження..." : "Зберегти"}
                                      </button>
                                    </form>
                                  )}

                                  {uploadMsg && (
                                    <p className="text-xs text-green-700">{uploadMsg}</p>
                                  )}

                                  {/* F3: review action error */}
                                  {reviewError && (
                                    <p className="text-xs text-red-500">{reviewError}</p>
                                  )}

                                  {/* Review note */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 whitespace-nowrap">Примітка до рішення:</label>
                                    <input
                                      type="text"
                                      value={reviewNote}
                                      onChange={(e) => setReviewNote(e.target.value)}
                                      placeholder="опційно"
                                      className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                                    />
                                  </div>

                                  {/* Asset list */}
                                  {history.assets.length === 0 ? (
                                    <p className="text-xs text-gray-400">Немає зображень. Завантажте файл або вставте URL вище.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {history.assets.map((a) => (
                                        <div
                                          key={a.id}
                                          className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-xs ${
                                            history.target.current_asset_id === a.id
                                              ? "border-green-200 bg-green-50"
                                              : "border-gray-200 bg-white"
                                          }`}
                                        >
                                          {/* Preview thumb */}
                                          {(a.local_path || a.source_url) && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                              src={a.local_path ? `/uploads/images/${a.local_path}` : (a.source_url ?? "")}
                                              alt=""
                                              className="h-12 w-12 rounded object-cover border border-gray-200"
                                            />
                                          )}

                                          <div className="flex-1 space-y-1">
                                            <div className="flex flex-wrap gap-1 items-center">
                                              <span className="font-mono text-gray-400">#{a.id}</span>
                                              {history.target.current_asset_id === a.id && (
                                                <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs text-green-800">current</span>
                                              )}
                                              <Badge text={a.governance_status} colorClass={GOVERNANCE_COLORS[a.governance_status] ?? "bg-gray-100 text-gray-600"} />
                                              <Badge text={a.lifecycle_status} colorClass={LIFECYCLE_COLORS[a.lifecycle_status] ?? "bg-gray-100 text-gray-600"} />
                                              <span className="text-gray-400">{ORIGIN_LABELS[a.origin] ?? a.origin}</span>
                                            </div>
                                            <div className="text-gray-500 truncate">
                                              {a.local_path ? `📁 ${a.local_path}` : a.source_url ? `🔗 ${a.source_url}` : "—"}
                                            </div>
                                            {a.review_note && <div className="text-gray-400 italic">{a.review_note}</div>}
                                          </div>

                                          {/* Action buttons */}
                                          <div className="flex gap-2">
                                            {a.governance_status !== "approved" && (
                                              <button
                                                disabled={reviewBusy}
                                                onClick={() => handleReview(a.id, "approve")}
                                                className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                              >
                                                ✓ Схвалити
                                              </button>
                                            )}
                                            {a.governance_status !== "rejected" && (
                                              <button
                                                disabled={reviewBusy}
                                                onClick={() => handleReview(a.id, "reject")}
                                                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                              >
                                                ✕ Відхилити
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}
