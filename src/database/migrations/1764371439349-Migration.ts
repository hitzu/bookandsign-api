import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1764371439349 implements MigrationInterface {
  name = 'Migration1764371439349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "package_products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "package_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_54cd0286e36604e73b44500dc77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_602f9cc7ac04f3694081921a8c" ON "package_products" ("package_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."packages_status_enum" AS ENUM('draft', 'active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "packages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "code" text NOT NULL, "name" text NOT NULL, "description" text, "base_price" double precision, "discount" double precision, "status" "public"."packages_status_enum" NOT NULL DEFAULT 'draft', CONSTRAINT "UQ_ced38866e7e59963188cd0a76df" UNIQUE ("code"), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_products" ADD CONSTRAINT "FK_299de9f62593f369708715b23ab" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_products" ADD CONSTRAINT "FK_64426253d06dc62a3b442394941" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ADD CONSTRAINT "FK_14ec7aa72ad40a8d11de6dcae6e" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "packages" DROP CONSTRAINT "FK_14ec7aa72ad40a8d11de6dcae6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_products" DROP CONSTRAINT "FK_64426253d06dc62a3b442394941"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_products" DROP CONSTRAINT "FK_299de9f62593f369708715b23ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(`DROP TYPE "public"."packages_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_602f9cc7ac04f3694081921a8c"`,
    );
    await queryRunner.query(`DROP TABLE "package_products"`);
  }
}
