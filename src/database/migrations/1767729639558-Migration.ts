import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767729639558 implements MigrationInterface {
  name = 'Migration1767729639558';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."contract_packages_source_enum" AS ENUM('package', 'bonus_expo', 'courtesy_sales')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contract_packages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "package_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "source" "public"."contract_packages_source_enum" NOT NULL DEFAULT 'package', CONSTRAINT "PK_a450ff1a1c8e8e1451838ee7c8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'transfer', 'card')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "amount" double precision NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "note" text, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contracts_status_enum" AS ENUM('draft', 'pending', 'active', 'canceled', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contracts" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'active', "total_amount" double precision NOT NULL DEFAULT '0', "token" text NOT NULL, CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_promotional" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "promotional_text" text`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."TOKEN_TYPE" RENAME TO "TOKEN_TYPE_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."TOKEN_TYPE" AS ENUM('access', 'refresh', 'contract')`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ALTER COLUMN "type" TYPE "public"."TOKEN_TYPE" USING "type"::"text"::"public"."TOKEN_TYPE"`,
    );
    await queryRunner.query(`DROP TYPE "public"."TOKEN_TYPE_old"`);
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD CONSTRAINT "FK_71d59767d1e8e778b7656267d73" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD CONSTRAINT "FK_cecb4ffcd23db87383fef977564" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP CONSTRAINT "FK_cecb4ffcd23db87383fef977564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP CONSTRAINT "FK_71d59767d1e8e778b7656267d73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."TOKEN_TYPE_old" AS ENUM('access', 'refresh')`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ALTER COLUMN "type" TYPE "public"."TOKEN_TYPE_old" USING "type"::"text"::"public"."TOKEN_TYPE_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."TOKEN_TYPE"`);
    await queryRunner.query(
      `ALTER TYPE "public"."TOKEN_TYPE_old" RENAME TO "TOKEN_TYPE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "promotional_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "is_promotional"`,
    );
    await queryRunner.query(`DROP TABLE "contracts"`);
    await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP TABLE "contract_packages"`);
    await queryRunner.query(
      `DROP TYPE "public"."contract_packages_source_enum"`,
    );
  }
}
