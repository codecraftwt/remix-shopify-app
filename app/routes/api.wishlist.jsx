// ============================= dyanamic CORS=============================

// import { json } from "@remix-run/node";
// import db from "../db.server";


// const SHOPIFY_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/;
// function withCors(request, response) {
//   const origin = request.headers.get("origin") || "";

//   const allowOrigin = SHOPIFY_ORIGIN_REGEX.test(origin)
//     ? origin
//     : "https://codecraft-team.myshopify.com";

//   const headers = new Headers(response.headers);
//   headers.set("Access-Control-Allow-Origin", allowOrigin);
//   headers.set("Access-Control-Allow-Credentials", "true");
//   headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
//   headers.set(
//     "Access-Control-Allow-Headers",
//     "Content-Type,Authorization,Accept"
//   );
//   headers.set("Vary", "Origin");

//   return new Response(response.body, {
//     status: response.status,
//     headers,
//   });
// }
// function errorResponse(request, message, status = 500) {
//   const res = json({ error: message }, { status });
//   return withCors(request, res);
// }
// export async function loader({ request }) {
//   // always answer preflight
//   if (request.method === "OPTIONS") {
//     return withCors(request, new Response(null, { status: 204 }));
//   }

//   try {
//     const url = new URL(request.url);
//     const customerId = url.searchParams.get("customerId");
//     if (!customerId) {
//       return errorResponse(request, "Missing customerId", 400);
//     }

//     const wishlists = await db.wishlist.findMany({
//       where: { customerId },
//     });

//     const res = json({ wishlists }, { status: 200 });
//     return withCors(request, res);
//   } catch (err) {
//     console.error("Loader error:", err);
//     return errorResponse(request, "Internal server error");
//   }
// }
// export async function action({ request }) {
//   if (request.method === "OPTIONS") {
//     return withCors(request, new Response(null, { status: 204 }));
//   }

//   if (request.method !== "POST") {
//     return withCors(
//       request,
//       json({ error: "Method Not Allowed" }, { status: 405 })
//     );
//   }

//   let data = {};
//   const contentType = request.headers.get("Content-Type") || "";
//   try {
//     if (contentType.includes("application/json")) {
//       data = await request.json();
//     } else if (contentType.includes("form")) {
//       data = Object.fromEntries(await request.formData());
//     } else {
//       return errorResponse(request, "Unsupported content type", 415);
//     }
//   } catch {
//     return errorResponse(request, "Invalid request body", 400);
//   }

//   try {
//     if (data.action === "DELETE") {
//       return await handleDelete(request, data);
//     }
//     return await handleUpsert(request, data);
//   } catch (err) {
//     console.error("Action error:", err);
//     return errorResponse(request, "Operation failed");
//   }
// }
// async function handleUpsert(request, data) {
//   const {
//     customerId,
//     productId,
//     productTitle,
//     shop,
//     quantity: qty = "1",
//     price,
//     productImage,
//   } = data;

//   if (!customerId || !productId || !shop || !price || !productTitle) {
//     return errorResponse(
//       request,
//       "Missing required fields for wishlist operation",
//       400
//     );
//   }

//   const existing = await db.wishlist.findFirst({
//     where: { customerId, productId, shop },
//   });

//   const wishlist = existing
//     ? await db.wishlist.update({
//         where: { id: existing.id },
//         data: { quantity: existing.quantity + parseInt(qty, 10) },
//       })
//     : await db.wishlist.create({
//         data: {
//           customerId,
//           productId,
//           shop,
//           productTitle,
//           quantity: parseInt(qty, 10),
//           price: parseFloat(price),
//           productImage,
//         },
//       });

//   return withCors(
//     request,
//     json(
//       {
//         success: true,
//         message: existing
//           ? "Quantity updated"
//           : "Item added to wishlist",
//         wishlist,
//       },
//       { status: 200 }
//     )
//   );
// }
// async function handleDelete(request, data) {
//   if (Array.isArray(data.ids) && data.ids.length) {
//     const validIds = data.ids
//       .map((id) => parseInt(id, 10))
//       .filter((id) => !isNaN(id));
//     if (!validIds.length) {
//       return errorResponse(request, "No valid IDs provided", 400);
//     }
//     const result = await db.wishlist.deleteMany({
//       where: { id: { in: validIds } },
//     });
//     return withCors(
//       request,
//       json(
//         {
//           message: `Deleted ${result.count} items`,
//           deletedCount: result.count,
//         },
//         { status: 200 }
//       )
//     );
//   }

