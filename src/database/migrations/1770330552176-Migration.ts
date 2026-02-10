import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1770330552176 implements MigrationInterface {
    name = 'Migration1770330552176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contract_preparation_profiles" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "answers" jsonb NOT NULL DEFAULT '{}'::jsonb, "locked" jsonb NOT NULL DEFAULT '{}'::jsonb, CONSTRAINT "REL_ccc4000bb9ef31de70fb692b1b" UNIQUE ("contract_id"), CONSTRAINT "PK_91eedaf019e1251b3a41d69437a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ccc4000bb9ef31de70fb692b1b" ON "contract_preparation_profiles" ("contract_id") `);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "direction"`);
        await queryRunner.query(`DROP TYPE "public"."payments_direction_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "related_product_name"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ADD CONSTRAINT "FK_ccc4000bb9ef31de70fb692b1ba" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" DROP CONSTRAINT "FK_ccc4000bb9ef31de70fb692b1ba"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "related_product_name" text`);
        await queryRunner.query(`CREATE TYPE "public"."payments_direction_enum" AS ENUM('incoming', 'outgoing')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "direction" "public"."payments_direction_enum" NOT NULL DEFAULT 'incoming'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ccc4000bb9ef31de70fb692b1b"`);
        await queryRunner.query(`DROP TABLE "contract_preparation_profiles"`);
    }

}
