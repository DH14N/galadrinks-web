import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Layout for all public-facing pages: sticky header + footer.
// Trade and admin pages live outside this group and keep their own UI.
export default function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
