"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import {
  collectionByName,
  collectionSchema,
  tidy,
  type Field,
} from "@/lib/content/collections";

type Json = unknown;
type Path = (string | number)[];

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--border-active)] hover:text-[var(--text-primary)] disabled:opacity-40";
const primary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-active)] bg-[var(--border-active)]/10 px-4 py-2.5 font-jetbrains text-xs font-semibold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--border-active)]/20 disabled:opacity-50";

function getAt(value: Json, path: Path): Json {
  return path.reduce<Json>((node, key) => (node as Record<string | number, Json> | undefined)?.[key], value);
}

function setAt(value: Json, path: Path, next: Json): Json {
  if (path.length === 0) return next;
  const [head, ...rest] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[head as number] = setAt(copy[head as number], rest, next);
    return copy;
  }
  const obj = (value ?? {}) as Record<string, Json>;
  return { ...obj, [head]: setAt(obj[head as string], rest, next) };
}

function emptyItem(fields: Field[]): Record<string, Json> {
  const item: Record<string, Json> = {};
  for (const f of fields) {
    if (f.type === "list" || f.type === "paragraphs") item[f.key] = [];
    else if (f.type === "group") item[f.key] = emptyItem(f.fields);
    else if (f.type === "boolean") item[f.key] = false;
    else item[f.key] = "";
  }
  return item;
}

/** A short, human summary of what changed, used as the default commit summary. */
function describeChanges(before: Json, after: Json): string[] {
  const out: string[] = [];
  const titleOf = (v: Json) => {
    const o = v as Record<string, Json> | undefined;
    return String(o?.title ?? o?.name ?? o?.question ?? o?.label ?? o?.domain ?? o?.alt ?? o?.id ?? "item");
  };
  const walk = (a: Json, b: Json, where: string) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (Array.isArray(a) && Array.isArray(b)) {
      const key = (v: Json) => String((v as Record<string, Json>)?.id ?? JSON.stringify(v));
      const ak = new Map(a.map((v) => [key(v), v]));
      const bk = new Map(b.map((v) => [key(v), v]));
      for (const [k, v] of bk) if (!ak.has(k)) out.push(`added ${titleOf(v)}${where}`);
      for (const [k, v] of ak) if (!bk.has(k)) out.push(`removed ${titleOf(v)}${where}`);
      for (const [k, v] of bk) if (ak.has(k) && JSON.stringify(ak.get(k)) !== JSON.stringify(v)) out.push(`edited ${titleOf(v)}${where}`);
      if (out.length === 0) out.push(`reordered${where}`);
      return;
    }
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b as object)])) {
        walk((a as Record<string, Json>)[k], (b as Record<string, Json>)[k], ` in ${k}`);
      }
      return;
    }
    out.push(`edited${where}`);
  };
  walk(before, after, "");
  return [...new Set(out)];
}

