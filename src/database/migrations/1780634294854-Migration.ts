import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780634294854 implements MigrationInterface {
  name = 'Migration1780634294854';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."terms_scope_enum" ADD VALUE IF NOT EXISTS 'brand'`,
    );
    await queryRunner.query(
      `CREATE TABLE "brand_terms" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "term_id" integer NOT NULL, CONSTRAINT "UQ_brand_terms_brand_term" UNIQUE ("brand_id", "term_id"), CONSTRAINT "PK_brand_terms" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "brand_terms_term_idx" ON "brand_terms" ("term_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "brand_terms_brand_idx" ON "brand_terms" ("brand_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_brand_terms_term" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_brand_terms_brand" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_brand_terms_brand"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_brand_terms_term"`,
    );
    await queryRunner.query(`DROP INDEX "public"."brand_terms_brand_idx"`);
    await queryRunner.query(`DROP INDEX "public"."brand_terms_term_idx"`);
    await queryRunner.query(`DROP TABLE "brand_terms"`);
  }
}
