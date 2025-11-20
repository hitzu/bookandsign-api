import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1763597102967 implements MigrationInterface {
  name = 'Migration1763597102967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" text NOT NULL, "description" text, "image_url" text, "price" double precision NOT NULL, "discount_percentage" double precision, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "brandId" integer, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD "logo_url" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD "phone_number" text NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "brands" ADD "email" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"`,
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
