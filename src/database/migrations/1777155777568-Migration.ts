import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777155777568 implements MigrationInterface {
    name = 'Migration1777155777568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_themes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "key" text NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_99d37a029428f68612b28ae5319" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" ADD "event_theme_id" integer`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_745b140453fbe9099f00c41dbbf" FOREIGN KEY ("event_theme_id") REFERENCES "event_themes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_745b140453fbe9099f00c41dbbf"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_theme_id"`);
        await queryRunner.query(`DROP TABLE "event_themes"`);
    }

}
