"use client";

import { motion } from "framer-motion";
import { Beer, Martini, Wine, Truck, BadgePercent, Boxes } from "lucide-react";
import PremiumButton from "@/components/PremiumButton";

// Floating card used in the hero artwork
function FloatCard({ children, className = "", duration = 6, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`glass rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Hero({ showcase = {} }) {
  const ranges = [
    {
      icon: Beer,
      big: "600+ beers, ciders & kegs",
      small: "World lagers, craft, cask and draught",
      product: showcase.beers,
      offset: "lg:ml-0",
      duration: 7,
      delay: 0,
    },
    {
      icon: Martini,
      big: "1,400+ spirits & liqueurs",
      small: "From back-bar staples to rare bottles",
      product: showcase.spirits,
      offset: "lg:ml-12",
      duration: 8,
      delay: 0.5,
    },
    {
      icon: Wine,
      big: "450+ wines & champagne",
      small: "House pours to celebration fizz",
      product: showcase.wines,
      offset: "lg:ml-3",
      duration: 7.5,
      delay: 1,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-navy pt-[124px] text-white">
      {/* One soft gold glow — kept subtle */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-glow-pan absolute -top-32 right-0 h-[480px] w-[480px] rounded-full bg-gold-light/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        {/* Left: headline + CTAs */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light"
          >
            Wholesale Drinks Supplier
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]"
          >
            Wholesale drinks, delivered with{" "}
            <em className="text-gold-light">service you can trust</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70"
          >
            Browse the full Gala Drinks range online. Trade customers can log
            in to view trade prices and place orders in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <PremiumButton href="/products" variant="gold" size="lg">
              Browse Product Ranges
            </PremiumButton>
            <PremiumButton href="/trade-login" variant="outline-light" size="lg">
              Trade Login
            </PremiumButton>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-7"
          >
            {[
              { icon: Boxes, big: "4,000+", small: "Product lines" },
              { icon: Truck, big: "Reliable", small: "Local delivery" },
              { icon: BadgePercent, big: "Trade only", small: "Wholesale prices" },
            ].map(({ icon: Icon, big, small }) => (
              <div key={small}>
                <Icon size={18} className="text-gold-light" />
                <div className="mt-2 font-display text-lg font-semibold">{big}</div>
                <div className="text-[12px] text-white/60">{small}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: a tidy stack of range highlights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="relative mx-auto hidden w-full max-w-[460px] sm:block"
        >
          {/* soft glow behind the stack */}
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light/10 blur-[90px]" />

          <div className="relative space-y-6">
            {ranges.map(({ icon: Icon, big, small, product, offset, duration, delay }) => (
              <FloatCard
                key={big}
                duration={duration}
                delay={delay}
                className={`flex items-center gap-5 p-6 ${offset}`}
              >
                {/* Product photo on a white tile, or an icon fallback */}
                {product?.image ? (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </span>
                ) : (
                  <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold-light/15 text-gold-light">
                    <Icon size={28} strokeWidth={1.6} />
                  </span>
                )}
                <span>
                  <span className="block font-display text-lg font-semibold leading-snug">{big}</span>
                  <span className="mt-1 block text-sm text-white/60">{small}</span>
                </span>
              </FloatCard>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
