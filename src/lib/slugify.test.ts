import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("MacBook Air (M3)")).toBe("macbook-air-m3");
  });

  it("collapses repeated non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Best Laptops -- Under $1,000!")).toBe("best-laptops-under-1-000");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });

  it("handles already-clean slugs unchanged", () => {
    expect(slugify("already-a-slug")).toBe("already-a-slug");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
