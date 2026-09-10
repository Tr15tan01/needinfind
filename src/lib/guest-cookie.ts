// Deliberately just a string constant, with no Node/next-headers imports —
// middleware.ts (Edge runtime) and Server Components both need this name,
// and importing "next/headers" from middleware isn't supported.
export const GUEST_COOKIE_NAME = "needinfind_guest";
