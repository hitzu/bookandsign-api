import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767824588522 implements MigrationInterface {
  name = 'Migration1767824588522';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f03f27dbbe89b6a0c8699f96"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."slots_period_enum" RENAME TO "slots_period_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum" AS ENUM('morning', 'afternoon', 'evening', 'am_block', 'pm_block')`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ALTER COLUMN "period" TYPE "public"."slots_period_enum" USING "period"::"text"::"public"."slots_period_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."slots_period_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9f03f27dbbe89b6a0c8699f96" ON "slots" ("event_date", "period") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f03f27dbbe89b6a0c8699f96"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum_old" AS ENUM('morning', 'afternoon', 'evening')`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ALTER COLUMN "period" TYPE "public"."slots_period_enum_old" USING "period"::"text"::"public"."slots_period_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."slots_period_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."slots_period_enum_old" RENAME TO "slots_period_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9f03f27dbbe89b6a0c8699f96" ON "slots" ("event_date", "period") WHERE (deleted_at IS NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
  }
}
