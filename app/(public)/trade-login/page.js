import { BadgePercent, History, Truck, ShieldCheck } from "lucide-react";
import TradeLoginForm from "@/components/TradeLoginForm";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Trade Login",
  description:
    "Log in to your Gala Drinks trade account to view your prices and place orders.",
};

const benefits = [
  { icon: BadgePercent, title: "Trade pricing", text: "Log in to see wholesale prices across the full range." },
  { icon: History, title: "Order in minutes", text: "Repeat your usual order and check past invoices any time." },
  { icon: Truck, title: "Delivery you can plan around", text: "Order online for your regular delivery day." },
  { icon: ShieldCheck, title: "Secure account", text: "Your customer number and password keep your pricing private." },
];

export default function TradeLoginPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ambient glow */}
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-14 px-4 pb-24 pt-[130px] sm:px-6 lg:grid-cols-2">
        {/* Left: pitch */}
        <Reveal className="hidden lg:block">
          <div className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold">
            Trade Customers
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
            Welcome back to your <em className="text-gold">trade account</em>
          </h1>
          <p className="mt-5 max-w-md text-body">
            Log in with your customer number to see trade prices and place
            your next order.
          </p>

          <div className="mt-10 space-y-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-pale text-gold">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="font-display text-sm font-semibold text-ink">{title}</div>
                  <div className="mt-1 text-sm text-body">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Right: login card */}
        <Reveal delay={0.1}>
          <div className="card mx-auto w-full max-w-md rounded-3xl p-8 shadow-[0_24px_60px_rgba(23,32,47,0.12)] sm:p-10">
            <div className="mb-8 text-center">
              <div className="inline-flex items-baseline gap-1.5 font-display text-2xl font-bold tracking-tight">
                <span className="text-ink">Gala</span>
                <span className="text-gold">Drinks</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink">
                Trade Login
              </h2>
              <p className="mt-2 text-sm text-body">
                Sign in with your customer number and password
              </p>
            </div>
            <TradeLoginForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
