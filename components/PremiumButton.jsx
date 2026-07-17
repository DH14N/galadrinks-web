import Link from "next/link";

const styles = {
  // Primary on light backgrounds — deep navy
  navy: "bg-ink text-white hover:bg-navy-700 shadow-sm",
  // Gold CTA — used on the navy hero and for key actions
  gold: "bg-gradient-to-b from-gold-light to-gold text-white font-semibold shadow-sm hover:brightness-105",
  // Secondary on light backgrounds
  outline: "border border-line bg-white text-ink hover:border-gold hover:text-gold",
  // Secondary on dark navy panels
  "outline-light": "border border-white/30 text-white hover:border-gold-light hover:text-gold-light",
  ghost: "text-body hover:text-gold",
};

const sizes = {
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
  sm: "px-4 py-2 text-sm",
};

// One button style used across the whole site.
// Pass href to render a link, or onClick/type to render a button.
export default function PremiumButton({
  href,
  variant = "navy",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${styles[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
