import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767292855666 implements MigrationInterface {
  name = 'Migration1767292855666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum" AS ENUM('morning', 'afternoon', 'evening')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_status_enum" AS ENUM('held', 'booked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "slots" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "event_date" date NOT NULL, "period" "public"."slots_period_enum" NOT NULL, "status" "public"."slots_status_enum" NOT NULL DEFAULT 'held', "author_id" integer NOT NULL, "contract_id" integer, "lead_name" text NOT NULL, "lead_email" text, "lead_phone" text, CONSTRAINT "REL_aeaab287974f97d406aee6e4de" UNIQUE ("author_id"), CONSTRAINT "PK_8b553bb1941663b63fd38405e42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e9f03f27dbbe89b6a0c8699f96" ON "slots" ("event_date", "period") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notes_scope_enum" AS ENUM('slot', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notes_kind_enum" AS ENUM('internal', 'public')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "scope" "public"."notes_scope_enum" NOT NULL, "target_id" integer NOT NULL, "kind" "public"."notes_kind_enum" NOT NULL DEFAULT 'internal', "content" text NOT NULL, "created_by" integer, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_290993a9f1db3f4ce949bf33fb" ON "notes" ("scope", "target_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ADD CONSTRAINT "FK_aeaab287974f97d406aee6e4de6" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "slots" DROP CONSTRAINT "FK_aeaab287974f97d406aee6e4de6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_290993a9f1db3f4ce949bf33fb"`,
    );
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TYPE "public"."notes_kind_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notes_scope_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f03f27dbbe89b6a0c8699f96"`,
    );
    await queryRunner.query(`DROP TABLE "slots"`);
    await queryRunner.query(`DROP TYPE "public"."slots_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."slots_period_enum"`);
  }
}
