import Link from "next/link";
import Image from "next/image";
import type { FeaturedProduct } from "@/lib/services/catalog";

export function ProductCard({ product }: { product: FeaturedProduct }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-100 bg-surface shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-parchment-200">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-300">
            No image yet
          </div>
        )}
        {product.offerCount > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-ink-900/90 px-2.5 py-1 text-[11px] font-medium text-parchment">
            {product.offerCount} retailers
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-trust-500">
            {product.brand}
          </p>
        )}
        <h3 className="mt-1 font-display text-base leading-snug text-ink-900">
          {product.name}
        </h3>
        {product.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{product.shortDescription}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-sm font-semibold text-ink-900">
            {product.lowestPrice
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.currency
                }).format(product.lowestPrice)
              : "See price"}
          </span>
          <span className="text-sm font-medium text-trust-700 group-hover:underline">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
