import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1763614356639 implements MigrationInterface {
  name = 'Migration1763614356639';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" text NOT NULL, "description" text, "image_url" text, "price" double precision NOT NULL, "discount_percentage" double precision, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "brand_id" integer NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "brands" ADD "logo_url" text`);
    await queryRunner.query(`ALTER TABLE "brands" ADD "phone_number" text`);
    await queryRunner.query(`ALTER TABLE "brands" ADD "email" text`);
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "phone_number"`);
    await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "logo_url"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
  }
}
