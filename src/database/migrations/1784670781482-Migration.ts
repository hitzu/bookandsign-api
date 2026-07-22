import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1784670781482 implements MigrationInterface {
    name = 'Migration1784670781482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" ADD "minimized_storage_path" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "minimized_public_url" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "minimized_public_url"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "minimized_storage_path"`);
    }

}
