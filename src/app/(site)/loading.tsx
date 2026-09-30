import { RouteLoader } from "@/components/page-loaders";

// Homepage shows its skeleton; other pages without their own loading.tsx
// show a spinner.
export default function Loading() {
  return <RouteLoader />;
}
