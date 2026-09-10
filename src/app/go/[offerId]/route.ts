import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSafeSession } from "@/lib/safe-auth";
import { getGuestToken } from "@/lib/guest-session";

/**
 * Every "View on {retailer}" button on a product page points here instead
 * of straight at the affiliate URL, per spec §30: "record the click and
 * then redirect." Doing this server-side (rather than a client-side click
 * handler that fires a beacon and hopes) means the click is recorded even
 * with JS disabled or an ad blocker present, and before the browser ever
 * leaves the site.
 *
 * This route is disallowed in robots.txt — it should never be indexed or
 * crawled, only followed by an actual click.
 */
export async function GET(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const url = new URL(req.url);
  const source = url.searchParams.get("from");
  const campaign = url.searchParams.get("campaign");

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    // Nothing to redirect to — send them home rather than a dead end.
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const session = await getSafeSession();
    const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
    const guestToken = userId ? null : await getGuestToken();

    await prisma.affiliateClick.create({
      data: {
        userId,
        guestToken,
        productId: offer.productId,
        offerId: offer.id,
        sourcePage: source ?? req.headers.get("referer") ?? null,
        campaign: campaign ?? null
      }
    });

    await prisma.analyticsEvent.create({
      data: {
        type: "AFFILIATE_CLICK",
        userId,
        guestToken,
        metadata: { productId: offer.productId, offerId: offer.id, retailerId: offer.retailerId }
      }
    });
  } catch (error) {
    // Never let a tracking failure block the actual redirect — the person
    // clicking through to buy something matters more than the log row.
    console.error("Affiliate click tracking failed:", error);
  }

  return NextResponse.redirect(offer.affiliateUrl, { status: 302 });
}
