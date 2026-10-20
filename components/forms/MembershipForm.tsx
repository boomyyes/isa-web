"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleAlert, Loader2, PhoneCall, Send } from "lucide-react";
import { AngularButton } from "@/components/ui/AngularButton";
import { fieldClass, labelClass } from "@/components/ui/formStyles";
import {
  HONEYPOT_FIELD,
  MEMBERSHIP_CALL_TIMES,
  MEMBERSHIP_YEARS,
  fieldErrors,
  membershipSchema,
  type MembershipInput,
} from "@/lib/forms/schemas";

const EMPTY = { name: "", email: "", phone: "", rollNumber: "", branch: "", year: "", callTime: "", message: "" };

/** Suggestions only: the field takes any branch, so a renamed or new one still works. */
const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Telecommunication",
  "Electronics and Computer Science",
  "Instrumentation Engineering",
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
];

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; ref: string } | { kind: "error"; message: string };

export function MembershipForm() {
  const [values, setValues] = useState(EMPTY);
  const [whatsapp, setWhatsapp] = useState(true);
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const mountedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);

  // Timed from mount, as in the query form: the server drops anything under 3 s.
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
    const input = { ...values, whatsapp, consent, adult } as unknown as MembershipInput;
    const parsed = membershipSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/forms/membership", {
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
        setStatus({ kind: "sent", ref: body.ref });
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
        <PhoneCall className="h-8 w-8 text-[var(--border-active)]" />
        <h3 className="mt-4 font-jetbrains text-lg font-semibold text-[var(--text-primary)]">We&apos;ll be in touch</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Your reference is{" "}
          <span className="font-jetbrains font-semibold text-[var(--text-primary)]">{status.ref}</span>. Someone from
          the committee will contact you{whatsapp ? " by phone or WhatsApp" : " by phone"} at the time you chose, and
          set up your membership with you on a short call. Quote the reference if you follow up.
        </p>
      </div>
    );
  }

  const busy = status.kind === "sending";
  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`m-${key}-error`} className="mt-1.5 text-xs text-danger">
        {errors[key]}
      </p>
    ) : null;
  const describedBy = (key: string) => (errors[key] ? `m-${key}-error` : undefined);
  const invalid = (key: string) => Boolean(errors[key]);

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-color)]/60 p-6 backdrop-blur-md md:p-8"
    >
      {/* Honeypot: off-screen and out of the tab order, so only bots fill it. */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="m-website">Website</label>
        <input ref={honeypot} id="m-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="m-name" className={labelClass}>Full name</label>
          <input
            id="m-name"
            name="name"
            autoComplete="name"
            maxLength={100}
            value={values.name}
            onChange={(e) => set("name")(e.target.value)}
            aria-invalid={invalid("name")}
            aria-describedby={describedBy("name")}
            className={fieldClass}
          />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor="m-email" className={labelClass}>Email</label>
          <input
            id="m-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            aria-invalid={invalid("email")}
            aria-describedby={describedBy("email")}
            className={fieldClass}
          />
          {fieldError("email")}
        </div>
      </div>

      <div>
        <label htmlFor="m-phone" className={labelClass}>Mobile number</label>
        <input
          id="m-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          maxLength={16}
          value={values.phone}
          onChange={(e) => set("phone")(e.target.value)}
          aria-invalid={invalid("phone")}
          aria-describedby={describedBy("phone")}
          className={fieldClass}
        />
        {fieldError("phone")}
        <label className="mt-3 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={whatsapp}
            onChange={(e) => setWhatsapp(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-[var(--accent-color)]"
          />
          This number is on WhatsApp, and you can message me there
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_1fr_8rem]">
        <div>
          <label htmlFor="m-roll" className={labelClass}>Roll number</label>
          <input
            id="m-roll"
            name="rollNumber"
            maxLength={30}
            value={values.rollNumber}
            onChange={(e) => set("rollNumber")(e.target.value)}
            aria-invalid={invalid("rollNumber")}
            aria-describedby={describedBy("rollNumber")}
            className={fieldClass}
          />
          {fieldError("rollNumber")}
        </div>
        <div>
          <label htmlFor="m-branch" className={labelClass}>Branch</label>
          <input
            id="m-branch"
            name="branch"
            list="m-branches"
            maxLength={80}
            value={values.branch}
            onChange={(e) => set("branch")(e.target.value)}
            aria-invalid={invalid("branch")}
            aria-describedby={describedBy("branch")}
            className={fieldClass}
          />
          <datalist id="m-branches">
            {BRANCHES.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          {fieldError("branch")}
        </div>
        <div>
          <label htmlFor="m-year" className={labelClass}>Year</label>
          <select
            id="m-year"
            name="year"
            value={values.year}
            onChange={(e) => set("year")(e.target.value)}
            aria-invalid={invalid("year")}
            aria-describedby={describedBy("year")}
            className={fieldClass}
          >
            <option value="">Choose</option>
            {MEMBERSHIP_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {fieldError("year")}
        </div>
      </div>

      <div>
        <label htmlFor="m-call" className={labelClass}>Best time to call you</label>
        <select
          id="m-call"
          name="callTime"
          value={values.callTime}
          onChange={(e) => set("callTime")(e.target.value)}
          aria-invalid={invalid("callTime")}
          aria-describedby={describedBy("callTime")}
          className={fieldClass}
        >
          <option value="">Choose</option>
          {MEMBERSHIP_CALL_TIMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {fieldError("callTime")}
      </div>

      <div>
        <label htmlFor="m-message" className={labelClass}>Anything we should know? (optional)</label>
        <textarea
          id="m-message"
          name="message"
          rows={3}
          maxLength={1000}
          value={values.message}
          onChange={(e) => set("message")(e.target.value)}
          aria-invalid={invalid("message")}
          aria-describedby={describedBy("message")}
          className={`${fieldClass} resize-y`}
        />
        {fieldError("message")}
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        Don&apos;t send passwords or payment details here. We&apos;ll go through everything with you on the call.
      </p>

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
            I agree to ISA-RAIT using these details to contact me by phone, WhatsApp or email about ISA membership, as
            described in the{" "}
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
        {busy ? "Sending…" : "Request a Call"}
      </AngularButton>

      {status.kind === "error" && (
        <p role="alert" className="flex items-center justify-center gap-2 font-jetbrains text-sm text-danger">
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