//   if (data.id) {
//     const id = parseInt(data.id, 10);
//     if (isNaN(id)) {
//       return errorResponse(request, "Invalid ID format", 400);
//     }
//     await db.wishlist.delete({ where: { id } });
//     return withCors(
//       request,
//       json({ success: true, message: "Item deleted successfully" }, { status: 200 })
//     );
//   }

//   return errorResponse(request, "Missing ID(s) for deletion", 400);
// }


//==================== cookies based storing data API ====================
import { json, createCookie } from "@remix-run/node";
import db from "../db.server";

/* ------------------------------- CORS ----------------------------------- */
const SHOPIFY_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/;

function withCors(request, response) {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = SHOPIFY_ORIGIN_REGEX.test(origin)
    ? origin
    : "https://codecraft-team.myshopify.com";

  const headers = new Headers(response.headers || {});
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Accept"
  );
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function errorResponse(request, message, status = 500) {
  const res = json({ ok: false, error: message }, { status });
  return withCors(request, res);
}

function ok(request, payload, init = 200, extraHeaders) {
  const res = json({ ok: true, ...payload }, { status: init, headers: extraHeaders });
  return withCors(request, res);
}

/* ----------------------------- Cookie utils ----------------------------- */
const wishlistCookie = createCookie("temp_wishlist", {
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  path: "/",
  sameSite: "none",
  secure: true,
});

async function readWishlistCookie(request) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    const parsed = (await wishlistCookie.parse(cookieHeader)) || [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[wishlist] Failed to parse cookie:", e);
    return [];
  }
}

async function commitWishlistCookie(value) {
  return wishlistCookie.serialize(value, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
  });
}

async function clearWishlistCookie() {
  return wishlistCookie.serialize([], {
    maxAge: 0,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
  });
}

const hasCustomerId = (v) => !!(v && String(v).trim() !== "");

/* --------------------- Cookie → DB migration (core) --------------------- */
/**
 * Migrates cookie wishlist into DB for given customerId if cookie has items.
 * - Works with/without Prisma composite unique (falls back to find/update/create).
 * - Clears cookie after success.
 */
async function migrateCookieToDb(request, customerId) {
  if (!hasCustomerId(customerId)) {
    return { migrated: false, setCookieHeader: null, wishlists: [] };
  }

  const cookieWishlist = await readWishlistCookie(request);
  if (!cookieWishlist.length) {
    // Nothing to migrate
    const wishlists = await db.wishlist.findMany({ where: { customerId: String(customerId) } });
    return { migrated: false, setCookieHeader: null, wishlists };
  }

  // Normalize incoming cookie items
  const items = cookieWishlist
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? "").trim(),
      productTitle: String(item.productTitle ?? item.title ?? ""),
      quantity: Math.max(1, parseInt(item.quantity ?? 1, 10) || 1),
      price: Number.isFinite(parseFloat(item.price)) ? parseFloat(item.price) : 0,
      productImage: item.productImage ?? item.image ?? null,
      shop: item.shop ? String(item.shop) : null,
    }))
    .filter((it) => it.productId && it.shop);

  if (!items.length) {
    const wishlists = await db.wishlist.findMany({ where: { customerId: String(customerId) } });
    return { migrated: false, setCookieHeader: null, wishlists };
  }

  console.log("[wishlist] Migrating cookie → DB", {
    customerId: String(customerId),
    count: items.length,
  });

  // Try upserts in a single transaction
  try {
    const ops = items.map((it) =>
      db.wishlist.upsert({
        where: {
          customerId_productId_shop: {
            customerId: String(customerId),
            productId: it.productId,
            shop: it.shop,
          },
        },
        update: {
          quantity: { increment: it.quantity },
          productTitle: it.productTitle,
          price: it.price,
          productImage: it.productImage,
        },
        create: {
          customerId: String(customerId),
          productId: it.productId,
          productTitle: it.productTitle,
          quantity: it.quantity,
          price: it.price,
          productImage: it.productImage,
          shop: it.shop,
        },
      })
    );

    await db.$transaction(ops);
  } catch (e) {
    // Fallback path if composite unique/constraint isn't present
    console.warn("[wishlist] Upsert transaction failed, falling back:", e?.code || e?.message);
    for (const it of items) {
      const existing = await db.wishlist.findFirst({
        where: {
          customerId: String(customerId),
          productId: it.productId,
          shop: it.shop,
        },
      });

      if (existing) {
        await db.wishlist.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + it.quantity,
            productTitle: it.productTitle || existing.productTitle,
            price: it.price ?? existing.price,
            productImage: it.productImage ?? existing.productImage,
          },
        });
      } else {
        await db.wishlist.create({
          data: {
            customerId: String(customerId),
            productId: it.productId,
            productTitle: it.productTitle,
            quantity: it.quantity,
            price: it.price,
            productImage: it.productImage,
            shop: it.shop,
          },
        });
      }
    }
  }

  // Clear cookie after successful migration
  const setCookieHeader = await clearWishlistCookie();
  const wishlists = await db.wishlist.findMany({ where: { customerId: String(customerId) } });

  console.log("[wishlist] Migration complete. Rows now:", wishlists.length);

  return { migrated: true, setCookieHeader, wishlists };
}

