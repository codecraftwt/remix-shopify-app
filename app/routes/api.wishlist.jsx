// ============================= dyanamic CORS=============================

import { json } from "@remix-run/node";
import db from "../db.server";


const SHOPIFY_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/;
function withCors(request, response) {
  const origin = request.headers.get("origin") || "";

  const allowOrigin = SHOPIFY_ORIGIN_REGEX.test(origin)
    ? origin
    : "https://codecraft-team.myshopify.com";

  const headers = new Headers(response.headers);
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
  const res = json({ error: message }, { status });
  return withCors(request, res);
}
export async function loader({ request }) {
  // always answer preflight
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    if (!customerId) {
      return errorResponse(request, "Missing customerId", 400);
    }

    const wishlists = await db.wishlist.findMany({
      where: { customerId },
    });

    const res = json({ wishlists }, { status: 200 });
    return withCors(request, res);
  } catch (err) {
    console.error("Loader error:", err);
    return errorResponse(request, "Internal server error");
  }
}
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return withCors(request, new Response(null, { status: 204 }));
  }

  if (request.method !== "POST") {
    return withCors(
      request,
      json({ error: "Method Not Allowed" }, { status: 405 })
    );
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
  } catch {
    return errorResponse(request, "Invalid request body", 400);
  }

  try {
    if (data.action === "DELETE") {
      return await handleDelete(request, data);
    }
    return await handleUpsert(request, data);
  } catch (err) {
    console.error("Action error:", err);
    return errorResponse(request, "Operation failed");
  }
}
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

  if (!customerId || !productId || !shop || !price || !productTitle) {
    return errorResponse(
      request,
      "Missing required fields for wishlist operation",
      400
    );
  }

  const existing = await db.wishlist.findFirst({
    where: { customerId, productId, shop },
  });

  const wishlist = existing
    ? await db.wishlist.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + parseInt(qty, 10) },
      })
    : await db.wishlist.create({
        data: {
          customerId,
          productId,
          shop,
          productTitle,
          quantity: parseInt(qty, 10),
          price: parseFloat(price),
          productImage,
        },
      });

  return withCors(
    request,
    json(
      {
        success: true,
        message: existing
          ? "Quantity updated"
          : "Item added to wishlist",
        wishlist,
      },
      { status: 200 }
    )
  );
}
async function handleDelete(request, data) {
  if (Array.isArray(data.ids) && data.ids.length) {
    const validIds = data.ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    if (!validIds.length) {
      return errorResponse(request, "No valid IDs provided", 400);
    }
    const result = await db.wishlist.deleteMany({
      where: { id: { in: validIds } },
    });
    return withCors(
      request,
      json(
        {
          message: `Deleted ${result.count} items`,
          deletedCount: result.count,
        },
        { status: 200 }
      )
    );
  }

  if (data.id) {
    const id = parseInt(data.id, 10);
    if (isNaN(id)) {
      return errorResponse(request, "Invalid ID format", 400);
    }
    await db.wishlist.delete({ where: { id } });
    return withCors(
      request,
      json({ success: true, message: "Item deleted successfully" }, { status: 200 })
    );
  }

  return errorResponse(request, "Missing ID(s) for deletion", 400);
}


//==================== cookies based storing data API ====================
// import { json, createCookie } from "@remix-run/node";
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

// /**
//  * COOKIE: temp_wishlist
//  */
// const wishlistCookie = createCookie("temp_wishlist", {
//   maxAge: 60 * 60 * 24 * 30,
//   httpOnly: true,
//   path: "/",
//   sameSite: "none",
//   secure: true,
// });

// async function readWishlistCookie(request) {
//   try {
//     const cookieHeader = request.headers.get("Cookie");
//     const parsed = (await wishlistCookie.parse(cookieHeader)) || [];
//     return Array.isArray(parsed) ? parsed : [];
//   } catch (e) {
//     console.warn("Failed to parse wishlist cookie:", e);
//     return [];
//   }
// }

// async function commitWishlistCookie(wishlistArray) {
//   return await wishlistCookie.serialize(wishlistArray, {
//     maxAge: 60 * 60 * 24 * 30,
//     httpOnly: true,
//     path: "/",
//     sameSite: "none",
//     secure: true,
//   });
// }

// async function clearWishlistCookie() {
//   return await wishlistCookie.serialize([], {
//     maxAge: 0,
//     httpOnly: true,
//     path: "/",
//     sameSite: "none",
//     secure: true,
//   });
// }

// export async function loader({ request }) {
//   if (request.method === "OPTIONS") {
//     return withCors(request, new Response(null, { status: 204 }));
//   }

//   try {
//     const url = new URL(request.url);
//     const customerId = url.searchParams.get("customerId");

//     if (!customerId) {
//       const cookieWishlist = await readWishlistCookie(request);
//       const res = json({ wishlists: cookieWishlist }, { status: 200 });
//       return withCors(request, res);
//     }

//     const cookieWishlist = await readWishlistCookie(request);
//     if (cookieWishlist.length) {
//       for (const item of cookieWishlist) {
//         const {
//           productId,
//           productTitle,
//           price = 0,
//           productImage,
//           quantity = 1,
//           shop,
//         } = item;

