import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Body text font — clean and highly readable
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display font for headings — a warm serif with real character
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://www.galadrinks.co.uk"),
  title: {
    default: "Gala Drinks | Wholesale Drinks Supplier",
    template: "%s | Gala Drinks",
  },
  description:
    "Wholesale drinks supplier in Leicester — beers, spirits, wines, soft drinks and more, delivered across the Midlands. Browse 4,000+ products online. Trade customers log in to view prices and order.",
  openGraph: {
    siteName: "Gala Drinks",
    type: "website",
    locale: "en_GB",
    url: "https://www.galadrinks.co.uk",
    title: "Gala Drinks | Wholesale Drinks Supplier",
    description:
      "Wholesale drinks, delivered with service you can trust. Beers, spirits, wines and soft drinks for restaurants, bars and shops across the Midlands.",
    images: [{ url: "/logo.png", width: 765, height: 480, alt: "Gala Drinks" }],
  },
};

// Business details in the structured format search engines read
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gala Drinks",
  url: "https://www.galadrinks.co.uk",
  telephone: "+44 116 289 0111",
  email: "sales@galadrinks.co.uk",
  description:
    "Wholesale drinks supplier serving restaurants, bars and shops across Leicester and the Midlands.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Leicester",
    addressCountry: "GB",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
