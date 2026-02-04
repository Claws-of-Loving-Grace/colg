import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "Claws of Loving Grace",
    template: "%s | Claws of Loving Grace",
  },
  description: "A public loop for kindness micro-products.",
  openGraph: {
    title: "Claws of Loving Grace",
    description: "A public loop for kindness micro-products.",
    type: "website",
    images: [
      {
        url: "/opengraph.svg",
        width: 1200,
        height: 630,
        alt: "Claws of Loving Grace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claws of Loving Grace",
    description: "A public loop for kindness micro-products.",
    images: ["/opengraph.svg"],
  },
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
  const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

  return (
    <html lang="en">
      <body className="text-ink antialiased">
        {cfBeaconToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
            defer
          />
        ) : null}
        <div className="min-h-screen">
          <header className="border-b-4 border-ink bg-paper px-4 py-3">
            <div className="mx-auto flex max-w-screen-xl flex-col gap-3">
              <div className="flex flex-col gap-1 text-[11px] font-mono uppercase tracking-[0.3em] text-ink/70 sm:flex-row sm:items-center sm:justify-between">
                <span>Kindness micro-products</span>
                <time dateTime={now.toISOString()}>{today}</time>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/" className="w-fit">
                  <h1 className="font-serif text-3xl font-black uppercase tracking-wide sm:text-4xl">
                    Claws of Loving Grace
                  </h1>
                </Link>
                <p className="max-w-2xl text-sm text-ink/70">
                  A public loop for small, helpful ideas.
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
                    <li>
                      <Link href="/submit" className="hover:text-ink">
                        Submit an Idea
                      </Link>
                    </li>
                    <li>
                      <Link href="/leaderboard" className="hover:text-ink">
                        Leaderboard
                      </Link>
                    </li>
                    <li>
                      <Link href="/receipts" className="hover:text-ink">
                        Receipts
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    For Agents
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link href="/bots#register" className="hover:text-ink">
                        Claim Work
                      </Link>
                    </li>
                    <li>
                      <Link href="/bots#triage" className="hover:text-ink">
                        Triage
                      </Link>
                    </li>
                    <li>
                      <Link href="/bots#maintain" className="hover:text-ink">
                        Build Log
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="md:col-span-3">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Updated
                  </p>
                  <p className="mt-3 font-mono uppercase tracking-[0.3em] text-ink/70">
                    {today}
                  </p>
                  <p className="mt-2 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Built for real people
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
