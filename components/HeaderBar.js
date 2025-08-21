// components/HeaderBar.jsx
"use client";
import Link from "next/link";
import Image from "next/image";

export default function HeaderBar({
  cartCount = 0,
  showFavesOnly = false,
  onToggleFaves = () => {},
  onSignOut = () => {},
}) {
  return (
    <header className="w-full border-b border-gray-200 shadow-sm bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center bg-gray-100 text-sm px-6 py-2">
        <div className="text-black">📞 0116 296 1537</div>
        <div className="flex space-x-4 text-black">
          <Link href="/help">Help</Link>
          <Link href="/about">About Us</Link>
        </div>
      </div>

      {/* Main bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="Gala Drinks" width={150} height={100} />
        </div>

        {/* Search */}
        <div className="flex-1 mx-6 text-black">
          <input
            type="text"
            placeholder="Find your drink..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-6 items-center text-black">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFavesOnly}
              onChange={(e) => onToggleFaves(e.target.checked)}
            />
            Show favourites only
          </label>

          <Link href="/cart" className="relative hover:underline">
            View Cart
            <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-sm border">
              {cartCount}
            </span>
          </Link>

          <button onClick={onSignOut} className="text-black hover:underline">
            Sign Out
          </button>
        </div>
      </div>

      {/* Category strip */}
      <nav className="bg-[#b91c1c] text-white text-sm px-6 py-2 flex flex-wrap gap-6">
        <Link href="/products/gin">Gin</Link>
        <Link href="/products/whisky">Whisky</Link>
        <Link href="/products/vodka">Vodka</Link>
        <Link href="/products/champagne">Champagne &amp; Sparkling</Link>
        <Link href="/products/wines">Wines</Link>
        <Link href="/products/beers">Beers, Ales &amp; Ciders</Link>
        <Link href="/products/liqueurs">Liqueurs</Link>
        <Link href="/products/hot">Hot Beverages</Link>
        <Link href="/sales">Sales &amp; Offers</Link>
      </nav>
    </header>
  );
}
