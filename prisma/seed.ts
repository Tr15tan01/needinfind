/**
 * DEVELOPMENT SEED DATA ONLY.
 *
 * Per spec §41, the CMS/admin (built in Phase 2) is the source of truth for
 * production content. This script exists purely so Phase 1 has something to
 * render locally — do not run this against a production database.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user (Phase 2 credential login) ---------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@needinfind.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash: await hash(adminPassword, 10)
    }
  });

  const computers = await prisma.category.upsert({
    where: { slug: "computers" },
    update: {},
    create: {
      name: "Computers",
      slug: "computers",
      description: "Laptops, desktops, monitors and accessories.",
      featured: true,
      order: 0
    }
  });

  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      parentId: computers.id,
      featured: true,
      order: 0
    }
  });

  await prisma.category.upsert({
    where: { slug: "desktops" },
    update: {},
    create: {
      name: "Desktop PCs",
      slug: "desktops",
      parentId: computers.id,
      order: 1
    }
  });

  await prisma.category.upsert({
    where: { slug: "monitors" },
    update: {},
    create: {
      name: "Monitors",
      slug: "monitors",
      parentId: computers.id,
      order: 2
    }
  });

  await prisma.category.upsert({
    where: { slug: "computer-accessories" },
    update: {},
    create: {
      name: "Accessories",
      slug: "computer-accessories",
      parentId: computers.id,
      order: 3
    }
  });

  const tools = await prisma.category.upsert({
    where: { slug: "tools" },
    update: {},
    create: {
      name: "Tools",
      slug: "tools",
      description: "Drills, saws, and workshop gear.",
      featured: true,
      order: 1
    }
  });

  await prisma.category.upsert({
    where: { slug: "power-tools" },
    update: {},
    create: {
      name: "Power Tools",
      slug: "power-tools",
      parentId: tools.id,
      order: 0
    }
  });

  await prisma.category.upsert({
    where: { slug: "hand-tools" },
    update: {},
    create: {
      name: "Hand Tools",
      slug: "hand-tools",
      parentId: tools.id,
      order: 1
    }
  });

  const kitchen = await prisma.category.upsert({
    where: { slug: "kitchen" },
    update: {},
    create: {
      name: "Kitchen",
      slug: "kitchen",
      description: "Appliances and cookware.",
      featured: true,
      order: 2
    }
  });

  await prisma.category.upsert({
    where: { slug: "small-appliances" },
    update: {},
    create: {
      name: "Small Appliances",
      slug: "small-appliances",
      parentId: kitchen.id,
      order: 0
    }
  });

  await prisma.category.upsert({
    where: { slug: "cookware" },
    update: {},
    create: {
      name: "Cookware",
      slug: "cookware",
      parentId: kitchen.id,
      order: 1
    }
  });

  const outdoor = await prisma.category.upsert({
    where: { slug: "outdoor" },
    update: {},
    create: {
      name: "Outdoor",
      slug: "outdoor",
      description: "Grills, garden, and camping gear.",
      featured: true,
      order: 3
    }
  });

  await prisma.category.upsert({
    where: { slug: "camping" },
    update: {},
    create: {
      name: "Camping",
      slug: "camping",
      parentId: outdoor.id,
      order: 0
    }
  });

  await prisma.category.upsert({
    where: { slug: "grills" },
    update: {},
    create: {
      name: "Grills",
      slug: "grills",
      parentId: outdoor.id,
      order: 1
    }
  });

  await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Audio, cameras, and everyday electronics.",
      order: 4
    }
  });

  await prisma.category.upsert({
    where: { slug: "gaming" },
    update: {},
    create: {
      name: "Gaming",
      slug: "gaming",
      description: "Consoles, accessories, and PC gaming gear.",
      order: 5
    }
  });

  await prisma.category.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      name: "Home",
      slug: "home",
      description: "Furniture, decor, and household goods.",
      order: 6
    }
  });

  await prisma.category.upsert({
    where: { slug: "books" },
    update: {},
    create: {
      name: "Books",
      slug: "books",
      description: "Fiction, nonfiction, and reference.",
      order: 7
    }
  });

  const amazon = await prisma.retailer.upsert({
    where: { slug: "amazon" },
    update: {},
    create: {
      name: "Amazon",
      slug: "amazon",
      websiteUrl: "https://www.amazon.com",
      affiliateDisclosure: "As an Amazon Associate, NeedInFind earns from qualifying purchases."
    }
  });

  const bestBuy = await prisma.retailer.upsert({
    where: { slug: "best-buy" },
    update: {},
    create: {
      name: "Best Buy",
      slug: "best-buy",
      websiteUrl: "https://www.bestbuy.com"
    }
  });

  const macbookAir = await prisma.product.upsert({
    where: { slug: "macbook-air-m3" },
    update: {},
    create: {
      name: "MacBook Air (M3)",
      slug: "macbook-air-m3",
      brand: "Apple",
      model: "MacBook Air 13-inch",
      status: "PUBLISHED",
      featured: true,
      shortDescription: "Lightweight laptop with all-day battery life.",
      description: "A thin, fanless laptop built around Apple's M3 chip — a solid general-purpose pick for coursework, writing, and light development.",
      categoryId: laptops.id,
      specifications: {
        create: [
          { group: "Performance", label: "CPU", value: "Apple M3 (8-core)", order: 1 },
          { group: "Performance", label: "RAM", value: "16", unit: "GB", order: 2 },
          { group: "Storage", label: "Storage", value: "512", unit: "GB SSD", order: 3 },
          { group: "Physical", label: "Weight", value: "1.24", unit: "kg", order: 4 },
          { group: "Software", label: "Operating System", value: "macOS", order: 5 }
        ]
      },
      features: {
        create: [
          { kind: "PRO", text: "Excellent battery life", order: 1 },
          { kind: "PRO", text: "Silent, fanless design", order: 2 },
          { kind: "CON", text: "Not upgradeable after purchase", order: 3 }
        ]
      },
      images: {
        create: [{ url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800", order: 0 }]
      },
      offers: {
        create: [
          {
            retailerId: amazon.id,
            affiliateUrl: "https://www.amazon.com/dp/PLACEHOLDER?tag=needinfind-20",
            displayPrice: 1099.0,
            availability: "IN_STOCK",
            featured: true
          },
          {
            retailerId: bestBuy.id,
            affiliateUrl: "https://www.bestbuy.com/site/PLACEHOLDER",
            displayPrice: 1099.0,
            availability: "IN_STOCK"
          }
        ]
      }
    }
  });

  const xps13 = await prisma.product.upsert({
    where: { slug: "dell-xps-13" },
    update: {},
    create: {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      brand: "Dell",
      model: "XPS 13 9340",
      status: "PUBLISHED",
      featured: true,
      shortDescription: "Compact Windows laptop with a sharp InfinityEdge display.",
      description: "A well-built Windows ultrabook that's a strong pick for programming on the go — good keyboard, high-res display, and enough RAM for real dev work.",
      categoryId: laptops.id,
      specifications: {
        create: [
          { group: "Performance", label: "CPU", value: "Intel Core Ultra 7", order: 1 },
          { group: "Performance", label: "RAM", value: "16", unit: "GB", order: 2 },
          { group: "Storage", label: "Storage", value: "512", unit: "GB SSD", order: 3 },
          { group: "Software", label: "Operating System", value: "Windows 11", order: 4 }
        ]
      },
      features: {
        create: [
          { kind: "PRO", text: "Sharp 13.4-inch display", order: 1 },
          { kind: "CON", text: "Limited port selection", order: 2 }
        ]
      },
      images: {
        create: [{ url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800", order: 0 }]
      },
      offers: {
        create: [
          {
            retailerId: amazon.id,
            affiliateUrl: "https://www.amazon.com/dp/PLACEHOLDER2?tag=needinfind-20",
            displayPrice: 999.0,
            availability: "IN_STOCK",
            featured: true
          }
        ]
      }
    }
  });

  const laptopComparison = await prisma.comparison.upsert({
    where: { slug: "macbook-air-vs-dell-xps-13" },
    update: {},
    create: {
      title: "MacBook Air vs Dell XPS 13",
      slug: "macbook-air-vs-dell-xps-13",
      description:
        "Two of the most popular ultrabooks for programming on the go — macOS vs Windows, and where each one actually differs on paper.",
      featured: true,
      fields: ["CPU", "RAM", "Storage", "Operating System", "Weight"],
      products: {
        create: [
          { productId: macbookAir.id, order: 0 },
          { productId: xps13.id, order: 1 }
        ]
      }
    }
  });

  const drill = await prisma.product.upsert({
    where: { slug: "bosch-18v-hammer-drill" },
    update: {},
    create: {
      name: "Bosch 18V Cordless Hammer Drill",
      slug: "bosch-18v-hammer-drill",
      brand: "Bosch",
      status: "PUBLISHED",
      featured: true,
      shortDescription: "Compact hammer drill for concrete, masonry, and everyday tasks.",
      description: "A versatile 18V hammer drill with enough torque for concrete and masonry work, while staying light enough for one-handed use around the house.",
      categoryId: tools.id,
      specifications: {
        create: [
          { group: "Power", label: "Voltage", value: "18", unit: "V", order: 1 },
          { group: "Power", label: "Chuck size", value: "13", unit: "mm", order: 2 },
          { group: "Physical", label: "Weight", value: "1.6", unit: "kg", order: 3 }
        ]
      },
      features: {
        create: [
          { kind: "PRO", text: "Good balance of power and weight", order: 1 },
          { kind: "CON", text: "Battery sold separately on base kit", order: 2 }
        ]
      },
      images: {
        create: [{ url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800", order: 0 }]
      },
      offers: {
        create: [
          {
            retailerId: amazon.id,
            affiliateUrl: "https://www.amazon.com/dp/PLACEHOLDER3?tag=needinfind-20",
            displayPrice: 129.0,
            availability: "IN_STOCK",
            featured: true
          }
        ]
      }
    }
  });

  await prisma.siteSetting.upsert({
    where: { key: "guest_message_limit" },
    update: {},
    create: { key: "guest_message_limit", value: 5 }
  });

  await prisma.pricingPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      price: 0,
      billingInterval: "MONTHLY",
      messageAllowance: 15,
      order: 0
    }
  });

  await prisma.pricingPlan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      name: "Basic",
      slug: "basic",
      price: 6,
      billingInterval: "MONTHLY",
      messageAllowance: 30,
      order: 1
    }
  });

  await prisma.pricingPlan.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      name: "Premium",
      slug: "premium",
      price: 12,
      billingInterval: "MONTHLY",
      messageAllowance: 100,
      order: 2
    }
  });

  const categoryCount = await prisma.category.count();
  const buyingGuideCategory = await prisma.blogCategory.upsert({
    where: { slug: "buying-guides" },
    update: {},
    create: { name: "Buying Guides", slug: "buying-guides" }
  });

  await prisma.blogPost.upsert({
    where: { slug: "best-laptops-for-programming-under-1000" },
    update: {},
    create: {
      title: "Best laptops for programming under $1,000",
      slug: "best-laptops-for-programming-under-1000",
      status: "PUBLISHED",
      publishedAt: new Date(),
      author: "NeedInFind Team",
      excerpt:
        "What actually matters for a coding laptop — and how the MacBook Air and Dell XPS 13 compare on paper.",
      categoryId: buyingGuideCategory.id,
      content: `## What matters for a programming laptop

For most day-to-day development work, three things matter more than anything else: enough RAM to run your editor, a browser, and a couple of local services at once; a fast enough CPU that builds and test runs don't feel like a coffee break; and a keyboard and screen you don't mind staring at for eight hours.

At the sub-$1,000 price point, you're mostly choosing between Apple's M-series MacBook Air and Windows ultrabooks like the Dell XPS 13.

### RAM and storage

16GB of RAM is a reasonable floor if you're running Docker, a browser with two dozen tabs, and an IDE simultaneously. 512GB of SSD storage is comfortable for most stacks, though it can fill up quickly with multiple language toolchains installed.

### macOS vs Windows

This mostly comes down to what you already use, and whether your tooling assumes a Unix-like environment (macOS, or Windows with WSL) or not.

See our full [MacBook Air vs Dell XPS 13 comparison](/compare/macbook-air-vs-dell-xps-13) for a spec-by-spec breakdown.`,
      seoTitle: "Best Laptops for Programming Under $1,000",
      seoDescription:
        "A practical guide to choosing a sub-$1,000 laptop for software development, comparing the MacBook Air and Dell XPS 13.",
      relatedProductIds: [macbookAir.id, xps13.id],
      relatedComparisonIds: [laptopComparison.id]
    }
  });

  console.log("Seeded:", {
    admin: adminEmail,
    categories: categoryCount,
    products: [macbookAir.slug, xps13.slug, drill.slug]
  });
  console.log(`Admin login -> ${adminEmail} / ${adminPassword} (change this in production)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
