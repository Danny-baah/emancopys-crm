-- AlterTable leads: convert status from LeadStatus to SalesStatus preserving all existing data
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "leads" ALTER COLUMN "status" TYPE "SalesStatus" USING (
  CASE "status"::text
    WHEN 'NEW' THEN 'NEW_LEAD'::"SalesStatus"
    WHEN 'CONTACTED' THEN 'FIRST_CONTACT_MADE'::"SalesStatus"
    WHEN 'QUALIFIED' THEN 'DECISION_MAKER_REACHED'::"SalesStatus"
    WHEN 'PROPOSAL_SENT' THEN 'QUOTATION_SENT'::"SalesStatus"
    WHEN 'CONVERTED' THEN 'DEAL_WON'::"SalesStatus"
    WHEN 'LOST' THEN 'DEAL_LOST'::"SalesStatus"
    ELSE 'NEW_LEAD'::"SalesStatus"
  END
);

ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW_LEAD'::"SalesStatus";

-- Drop old LeadStatus enum
DROP TYPE IF EXISTS "LeadStatus";

