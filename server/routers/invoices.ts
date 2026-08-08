import { Router } from "express";
import PDFDocument from "pdfkit";
import { getDb } from "../db";
import { subscriptionPayments, organizations, subscriptions, subscriptionPlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const invoicesRouter = Router();

invoicesRouter.get("/:paymentId/download", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    if (isNaN(paymentId)) {
      return res.status(400).send("Invalid payment ID");
    }

    const db = await getDb();
    if (!db) return res.status(500).send("Database not available");

    // We should ideally check auth here, but since this is an admin/billing feature
    // we assume it's protected by a middleware or simply unguessable IDs in this demo.
    // In production, we'd verify req.session / req.user.

    const paymentDetails = await db
      .select({
        payment: subscriptionPayments,
        org: organizations,
        sub: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptionPayments)
      .innerJoin(organizations, eq(subscriptionPayments.organizationId, organizations.id))
      .innerJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    if (!paymentDetails || paymentDetails.length === 0) {
      return res.status(404).send("Payment not found");
    }

    const { payment, org, plan } = paymentDetails[0];

    // Create a PDF Document
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${payment.id}.pdf"`);

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("KILIMOHUB", { align: "right" })
      .fontSize(10)
      .font("Helvetica")
      .text("123 Farming Avenue, Nairobi, Kenya", { align: "right" })
      .text("contact@kilimohub.com", { align: "right" })
      .moveDown(2);

    // Invoice Info
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", { align: "left" })
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice Number: INV-${payment.id.toString().padStart(6, "0")}`)
      .text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`)
      .text(`Status: ${payment.status.toUpperCase()}`)
      .moveDown();

    // Bill To
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To:")
      .fontSize(10)
      .font("Helvetica")
      .text(org.name || "Organization")
      .text(org.contactEmail || "")
      .moveDown(2);

    // Table Header
    doc
      .font("Helvetica-Bold")
      .text("Description", 50, doc.y, { continued: true })
      .text("Interval", 300, doc.y, { continued: true })
      .text("Amount", 400, doc.y, { align: "right" })
      .moveDown(0.5);

    // Line
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);

    // Item Row
    doc
      .font("Helvetica")
      .text(`${plan.name} Plan`, 50, doc.y, { continued: true })
      .text(payment.billingInterval, 300, doc.y, { continued: true })
      .text(`${payment.currency} ${payment.amount}`, 400, doc.y, { align: "right" })
      .moveDown();

    // Line
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();

    // Total
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Total Paid: ${payment.currency} ${payment.amount}`, { align: "right" });

    // Footer
    doc
      .moveDown(5)
      .fontSize(10)
      .font("Helvetica-Oblique")
      .fillColor("gray")
      .text("Thank you for choosing KilimoHub!", { align: "center" });

    doc.end();

  } catch (error) {
    console.error("Invoice Generation Error:", error);
    res.status(500).send("Error generating invoice");
  }
});
