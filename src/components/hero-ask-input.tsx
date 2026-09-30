"use client";

/**
 * Homepage "tell us what you need" box. Enter sends the question;
 * Shift+Enter adds a new line. Empty input is ignored.
 */
export function HeroAskInput() {
  return (
    <textarea
      id="need"
      name="q"
      rows={2}
      required
      placeholder="I need a laptop for programming, under $1,000…"
      onKeyDown={(e) => {
        if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        if (!e.currentTarget.value.trim()) return;
        e.currentTarget.form?.requestSubmit();
      }}
      className="w-full resize-none rounded-lg border-0 bg-transparent px-3.5 py-3.5 text-ink-900 placeholder:text-ink-300 focus:outline-none"
    />
  );
}
