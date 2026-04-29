import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777422860196 implements MigrationInterface {
    name = 'Migration1777422860196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "print_template" character varying(50) NOT NULL DEFAULT 'polaroid_2'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "decorative_icon" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "decorative_icon"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "print_template"`);
    }

}
