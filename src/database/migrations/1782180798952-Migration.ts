import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1782180798952 implements MigrationInterface {
    name = 'Migration1782180798952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5881f3a38e6f68fe6a04e9ed55"`);
        await queryRunner.query(`ALTER TABLE "promotion_packages" ADD "tier_order" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "promotion_packages" ADD "discount_percentage" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contract_packages" ADD "discount_percentage_snapshot" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "contract_packages" ADD "final_price_snapshot" numeric`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD "contract_package_id" integer`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD "discount_percentage_snapshot" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD "final_price_snapshot" numeric`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1ac102cb5279aeb3e4c973d550" ON "promotion_packages" ("promotion_id", "package_id", "tier_order") `);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD CONSTRAINT "FK_c4e742907cb5b68b7b87efd9e0b" FOREIGN KEY ("contract_package_id") REFERENCES "contract_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP CONSTRAINT "FK_c4e742907cb5b68b7b87efd9e0b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ac102cb5279aeb3e4c973d550"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP COLUMN "final_price_snapshot"`);
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP COLUMN "discount_percentage_snapshot"`);
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP COLUMN "contract_package_id"`);
        await queryRunner.query(`ALTER TABLE "contract_packages" DROP COLUMN "final_price_snapshot"`);
        await queryRunner.query(`ALTER TABLE "contract_packages" DROP COLUMN "discount_percentage_snapshot"`);
        await queryRunner.query(`ALTER TABLE "promotion_packages" DROP COLUMN "discount_percentage"`);
        await queryRunner.query(`ALTER TABLE "promotion_packages" DROP COLUMN "tier_order"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5881f3a38e6f68fe6a04e9ed55" ON "promotion_packages" ("package_id", "promotion_id") `);
    }

}
