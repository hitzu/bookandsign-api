import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768002276219 implements MigrationInterface {
  name = 'Migration1768002276219';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "brand_id"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "deposit"`);
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "user_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" ADD "userId" integer`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f03f27dbbe89b6a0c8699f96"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."slots_period_enum" RENAME TO "slots_period_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum" AS ENUM('am_block', 'pm_block')`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ALTER COLUMN "period" TYPE "public"."slots_period_enum" USING "period"::"text"::"public"."slots_period_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."slots_period_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9f03f27dbbe89b6a0c8699f96" ON "slots" ("event_date", "period") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_4f178b72ba6f1e74f6643d86c11" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP CONSTRAINT "FK_4f178b72ba6f1e74f6643d86c11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f03f27dbbe89b6a0c8699f96"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum_old" AS ENUM('morning', 'afternoon', 'night', 'am_block', 'pm_block')`,
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
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "deposit" numeric`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "brand_id" integer`);
  }
}
