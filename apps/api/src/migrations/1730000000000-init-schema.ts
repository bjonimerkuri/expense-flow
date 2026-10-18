import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1730000000000 implements MigrationInterface {
  name = 'InitSchema1730000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" character varying NOT NULL,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('employee', 'manager', 'finance'))
      )`);

    // Money is stored as integer cents. The checks keep bad data out even if the API is bypassed.
    await q.query(`
      CREATE TABLE "expenses" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying NOT NULL,
        "description" text,
        "amount" integer NOT NULL,
        "category" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "submittedBy" integer NOT NULL REFERENCES "users"("id"),
        "reviewerId" integer REFERENCES "users"("id"),
        "rejectionReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_expenses_amount" CHECK ("amount" > 0),
        CONSTRAINT "CHK_expenses_category" CHECK ("category" IN ('travel', 'meals', 'software', 'equipment', 'other')),
        CONSTRAINT "CHK_expenses_status" CHECK ("status" IN ('pending', 'approved', 'rejected', 'paid'))
      )`);

    await q.query(`
      CREATE TABLE "expense_events" (
        "id" SERIAL PRIMARY KEY,
        "expenseId" integer NOT NULL REFERENCES "expenses"("id") ON DELETE CASCADE,
        "actorId" integer NOT NULL REFERENCES "users"("id"),
        "fromStatus" character varying,
        "toStatus" character varying NOT NULL,
        "note" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )`);

    await q.query(`CREATE INDEX "IDX_expenses_status" ON "expenses" ("status")`);
    await q.query(`CREATE INDEX "IDX_expenses_submittedBy" ON "expenses" ("submittedBy")`);
    await q.query(`CREATE INDEX "IDX_expenses_createdAt" ON "expenses" ("createdAt" DESC)`);
    await q.query(`CREATE INDEX "IDX_expense_events_expenseId" ON "expense_events" ("expenseId")`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "expense_events"`);
    await q.query(`DROP TABLE "expenses"`);
    await q.query(`DROP TABLE "users"`);
  }
}
