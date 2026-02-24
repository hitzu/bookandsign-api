import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1771898266092 implements MigrationInterface {
    name = 'Migration1771898266092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, "key" character varying(255) NOT NULL, "description" text, "token" uuid NOT NULL, "contract_id" integer NOT NULL, CONSTRAINT "UQ_6a6b796ced805b701c82fd8cec7" UNIQUE ("key"), CONSTRAINT "UQ_2cf15aa185455b63a6cff3c54f7" UNIQUE ("token"), CONSTRAINT "REL_aef1b28586686ab9b1e48fd076" UNIQUE ("contract_id"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_events_key" ON "events" ("key") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_events_token" ON "events" ("token") `);
        await queryRunner.query(`CREATE TABLE "photos" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "storage_path" character varying(512) NOT NULL, "public_url" character varying(1024) NOT NULL, "consent_at" TIMESTAMP WITH TIME ZONE NOT NULL, "event_id" integer NOT NULL, CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_photos_event_storage" ON "photos" ("event_id", "storage_path") `);
        await queryRunner.query(`CREATE INDEX "IDX_photos_event_id" ON "photos" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_aef1b28586686ab9b1e48fd076a" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_8089e0d1ec8c17d988882474cc7" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_8089e0d1ec8c17d988882474cc7"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_aef1b28586686ab9b1e48fd076a"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_photos_event_id"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_photos_event_storage"`);
        await queryRunner.query(`DROP TABLE "photos"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_events_token"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_events_key"`);
        await queryRunner.query(`DROP TABLE "events"`);
    }

}
