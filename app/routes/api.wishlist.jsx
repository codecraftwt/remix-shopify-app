// import { json } from "@remix-run/node";
// import { cors } from "remix-utils/cors";
// import db from "../db.server";

// const CORS_OPTIONS = {
//   headers: {
//     "Access-Control-Allow-Origin": "https://codecraft-team.myshopify.com",
//     "Access-Control-Allow-Credentials": "true",
//     "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type,Authorization,Accept"
//   }
// };

// function errorResponse(request, message, status = 500) {
//   const response = json({ error: message }, { status });
//   return cors(request, response, CORS_OPTIONS);
// }

// export async function loader({ request }) {
//   try {
//     const url = new URL(request.url);
//     const customerId = url.searchParams.get("customerId");
//     if (!customerId) {
//       return errorResponse(request, "Missing customerId", 400);
//     }

//     const wishlists = await db.wishlist.findMany({
//       where: { customerId }
//     });

//     const response = json({
//       method: "GET",
//       wishlists
//     }, { status: 200 });

//     return cors(request, response, CORS_OPTIONS);
//   } catch (error) {
//     console.error("Loader error:", error);
//     return errorResponse(request, "Internal server error");
//   }
// }

// export async function action({ request }) {
//   // Always respond to OPTIONS for preflight
//   if (request.method === "OPTIONS") {
//     return cors(
//       request,
//       new Response(null, { status: 204 }),
//       CORS_OPTIONS
//     );
//   }

//   // Parse JSON or form data
//   let data = {};
//   const contentType = request.headers.get("Content-Type") || "";
//   try {
//     if (contentType.includes("application/json")) {
//       data = await request.json();
//     } else if (contentType.includes("form")) {
//       const formData = await request.formData();
//       data = Object.fromEntries(formData);
//     }
//   } catch (err) {
//     return cors(
//       request,
//       json({ message: "Invalid request body", error: err.message }, { status: 400 }),
//       CORS_OPTIONS
//     );
//   }

//   try {
//     switch (request.method) {
//       case "POST": {
//         const {
//           customerId,
//           productId,
//           productTitle,
//           shop,
//           quantity: qty = "1",
//           price,
//           productImage
//         } = data;

//         if (!customerId || !productId || !shop || !price || !productTitle) {
//           return cors(
//             request,
//             json({ message: "Missing required fields" }, { status: 400 }),
//             CORS_OPTIONS
//           );
//         }

//         // Upsert logic
//         const existing = await db.wishlist.findFirst({
//           where: { customerId, productId, shop }
//         });

//         const wishlist = existing
//           ? await db.wishlist.update({
//               where: { id: existing.id },
//               data: { quantity: existing.quantity + parseInt(qty, 10) }
//             })
//           : await db.wishlist.create({
//               data: {
//                 customerId,
//                 productId,
//                 shop,
//                 productTitle,
//                 quantity: parseInt(qty, 10),
//                 price: parseFloat(price),
//                 productImage
//               }
//             });

//         return cors(
//           request,
//           json({
//             message: existing ? "Wishlist quantity updated" : "Product added to wishlist",
//             method: "POST",
//             wishlist
//           }, { status: 200 }),
//           CORS_OPTIONS
//         );
//       }

//       case "PATCH": {
//         // stub
//         return cors(
//           request,
//           json({ message: "PATCH method not implemented" }, { status: 501 }),
//           CORS_OPTIONS
//         );
//       }

//       case "DELETE": {
//         // Bulk delete
//         if (Array.isArray(data.ids) && data.ids.length) {
//           const validIds = data.ids.map((id) => parseInt(id, 10)).filter(id => !isNaN(id));
//           if (!validIds.length) {
//             return cors(
//               request,
//               json({ message: "No valid IDs provided" }, { status: 400 }),
//               CORS_OPTIONS
//             );
//           }
//           const result = await db.wishlist.deleteMany({
//             where: { id: { in: validIds } }
//           });
//           return cors(
//             request,
//             json({
//               message: `Deleted ${result.count} entries`,
//               deletedCount: result.count
//             }, { status: 200 }),
//             CORS_OPTIONS
//           );
//         }

//         // Single delete
//         if (data.id) {
//           const id = parseInt(data.id, 10);
//           if (isNaN(id)) {
//             return cors(
//               request,
//               json({ message: "Invalid ID" }, { status: 400 }),
//               CORS_OPTIONS
//             );
//           }
//           await db.wishlist.delete({ where: { id } });
//           return cors(
//             request,
//             json({ message: "Entry removed" }, { status: 200 }),
//             CORS_OPTIONS
//           );
//         }

//         // No delete params
//         return cors(
//           request,
//           json({ message: "Missing 'id' or 'ids' for delete" }, { status: 400 }),
//           CORS_OPTIONS
//         );
//       }

//       default: {
//         return cors(
//           request,
//           json({ message: "Method Not Allowed" }, { status: 405 }),
//           CORS_OPTIONS
//         );
//       }
//     }
//   } catch (error) {
//     console.error(`${request.method} error:`, error);
//     return cors(
//       request,
//       json({ message: `${request.method} operation failed`, error: error.message }, { status: 500 }),
//       CORS_OPTIONS
//     );
//   }
// }

//======================= Manual CORS ======================================

// import { json } from "@remix-run/node";
// import db from "../db.server";

// const ALLOWED_ORIGINS = [
//   "https://codecraft-team.myshopify.com",
//   // you can add more Shopify admin sub-domains here if needed
// ];

// function withCors(request, response) {
//   const origin = request.headers.get("origin");
//   // only echo back if it’s on your whitelist
//   const allowOrigin = ALLOWED_ORIGINS.includes(origin)
//     ? origin
//     : ALLOWED_ORIGINS[0];

//   // clone the headers so we don’t mutate immutable Response headers
//   const headers = new Headers(response.headers);
//   headers.set("Access-Control-Allow-Origin", allowOrigin);
//   headers.set("Access-Control-Allow-Credentials", "true");
//   headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
//   headers.set(
//     "Access-Control-Allow-Headers",
//     "Content-Type,Authorization,Accept"
//   );
//   // some browsers want this on every preflight
//   headers.set("Vary", "Origin");

//   // return a brand-new Response with the same body & status
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
//       json({ message: "Item deleted successfully" }, { status: 200 })
//     );
//   }

//   return errorResponse(request, "Missing ID(s) for deletion", 400);
// }


// ============================= dyanamic CORS=============================

import { json } from "@remix-run/node";
import db from "../db.server";


const SHOPIFY_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/;
function withCors(request, response) {
  const origin = request.headers.get("origin") || "";

  const allowOrigin = SHOPIFY_ORIGIN_REGEX.test(origin)
    ? origin
    : "https://codecraft-team.myshopify.com";

    console.log(allowOrigin,"allowed origin")

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
      json({ message: "Item deleted successfully" }, { status: 200 })
    );
  }

  return errorResponse(request, "Missing ID(s) for deletion", 400);
}