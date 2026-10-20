"use client";

// The admin sidebar's links. A client component only so the current page can
// be highlighted from usePathname(); everything it shows is decided on the
// server by AdminShell (which items this member may see, and the badges).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { NavCounts } from "@/lib/admin/navCounts";
import { channelName, WORKSPACE_ID } from "@/lib/ablyChannels";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Gauge,
  History,
  Inbox,
  Landmark,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  PiggyBank,
  Receipt,
  ShieldX,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  inbox: Inbox,
  announcements: Megaphone,
  calendar: CalendarDays,
  forum: MessagesSquare,
  chat: MessageCircle,
  content: FileText,
  overview: Gauge,
  bills: Receipt,
  ledger: BookOpen,
  budgets: PiggyBank,
  purge: Trash2,
  team: Users,
  erase: ShieldX,
  audit: History,
  treasury: Landmark,
} satisfies Record<string, LucideIcon>;

export type NavIcon = keyof typeof NAV_ICONS;

export type AdminNavSection = {
  title: string;
  items: { href: string; label: string; icon: NavIcon; badge?: keyof NavCounts }[];
};

// The layout fetches the counts once; after that this store holds the latest,
// shared by the sidebar badges, the bell and the drawer. Null until it changes.
let live: NavCounts | null = null;
const listeners = new Set<() => void>();
const setLive = (next: NavCounts) => {
  live = next;
  listeners.forEach((notify) => notify());
};
const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => void listeners.delete(notify);
};

const onAnnouncements = (pathname: string) => /\/announcements\/?$/.test(pathname);

function useCount(counts: Promise<NavCounts>, name: keyof NavCounts) {
  const here = onAnnouncements(usePathname());
  const initial = use(counts);
  const current = useSyncExternalStore(subscribe, () => live, () => null) ?? initial;
  useEffect(() => {
    // Opening Announcements marks everything read on the server.
    if (here && (live ?? initial).unread) setLive({ ...(live ?? initial), unread: 0 });
  }, [here, initial]);
  return name === "unread" && here ? 0 : current[name];
}

/**
 * Keeps the badges current without a reload. The server publishes a bare
 * "something changed" on Ably; this refetches the counts from our own API, so
 * nothing about announcements or bills passes through Ably. Renders nothing.
 */
export function LiveUpdates() {
  useEffect(() => {
    let closed = false;
    let realtime: import("ably").Realtime | null = null;
    const refetch = async () => {
      const res = await fetch("/api/admin/live/counts", { cache: "no-store" }).catch(() => null);
      if (!res?.ok || closed) return;
      const next = await res.json().catch(() => null);
      if (next) setLive(next);
    };
    // Loaded after the page, so the Ably client never weighs on first paint.
    import("ably").then(({ Realtime }) => {
      if (closed) return;
      realtime = new Realtime({ authUrl: "/api/admin/live/token", authMethod: "GET" });
      // Every (re)connect refetches, which also covers signals missed while asleep or offline.
      realtime.connection.on("connected", refetch);
      realtime.channels.get(channelName(WORKSPACE_ID)).subscribe(refetch);
    }).catch(() => {
      // Offline or a failed chunk: badges update on the next load instead.
    });
    return () => {
      closed = true;
      realtime?.close();
    };
  }, []);
  return null;
}

function CountBadge({ counts, name }: { counts: Promise<NavCounts>; name: keyof NavCounts }) {
  const n = useCount(counts, name);
  if (!n) return null;
  return (
    <span className="rounded-full bg-[var(--accent-color)] px-1.5 py-0.5 font-jetbrains text-[10px] font-bold tabular-nums text-[var(--bg-color)]">
      {n}
      <span className="sr-only"> new</span>
    </span>
  );
}

/** The unread dot on the top-bar bell. */
export function BellDot({ counts }: { counts: Promise<NavCounts> }) {
  const n = useCount(counts, "unread");
  if (!n) return null;
  return (
    <>
      <span aria-hidden className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[var(--accent-color)] ring-2 ring-[var(--card-color)]" />
      <span className="sr-only">, {n} unread</span>
    </>
  );
}

