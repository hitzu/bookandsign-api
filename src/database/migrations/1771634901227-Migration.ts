import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1771634901227 implements MigrationInterface {
    name = 'Migration1771634901227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_contract_id"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_photos_event_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "UQ_6a6b796ced805b701c82fd8cec7" UNIQUE ("key")`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "UQ_2cf15aa185455b63a6cff3c54f7" UNIQUE ("token")`);
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
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_2cf15aa185455b63a6cff3c54f7"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_6a6b796ced805b701c82fd8cec7"`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_photos_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_contract_id" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
