import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1773443956344 implements MigrationInterface {
    name = 'Migration1773443956344'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."contracts_status_enum" RENAME TO "contracts_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum" AS ENUM('confirmed', 'cancelled', 'active', 'inactive', 'finalized')`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "public"."contracts_status_enum" USING "status"::"text"::"public"."contracts_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "locked" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "contract_preparation_profiles" ALTER COLUMN "answers" SET DEFAULT '{}'`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum_old" AS ENUM('confirmed', 'cancelled', 'active', 'inactive')`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" TYPE "public"."contracts_status_enum_old" USING "status"::"text"::"public"."contracts_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."contracts_status_enum_old" RENAME TO "contracts_status_enum"`);
    }

}
