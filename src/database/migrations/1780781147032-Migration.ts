import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780781147032 implements MigrationInterface {
    name = 'Migration1780781147032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contract_extras" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "contract_id" integer NOT NULL, "extra_id" integer NOT NULL, "promotion_id" integer, "name_snapshot" text NOT NULL, "base_price_snapshot" numeric NOT NULL, "quantity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_de914bfd0fea909816f009d1af2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD CONSTRAINT "FK_4361ff443e62f4e44b335f4692f" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD CONSTRAINT "FK_efbeb3f60d90fbf010540c7cd47" FOREIGN KEY ("extra_id") REFERENCES "extras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_extras" ADD CONSTRAINT "FK_65c0ed46d668ed37d35b2d3ca06" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP CONSTRAINT "FK_65c0ed46d668ed37d35b2d3ca06"`);
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP CONSTRAINT "FK_efbeb3f60d90fbf010540c7cd47"`);
        await queryRunner.query(`ALTER TABLE "contract_extras" DROP CONSTRAINT "FK_4361ff443e62f4e44b335f4692f"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TABLE "contract_extras"`);
    }

}
