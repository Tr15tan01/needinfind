import { PageSpinner } from "@/components/page-loaders";

// Admin pages without their own skeleton show a spinner while loading.
export default function Loading() {
  return <PageSpinner />;
}
