import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780779701328 implements MigrationInterface {
    name = 'Migration1780779701328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_brand_terms_brand"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_brand_terms_term"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "UQ_brand_terms_brand_term"`);
        await queryRunner.query(`CREATE TYPE "public"."extras_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "extras" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "brand_id" integer NOT NULL, "name" text NOT NULL, "description" text, "price" numeric, "status" "public"."extras_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_e07ed57e910c6cfc15f350141a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "UQ_8d150e9afaca619c3e52806091e" UNIQUE ("brand_id", "term_id")`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_c28fded8990f9b04eff584b50cd" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_0e2dc5ed767957230f5b054f9d1" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "extras" ADD CONSTRAINT "FK_81341034c442e3b13b726584e90" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "extras" DROP CONSTRAINT "FK_81341034c442e3b13b726584e90"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_0e2dc5ed767957230f5b054f9d1"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "FK_c28fded8990f9b04eff584b50cd"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" DROP CONSTRAINT "UQ_8d150e9afaca619c3e52806091e"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TABLE "extras"`);
        await queryRunner.query(`DROP TYPE "public"."extras_status_enum"`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "UQ_brand_terms_brand_term" UNIQUE ("brand_id", "term_id")`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_brand_terms_term" FOREIGN KEY ("term_id") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "brand_terms" ADD CONSTRAINT "FK_brand_terms_brand" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
