// import {
//   Box,
//   Card,
//   Layout,
//   Link,
//   List,
//   Page,
//   Text,
//   BlockStack,
// } from "@shopify/polaris";
// import { TitleBar } from "@shopify/app-bridge-react";

// export default function PricingPage() {
//   return (
//     <Page>
//       <TitleBar title="Pricing" />
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <BlockStack gap="300">
//               <Text as="p" variant="bodyMd">
//                 The app template comes with an additional page which
//                 demonstrates how to create multiple pages within app navigation
//                 using{" "}
//                 <Link
//                   url="https://shopify.dev/docs/apps/tools/app-bridge"
//                   target="_blank"
//                   removeUnderline
//                 >
//                   App Bridge
//                 </Link>
//                 .
//               </Text>
//               <Text as="p" variant="bodyMd">
//                 To create your own page and have it show up in the app
//                 navigation, add a page inside <Code>app/routes</Code>, and a
//                 link to it in the <Code>&lt;NavMenu&gt;</Code> component found
//                 in <Code>app/routes/app.jsx</Code>.
//               </Text>
//             </BlockStack>
//           </Card>
//         </Layout.Section>
//         <Layout.Section variant="oneThird">
//           <Card>
//             <BlockStack gap="200">
//               <Text as="h2" variant="headingMd">
//                 Resources
//               </Text>
//               <List>
//                 <List.Item>
//                   <Link
//                     url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
//                     target="_blank"
//                     removeUnderline
//                   >
//                     App nav best practices
//                   </Link>
//                 </List.Item>
//               </List>
//             </BlockStack>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

// function Code({ children }) {
//   return (
//     <Box
//       as="span"
//       padding="025"
//       paddingInlineStart="100"
//       paddingInlineEnd="100"
//       background="bg-surface-active"
//       borderWidth="025"
//       borderColor="border"
//       borderRadius="100"
//     >
//       <code>{children}</code>
//     </Box>
//   );
// }

import {
  Page,
  Box,
  Button,
  Card,
  CalloutCard,
  Text,
  Grid,
  Divider,
  BlockStack,
  ExceptionList
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

// import {
//   MobileAcceptMajor
// } from '@shopify/polaris-icons'

export async function loader({ request }) {
  const { billing } = await authenticate.admin(request);

  try {
    // Attempt to check if the shop has an active payment for any plan
    const billingCheck = await billing.require({
      plans: [MONTHLY_PLAN, ANNUAL_PLAN],
      isTest: true,
      // Instead of redirecting on failure, just catch the error
      onFailure: () => {
        throw new Error('No active plan');
      },
    });

    // If the shop has an active subscription, log and return the details
    const subscription = billingCheck.appSubscriptions[0];
    return json({ billing, plan: subscription });

  } catch (error) {
    // If the shop does not have an active plan, return an empty plan object
    if (error.message === 'No active plan') {
      return json({ billing, plan: { name: "Free" } });
    }
    // If there is another error, rethrow it
    throw error;
  }
}


let planData = [
  {
    title: "Free",
    description: "Free plan with basic features",
    price: "0",
    action: "Upgrade to pro",
    name: "Free",
    url: "/app/upgrade",
    features: [
      "100 wishlist per day",
      "500 Products",
      "Basic customization",
      "Basic support",
      "Basic analytics"
    ]
  },
  {
    title: "Pro",
    description: "Pro plan with advanced features",
    price: "10",
    name: "Monthly subscription",
    action: "Upgrade to pro",
    url: "/app/upgrade",
    features: [
      "Unlimted wishlist per day",
      "10000 Products",
      "Advanced customization",
      "Priority support",
      "Advanced analytics"
    ]
  },
]

export default function PricingPage() {
  const { plan } = useLoaderData();

  return (
    <Page>
      <ui-title-bar title="Pricing" />
      <CalloutCard
          title="Change your plan"
          illustration="https://cdn.shopify.com/s/files/1/0583/6465/7734/files/tag.png?v=1705280535"
          primaryAction={{
            content: 'Cancel Plan',
            url: '/app/cancel',
          }}
        >
          { plan.name == "Monthly subscription" ? (
            <p>
              You're currently on pro plan. All features are unlocked.
            </p>
          ) : (
            <p>
              You're currently on free plan. Upgrade to pro to unlock more features.
            </p>
          )}
      </CalloutCard>

      <div style={{ margin: "0.5rem 0"}}>
        <Divider />
      </div>

      <Grid>
        {planData?.map((plan_item, index) => (
          <Grid.Cell key={index} columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
            <Card background={ plan_item.name == plan.name ? "bg-surface-success" : "bg-surface" } sectioned>
              <Box padding="400">
                <Text as="h3" variant="headingMd">
                  {plan_item.title}
                </Text>
                <Box as="p" variant="bodyMd">
                  {plan_item.description}
                  {/* If plan_item is 0, display nothing */}
                  <br />
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    {plan_item.price === "0" ? "" : "$" + plan_item.price}
                  </Text>
                </Box>

                <div style={{ margin: "0.5rem 0"}}>
                  <Divider />
                </div>

                <BlockStack gap={100}>
                  {plan_item?.features?.map((feature, index) => (
                    <ExceptionList
                      key={index}
                      items={[
                        {
                          // icon: MobileAcceptMajor,
                          description: feature,
                        },
                      ]}
                    />
                  ))}
                </BlockStack>
                <div style={{ margin: "0.5rem 0"}}>
                  <Divider />
                </div>

                { plan_item.name == "Monthly subscription" ?
                  plan.name != "Monthly subscription" ? (
                    <Button primary url={plan_item.url}>
                      {plan_item.action}
                    </Button>
                  ) : (
                    <Text as="p" variant="bodyMd">
                      You're currently on this plan
                    </Text>
                  )
                : null }
              </Box>
            </Card>
          </Grid.Cell>
        ))}

      </Grid>

    </Page>
  );
}