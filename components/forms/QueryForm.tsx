"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleAlert, Loader2, MailCheck, Send } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import { HONEYPOT_FIELD, fieldErrors, querySchema, type QueryInput } from "@/lib/forms/schemas";

const EMPTY = { name: "", email: "", subject: "", message: "" };

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; ref: string; anonymous: boolean }
  | { kind: "error"; message: string };

export function QueryForm() {
  const [values, setValues] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const mountedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);

  // Timed from mount, not first keystroke: someone who autofills and pastes can
  // finish in seconds, and the server silently drops anything under 3 s.
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const clearError = (key: string) =>
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(key);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Anonymous: name and email aren't sent at all, not just ignored later.
    const input: QueryInput = anonymous
      ? { anonymous: true, subject: values.subject, message: values.message, consent: consent as true, adult: adult as true }
      : { ...values, consent: consent as true, adult: adult as true };
    const parsed = querySchema.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/forms/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          [HONEYPOT_FIELD]: honeypot.current?.value ?? "",
          elapsed: mountedAt.current ? Date.now() - mountedAt.current : 0,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ref?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      if (response.ok && body.ref) {
        setStatus({ kind: "sent", ref: body.ref, anonymous });
        return;
      }
      if (body.fields) setErrors(body.fields);
      setStatus({ kind: "error", message: body.error ?? "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="rounded-2xl border border-[var(--border-active)]/40 bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8">
        <MailCheck className="h-8 w-8 text-[var(--border-active)]" />
        <h3 className="mt-4 font-jetbrains text-lg font-semibold text-[var(--text-primary)]">
          Query received
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Your reference is{" "}
          <span className="font-jetbrains font-semibold text-[var(--text-primary)]">{status.ref}</span>.
          {status.anonymous
            ? " You sent this without your name or email, so the committee can read it but can't reply."
            : " The committee will reply to the email address you gave. Quote the reference if you follow up."}
        </p>
      </div>
    );
  }

  const busy = status.kind === "sending";
  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`q-${key}-error`} className="mt-1.5 text-xs text-red-400">
        {errors[key]}
      </p>
    ) : null;
  const describedBy = (key: string) => (errors[key] ? `q-${key}-error` : undefined);

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
    >
      {/* Honeypot: off-screen and out of the tab order, so only bots fill it. */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="q-website">Website</label>
        <input ref={honeypot} id="q-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => {
            setAnonymous(e.target.checked);
            clearError("name");
            clearError("email");
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-color)]"
        />
        <span>
          <span className="text-[var(--text-primary)]">Send without my name or email</span>
          <span className="mt-0.5 block text-xs">
            The committee won&apos;t know who sent it and won&apos;t be able to reply. Leave out anything in your
            message that identifies you.
          </span>
        </span>
      </label>

      {!anonymous && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="q-name" className={labelClass}>Name</label>
            <input
              id="q-name"
              name="name"
              autoComplete="name"
              maxLength={100}
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("name")}
              className={fieldClass}
            />
            {fieldError("name")}
          </div>
          <div>
            <label htmlFor="q-email" className={labelClass}>Email</label>
            <input
              id="q-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email")}
              className={fieldClass}
            />
            {fieldError("email")}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="q-subject" className={labelClass}>Subject</label>
        <input
          id="q-subject"
          name="subject"
          maxLength={150}
          value={values.subject}
          onChange={(e) => set("subject")(e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={describedBy("subject")}
          className={fieldClass}
        />
        {fieldError("subject")}
      </div>

      <div>
        <label htmlFor="q-message" className={labelClass}>Message</label>
        <textarea
          id="q-message"
          name="message"
          rows={6}
          maxLength={3000}
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy("message")}
          className={`${fieldClass} resize-y`}
        />
        {fieldError("message")}
      </div>

      <div className="space-y-3 text-sm text-[var(--text-secondary)]">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              clearError("consent");
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-color)]"
          />
          <span>
            I agree to ISA-RAIT processing what I submit here to deal with my query, as described in the{" "}
            <Link href="/privacy" className="text-[var(--accent-color)] underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {fieldError("consent")}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={adult}
            onChange={(e) => {
              setAdult(e.target.checked);
              clearError("adult");
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-color)]"
          />
          <span>I am 18 or older.</span>
        </label>
        {fieldError("adult")}
      </div>

      <AngularButton
        type="submit"
        variant="primary"
        disabled={busy}
        className="w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Sending…" : "Send Query"}
      </AngularButton>

      {status.kind === "error" && (
        <p role="alert" className="flex items-center justify-center gap-2 font-jetbrains text-sm text-red-400">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {status.message}
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-[var(--text-secondary)]">
        Under 18? Ask a parent or guardian to write to{" "}
        <a href="mailto:isa.rait@rait.ac.in" className="text-[var(--accent-color)]">
          isa.rait@rait.ac.in
        </a>{" "}
        instead.
      </p>
    </form>
  );
}
