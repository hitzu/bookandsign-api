import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767992587594 implements MigrationInterface {
  name = 'Migration1767992587594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."TOKEN_TYPE" AS ENUM('access', 'refresh', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tokens" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "token" uuid NOT NULL, "type" "public"."TOKEN_TYPE" NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, "user_id" integer, CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'sales_agent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "role" "public"."users_role_enum" NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text, "password" text NOT NULL, "phone" text, "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."terms_scope_enum" AS ENUM('global', 'package', 'product')`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "code" text NOT NULL, "title" text NOT NULL, "content" text NOT NULL, "scope" "public"."terms_scope_enum" NOT NULL, CONSTRAINT "UQ_7e399562d3db75d5a0b6a3f25e0" UNIQUE ("code"), CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "terms_scope_idx" ON "terms" ("scope") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_promotional_type_enum" AS ENUM('promotional', 'not_promotional', 'bonus', 'none')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "name" text NOT NULL, "promotional_type" "public"."products_promotional_type_enum" NOT NULL DEFAULT 'none', CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" text NOT NULL, "logo_url" text, "phone_number" text, "email" text, CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
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
      `CREATE TABLE "packages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "name" text NOT NULL, "base_price" numeric, "status" "public"."packages_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`,
    );
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
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'transfer', 'card')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "amount" numeric NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "note" text, "reference" text, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contract_packages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "package_id" integer NOT NULL, "name_snapshot" text NOT NULL, "base_price_snapshot" numeric NOT NULL, "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_a450ff1a1c8e8e1451838ee7c8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "promotion_packages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "promotion_id" integer NOT NULL, "package_id" integer NOT NULL, CONSTRAINT "PK_2c5896b391334f14b1840314e00" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5881f3a38e6f68fe6a04e9ed55" ON "promotion_packages" ("promotion_id", "package_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promotions_type_enum" AS ENUM('percentage', 'fixed', 'bonus')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promotions_status_enum" AS ENUM('active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "promotions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "name" text NOT NULL, "type" "public"."promotions_type_enum" NOT NULL, "value" numeric NOT NULL, "status" "public"."promotions_status_enum" NOT NULL DEFAULT 'active', "valid_from" TIMESTAMP WITH TIME ZONE, "valid_until" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contract_promotions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "promotion_id" integer, "name_snapshot" text NOT NULL, "type_snapshot" text NOT NULL, "value_snapshot" numeric NOT NULL, "applied_amount" numeric NOT NULL, CONSTRAINT "PK_2acc58a73d0cb48c660b9703411" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contracts_status_enum" AS ENUM('confirmed', 'cancelled', 'active', 'inactive')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contracts" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer, "client_name" text, "client_phone" text, "client_email" text, "subtotal" numeric, "discount_total" numeric, "total" numeric, "deposit" numeric, "sku" text NOT NULL, "token" text NOT NULL, "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'active', "slot_id" integer, CONSTRAINT "REL_b35d9aa81b44226e8505284fb7" UNIQUE ("slot_id"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_slots_purpose_enum" AS ENUM('event', 'trial_makeup', 'trial_hair', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contract_slots" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "slot_id" integer NOT NULL, "purpose" "public"."contract_slots_purpose_enum" NOT NULL DEFAULT 'event', CONSTRAINT "REL_bb5e528a8b8c49df14d22e7c6b" UNIQUE ("slot_id"), CONSTRAINT "PK_3e23816118f0ec591603cb3288f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5fba8f921c69af6a570a2d216f" ON "contract_slots" ("contract_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_period_enum" AS ENUM('morning', 'afternoon', 'night', 'am_block', 'pm_block')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_status_enum" AS ENUM('available', 'reserved')`,
    );
    await queryRunner.query(
      `CREATE TABLE "slots" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "event_date" date NOT NULL, "period" "public"."slots_period_enum" NOT NULL, "status" "public"."slots_status_enum" NOT NULL DEFAULT 'available', CONSTRAINT "PK_8b553bb1941663b63fd38405e42" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "package_terms" ADD CONSTRAINT "FK_d58eccba877eb3f34e141ad47cc" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" ADD CONSTRAINT "FK_3bd2c9a9564ea9f8c7cf6ea33f2" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD CONSTRAINT "FK_71d59767d1e8e778b7656267d73" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD CONSTRAINT "FK_cecb4ffcd23db87383fef977564" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotion_packages" ADD CONSTRAINT "FK_f6545d3021de646caff9b9a2229" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotion_packages" ADD CONSTRAINT "FK_1cadca19c69aac91627cc91ed16" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotions" ADD CONSTRAINT "FK_42a4340ace1e9ba16f80753b324" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_promotions" ADD CONSTRAINT "FK_92e17ed05947afbf2edcc5fef53" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_promotions" ADD CONSTRAINT "FK_124f74218b892c1e4e02ba595d2" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_b35d9aa81b44226e8505284fb7d" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ADD CONSTRAINT "FK_5fba8f921c69af6a570a2d216f3" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ADD CONSTRAINT "FK_bb5e528a8b8c49df14d22e7c6b5" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contract_slots" DROP CONSTRAINT "FK_bb5e528a8b8c49df14d22e7c6b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" DROP CONSTRAINT "FK_5fba8f921c69af6a570a2d216f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP CONSTRAINT "FK_b35d9aa81b44226e8505284fb7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_promotions" DROP CONSTRAINT "FK_124f74218b892c1e4e02ba595d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_promotions" DROP CONSTRAINT "FK_92e17ed05947afbf2edcc5fef53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotions" DROP CONSTRAINT "FK_42a4340ace1e9ba16f80753b324"`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotion_packages" DROP CONSTRAINT "FK_1cadca19c69aac91627cc91ed16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "promotion_packages" DROP CONSTRAINT "FK_f6545d3021de646caff9b9a2229"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP CONSTRAINT "FK_cecb4ffcd23db87383fef977564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP CONSTRAINT "FK_71d59767d1e8e778b7656267d73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_52fc2356fb8c211c93d4b1496f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" DROP CONSTRAINT "FK_3bd2c9a9564ea9f8c7cf6ea33f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_terms" DROP CONSTRAINT "FK_d58eccba877eb3f34e141ad47cc"`,
    );
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
      `ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`,
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
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5fba8f921c69af6a570a2d216f"`,
    );
    await queryRunner.query(`DROP TABLE "contract_slots"`);
    await queryRunner.query(`DROP TYPE "public"."contract_slots_purpose_enum"`);
    await queryRunner.query(`DROP TABLE "contracts"`);
    await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
    await queryRunner.query(`DROP TABLE "contract_promotions"`);
    await queryRunner.query(`DROP TABLE "promotions"`);
    await queryRunner.query(`DROP TYPE "public"."promotions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."promotions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5881f3a38e6f68fe6a04e9ed55"`,
    );
    await queryRunner.query(`DROP TABLE "promotion_packages"`);
    await queryRunner.query(`DROP TABLE "contract_packages"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP INDEX "public"."package_terms_pkg_idx"`);
    await queryRunner.query(`DROP INDEX "public"."package_terms_term_idx"`);
    await queryRunner.query(`DROP TABLE "package_terms"`);
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(`DROP TYPE "public"."packages_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_602f9cc7ac04f3694081921a8c"`,
    );
    await queryRunner.query(`DROP TABLE "package_products"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP TYPE "public"."products_promotional_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."terms_scope_idx"`);
    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(`DROP TYPE "public"."terms_scope_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "tokens"`);
    await queryRunner.query(`DROP TYPE "public"."TOKEN_TYPE"`);
  }
}
