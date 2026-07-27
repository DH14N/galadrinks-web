import { Phone, Mail, MapPin, Clock } from "lucide-react";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";

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

        <Reveal delay={0.1}>
          <ContactForm />
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
