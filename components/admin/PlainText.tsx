// Member-written text (announcements, forum posts). Rendered as React text, so
// any markup in it shows literally; only http(s) URLs become links, and those
// open in a new tab without access to this page.

const URL_PATTERN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;

export function PlainText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--accent-color)] underline underline-offset-2">
            {part}
          </a>
        ) : (
          part
        )
      )}
    </div>
  );
}
