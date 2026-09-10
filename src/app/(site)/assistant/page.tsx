import { AssistantChat } from "@/components/assistant-chat";

export const metadata = { title: "Ask the assistant" };

export default async function AssistantPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <AssistantChat initialMessage={q} />;
}
