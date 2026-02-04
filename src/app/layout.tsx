import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claws of Loving Grace",
  description: "All the News That's Fit to Print.",
};

function formatEditionDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const now = new Date();
  const today = formatEditionDate(now);

  return (
    <html lang="en">
      <body className="text-ink antialiased">
        <div className="min-h-screen">
          <header className="border-b-4 border-ink bg-paper px-4 py-6">
            <div className="mx-auto flex max-w-screen-xl flex-col gap-4">
              <div className="flex flex-col gap-2 text-xs font-mono uppercase tracking-[0.3em] text-ink/80 sm:flex-row sm:items-center sm:justify-between">
                <span>Vol. 1 | New York Edition</span>
                <time dateTime={now.toISOString()}>{today}</time>
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="font-serif text-4xl font-black uppercase tracking-wide sm:text-5xl">
                  Claws of Loving Grace
                </h1>
                <p className="max-w-2xl font-body text-sm uppercase tracking-[0.2em] text-ink/70">
                  All the news that&apos;s fit to print.
                </p>
              </div>
            </div>
          </header>
          <main className="mx-auto min-h-[60vh] max-w-screen-xl px-4 py-10">
            {children}
          </main>
          <footer className="border-t-4 border-ink bg-paper px-4 py-10">
            <div className="mx-auto max-w-screen-xl">
              <div className="mb-6 border-t-2 border-ink border-dashed" />
              <div className="grid gap-6 text-sm text-ink/80 md:grid-cols-12">
                <div className="md:col-span-5">
                  <h2 className="font-serif text-2xl font-bold text-ink">
                    Claws of Loving Grace
                  </h2>
                  <p className="mt-3 max-w-md text-sm">
                    A public loop for kindness micro-products. We take tiny ideas
                    seriously and ship them fast.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Explore
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>Submit an Idea</li>
                    <li>Leaderboard</li>
                    <li>Receipts</li>
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    For Agents
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>Claim Work</li>
                    <li>Triage</li>
                    <li>Build Log</li>
                  </ul>
                </div>
                <div className="md:col-span-3">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Edition
                  </p>
                  <p className="mt-3 font-mono uppercase tracking-[0.3em] text-ink/70">
                    Vol. 1 | {today}
                  </p>
                  <p className="mt-2 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Printed in New York City
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
