import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775250622678 implements MigrationInterface {
    name = 'Migration1775250622678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_phrases" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "event_type_id" integer NOT NULL, "content" text NOT NULL, CONSTRAINT "PK_20f9551d317c5298a8880468f59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_types" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_d5110ab69f4aacfe41fecdf4fcd" UNIQUE ("name"), CONSTRAINT "PK_ffe6b2d60596409fb08fb13830d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" ADD "event_type_id" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD "honorees_names" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD "album_phrase" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD "venue_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "service_location_url" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD "service_starts_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "events" ADD "service_ends_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "events" ADD "delegate_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "event_phrases" ADD CONSTRAINT "FK_3a046cfec5b9f3b472220534607" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_cca2d7a421ac4b1b24b9996d101" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_cca2d7a421ac4b1b24b9996d101"`);
        await queryRunner.query(`ALTER TABLE "event_phrases" DROP CONSTRAINT "FK_3a046cfec5b9f3b472220534607"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "delegate_name"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_ends_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_starts_at"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_location_url"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "venue_name"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "album_phrase"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "honorees_names"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_type_id"`);
        await queryRunner.query(`DROP TABLE "event_types"`);
        await queryRunner.query(`DROP TABLE "event_phrases"`);
    }

}
