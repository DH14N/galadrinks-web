// Tells search engines what they may index.
// While the preview password is on, everything is off-limits; once the
// password is removed (launch), the whole site opens up with a sitemap.
export default function robots() {
  const locked = !!process.env.PREVIEW_PASSWORD;

  if (locked) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/trade/", "/admin/", "/cart", "/orders", "/api/"],
    },
    sitemap: "https://www.galadrinks.co.uk/sitemap.xml",
  };
}
