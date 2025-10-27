import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761529165973 implements MigrationInterface {
    name = 'Migration1761529165973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "theme" SET DEFAULT '{}'`);
    }

}
