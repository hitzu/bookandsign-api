import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768248325471 implements MigrationInterface {
  name = 'Migration1768248325471';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP CONSTRAINT "FK_4f178b72ba6f1e74f6643d86c11"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD "promotion_id" integer`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."contract_slots_purpose_enum" RENAME TO "contract_slots_purpose_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_slots_purpose_enum" AS ENUM('event', 'trial_makeup', 'trial_hair', 'trial_nail', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" TYPE "public"."contract_slots_purpose_enum" USING "purpose"::"text"::"public"."contract_slots_purpose_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" SET DEFAULT 'event'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."contract_slots_purpose_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" ADD CONSTRAINT "FK_888a19726ea3dd10863bcd70988" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_4e1de36dfe48eb55999a95e1056" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP CONSTRAINT "FK_4e1de36dfe48eb55999a95e1056"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP CONSTRAINT "FK_888a19726ea3dd10863bcd70988"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_slots_purpose_enum_old" AS ENUM('event', 'trial_makeup', 'trial_hair', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" TYPE "public"."contract_slots_purpose_enum_old" USING "purpose"::"text"::"public"."contract_slots_purpose_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_slots" ALTER COLUMN "purpose" SET DEFAULT 'event'`,
    );
    await queryRunner.query(`DROP TYPE "public"."contract_slots_purpose_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."contract_slots_purpose_enum_old" RENAME TO "contract_slots_purpose_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contract_packages" DROP COLUMN "promotion_id"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" ADD "userId" integer`);
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD CONSTRAINT "FK_4f178b72ba6f1e74f6643d86c11" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