/** Exact match for the dashboard, prefix match for everything else. */
function matches(pathname: string, href: string, home: string) {
  if (href === home) return pathname === home || pathname === `${home}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one item to highlight: the longest href that matches. Without this,
 * /finance/bills matched both "Overview" (/finance) and "Bills", and the pill
 * slid to whichever came first.
 */
function currentHref(sections: AdminNavSection[], pathname: string, home: string) {
  let best: string | null = null;
  for (const { items } of sections) {
    for (const { href } of items) {
      const h = href || "/";
      if (matches(pathname, h, home) && (!best || h.length > best.length)) best = h;
    }
  }
  return best;
}

/**
 * Slides the glowing pill onto the current item. The nav persists across
 * pages, so the pill glides from wherever it last was; the first placement
 * skips the transition. Positioned in a layout effect, before paint, and
 * written straight to the DOM: no re-render.
 */
function useSlidingPill(navRef: React.RefObject<HTMLElement | null>, pillRef: React.RefObject<HTMLDivElement | null>) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    const target = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !pill || !target) {
      if (pill) pill.style.opacity = "0";
      return;
    }
    // The copy inside the closed mobile drawer has no layout; measuring it
    // would put the pill at the top.
    if (target.offsetHeight === 0) return;
    const first = pill.style.opacity !== "1";
    if (first) pill.style.transition = "none";
    pill.style.transform = `translateY(${target.offsetTop}px)`;
    pill.style.height = `${target.offsetHeight}px`;
    pill.style.opacity = "1";
    if (first) {
      void pill.offsetHeight; // commit the position before re-enabling transitions
      pill.style.transition = "";
    }
  }, [navRef, pillRef, pathname]);
}

export function AdminNav({
  sections,
  home,
  counts,
}: {
  sections: AdminNavSection[];
  home: string;
  counts: Promise<NavCounts>;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  useSlidingPill(navRef, pillRef);
  // The frame persists across pages, so the mobile drawer has to be shut by hand.
  useEffect(() => navRef.current?.closest("details")?.removeAttribute("open"), [pathname]);
  // While the drawer is open, the rest of the frame is inert, and Escape closes it.
  useEffect(() => {
    const drawer = navRef.current?.closest("details");
    if (!drawer) return;
    const others = () => [...(drawer.parentElement?.children ?? [])].filter((el) => el !== drawer);
    const onToggle = () => others().forEach((el) => el.toggleAttribute("inert", drawer.open));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !drawer.open) return;
      drawer.removeAttribute("open");
      drawer.querySelector("summary")?.focus();
    };
    drawer.addEventListener("toggle", onToggle);
    document.addEventListener("keydown", onKey);
    return () => {
      drawer.removeEventListener("toggle", onToggle);
      document.removeEventListener("keydown", onKey);
      others().forEach((el) => el.removeAttribute("inert"));
    };
  }, []);
  // On admin.isarait.in the URL has no /admin prefix while `home` may be ""
  // (subdomain) or "/admin" (path mode); normalise both to compare.
  const root = home || "/";
  const active = currentHref(sections, pathname, root);

  return (
    <nav ref={navRef} aria-label="Admin" className="relative space-y-5">
      {/* The one glowing pill, slid under whichever item is current. */}
      <div
        ref={pillRef}
        aria-hidden
        className="admin-glow admin-nav-pill pointer-events-none absolute inset-x-0 top-0 rounded-xl border border-[var(--border-active)]/40 opacity-0"
      />
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 font-jetbrains text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]/60">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const current = (item.href || "/") === active;
              const Icon = NAV_ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href || "/"}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "admin-nav-item group relative flex min-h-9 items-center gap-3 rounded-xl px-3 py-1.5 text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]",
                      current
                        ? "font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon aria-hidden className="admin-nav-icon size-4 shrink-0" />
                    <span className="admin-nav-label flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <Suspense>
                        <CountBadge counts={counts} name={item.badge} />
                      </Suspense>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
