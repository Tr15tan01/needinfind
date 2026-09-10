"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { FeaturedProduct } from "@/lib/services/catalog";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: FeaturedProduct[];
};

export function AssistantChat({ initialMessage }: { initialMessage?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const sentInitial = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending || limitReached) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: {
        conversationId: string;
        reply: string;
        products: FeaturedProduct[];
        limitReached?: boolean;
      } = await res.json();

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, products: data.products }
      ]);
      if (data.limitReached) setLimitReached(true);
    } catch {
      setError("Something went wrong sending that message. Please try again.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      send(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col px-5 py-10">
      <h1 className="font-display text-2xl text-ink-900">Tell us what you need.</h1>
      <p className="mt-1 text-sm text-ink-500">
        Grounded in our real catalog — I&apos;ll ask questions if I need more detail,
        and I&apos;ll say so if nothing matches yet.
      </p>

      <div className="mt-6 flex-1 space-y-5">
        {messages.length === 0 && !pending && (
          <p className="text-sm text-ink-300">
            Try something like &ldquo;I need a laptop for programming under $1,000&rdquo;.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-ink-900 px-4 py-2.5 text-sm text-parchment"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-ink-100 bg-surface px-4 py-2.5 text-sm text-ink-900 shadow-soft"
              }
            >
              <p>{m.content}</p>
              {m.products && m.products.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {m.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-ink-100 bg-surface px-4 py-2.5 text-sm text-ink-300 shadow-soft">
              Thinking…
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {limitReached && (
          <div className="rounded-xl border border-gold-500/40 bg-gold-100 px-4 py-3 text-sm text-ink-700">
            You&apos;ve reached your free message limit.{" "}
            <Link href="/register" className="font-medium text-trust-700 underline">
              Create a free account
            </Link>{" "}
            for a higher monthly limit, or{" "}
            <Link href="/login" className="font-medium text-trust-700 underline">
              sign in
            </Link>{" "}
            if you already have one.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-4 mt-6 rounded-2xl border border-ink-100 bg-surface p-2 shadow-lifted"
      >
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={limitReached}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={limitReached ? "Message limit reached" : "Ask a follow-up…"}
            className="flex-1 resize-none rounded-lg border-0 bg-transparent px-2.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || !input.trim() || limitReached}
            className="rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-gold-700 hover:text-parchment disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
