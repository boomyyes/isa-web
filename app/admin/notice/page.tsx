import { AdminShell, buttonClass, cardClass, formatTime, Notice } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/session";
import { ackedAt, NOTICE_VERSION } from "@/lib/admin/notice";

export const dynamic = "force-dynamic";

const h2 = "font-jetbrains text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]";

// The notice to committee members under s.5 of the DPDP Act, 2023. Keep it
// true to what the workspace does; when its substance changes, bump
// NOTICE_VERSION in lib/admin/notice.ts so everyone acknowledges it again.
export default async function NoticePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireAdmin("jointcore", { notice: false });
  const { base } = session;
  const { error } = await searchParams;
  let acked: Date | null = null;
  try {
    acked = await ackedAt(session.email);
  } catch {
    acked = null;
  }

  return (
    <AdminShell session={session} base={base} title="Notice to committee members">
      {error && <Notice tone="error">Your acknowledgement couldn&apos;t be saved. Try again in a moment.</Notice>}
      {!acked && (
        <Notice>Please read this before using the workspace. It explains what the workspace holds about you.</Notice>
      )}

      <div className={`${cardClass} space-y-6 text-sm leading-relaxed text-[var(--text-secondary)]`}>
        <p>
          This notice is given by the ISA-RAIT Student Chapter, as Data Fiduciary under the Digital Personal Data
          Protection Act, 2023, to its committee members and volunteers who use this admin workspace. It
          supplements the public Privacy Policy, which covers students and visitors. Version {NOTICE_VERSION}.
        </p>

        <section className="space-y-2">
          <h2 className={h2}>What is held about you, and for how long</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text-primary)]">Your account:</strong> your email address, role and
              domain, who added you and when. Kept while you are a member of the workspace and deleted when you are
              removed from it.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Sign-in:</strong> single-use sign-in codes (valid 10
              minutes, at most 5 attempts) and sessions (valid 8 hours), held as one-way hashes. A strictly necessary cookie keeps you
              signed in. Login attempts are rate-limited per email and per network address.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Activity log:</strong> significant actions you take
              (for example publishing content, approving a bill, changing someone&apos;s role), with your email and
              the time. Kept for one year, then deleted automatically.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Chat messages:</strong> the text, your email and the
              time. Deleted automatically one year after they were sent. Deleting a message removes its text at
              once; a placeholder showing that a message was deleted remains until the one-year deletion.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Forum threads and posts:</strong> the text, your email
              and the time. Kept until deleted. Deleting a post removes its text; a record that a post existed,
              who wrote it, when, and who deleted it is kept for moderation accountability.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Announcements and calendar entries</strong> you
              create: kept until deleted. Which announcements you have read is recorded so that unread ones can be
              shown to you.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Treasury:</strong> bills you submit (amount, vendor,
              description), receipt files you attach, and who approved, rejected or paid each bill. Where you are
              reimbursed, your name and the payment mode are recorded; bank account numbers and UPI IDs are never
              collected. Financial records are kept for at least one year after the end of their financial year
              (April to March) so that accounts can be audited, and are then deleted by the chapter&apos;s
              leadership.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Website edits:</strong> changes you publish to the
              public website are kept in the website&apos;s version history, which does not name you. That you
              made the change is recorded in the activity log above.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">This acknowledgement:</strong> your email, the notice
              version and the time you acknowledged it.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className={h2}>Why</h2>
          <p>
            To run the chapter: coordinating the committee, keeping members informed, maintaining the website,
            and keeping accountable financial records that can be audited by the institute. The activity log
            exists so that every significant action in the workspace can be traced to the person who took it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className={h2}>Who can see it</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Chat channels and forum categories: the members they are open to (everyone, Core and above, or one domain).</li>
            <li>Announcements and the shared calendar: all workspace members.</li>
            <li>Your bills and receipts: you, Core and above (who approve and pay them), and Faculty and the President (who audit them). Exports of the accounts may be given to faculty or the institute for audit.</li>
            <li>The activity log and the team list: Faculty, the President and Admins.</li>
          </ul>
          <p>
            The workspace relies on service providers for hosting, databases, file storage and real-time
            message delivery. The real-time delivery provider receives only a pseudonymous identifier and a
            signal that a channel has changed; it never receives message text or your email address. The
            categories of these providers are listed in the public Privacy Policy, and you may ask for their
            identities.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className={h2}>Your rights</h2>
          <p>
            You may ask to access, correct or erase personal data held about you, or raise a grievance, by
            writing to Faculty or the President, or through the contact details in the public Privacy Policy.
            Financial records cannot be erased before the end of their retention period where they are needed
            to keep the chapter&apos;s accounts complete and auditable; in that case the reason will be explained
            to you. You may also approach the Data Protection Board of India.
          </p>
        </section>
      </div>

      {acked ? (
        <p className="text-sm text-[var(--text-secondary)]">You acknowledged this notice on {formatTime(acked.toISOString())}.</p>
      ) : (
        <form method="post" action="/api/admin/notice">
          <button className={buttonClass}>I have read this notice</button>
        </form>
      )}
    </AdminShell>
  );
}
