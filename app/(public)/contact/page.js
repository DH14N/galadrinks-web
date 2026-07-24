import { Phone, Mail, MapPin, Clock } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Contact" };

const details = [
  { icon: Phone, label: "Phone", value: "0116 289 0111" },
  { icon: Mail, label: "Email", value: "sales@galadrinks.co.uk" },
  { icon: MapPin, label: "Address", value: "6 Vitruvius Way, Meridian Business Park, Leicester" },
  { icon: Clock, label: "Office hours", value: "Mon–Fri, 9am–5:30pm" },
];

// Google Maps embed (no API key needed) centred on the address
const MAP_QUERY = "6 Vitruvius Way, Meridian Business Park, Leicester";
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the team"
        sub="Questions, orders or opening a new trade account — we're one call away."
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-2">
        {/* Contact details */}
        <Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="card rounded-2xl p-6">
                <Icon size={20} className="text-gold" strokeWidth={1.8} />
                <div className="mt-3 text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                  {label}
                </div>
                <div className="mt-1 font-display text-base font-semibold text-ink">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="card mt-5 rounded-2xl p-6 text-sm leading-relaxed text-body">
            <span className="font-semibold text-ink">Applying for a trade account?</span>{" "}
            Tell us your business name, address and what you’d like to stock —
            we’ll set you up with a customer number and online ordering.
          </div>
        </Reveal>

        {/* Enquiry form (front-end only for now — we'll wire it up later) */}
        <Reveal delay={0.1}>
          <form className="card space-y-4 rounded-3xl p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Send an enquiry</h2>
            {[
              { name: "business", label: "Business name", type: "text", placeholder: "e.g. The Golden Lion" },
              { name: "name", label: "Your name", type: "text", placeholder: "Full name" },
              { name: "email", label: "Email", type: "email", placeholder: "you@business.co.uk" },
              { name: "phone", label: "Phone", type: "tel", placeholder: "Contact number" },
            ].map((f) => (
              <div key={f.name}>
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  className="w-full rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-body/60 transition-colors focus:border-gold focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.15em] text-body">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about your venue and what you're looking for…"
                className="w-full rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink placeholder:text-body/60 transition-colors focus:border-gold focus:outline-none"
              />
            </div>
            <button
              type="button"
              title="Form submissions will be connected soon — call us in the meantime"
              className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-navy-700"
            >
              Send enquiry
            </button>
            <p className="text-center text-[12px] text-body">
              The form will be connected soon — for now, call 0116 289 0111.
            </p>
          </form>
        </Reveal>
      </div>

      {/* Map */}
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <Reveal className="overflow-hidden rounded-3xl border border-line">
          <iframe
            src={MAP_SRC}
            title="Gala Drinks location — 6 Vitruvius Way, Meridian Business Park, Leicester"
            width="100%"
            height="420"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block w-full border-0"
            allowFullScreen
          />
        </Reveal>
      </div>
    </>
  );
}
