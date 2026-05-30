import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780105893553 implements MigrationInterface {
    name = 'Migration1780105893553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_service_types" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying(255) NOT NULL, CONSTRAINT "UQ_fabdf2d3d7517132bc1725714e8" UNIQUE ("name"), CONSTRAINT "PK_f9d684d02cf5d6fe2cb3feaa913" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_type"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "service_type_id" integer`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_d0a5f121d871ed3651e161d8870" FOREIGN KEY ("service_type_id") REFERENCES "event_service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_d0a5f121d871ed3651e161d8870"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "service_type_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "service_type" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "events" ADD "description" text`);
        await queryRunner.query(`DROP TABLE "event_service_types"`);
    }

}
