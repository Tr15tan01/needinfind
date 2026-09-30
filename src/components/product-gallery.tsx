"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { id: string; url: string; altText: string | null };

/**
 * Shows the whole photo (object-contain) instead of cropping it to fill the
 * frame — product shots are usually on a plain background and look
 * "zoomed in" when cropped. Extra images appear as thumbnails below.
 */
export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-ink-100 bg-parchment-200 text-sm text-ink-300">
        No image yet
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-ink-100 bg-white">
        <Image
          key={current.id}
          src={current.url}
          alt={current.altText ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-white transition ${
                i === active ? "border-trust-500 ring-2 ring-trust-500/30" : "border-ink-100 hover:border-ink-300"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