export function ContentEditor({
  name,
  initial,
  sha,
  commitBase,
}: {
  name: string;
  initial: Json;
  sha: string;
  commitBase: string;
}) {
  const collection = collectionByName(name)!;
  const [value, setValue] = useState<Json>(initial);
  const [base, setBase] = useState({ value: initial, sha });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "busy" } | { kind: "done"; url: string } | { kind: "error"; message: string; conflict?: boolean }
  >({ kind: "idle" });

  const changes = useMemo(() => describeChanges(tidy(base.value), tidy(value)), [base.value, value]);
  const dirty = changes.length > 0;
  const update = (path: Path, next: Json) => {
    setValue((v: Json) => setAt(v, path, next));
    setStatus({ kind: "idle" });
  };

  async function publish() {
    const data = tidy(value);
    const check = collectionSchema(collection).safeParse(data);
    if (!check.success) {
      setErrors(Object.fromEntries(check.error.issues.map((i) => [i.path.join("."), i.message])));
      setStatus({ kind: "error", message: "Some fields need fixing. They're marked in red." });
      return;
    }
    setErrors({});
    setStatus({ kind: "busy" });
    try {
      const response = await fetch(`/api/admin/content/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sha: base.sha, data, summary: changes.slice(0, 3).join(", ") }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        commitUrl?: string;
        fileSha?: string;
        error?: string;
        conflict?: boolean;
        issues?: { path: string; message: string }[];
      };
      if (response.ok && body.commitUrl && body.fileSha) {
        setBase({ value: data, sha: body.fileSha });
        setValue(data);
        setStatus({ kind: "done", url: body.commitUrl });
        return;
      }
      if (body.issues) setErrors(Object.fromEntries(body.issues.map((i) => [i.path, i.message])));
      setStatus({ kind: "error", message: body.error ?? "Publishing failed.", conflict: body.conflict });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server. Your edits are still here; try again." });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)]">{collection.description}</p>

      <FieldsBlock fields={collection.fields} shape={collection.shape} itemTitle={collection.itemTitle} value={value} path={[]} update={update} errors={errors} />

      <div className="sticky bottom-0 z-10 -mx-1 space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)]/95 p-4 backdrop-blur">
        {dirty ? (
          <div className="text-sm text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)]">Unpublished changes</p>
            <ul className="mt-1 list-disc pl-5">
              {changes.slice(0, 8).map((c) => (
                <li key={c}>{c}</li>
              ))}
              {changes.length > 8 && <li>and {changes.length - 8} more</li>}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No unpublished changes.</p>
        )}
        {status.kind === "done" && (
          <p className="text-sm text-[var(--text-primary)]">
            Published. The site updates in about 2 minutes.{" "}
            <a href={status.url} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] underline">
              View the commit
            </a>
          </p>
        )}
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-400">
            {status.message}
            {status.conflict && " Reload the page to get their version; copy anything you need first."}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" className={primary} disabled={!dirty || status.kind === "busy"} onClick={publish}>
            {status.kind === "busy" && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish to {commitBase}
          </button>
          <button
            type="button"
            className={btn}
            disabled={!dirty || status.kind === "busy"}
            onClick={() => {
              if (confirm("Discard all unpublished changes?")) {
                setValue(base.value);
                setErrors({});
                setStatus({ kind: "idle" });
              }
            }}
          >
            Discard changes
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldsBlock({
  fields,
  shape,
  itemTitle,
  value,
  path,
  update,
  errors,
}: {
  fields: Field[];
  shape: "list" | "object";
  itemTitle?: string;
  value: Json;
  path: Path;
  update: (path: Path, next: Json) => void;
  errors: Record<string, string>;
}) {
  if (shape === "list") {
    return (
      <ListEditor
        field={{ key: "", label: "Items", type: "list", fields, itemTitle: itemTitle ?? "id" }}
        value={value}
        path={path}
        update={update}
        errors={errors}
      />
    );
  }
  return (
    <div className="space-y-5">
      {fields.map((f) => (
        <FieldEditor key={f.key} field={f} value={getAt(value, [f.key])} path={[...path, f.key]} update={update} errors={errors} />
      ))}
    </div>
  );
}

function FieldEditor({
  field,
  value,
  path,
  update,
  errors,
}: {
  field: Field;
  value: Json;
  path: Path;
  update: (path: Path, next: Json) => void;
  errors: Record<string, string>;
}) {
  const id = path.join("-");
  const error = errors[path.join(".")];
  const help = "help" in field && field.help ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{field.help}</p> : null;
  const err = error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null;
  const label = (
    <label htmlFor={id} className={labelClass}>
      {field.label}
      {"required" in field && field.required ? " *" : ""}
    </label>
  );
  const str = typeof value === "string" ? value : "";

  switch (field.type) {
    case "text":
    case "url":
    case "date":
    case "path":
      return (
        <div>
          {label}
          <input
            id={id}
            type={field.type === "date" ? "date" : "text"}
            value={str}
            onChange={(e) => update(path, e.target.value)}
            className={`${fieldClass} ${error ? "!border-red-500/70" : ""}`}
          />
          {help}
          {err}
        </div>
      );
    case "textarea":
      return (
        <div>
          {label}
          <textarea id={id} rows={5} value={str} onChange={(e) => update(path, e.target.value)} className={`${fieldClass} resize-y ${error ? "!border-red-500/70" : ""}`} />
          {help}
          {err}
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select id={id} value={str} onChange={(e) => update(path, e.target.value)} className={`${fieldClass} w-auto`}>
            <option value="">Choose…</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {help}
          {err}
        </div>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
          <input type="checkbox" checked={value === true} onChange={(e) => update(path, e.target.checked)} className="h-4 w-4 accent-[var(--accent-color)]" />
          {field.label}
        </label>
      );
    case "image":
      return <ImageField field={field} id={id} value={str} path={path} update={update} label={label} help={help} err={err} />;
    case "paragraphs": {
      const items = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {label}
          {help}
          <div className="mt-2 space-y-3">
            {items.map((p, i) => (
              <div key={i} className="flex gap-2">
                <textarea rows={4} value={p} onChange={(e) => update([...path, i], e.target.value)} className={`${fieldClass} resize-y`} aria-label={`Paragraph ${i + 1}`} />
                <button type="button" className={btn} onClick={() => update(path, items.filter((_, j) => j !== i))} aria-label="Remove paragraph">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" className={btn} onClick={() => update(path, [...items, ""])}>
              <Plus className="h-3.5 w-3.5" /> Add paragraph
            </button>
          </div>
          {err}
        </div>
      );
    }
    case "group":
      return (
        <fieldset className="rounded-2xl border border-[var(--border-color)] p-4">
          <legend className={`${labelClass} px-2`}>{field.label}</legend>
          <div className="space-y-5">
            {field.fields.map((f) => (
              <FieldEditor key={f.key} field={f} value={getAt(value, [f.key])} path={[...path, f.key]} update={update} errors={errors} />
            ))}
          </div>
        </fieldset>
      );
    case "list":
      return <ListEditor field={field} value={value} path={path} update={update} errors={errors} showLabel />;
  }
}

function ListEditor({
  field,
  value,
  path,
  update,
  errors,
  showLabel,
}: {
  field: Extract<Field, { type: "list" }>;
  value: Json;
  path: Path;
  update: (path: Path, next: Json) => void;
  errors: Record<string, string>;
  showLabel?: boolean;
}) {
  const items = Array.isArray(value) ? (value as Record<string, Json>[]) : [];
  const move = (from: number, to: number) => {
    const copy = [...items];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    update(path, copy);
  };
  const prefix = path.join(".");
  const hasErrorIn = (i: number) =>
    Object.keys(errors).some((k) => k === `${prefix ? `${prefix}.` : ""}${i}` || k.startsWith(`${prefix ? `${prefix}.` : ""}${i}.`));

  return (
    <div>
      {showLabel && <p className={labelClass}>{field.label}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <details key={i} className={`group rounded-xl border bg-[var(--card-color)]/40 ${hasErrorIn(i) ? "border-red-500/60" : "border-[var(--border-color)]"}`} open={hasErrorIn(i) || undefined}>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-primary)]">
              <ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" />
              <span className="min-w-0 flex-1 truncate">
                {String(item?.[field.itemTitle] || "(untitled)")}
                {item?.hidden === true && <span className="ml-2 text-xs text-[var(--text-secondary)]">hidden</span>}
              </span>
              <button type="button" className={btn} disabled={i === 0} onClick={(e) => { e.preventDefault(); move(i, i - 1); }} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={btn} disabled={i === items.length - 1} onClick={(e) => { e.preventDefault(); move(i, i + 1); }} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={btn}
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm(`Remove "${String(item?.[field.itemTitle] || "this item")}"?`)) update(path, items.filter((_, j) => j !== i));
                }}
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </summary>
            <div className="space-y-5 border-t border-[var(--border-color)] p-4">
              {field.fields.map((f) => (
                <FieldEditor key={f.key} field={f} value={getAt(item, [f.key])} path={[...path, i, f.key]} update={update} errors={errors} />
              ))}
            </div>
          </details>
        ))}
      </div>
      <button type="button" className={`${btn} mt-3`} onClick={() => update(path, [...items, emptyItem(field.fields)])}>
        <Plus className="h-3.5 w-3.5" /> Add {field.label === "Items" ? "item" : `to ${field.label.toLowerCase()}`}
      </button>
    </div>
  );
}

export function ImageField({
  field,
  id,
  value,
  path,
  update,
  label,
  help,
  err,
}: {
  field: Extract<Field, { type: "image" }>;
  id: string;
  value: string;
  path: Path;
  update: (path: Path, next: Json) => void;
  label: React.ReactNode;
  help: React.ReactNode;
  err: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setNote("");
    const form = new FormData();
    form.set("file", file);
    form.set("folder", field.folder);
    try {
      const response = await fetch("/api/admin/content/upload", { method: "POST", body: form });
      const body = (await response.json().catch(() => ({}))) as { path?: string; error?: string };
      if (response.ok && body.path) {
        update(path, body.path);
        setNote("Uploaded. It appears on the site after the next deploy, about 2 minutes.");
      } else {
        setNote(body.error ?? "Upload failed.");
      }
    } catch {
      setNote("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label}
      <div className="flex flex-wrap items-center gap-3">
        <input id={id} type="text" value={value} onChange={(e) => update(path, e.target.value)} placeholder={`/${field.folder ? `${field.folder}/` : ""}photo.jpg`} className={`${fieldClass} max-w-md`} />
        <label className={`${btn} cursor-pointer`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- a raw preview of whatever path is typed, not a site image
        <img src={value} alt="" className="mt-3 h-24 w-auto rounded-lg border border-[var(--border-color)] object-cover" />
      )}
      {note && <p className="mt-1 text-xs text-[var(--text-secondary)]">{note}</p>}
      {help}
      {err}
    </div>
  );
}
