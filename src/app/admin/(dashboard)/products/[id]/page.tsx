import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";
import { updateProduct, deleteProduct, addOffer, deleteOffer } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, retailers] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        specifications: { orderBy: { order: "asc" } },
        features: { orderBy: { order: "asc" } },
        offers: { include: { retailer: true }, orderBy: { createdAt: "asc" } }
      }
    }),
    prisma.retailer.findMany({ where: { enabled: true }, orderBy: { name: "asc" } })
  ]);

  if (!product) notFound();

  const specifications = product.specifications
    .map((s) => `${s.label}: ${s.value}`)
    .join("\n");
  const features = product.features
    .map((f) => (f.kind === "PRO" ? `+ ${f.text}` : f.kind === "CON" ? `- ${f.text}` : f.text))
    .join("\n");

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updateProduct(id, formData);
  };
  const boundAddOffer = async (formData: FormData) => {
    "use server";
    await addOffer(id, formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">{product.name}</h1>
        <form
          action={async () => {
            "use server";
            await deleteProduct(id);
          }}
        >
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Delete product
          </button>
        </form>
      </div>

      <ProductForm
        action={boundUpdate}
        submitLabel="Save changes"
        values={{
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          model: product.model,
          shortDescription: product.shortDescription,
          description: product.description,
          status: product.status,
          featured: product.featured,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          categoryId: product.categoryId,
          imageUrl: product.images[0]?.url ?? "",
          specifications,
          features
        }}
      />

      <section className="mt-10 border-t border-ink-100 pt-8">
        <h2 className="font-display text-lg text-ink-900">Retailer offers</h2>
        <p className="mt-1 text-sm text-ink-500">
          The same product can have multiple offers across retailers.
        </p>

        <div className="mt-4 space-y-2">
          {product.offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-lg border border-ink-100 bg-surface px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{offer.retailer.name}</p>
                <p className="text-xs text-ink-300">
                  {offer.displayPrice ? `${offer.currency} ${offer.displayPrice}` : "No price set"} ·{" "}
                  {offer.availability}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteOffer(id, offer.id);
                }}
              >
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))}
          {product.offers.length === 0 && (
            <p className="text-sm text-ink-300">No offers yet — this product won&apos;t show a purchase link.</p>
          )}
        </div>

        <form action={boundAddOffer} className="mt-5 grid gap-3 rounded-lg border border-ink-100 bg-surface p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Retailer</span>
            <select name="retailerId" required className={selectClass}>
              <option value="" disabled>
                Select a retailer
              </option>
              {retailers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Affiliate URL</span>
            <input name="affiliateUrl" type="url" required placeholder="https://…" className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Display price</span>
            <input name="displayPrice" type="number" step="0.01" className={selectClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Availability</span>
            <select name="availability" defaultValue="IN_STOCK" className={selectClass}>
              <option value="IN_STOCK">In stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-trust-500 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-trust-700"
            >
              Add offer
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

const selectClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
