"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  TrendingUp,
  Users,
  Briefcase,
  Globe,
  Award,
  LineChart,
  Crown,
  Quote,
  Wrench,
  Network,
  Rocket,
  Compass,
  Tag,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { HolographicCard } from "@/components/ui/HolographicCard";

/** External sign-up destination. */
const JOIN_URL = "https://www.isa.org/membership";

const badges = [
  { icon: Globe, label: "Global Network" },
  { icon: Award, label: "Industry Recognized" },
  { icon: LineChart, label: "Career Growth" },
  { icon: Crown, label: "Leadership Opportunities" },
] as const;

type Pillar = {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  /** One of the site's two signature accents (CSS var), alternated per pillar. */
  glow: string;
  items: string[];
};

const pillars: Pillar[] = [
  {
    icon: BookOpen,
    title: "Learn",
    glow: "var(--border-active)",
    items: [
      "Access 150+ automation standards, technical reports & best practices",
      "Read ISA Transactions and Automation Monthly magazine",
      "Automation.com newsletters",
      "ISA Pub Hub for e-books, archives & more",
    ],
  },
  {
    icon: TrendingUp,
    title: "Grow",
    glow: "var(--accent-color)",
    items: [
      "Discounts on training courses",
      "Discounts on CAP®, CCST® and CST® certification programs",
      "Discounts on conference registration",
      "Earn a mini-MBA with ISA Business Academy",
    ],
  },
  {
    icon: Users,
    title: "Connect",
    glow: "var(--border-active)",
    items: [
      "Engage in technical discussions on ISA Connect",
      "Network through local ISA sections and communities",
      "Participate in webinars, conferences & forums",
      "ISA Mentor Program & volunteer opportunities",
    ],
  },
  {
    icon: Briefcase,
    title: "Advance Your Career",
    glow: "var(--accent-color)",
    items: [
      "Explore internships and job opportunities in the ISA Career Center",
      "Build a stronger resume with global recognition",
      "Access Member & Expert Directory",
      "Use of ISA member logo",
    ],
  },
];

const whyItMatters = [
  { icon: Wrench, label: "Build in-demand skills and knowledge" },
  { icon: Network, label: "Connect with professionals worldwide" },
  { icon: Rocket, label: "Boost your career from college" },
  { icon: Compass, label: "Stay ahead with industry trends and resources" },
] as const;

const trustBadges = [
  { icon: Tag, label: "Affordable Membership" },
  { icon: ShieldCheck, label: "Trusted Globally" },
  { icon: GraduationCap, label: "Designed for Students Like You" },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] as const },
};