//         if (!productId || !shop) continue;

//         const existing = await db.wishlist.findFirst({
//           where: { customerId, productId, shop },
//         });

//         if (existing) {
//           await db.wishlist.update({
//             where: { id: existing.id },
//             data: { quantity: existing.quantity + parseInt(quantity, 10) },
//           });
//         } else {
//           await db.wishlist.create({
//             data: {
//               customerId,
//               productId,
//               shop,
//               productTitle,
//               quantity: parseInt(quantity, 10),
//               price: parseFloat(price || 0),
//               productImage,
//             },
//           });
//         }
//       }

//       const headers = new Headers();
//       headers.set("Set-Cookie", await clearWishlistCookie());

//       const wishlistsFromDb = await db.wishlist.findMany({
//         where: { customerId },
//       });
//       const res = json({ wishlists: wishlistsFromDb }, { status: 200, headers });
//       return withCors(request, res);
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
//       const customerId = data.customerId;
//       if (!customerId) {
//         const cookieWishlist = await readWishlistCookie(request);

//         const idsToRemove = Array.isArray(data.ids)
//           ? data.ids.map(String)
//           : data.id
//           ? [String(data.id)]
//           : [];

//         const newCookieList = cookieWishlist.filter((item) => {
//           const pid = String(item.productId || item.id || "");
//           return !idsToRemove.includes(pid);
//         });

//         const headers = new Headers();
//         headers.set("Set-Cookie", await commitWishlistCookie(newCookieList));
//         const res = json(
//           { success: true, wishlists: newCookieList, message: `Deleted ${cookieWishlist.length - newCookieList.length} items` },
//           { status: 200, headers }
//         );
//         return withCors(request, res);
//       }

//       if (Array.isArray(data.ids) && data.ids.length) {
//         const validIds = data.ids
//           .map((id) => parseInt(id, 10))
//           .filter((id) => !isNaN(id));
//         if (!validIds.length) {
//           return errorResponse(request, "No valid IDs provided", 400);
//         }
//         const result = await db.wishlist.deleteMany({
//           where: { id: { in: validIds } },
//         });
//         return withCors(
//           request,
//           json(
//             {
//               message: `Deleted ${result.count} items`,
//               deletedCount: result.count,
//             },
//             { status: 200 }
//           )
//         );
//       }

//       if (data.id) {
//         const id = parseInt(data.id, 10);
//         if (isNaN(id)) {
//           return errorResponse(request, "Invalid ID format", 400);
//         }
//         await db.wishlist.delete({ where: { id } });
//         return withCors(
//           request,
//           json({ success: true, message: "Item deleted successfully" }, { status: 200 })
//         );
//       }

//       return errorResponse(request, "Missing ID(s) for deletion", 400);
//     }

//     const {
//       customerId,
//       productId,
//       productTitle,
//       shop,
//       quantity: qty = "1",
//       price,
//       productImage,
//     } = data;

//     if (!productId || !shop || !productTitle) {
//       return errorResponse(
//         request,
//         "Missing required fields for wishlist operation",
//         400
//       );
//     }

//     if (!customerId) {
//       const cookieWishlist = await readWishlistCookie(request);
//       const item = {
//         productId: String(productId),
//         productTitle,
//         shop,
//         quantity: parseInt(qty, 10),
//         price: parseFloat(price || 0),
//         productImage,
//       };

//       const existingIndex = cookieWishlist.findIndex(
//         (i) => String(i.productId) === item.productId && i.shop === item.shop
//       );
//       if (existingIndex >= 0) {
//         cookieWishlist[existingIndex].quantity =
//           (parseInt(cookieWishlist[existingIndex].quantity || 0, 10) || 0) +
//           item.quantity;
//       } else {
//         cookieWishlist.push(item);
//       }

//       const headers = new Headers();
//       headers.set("Set-Cookie", await commitWishlistCookie(cookieWishlist));
//       const res = json(
//         { success: true, message: "Saved to cookie", wishlists: cookieWishlist },
//         { status: 200, headers }
//       );
//       return withCors(request, res);
//     }

//     const existing = await db.wishlist.findFirst({
//       where: { customerId, productId, shop },
//     });

//     const wishlist = existing
//       ? await db.wishlist.update({
//           where: { id: existing.id },
//           data: { quantity: existing.quantity + parseInt(qty, 10) },
//         })
//       : await db.wishlist.create({
//           data: {
//             customerId,
//             productId,
//             shop,
//             productTitle,
//             quantity: parseInt(qty, 10),
//             price: parseFloat(price || 0),
//             productImage,
//           },
//         });

//     return withCors(
//       request,
//       json(
//         {
//           success: true,
//           message: existing ? "Quantity updated" : "Item added to wishlist",
//           wishlist,
//         },
//         { status: 200 }
//       )
//     );
//   } catch (err) {
//     console.error("Action error:", err);
//     return errorResponse(request, "Operation failed");
//   }
// }
