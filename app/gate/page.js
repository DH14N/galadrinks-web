import Image from "next/image";
import { KeyRound } from "lucide-react";

export const metadata = {
  title: "Private Preview",
  robots: { index: false, follow: false },
};

// The password screen shown while the site is in private preview.
// Deliberately plain — no navigation, no links out.
export default async function GatePage({ searchParams }) {
  const sp = await searchParams;
  const error = sp?.error === "1";
  const from = (sp?.from ?? "/").toString();

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:p-10">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Gala Drinks — Wholesale Drinks Supplier"
            width={176}
            height={110}
            priority
            className="mx-auto h-28 w-auto"
          />
          <p className="mt-4 text-sm text-body">
            This site is in private preview. Enter the password to continue.
          </p>
        </div>

        <form method="POST" action="/api/gate" className="mt-8 space-y-4">
          <input type="hidden" name="from" value={from} />
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper-2 px-4 transition-colors focus-within:border-gold">
            <KeyRound size={17} className="shrink-0 text-gold" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              required
              className="w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-body/50 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              That password isn&rsquo;t right — try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-navy-700"
          >
            Enter site
          </button>
        </form>
      </div>
    </main>
  );
}
