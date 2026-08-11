import { eq, and } from "drizzle-orm";
import { organizations, organizationMembers } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Validates that the specified user is a member of the organization.
 * Used for read-only organization queries (e.g., getting the subscription details).
 */
export async function requireOrganizationMembership(db: any, userId: number, organizationId: number) {
  // First check if they are the organization owner directly
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
    
  if (!org) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
  }
  
  if (org.ownerId === userId) {
    return { role: "owner", org };
  }

  // Then check organizationMembers
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this organization" });
  }
  
  return { role: membership.role, membership };
}

/**
 * Validates that the specified user has permission to manage billing for the organization.
 * Used for mutations or sensitive billing queries.
 */
export async function requireOrganizationBillingPermission(db: any, userId: number, organizationId: number) {
  const result = await requireOrganizationMembership(db, userId, organizationId);
  
  // Only owners and admins can manage billing
  if (result.role !== "owner" && result.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have billing permissions for this organization" });
  }
  
  return result;
}
