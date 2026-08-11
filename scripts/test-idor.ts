import { getDb } from "../server/db";
import { organizations, users, organizationMembers } from "../drizzle/schema";
import { billingRouter } from "../server/routers/billing";
import { subscriptionsRouter } from "../server/routers/subscriptions";
import { TRPCError } from "@trpc/server";

async function testIdorFix() {
  const db = await getDb();
  if (!db) throw new Error("No db");

  console.log("Setting up test data...");

  // 1. Create two test users
  const [{ insertId: userAId }] = await db.insert(users).values({ email: "usera@test.com", name: "User A", role: "user" });
  const [{ insertId: userBId }] = await db.insert(users).values({ email: "userb@test.com", name: "User B", role: "user" });

  // 2. Create two test organizations
  const [{ insertId: orgAId }] = await db.insert(organizations).values({ name: "Org A", businessType: "Farm", ownerId: userAId });
  const [{ insertId: orgBId }] = await db.insert(organizations).values({ name: "Org B", businessType: "Farm", ownerId: userBId });

  // Make sure they are members of their own orgs as 'owner'
  await db.insert(organizationMembers).values({ organizationId: orgAId, userId: userAId, role: "owner" });
  await db.insert(organizationMembers).values({ organizationId: orgBId, userId: userBId, role: "owner" });

  console.log(`Created Org A (${orgAId}) owned by User A (${userAId})`);
  console.log(`Created Org B (${orgBId}) owned by User B (${userBId})`);

  // Create Caller for User A
  const callerA = billingRouter.createCaller({ user: { id: userAId, role: "user", email: "usera@test.com", name: "User A" } } as any);
  const callerASub = subscriptionsRouter.createCaller({ user: { id: userAId, role: "user", email: "usera@test.com", name: "User A" } } as any);

  let passed = 0;
  let failed = 0;

  const assertThrowsForbidden = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
      console.error(`❌ [${name}] Failed: Expected FORBIDDEN error, but request succeeded!`);
      failed++;
    } catch (e: any) {
      if (e instanceof TRPCError && e.code === "FORBIDDEN") {
        console.log(`✅ [${name}] Passed: Correctly blocked with FORBIDDEN error.`);
        passed++;
      } else {
        console.error(`❌ [${name}] Failed: Expected FORBIDDEN, got ${e.code || e.message}`);
        failed++;
      }
    }
  };

  const assertSucceeds = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
      console.log(`✅ [${name}] Passed: Request succeeded as expected.`);
      passed++;
    } catch (e: any) {
      console.error(`❌ [${name}] Failed: Expected success, got error ${e.code || e.message}`);
      failed++;
    }
  };

  console.log("\n--- Testing billing.listMyPayments ---");
  await assertSucceeds("User A fetching Org A payments", () => callerA.listMyPayments({ organizationId: orgAId }));
  await assertThrowsForbidden("User A fetching Org B payments (IDOR test)", () => callerA.listMyPayments({ organizationId: orgBId }));

  // Skip checkout session creation for test because it actually hits Stripe, just testing subscriptions now

  console.log("\n--- Testing subscriptions.getOrganizationSubscription ---");
  await assertSucceeds("User A fetching Org A subscription", () => callerASub.getOrganizationSubscription({ organizationId: orgAId }));
  await assertThrowsForbidden("User A fetching Org B subscription (IDOR test)", () => callerASub.getOrganizationSubscription({ organizationId: orgBId }));

  console.log("\n--- Testing subscriptions.getGrantedFeatures ---");
  await assertSucceeds("User A fetching Org A features", () => callerASub.getGrantedFeatures({ organizationId: orgAId }));
  await assertThrowsForbidden("User A fetching Org B features (IDOR test)", () => callerASub.getGrantedFeatures({ organizationId: orgBId }));

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.`);

  process.exit(failed > 0 ? 1 : 0);
}

testIdorFix().catch(console.error);
