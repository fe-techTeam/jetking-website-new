"use client";

import { useEffect, useState, useTransition } from "react";
import {
  saveCollectionItem,
  removeCollectionItem,
  setRecordStatus,
} from "./actions";
import { HistoryPanel } from "./HistoryPanel";
import type { CmsCollection } from "@/lib/cms/types";
import { ADMIN_FORM_CONFIG } from "@/lib/cms/admin-form-config";
import { ValueEditor, humanize, isWideField } from "./ValueEditor";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { RelationsContext, type Relations } from "./FieldInputs";
import { AdminPageHeader } from "./AdminPageHeader";
import { WebsiteUsage } from "./WebsiteUsage";
import type { AppearsOn } from "./registry";

function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
        published
          ? "bg-[var(--color-growth-50)] text-[#067647]"
          : "bg-[var(--color-signal-50)] text-[#b54708]"
      }`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {published ? "Published" : status === "draft" ? "Draft" : status}
    </span>
  );
}

type Rec = Record<string, unknown>;
type PendingSwitch =
  { kind: "record"; item: Rec } | { kind: "new" } | { kind: "list" };

const NAME_KEYS = ["title", "name", "question", "message", "headline", "label"];
const PAGE_SIZE = 25;

/** The human name of a record for the list and page heading — its title when it has one, else its id. */
function displayName(item: Rec, fallback: string): string {
  for (const key of NAME_KEYS) {
    const v = item[key];
    if (typeof v === "string" && v.trim())
      return v.length > 100 ? `${v.slice(0, 100)}…` : v;
  }
  return fallback;
}

export function RecordEditor({
  collection,
  idKey,
  initial,
  title,
  description = "Edit as a form and save — no JSON required.",
  live = true,
  appearsOn = [],
  note,
  mode = "list",
  openId,
  viewPath,
  relations,
}: {
  collection: CmsCollection;
  idKey: string;
  initial: unknown[];
  title: string;
  description?: string;
  /** False when the website does not render this collection — the strip below the heading says so. */
  live?: boolean;
  appearsOn?: AppearsOn[];
  note?: string;
  /**
   * `list` — any number of records, add and delete. `fixed` — a set of documents that already exist
   * (the legal pages): listed, but none can be added or deleted. `singleton` — exactly one document
   * (About, Placements): no list at all, just its form.
   */
  mode?: "list" | "fixed" | "singleton";
  /** Record to open first instead of the first in the list. */
  openId?: string;
  /** Public URL pattern for a record; shows a "View on site" link for saved, published records. */
  viewPath?: string;
  /** Options for fields that point at other records. */
  relations?: Relations;
}) {
  // Looked up here rather than passed as a prop: a Server Component page can't
  // hand a Client Component a config object whose `blank` field is a function —
  // React Server Components can only serialize plain data across that boundary.
  const config = ADMIN_FORM_CONFIG[collection];
  const initialRecords = initial as Rec[];
  const firstRecord =
    (openId
      ? initialRecords.find((r) => String(r[idKey]) === openId)
      : undefined) ?? initialRecords[0];
  const firstDraft = { ...config.blank(), ...(firstRecord ?? {}) };

  const [items, setItems] = useState<Rec[]>(initialRecords);
  const [draft, setDraft] = useState<Rec>(firstDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(firstDraft),
  );
  const [originalId, setOriginalId] = useState<string | undefined>(
    firstRecord ? String(firstRecord[idKey]) : undefined,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [pageIndex, setPageIndex] = useState(0);
  /** A collection opens on its list; a record (or a singleton's one document) opens on its own page. */
  const [view, setView] = useState<"list" | "edit">(
    mode === "singleton" || openId ? "edit" : "list",
  );
  const singular = title.replace(/s$/, "").replace(/ies$/, "y").toLowerCase();
  /** Anything that changes the live website waits for an explicit yes. */
  const [confirm, setConfirm] = useState<
    { kind: "save" } | { kind: "toggle"; id: string; current: string } | null
  >(null);
  const [panel, setPanel] = useState<"history" | "trash" | null>(null);

  // Each screen starts at its top (the admin's scroll area is not the window).
  useEffect(() => {
    document.getElementById("admin-content")?.scrollTo({ top: 0 });
  }, [view]);

  const isDirty = JSON.stringify(draft) !== savedSnapshot;
  const query = search.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return (
      !query ||
      `${String(item[idKey])} ${displayName(item, "")}`
        .toLowerCase()
        .includes(query)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  function confirmDelete(id: string) {
    start(async () => {
      await removeCollectionItem(collection, idKey, id);
      setItems((prev) => prev.filter((p) => p[idKey] !== id));
      if (originalId === id) {
        applyNew();
        setView("list");
      }
      setMessage(`Deleted ${id}.`);
      setPendingDeleteId(null);
    });
  }

  const published = draft.status === "published";
  const fieldKeys = Object.keys(draft).filter(
    (k) => k !== "status" && !config.hiddenFields?.includes(k),
  );

  const sections = config.sections
    ? [
        ...config.sections.map((s) => ({
          title: s.title,
          fields: s.fields.filter((f) => fieldKeys.includes(f)),
        })),
        {
          title: "More",
          fields: fieldKeys.filter(
            (f) => !config.sections!.some((s) => s.fields.includes(f)),
          ),
        },
      ].filter((s) => s.fields.length > 0)
    : [{ title: null, fields: fieldKeys }];

  function applyRecord(item: Rec) {
    const next = { ...config.blank(), ...item };
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setOriginalId(String(item[idKey]));
    setMessage(null);
    setError(null);
  }

  function applyNew() {
    const next = config.blank();
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setOriginalId(undefined);
    setMessage(null);
    setError(null);
  }

  /** Copy the open record into a new unsaved one; the id gets a suffix so it cannot collide. */
  function duplicate() {
    const next = {
      ...draft,
      [idKey]: `${String(draft[idKey] ?? "record")}-copy`,
      status: "draft",
    };
    setDraft(next);
    setSavedSnapshot("");
    setOriginalId(undefined);
    setMessage("Duplicated as a draft — change the id, then Save.");
    setError(null);
  }

  /** A version from history: becomes the editor's draft, unsaved, so it can be reviewed first. */
  function loadVersion(record: Rec, asNew: boolean) {
    const next = { ...config.blank(), ...record };
    setDraft(next);
    setSavedSnapshot(asNew ? "" : JSON.stringify(draft));
    if (asNew) setOriginalId(undefined);
    setPanel(null);
    setView("edit");
    setMessage(
      asNew
        ? "Loaded the deleted record — Save to bring it back."
        : "Loaded an earlier version — Save to apply it.",
    );
    setError(null);
  }

  function toggleStatus(id: string, current: string) {
    const next = current === "published" ? "draft" : "published";
    start(async () => {
      const result = await setRecordStatus(collection, idKey, id, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((p) => (p[idKey] === id ? { ...p, status: next } : p)),
      );
      if (originalId === id) {
        setDraft((prev) => ({ ...prev, status: next }));
        setSavedSnapshot((snap) => {
          try {
            return JSON.stringify({ ...JSON.parse(snap), status: next });
          } catch {
            return snap;
          }
        });
      }
    });
  }

  function loadRecord(item: Rec) {
    if (isDirty) {
      setPendingSwitch({ kind: "record", item });
      return;
    }
    applyRecord(item);
    setView("edit");
  }

  function startNew() {
    if (isDirty) {
      setPendingSwitch({ kind: "new" });
      return;
    }
    applyNew();
    setView("edit");
  }

  /** Back to the list; unsaved edits ask first. */
  function goList() {
    if (isDirty) {
      setPendingSwitch({ kind: "list" });
      return;
    }
    setView("list");
    setPanel(null);
  }

  function confirmSwitch() {
    if (!pendingSwitch) return;
    if (pendingSwitch.kind === "record") {
      applyRecord(pendingSwitch.item);
      setView("edit");
    } else if (pendingSwitch.kind === "new") {
      applyNew();
      setView("edit");
    } else {
      applyRecord(
        items.find((r) => String(r[idKey]) === originalId) ?? config.blank(),
      );
      setView("list");
      setPanel(null);
    }
    setPendingSwitch(null);
  }

  /** Saving touches the live site when the record is (or was) published; drafts save without asking. */
  function requestSave() {
    const missing = (config.requiredFields ?? []).filter((k) => {
      const v = draft[k];
      return (
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "")
      );
    });
    if (missing.length > 0) {
      setError(
        `Fill in: ${missing.map((k) => config.selectFields?.[k]?.label ?? humanize(k)).join(", ")}.`,
      );
      setMessage(null);
      document
        .getElementById("admin-content")
        ?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    let wasLive = false;
    try {
      wasLive = JSON.parse(savedSnapshot || "{}").status === "published";
    } catch {
      /* new record */
    }
    if (draft.status === "published" || wasLive) setConfirm({ kind: "save" });
    else save();
  }

  function save() {
    start(async () => {
      setMessage(null);
      setError(null);
      const result = await saveCollectionItem(
        collection,
        idKey,
        JSON.stringify(draft),
        originalId,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => {
        const next = [...prev];
        const renamedFromIdx =
          originalId !== undefined
            ? next.findIndex((p) => p[idKey] === originalId)
            : -1;
        if (renamedFromIdx >= 0) {
          next[renamedFromIdx] = draft;
          return next;
        }
        const idx = next.findIndex((p) => p[idKey] === draft[idKey]);
        if (idx >= 0) next[idx] = draft;
        else next.push(draft);
        return next;
      });
      setOriginalId(String(draft[idKey]));
      setSavedSnapshot(JSON.stringify(draft));
      setMessage(
        draft.status === "draft"
          ? "Saved as a draft — not shown on the site."
          : "Saved — live on the site.",
      );
    });
  }

  return (
    <RelationsContext.Provider
      value={relations ?? { courses: [], centres: [], cities: [] }}
    >
      <div>
        {view === "list" ? (
          <>
            <AdminPageHeader
              eyebrow={collection.replace(/_/g, " ")}
              title={title}
              description={description}
              actions={
                mode === "list" ? (
                  <button
                    type="button"
                    onClick={startNew}
                    className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm font-bold"
                  >
                    + New {singular}
                  </button>
                ) : undefined
              }
            />

            <WebsiteUsage live={live} appearsOn={appearsOn} note={note} />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
                placeholder={`Search ${title.toLowerCase()}…`}
                aria-label="Search records"
                className="admin-input h-11 w-full text-sm sm:max-w-sm sm:flex-1"
              />
              <div
                className="flex gap-1.5"
                role="group"
                aria-label="Filter by status"
              >
                {(["all", "published", "draft"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={statusFilter === f}
                    onClick={() => {
                      setStatusFilter(f);
                      setPageIndex(0);
                    }}
                    className={`min-h-11 cursor-pointer rounded-full border px-4 text-xs font-bold capitalize transition-colors ${
                      statusFilter === f
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                        : "border-border text-foreground-secondary hover:border-border-medium"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {mode === "list" ? (
                <button
                  type="button"
                  onClick={() => setPanel(panel === "trash" ? null : "trash")}
                  className="ml-auto min-h-11 cursor-pointer px-2 text-xs font-semibold text-foreground-muted hover:text-foreground"
                >
                  Deleted records…
                </button>
              ) : null}
            </div>

            {panel === "trash" ? (
              <HistoryPanel
                collection={collection}
                idKey={idKey}
                recordId={undefined}
                mode="trash"
                onLoad={loadVersion}
                onClose={() => setPanel(null)}
              />
            ) : null}

            <div className="adm-card mt-4 overflow-hidden">
              <div className="hidden grid-cols-[minmax(0,1fr)_9rem_14rem] gap-4 border-b border-border bg-surface/70 px-5 py-3 text-xs font-bold tracking-wide text-foreground-muted uppercase md:grid">
                <span>{title}</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {pageItems.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-foreground-muted">
                  {items.length === 0
                    ? `No ${title.toLowerCase()} yet.`
                    : "Nothing matches your search."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {pageItems.map((item, i) => {
                    const id = String(item[idKey] ?? i);
                    const status = String(item.status ?? "unknown");
                    const name = displayName(item, id);
                    return (
                      <li
                        key={id}
                        className="grid gap-3 px-5 py-3.5 transition-colors hover:bg-surface/60 md:grid-cols-[minmax(0,1fr)_9rem_14rem] md:items-center md:gap-4"
                      >
                        <button
                          type="button"
                          onClick={() => loadRecord(item)}
                          className="min-w-0 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                        >
                          <span className="block truncate text-[15px] font-semibold text-foreground hover:text-[var(--accent-ink)]">
                            {name}
                          </span>
                          {name !== id ? (
                            <span className="block truncate text-xs text-foreground-muted">
                              {id}
                            </span>
                          ) : null}
                        </button>
                        <span>
                          <StatusBadge status={status} />
                        </span>
                        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                          <button
                            type="button"
                            onClick={() => loadRecord(item)}
                            className="min-h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3.5 text-xs font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                          >
                            {mode === "list" ? "Edit" : "Open"}
                          </button>
                          {mode === "list" &&
                          (status === "published" || status === "draft") ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                setConfirm({
                                  kind: "toggle",
                                  id,
                                  current: status,
                                })
                              }
                              aria-label={`${status === "published" ? "Unpublish" : "Publish"} ${id}`}
                              className="min-h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-45"
                            >
                              {status === "published" ? "Unpublish" : "Publish"}
                            </button>
                          ) : null}
                          {mode === "list" ? (
                            <button
                              type="button"
                              disabled={pending}
                              aria-label={`Delete ${id}`}
                              onClick={() => setPendingDeleteId(id)}
                              className="min-h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:text-[#b42318] disabled:opacity-45"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {pageCount > 1 ? (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex(pageIndex - 1)}
                  className="min-h-10 cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-foreground-muted">
                  Page {pageIndex + 1} of {pageCount} · {filtered.length}{" "}
                  {title.toLowerCase()}
                </span>
                <button
                  type="button"
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => setPageIndex(pageIndex + 1)}
                  className="min-h-10 cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {mode !== "singleton" ? (
              <button
                type="button"
                onClick={goList}
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-[var(--accent-ink)]"
              >
                <span aria-hidden="true">←</span> All {title.toLowerCase()}
              </button>
            ) : null}

            <AdminPageHeader
              eyebrow={originalId ? `Editing ${singular}` : `New ${singular}`}
              title={
                mode === "singleton"
                  ? title
                  : displayName(
                      draft,
                      String(draft[idKey] || `New ${singular}`),
                    )
              }
              description={
                mode === "singleton"
                  ? description
                  : originalId
                    ? String(draft[idKey] ?? "")
                    : "Fill in the details, then save."
              }
              actions={<StatusBadge status={String(draft.status ?? "draft")} />}
            />

            {mode === "singleton" ? (
              <WebsiteUsage live={live} appearsOn={appearsOn} note={note} />
            ) : null}

            <div className="adm-card mt-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      status: published ? "draft" : "published",
                    }))
                  }
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] pr-2 text-sm font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${published ? "bg-growth-600" : "bg-border-medium"}`}
                  >
                    <span
                      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${published ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </span>
                  {published
                    ? "Published — visible on the website"
                    : "Draft — hidden from the website"}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {originalId ? (
                    <>
                      {viewPath && published ? (
                        <a
                          href={viewPath.replace(
                            /\{(\w+)\}/g,
                            (_m, k: string) => String(draft[k] ?? ""),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                        >
                          View on site
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setPanel(panel === "history" ? null : "history")
                        }
                        className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                      >
                        History
                      </button>
                      {mode === "list" ? (
                        <>
                          <button
                            type="button"
                            onClick={duplicate}
                            className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(originalId)}
                            className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-muted transition-colors hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={requestSave}
                    className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45"
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="mt-3 text-sm font-medium text-[var(--color-error-600)]"
                >
                  {error}
                </p>
              ) : null}
              {message ? (
                <p aria-live="polite" className="mt-3 text-sm text-growth-600">
                  {message}
                </p>
              ) : null}
            </div>

            {panel === "history" ? (
              <HistoryPanel
                collection={collection}
                idKey={idKey}
                recordId={originalId}
                mode="history"
                onLoad={loadVersion}
                onClose={() => setPanel(null)}
              />
            ) : null}

            <div className="mt-5 flex flex-col gap-5">
              {sections.map((section) => (
                <section
                  key={section.title ?? "flat"}
                  className="adm-card p-5 sm:p-6"
                >
                  {section.title ? (
                    <h3 className="mb-4 text-base font-bold tracking-tight text-foreground">
                      {section.title}
                    </h3>
                  ) : null}
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {section.fields.map((key) => {
                      const value = draft[key];
                      const isWide = isWideField(key, value);
                      return (
                        <div
                          key={key}
                          className={isWide ? "sm:col-span-2" : ""}
                        >
                          {section.fields.length === 1 &&
                          section.title === humanize(key) ? null : (
                            <label className="mb-1.5 block text-xs font-semibold text-foreground-secondary">
                              {config.selectFields?.[key]?.label ??
                                humanize(key)}
                              {config.requiredFields?.includes(key) ? (
                                <span
                                  className="ml-0.5 text-[var(--color-error-600)]"
                                  aria-label="required"
                                >
                                  {" "}
                                  *
                                </span>
                              ) : null}
                            </label>
                          )}
                          {config.lockedFields?.includes(key) &&
                          typeof value === "string" ? (
                            <input
                              value={value}
                              readOnly
                              aria-readonly="true"
                              className="admin-input cursor-not-allowed bg-surface text-foreground-muted"
                            />
                          ) : (
                            <ValueEditor
                              fieldKey={key}
                              value={value}
                              path={key}
                              context={draft}
                              config={config}
                              onChange={(next) =>
                                setDraft((prev) => ({ ...prev, [key]: next }))
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Sticks to the bottom of the viewport on a long form, so Save is never more than a glance away. */}
            <div className="adm-card sticky bottom-4 z-10 mt-5 flex items-center justify-between gap-3 !bg-background/90 px-4 py-3 shadow-[var(--adm-shadow-lift)] backdrop-blur-md">
              <span
                className={`inline-flex items-center gap-2 text-sm font-semibold ${isDirty ? "text-[#b54708]" : "text-foreground-muted"}`}
              >
                <span aria-hidden="true" className="adm-dot" />
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={requestSave}
                className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
        <AdminConfirmDialog
          open={pendingDeleteId !== null}
          onOpenChange={(open) => !open && setPendingDeleteId(null)}
          title="Delete record"
          description={
            <>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteId}
              </span>{" "}
              from {collection}? You can bring it back from “Deleted records”.
            </>
          }
          pending={pending}
          onConfirm={() => pendingDeleteId && confirmDelete(pendingDeleteId)}
        />

        <AdminConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => !open && !pending && setConfirm(null)}
          title={
            confirm?.kind === "toggle"
              ? confirm.current === "published"
                ? "Take this page offline?"
                : "Publish this record?"
              : draft.status === "published"
                ? "Publish changes to the live site?"
                : "Take this record offline?"
          }
          description={
            confirm?.kind === "toggle" ? (
              <>
                <span className="font-semibold text-foreground">
                  {confirm.id}
                </span>{" "}
                {confirm.current === "published"
                  ? "will disappear from the website straight away."
                  : "will appear on the website straight away."}
              </>
            ) : draft.status === "published" ? (
              <>
                Saving{" "}
                <span className="font-semibold text-foreground">
                  {String(draft[idKey] ?? "this record")}
                </span>{" "}
                updates the live website straight away.
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {String(draft[idKey] ?? "This record")}
                </span>{" "}
                is live now. Saving it as a draft removes it from the website.
              </>
            )
          }
          confirmLabel={
            confirm?.kind === "toggle"
              ? confirm.current === "published"
                ? "Unpublish"
                : "Publish"
              : draft.status === "published"
                ? "Publish"
                : "Save as draft"
          }
          pendingLabel="Saving…"
          tone="default"
          pending={pending}
          onConfirm={() => {
            const c = confirm;
            setConfirm(null);
            if (c?.kind === "toggle") toggleStatus(c.id, c.current);
            else if (c) save();
          }}
        />

        <AdminConfirmDialog
          open={pendingSwitch !== null}
          onOpenChange={(open) => !open && setPendingSwitch(null)}
          title="Discard unsaved changes?"
          description="You've edited this record without saving. Switching now discards those changes."
          confirmLabel="Discard"
          onConfirm={confirmSwitch}
        />
      </div>
    </RelationsContext.Provider>
  );
}
