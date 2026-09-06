import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1788629147527 implements MigrationInterface {
    name = 'Migration1788629147527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_themes" ADD "images" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_themes" DROP COLUMN "images"`);
    }

}
