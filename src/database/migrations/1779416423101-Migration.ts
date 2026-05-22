import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1779416423101 implements MigrationInterface {
    name = 'Migration1779416423101'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "surface" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "item_type" character varying(16)`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "variant" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "item_index" integer`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "item_count" integer`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "photo_count" integer`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD "person_count" integer`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "person_count"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "photo_count"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "item_count"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "item_index"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "variant"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "item_type"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP COLUMN "surface"`);
    }

}
