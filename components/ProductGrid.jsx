import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ products }) {
  if (!products?.length) {
    return (
      <p className="card rounded-2xl p-8 text-center text-body">
        No products found. Try a different search or category.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
