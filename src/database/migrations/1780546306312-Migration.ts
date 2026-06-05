import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780546306312 implements MigrationInterface {
    name = 'Migration1780546306312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "carousels" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "page" text NOT NULL, "section" text NOT NULL, "brand_id" integer, "content_type" text NOT NULL DEFAULT 'image', "title" text, "subtitle" text, "description" text, "image_url" text NOT NULL, "cta_label" text, "cta_url" text, "metadata" jsonb NOT NULL DEFAULT '{}', "sort_order" integer NOT NULL DEFAULT '0', "status" text NOT NULL DEFAULT 'active', CONSTRAINT "PK_ca413cbc94c27aa62942c1cee79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "brands" ADD "expo_monthly_risk_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "brands" ADD "min_amount_hold_slot" numeric`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD "brand_id" integer`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_05b66621947a06feb36ac19e924" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carousels" ADD CONSTRAINT "FK_fd8ae252aaaa3aab5d947b1a148" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carousels" DROP CONSTRAINT "FK_fd8ae252aaaa3aab5d947b1a148"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_05b66621947a06feb36ac19e924"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "brand_id"`);
        await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "min_amount_hold_slot"`);
        await queryRunner.query(`ALTER TABLE "brands" DROP COLUMN "expo_monthly_risk_enabled"`);
        await queryRunner.query(`DROP TABLE "carousels"`);
    }

}
