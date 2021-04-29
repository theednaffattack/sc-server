import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTeamScopes1619462812937 implements MigrationInterface {
    name = 'AddTeamScopes1619462812937'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" ADD "team_scopes" text array NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "tokenVersion" integer NOT NULL DEFAULT 0`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenVersion"`, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "team_scopes"`, undefined);
    }

}
