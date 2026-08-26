import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, PenLine } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { ArticleBody } from "@/components/sections/ArticleBody";
import { articles, getArticleBySlug, readingMinutes } from "@/lib/articles";

/**
 * Every article is known at build time, so all reader pages are prerendered and
 * an unknown slug 404s instead of rendering at request time.
 */
export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata(
  props: PageProps<"/articles/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);

  if (!article) return { title: "Article Not Found | ISA RAIT" };

  return {
    title: `${article.title} | ISA RAIT`,
    description: article.summary,
    authors: article.author ? [{ name: article.author }] : undefined,
  };
}

export default async function ArticlePage(props: PageProps<"/articles/[slug]">) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-6 pt-24 md:pt-32 pb-16 md:pb-24">
        <Link
          href="/initiatives#articles"
          className="inline-flex items-center gap-2 font-jetbrains text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-color)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>

        <header className="relative mt-8">
          {/* ambient glow behind the title, matching the other page headers */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 left-0 h-40 w-80 max-w-full rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--accent-color)" }}
          />
          <p className="relative font-jetbrains text-xs uppercase tracking-[0.3em] text-[var(--accent-color)]">
            [ ISA Articles ]
          </p>
          <h1 className="relative mt-4 font-jetbrains text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="relative mt-3 text-lg leading-relaxed text-[var(--text-secondary)]">
              {article.subtitle}
            </p>
          )}

          <div className="relative mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-jetbrains text-xs text-[var(--text-secondary)]">
            {article.author && (
              <span className="inline-flex items-center gap-1.5 text-[var(--text-primary)]">
                <PenLine className="h-3.5 w-3.5 text-[var(--accent-color)]" />
                {article.author}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readingMinutes(article)} min read
            </span>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border-color)]/60 px-2.5 py-0.5 font-jetbrains text-[11px] text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="relative mt-8 h-px bg-gradient-to-r from-[var(--accent-color)]/60 via-[var(--border-color)] to-transparent" />

          <p className="relative mt-8 text-lg leading-relaxed text-[var(--text-primary)]">
            {article.summary}
          </p>
        </header>

        <article>
          <ArticleBody blocks={article.body} />
        </article>

        <footer className="mt-16 border-t border-[var(--border-color)]/60 pt-8">
          <Link
            href="/initiatives#articles"
            className="inline-flex items-center gap-2 font-jetbrains text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-color)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
        </footer>
      </main>
    </PageTransition>
  );
}
