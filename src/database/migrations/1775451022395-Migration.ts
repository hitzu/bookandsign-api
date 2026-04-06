import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775451022395 implements MigrationInterface {
    name = 'Migration1775451022395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_token" uuid NOT NULL, "session_id" uuid, "action" character varying(64) NOT NULL, "metadata" jsonb, "user_agent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_62f90c4da3a8e28f9e51b56324f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "event_analytics" ADD CONSTRAINT "FK_cb9de9c0a970034368dd0a5630a" FOREIGN KEY ("event_token") REFERENCES "events"("token") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_ea_event_token" ON "event_analytics" ("event_token")`);
        await queryRunner.query(`CREATE INDEX "idx_ea_action" ON "event_analytics" ("action")`);
        await queryRunner.query(`CREATE INDEX "idx_ea_created_at" ON "event_analytics" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_ea_created_at"`);
        await queryRunner.query(`DROP INDEX "idx_ea_action"`);
        await queryRunner.query(`DROP INDEX "idx_ea_event_token"`);
        await queryRunner.query(`ALTER TABLE "event_analytics" DROP CONSTRAINT "FK_cb9de9c0a970034368dd0a5630a"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TABLE "event_analytics"`);
    }

}
