import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776907256956 implements MigrationInterface {
    name = 'Migration1776907256956'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_ea_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ea_action"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ea_event_token"`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "session_token" uuid NOT NULL, "event_id" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "photo_count" integer NOT NULL DEFAULT '0', "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_f10db2949bbea55b44f31108e1a" UNIQUE ("session_token"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_sessions_session_token" ON "sessions" ("session_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_event_id" ON "sessions" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD "photo_count" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "session_id" integer`);
        await queryRunner.query(`CREATE TYPE "public"."photos_status_enum" AS ENUM('processing', 'ready', 'error')`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "status" "public"."photos_status_enum" NOT NULL DEFAULT 'ready'`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "public_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_photos_session_id" ON "photos" ("session_id") `);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_98fcc611bf939573cac8251a2ac" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_9e651458cdc61503d59933b23eb" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_9e651458cdc61503d59933b23eb"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_98fcc611bf939573cac8251a2ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_photos_session_id"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "public_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."photos_status_enum"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "session_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "photo_count"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sessions_event_id"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_sessions_session_token"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`CREATE INDEX "idx_ea_event_token" ON "event_analytics" ("event_token") `);
        await queryRunner.query(`CREATE INDEX "idx_ea_action" ON "event_analytics" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_ea_created_at" ON "event_analytics" ("created_at") `);
    }

}
