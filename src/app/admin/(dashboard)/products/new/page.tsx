import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">New product</h1>
      <ProductForm action={createProduct} submitLabel="Create product" />
    </div>
  );
}
