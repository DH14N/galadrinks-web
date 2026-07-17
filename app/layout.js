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
  title: {
    default: "Gala Drinks | Wholesale Drinks Supplier",
    template: "%s | Gala Drinks",
  },
  description:
    "Gala Drinks — wholesale drinks, delivered with service you can trust. Browse our full range online. Trade customers log in to view prices and order.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