/* -------------------------------- Loader -------------------------------- */
export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");

    console.log("[wishlist] Loader hit", { customerId, origin: request.headers.get("origin") });

    if (hasCustomerId(customerId)) {
      const { migrated, setCookieHeader, wishlists } = await migrateCookieToDb(request, customerId);
      const headers = new Headers();
      if (setCookieHeader) headers.set("Set-Cookie", setCookieHeader);
      return ok(request, { migrated, wishlists }, 200, headers);
    }

    // Guest: return cookie contents
    const cookieWishlist = await readWishlistCookie(request);
    return ok(request, { migrated: false, wishlists: cookieWishlist });
  } catch (err) {
    console.error("[wishlist] Loader error:", err);
    return errorResponse(request, "Internal server error");
  }
}

/* -------------------------------- Action -------------------------------- */
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  if (request.method !== "POST") {
    return errorResponse(request, "Method Not Allowed", 405);
  }

  let data = {};
  const contentType = request.headers.get("Content-Type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("form")) {
      data = Object.fromEntries(await request.formData());
    } else {
      return errorResponse(request, "Unsupported content type", 415);
    }
  } catch (e) {
    console.error("[wishlist] Parse body error:", e);
    return errorResponse(request, "Invalid request body", 400);
  }

  try {
    if (data.action === "DELETE") {
      return await handleDelete(request, data);
    }

    // Safety net: if user is logged in and there is still cookie data, migrate first
    if (hasCustomerId(data.customerId)) {
      await migrateCookieToDb(request, data.customerId);
    }

    return await handleUpsert(request, data);
  } catch (err) {
    console.error("[wishlist] Action error:", err);
    return errorResponse(request, "Operation failed");
  }
}

