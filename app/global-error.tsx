"use client";

// Last resort: the root layout itself failed. It replaces the whole document,
// so globals.css isn't loaded; styles are inline and follow the OS theme.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          colorScheme: "light dark",
          textAlign: "center",
          padding: 16,
        }}
      >
        <title>Something went wrong | ISA RAIT</title>
        <main>
          <h1 style={{ fontSize: 24 }}>The site couldn&apos;t load</h1>
          <p style={{ opacity: 0.7 }}>Something on our side didn&apos;t answer. Try again in a moment.</p>
          <button onClick={retry} style={{ padding: "10px 20px", fontSize: 14, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