export function MembershipContent() {
  return (
    <main className="relative overflow-hidden">
      {/* ============================= HERO ============================= */}
      <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 md:pt-36 md:pb-28">
        {/* ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full opacity-30 blur-[120px]"
          style={{ background: "var(--accent-color)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 h-80 w-80 rounded-full opacity-20 blur-[120px]"
          style={{ background: "var(--border-active)" }}
        />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
          {/* Left: headline + copy */}
          <motion.div {...fadeUp}>
            <p className="font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
              [ Section 03 // Membership ]
            </p>

            <p className="mt-6 font-jetbrains text-sm font-bold uppercase tracking-[0.25em] text-[var(--text-secondary)]">
              Shape Your Tomorrow.
            </p>
            <h1 className="mt-3 font-inter text-5xl font-black leading-[0.95] tracking-tighter text-[var(--text-primary)] sm:text-6xl md:text-7xl">
              Join the{" "}
              <span className="text-[var(--accent-color)] [text-shadow:0_0_40px_var(--accent-color)]">
                Automation
              </span>{" "}
              Community.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--text-secondary)]">
              ISA-RAIT Student Membership connects you with{" "}
              <span className="font-medium text-[var(--text-primary)]">
                knowledge, networks, and opportunities
              </span>{" "}
              to build a successful career in automation.
            </p>

            {/* badges */}
            <div className="mt-10 flex flex-wrap gap-3">
              {badges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="clip-angular flex items-center gap-2 border border-[var(--border-color)] bg-white/5 px-4 py-2.5 backdrop-blur-md transition-colors duration-300 hover:border-[var(--border-active)] dark:bg-white/[0.03]"
                >
                  <Icon size={16} className="text-[var(--border-active)]" />
                  <span className="font-jetbrains text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: glowing quote block */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="relative"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-40 blur-2xl"
              style={{ background: "var(--border-active)" }}
            />
            <figure className="clip-angular relative overflow-hidden border border-[var(--border-active)] bg-white/5 p-8 backdrop-blur-xl md:p-10 dark:bg-[#0D0D0D]/60">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--border-active), transparent)",
                }}
              />
              <Quote
                size={40}
                className="text-[var(--border-active)] [filter:drop-shadow(0_0_18px_var(--border-active))]"
              />
              <blockquote className="mt-5 font-inter text-2xl font-semibold leading-snug tracking-tight text-[var(--text-primary)] md:text-3xl">
                Empowering students today to lead the automation future. For the students, by the students.
              </blockquote>
              <figcaption className="mt-6 font-jetbrains text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">
                &mdash; ISA-RAIT Student Section
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </section>

      {/* ========================= THE 4 PILLARS ========================= */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <motion.div {...fadeUp} className="mb-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-color)]" />
          <h2 className="text-center font-jetbrains text-lg font-bold uppercase tracking-widest text-[var(--text-primary)] sm:text-xl">
            As an ISA-RAIT Student Member,{" "}
            <span className="text-[var(--accent-color)]">you get access to</span>
          </h2>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, glow, items }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.33, 1, 0.68, 1] }}
              className="group relative"
            >
              {/* per-card glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-[14px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-60"
                style={{ background: glow }}
              />
              <HolographicCard className="clip-angular relative h-full p-6">
                {/* top accent line */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
                  }}
                />

                <div
                  className="clip-angular mb-5 inline-flex h-14 w-14 items-center justify-center border"
                  style={{
                    borderColor: glow,
                    background: `color-mix(in srgb, ${glow} 14%, transparent)`,
                    boxShadow: `0 0 24px color-mix(in srgb, ${glow} 45%, transparent)`,
                  }}
                >
                  <Icon size={26} className="text-[var(--text-primary)]" style={{ color: glow }} />
                </div>

                <h3
                  className="font-jetbrains text-lg font-bold uppercase tracking-wider text-[var(--text-primary)]"
                  style={{ textShadow: `0 0 22px color-mix(in srgb, ${glow} 55%, transparent)` }}
                >
                  {title}
                </h3>

                <ul className="mt-5 space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: glow, boxShadow: `0 0 8px ${glow}` }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </HolographicCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================= WHY IT MATTERS ========================= */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <motion.div
          {...fadeUp}
          className="clip-angular relative overflow-hidden border border-[var(--border-color)] bg-white/5 p-8 backdrop-blur-xl md:p-12 dark:bg-[#141414]/70"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ background: "var(--accent-color)" }}
          />

          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_2fr]">
            <div>
              <h2 className="font-inter text-4xl font-black tracking-tighter text-[var(--text-primary)] md:text-5xl">
                Why It{" "}
                <span className="text-[var(--accent-color)] [text-shadow:0_0_30px_var(--accent-color)]">
                  Matters?
                </span>
              </h2>
              <div className="mt-4 h-1 w-20 bg-[var(--accent-color)]" />
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {whyItMatters.map(({ icon: Icon, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex flex-col gap-3"
                >
                  <Icon
                    size={28}
                    className="text-[var(--border-active)] [filter:drop-shadow(0_0_12px_var(--border-active))]"
                  />
                  <p className="text-sm font-medium leading-relaxed text-[var(--text-secondary)]">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-28">
        <motion.div
          {...fadeUp}
          className="clip-angular relative overflow-hidden border border-[var(--border-active)] bg-white/5 p-8 backdrop-blur-2xl md:p-14 dark:bg-[#0D0D0D]/70"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-20 h-96 w-96 rounded-full opacity-25 blur-[120px]"
            style={{ background: "var(--accent-color)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full opacity-20 blur-[120px]"
            style={{ background: "var(--border-active)" }}
          />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.6fr_1fr]">
            {/* Left: text + button + trust badges */}
            <div>
              <h2 className="font-inter text-4xl font-black leading-[0.95] tracking-tighter text-[var(--text-primary)] md:text-6xl">
                Your Future{" "}
                <span className="text-[var(--accent-color)] [text-shadow:0_0_40px_var(--accent-color)]">
                  Starts Here.
                </span>
              </h2>
              <p className="mt-5 max-w-lg text-lg text-[var(--text-secondary)]">
                Be part of the world&apos;s leading automation community.
              </p>

              {/* trust badges */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {trustBadges.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={16} className="text-[var(--border-active)]" />
                    <span className="font-jetbrains text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* massive glowing button */}
              <div className="mt-10">
                <Link
                  href={JOIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-angular group relative inline-flex items-center gap-3 bg-[var(--accent-color)] px-10 py-5 font-jetbrains text-base font-black uppercase tracking-widest text-[var(--bg-color)] transition-transform duration-300 hover:scale-[1.02] md:text-lg"
                  style={{ boxShadow: "0 0 45px color-mix(in srgb, var(--accent-color) 65%, transparent)" }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-80"
                    style={{ background: "var(--accent-color)" }}
                  />
                  Join ISA Today!
                  <ArrowRight
                    size={22}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>

            {/* Right: Scan to Join QR placeholder */}
            <div className="flex flex-col items-center gap-4">
              <p className="font-jetbrains text-xs font-bold uppercase tracking-[0.3em] text-[var(--border-active)]">
                Scan to Join
              </p>
              <Link
                href={JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Scan or open the ISA membership join link"
                className="clip-angular relative flex h-44 w-44 items-center justify-center border border-[var(--border-active)] bg-white p-3 transition-transform duration-300 hover:scale-[1.03]"
                style={{ boxShadow: "0 0 35px color-mix(in srgb, var(--border-active) 40%, transparent)" }}
              >
                {/* corner ticks */}
                <span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[var(--border-active)]" />
                <span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[var(--border-active)]" />
                <span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[var(--border-active)]" />
                <span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[var(--border-active)]" />
                <Image
                  src="/membership-qr.png"
                  alt="QR code linking to the ISA membership page"
                  width={512}
                  height={512}
                  className="h-full w-full"
                />
              </Link>
              <p className="text-center font-jetbrains text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                *Terms and conditions apply.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
