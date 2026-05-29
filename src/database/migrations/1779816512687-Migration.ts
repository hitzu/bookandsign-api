import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779816512687 implements MigrationInterface {
    name = 'Migration1779816512687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "service_type" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "print_templates" jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "print_templates"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_type"`);
    }

}
