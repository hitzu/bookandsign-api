import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777347937404 implements MigrationInterface {
    name = 'Migration1777347937404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP CONSTRAINT "PK_62f90c4da3a8e28f9e51b56324f"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD CONSTRAINT "PK_62f90c4da3a8e28f9e51b56324f" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP CONSTRAINT "PK_62f90c4da3a8e28f9e51b56324f"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD CONSTRAINT "PK_62f90c4da3a8e28f9e51b56324f" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "updated_at"`);
    }

}
