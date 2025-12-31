import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767143363089 implements MigrationInterface {
  name = 'Migration1767143363089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "package_terms" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "package_id" integer NOT NULL, "term_id" integer NOT NULL, CONSTRAINT "UQ_fef77ea9c007f8ac29b51aa8ed8" UNIQUE ("package_id", "term_id"), CONSTRAINT "PK_2fac54c49fed00d6264db6d0959" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "package_terms_term_idx" ON "package_terms" ("term_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "package_terms_pkg_idx" ON "package_terms" ("package_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."terms_scope_enum" AS ENUM('global', 'package')`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "code" text NOT NULL, "package_id" integer, "title" text NOT NULL, "content" text NOT NULL, "scope" "public"."terms_scope_enum" NOT NULL, CONSTRAINT "UQ_7e399562d3db75d5a0b6a3f25e0" UNIQUE ("code"), CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "terms_scope_idx" ON "terms" ("scope") `,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ALTER COLUMN "code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" ADD CONSTRAINT "FK_d58eccba877eb3f34e141ad47cc" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" ADD CONSTRAINT "FK_3bd2c9a9564ea9f8c7cf6ea33f2" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_terms" DROP CONSTRAINT "FK_3bd2c9a9564ea9f8c7cf6ea33f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" DROP CONSTRAINT "FK_d58eccba877eb3f34e141ad47cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ALTER COLUMN "code" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP INDEX "public"."terms_scope_idx"`);
    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(`DROP TYPE "public"."terms_scope_enum"`);
    await queryRunner.query(`DROP INDEX "public"."package_terms_pkg_idx"`);
    await queryRunner.query(`DROP INDEX "public"."package_terms_term_idx"`);
    await queryRunner.query(`DROP TABLE "package_terms"`);
  }
}
