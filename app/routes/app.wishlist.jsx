import {
  Page,
  LegacyCard,
  DataTable
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server"

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop"); // Optional filter

  const wishlists = await db.wishlist.findMany({
    where: shop ? { shop } : {},
    orderBy: { createdAt: "desc" },
  });

  return json({ wishlists });
}

export default function WishlistPage() {
  const { wishlists } = useLoaderData();
  let totalQuantity = 0;
  let totalNetSales = 0;
  
  const rowsNew = wishlists.map(item => {
  const price = item.price ?? 0;
  const quantity = item.quantity ?? 1;
  const productTitle = item.productTitle || 'Unknown Product';
  const total = price * quantity;

   totalQuantity += quantity;
    totalNetSales += total;

  return [
    productTitle,
    `${price.toFixed(2)}`,
    "123456",
    quantity,
    `${total.toFixed(2)}`
  ];
});  
    return(
        <Page title="Wishlist">
            <TitleBar title="Wishlist" />
      <LegacyCard>
        <DataTable
          columnContentTypes={[
            'text',
            'numeric',
            'numeric',
            'numeric',
            'numeric',
          ]}
          headings={[
            'Product',
            'Price',
            'SKU Number',
            'Net quantity',
            'Net sales',
          ]}
          rows={rowsNew}
           totals={[
            '',
            '',
            '',
            totalQuantity,
            `$${totalNetSales.toFixed(2)}`
          ]}
        />
      </LegacyCard>
    </Page>
    )
}