/* ----------------------------- Upsert Handler ---------------------------- */
async function handleUpsert(request, data) {
  const {
    customerId,
    productId,
    productTitle,
    shop,
    quantity: qty = "1",
    price,
    productImage,
  } = data;

  if (!productId || !shop || !productTitle) {
    return errorResponse(request, "Missing required fields: productId/productTitle/shop", 400);
  }

  // Guest → store in cookie
  if (!hasCustomerId(customerId)) {
    const cookieWishlist = await readWishlistCookie(request);
    const item = {
      productId: String(productId),
      productTitle,
      shop: String(shop),
      quantity: parseInt(qty, 10) || 1,
      price: Number.isFinite(parseFloat(price)) ? parseFloat(price) : 0,
      productImage: productImage ?? null,
    };

    const idx = cookieWishlist.findIndex(
      (i) => String(i.productId) === item.productId && String(i.shop) === item.shop
    );

    if (idx >= 0) {
      cookieWishlist[idx].quantity =
        (parseInt(cookieWishlist[idx].quantity || 0, 10) || 0) + item.quantity;
    } else {
      cookieWishlist.push(item);
    }

    const headers = new Headers();
    headers.set("Set-Cookie", await commitWishlistCookie(cookieWishlist));
    return ok(request, { message: "Saved to cookie", wishlists: cookieWishlist }, 200, headers);
  }

  // Logged-in → go to DB
  const parsedQty = parseInt(qty, 10) || 1;
  const parsedPrice = Number.isFinite(parseFloat(price)) ? parseFloat(price) : 0;

  try {
    const wishlist = await db.wishlist.upsert({
      where: {
        customerId_productId_shop: {
          customerId: String(customerId),
          productId: String(productId),
          shop: String(shop),
        },
      },
      update: {
        quantity: { increment: parsedQty },
        productTitle,
        productImage,
        price: parsedPrice,
      },
      create: {
        customerId: String(customerId),
        productId: String(productId),
        shop: String(shop),
        productTitle,
        quantity: parsedQty,
        price: parsedPrice,
        productImage,
      },
    });

    return ok(request, { message: "Item added/updated", wishlist });
  } catch (e) {
    console.warn("[wishlist] Upsert failed, trying fallback:", e?.code || e?.message);

    try {
      const existing = await db.wishlist.findFirst({
        where: {
          customerId: String(customerId),
          productId: String(productId),
          shop: String(shop),
        },
      });

      const wishlist = existing
        ? await db.wishlist.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + parsedQty,
              productTitle,
              productImage,
              price: parsedPrice,
            },
          })
        : await db.wishlist.create({
            data: {
              customerId: String(customerId),
              productId: String(productId),
              shop: String(shop),
              productTitle,
              quantity: parsedQty,
              price: parsedPrice,
              productImage,
            },
          });

      return ok(request, { message: "Item added/updated (fallback)", wishlist });
    } catch (inner) {
      console.error("[wishlist] Fallback failed:", inner);
      return errorResponse(request, "Database operation failed", 500);
    }
  }
}

/* ---------------------------- Delete Handler ---------------------------- */
async function handleDelete(request, data) {
  const { customerId } = data;

  // Guest: delete from cookie
  if (!hasCustomerId(customerId)) {
    const cookieWishlist = await readWishlistCookie(request);
    const idsToRemove = Array.isArray(data.ids)
      ? data.ids.map(String)
      : data.id
      ? [String(data.id)]
      : data.productId
      ? [String(data.productId)]
      : [];

    if (!idsToRemove.length) {
      return errorResponse(request, "Missing productId(s) to remove from cookie", 400);
    }

    const newCookie = cookieWishlist.filter(
      (item) => !idsToRemove.includes(String(item.productId ?? item.id ?? ""))
    );

    const headers = new Headers();
    headers.set("Set-Cookie", await commitWishlistCookie(newCookie));
    return ok(
      request,
      {
        message: `Deleted ${cookieWishlist.length - newCookie.length} items`,
        wishlists: newCookie,
      },
      200,
      headers
    );
  }

  // Logged-in: delete from DB
  if (Array.isArray(data.ids) && data.ids.length) {
    const validIds = data.ids.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    const result = await db.wishlist.deleteMany({ where: { id: { in: validIds } } });
    return ok(request, { message: `Deleted ${result.count} items`, deletedCount: result.count });
  }

  if (data.id) {
    const id = parseInt(data.id, 10);
    if (isNaN(id)) return errorResponse(request, "Invalid ID format", 400);
    await db.wishlist.delete({ where: { id } });
    return ok(request, { message: "Item deleted successfully" });
  }

  if (data.productId && data.shop) {
    const result = await db.wishlist.deleteMany({
      where: {
        customerId: String(customerId),
        productId: String(data.productId),
        shop: String(data.shop),
      },
    });
    return ok(request, { message: `Deleted ${result.count} items`, deletedCount: result.count });
  }

  return errorResponse(request, "Missing ID(s) for deletion", 400);
}