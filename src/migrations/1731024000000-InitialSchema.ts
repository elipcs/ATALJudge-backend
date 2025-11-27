import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1731024000000 implements MigrationInterface {
  name = 'InitialSchema1731024000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension FIRST
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role" AS ENUM ('student', 'professor', 'assistant');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "programming_language" AS ENUM (
          'java', 'python'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "submission_status" AS ENUM (
          'pending','in_queue', 'processing', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded',
          'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'internal_error'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "judge_verdict" AS ENUM (
          'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded',
          'Runtime Error', 'Compilation Error', 'Presentation Error', 'Judge Error'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table (base table with Single Table Inheritance)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255),
        "role" user_role NOT NULL DEFAULT 'student',
        "last_login" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        "class_id" uuid,
        "student_registration" varchar(100)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_role" ON "users" ("role")
    `);

    // Create classes table
    await queryRunner.query(`
      CREATE TABLE "classes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "professor_id" uuid NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_classes_professor" FOREIGN KEY ("professor_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_classes_professor_id" ON "classes" ("professor_id")
    `);

    // Add foreign key from users to classes
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "fk_users_class" 
      FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL
    `);

    // Create question_lists table (must be created before questions)
    await queryRunner.query(`
      CREATE TABLE "question_lists" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(500) NOT NULL,
        "description" text,
        "start_date" timestamp with time zone NOT NULL,
        "end_date" timestamp with time zone NOT NULL,
        "scoring_mode" varchar(20) DEFAULT 'simple',
        "max_score" int DEFAULT 10,
        "min_questions_for_max_score" int,
        "question_groups" jsonb DEFAULT '[]',
        "is_restricted" boolean DEFAULT false,
        "count_toward_score" boolean DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_question_lists_dates" ON "question_lists" ("start_date", "end_date")
    `);

    // Create questions table
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(500) NOT NULL,
        "text" text NOT NULL,
        "question_list_id" uuid ,
        "time_limit_ms" int NOT NULL DEFAULT 1000,
        "memory_limit_kb" int NOT NULL DEFAULT 64000,
        "examples" jsonb DEFAULT '[]',
        "oracle_code" text,
        "oracle_language" varchar(20),
        "source" varchar(200),
        "tags" jsonb DEFAULT '[]',
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_questions_question_list_id" ON "questions" ("question_list_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_questions_title" ON "questions" ("title")
    `);

    // Create test_cases table
    await queryRunner.query(`
      CREATE TABLE "test_cases" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "input" text NOT NULL,
        "expected_output" text NOT NULL,
        "weight" int DEFAULT 1,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_test_cases_question" FOREIGN KEY ("question_id") 
          REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_test_cases_question_id" ON "test_cases" ("question_id")
    `);

    // Create submissions table
    await queryRunner.query(`
      CREATE TABLE "submissions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "code" text NOT NULL,
        "language" programming_language NOT NULL,
        "status" submission_status NOT NULL DEFAULT 'pending',
        "score" int DEFAULT 0,
        "total_tests" int DEFAULT 0,
        "passed_tests" int DEFAULT 0,
        "execution_time_ms" int,
        "memory_used_kb" int,
        "verdict" text,
        "error_message" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_submissions_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_submissions_question" FOREIGN KEY ("question_id") 
          REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_submissions_user_id" ON "submissions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_submissions_question_id" ON "submissions" ("question_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_submissions_status" ON "submissions" ("status")
    `);

    // Create submission_results table
    await queryRunner.query(`
      CREATE TABLE "submission_results" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "submission_id" uuid NOT NULL,
        "test_case_id" uuid NOT NULL,
        "verdict" judge_verdict NOT NULL,
        "execution_time_ms" int,
        "memory_used_kb" int,
        "output" text,
        "error_message" text,
        "passed" boolean DEFAULT false,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_submission_results_submission" FOREIGN KEY ("submission_id") 
          REFERENCES "submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_submission_results_test_case" FOREIGN KEY ("test_case_id") 
          REFERENCES "test_cases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_submission_results_submission_id" ON "submission_results" ("submission_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_submission_results_test_case_id" ON "submission_results" ("test_case_id")
    `);

    await queryRunner.query(`
      CREATE TABLE question_list_questions (
      "question_list_id" uuid NOT NULL,
      "question_id" uuid NOT NULL,
      PRIMARY KEY ("question_list_id", "question_id"),
      CONSTRAINT "fk_question_list_questions_question_list" FOREIGN KEY ("question_list_id") REFERENCES "question_lists"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_question_list_questions_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
            )
        `);

    await queryRunner.query(`
      CREATE INDEX idx_question_list_questions_question_id ON question_list_questions(question_id)
    `);

    // Create question_list_classes junction table
    await queryRunner.query(`
      CREATE TABLE "question_list_classes" (
        "question_list_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        PRIMARY KEY ("question_list_id", "class_id"),
        CONSTRAINT "fk_qlc_question_list" FOREIGN KEY ("question_list_id") 
          REFERENCES "question_lists"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_qlc_class" FOREIGN KEY ("class_id") 
          REFERENCES "classes"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_qlc_question_list_id" ON "question_list_classes" ("question_list_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_qlc_class_id" ON "question_list_classes" ("class_id")
    `);

    // Create grades table
    await queryRunner.query(`
      CREATE TABLE "grades" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" uuid NOT NULL,
        "question_list_id" uuid NOT NULL,
        "score" decimal(5,2) NOT NULL DEFAULT 0,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_grades_student" FOREIGN KEY ("student_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_grades_question_list" FOREIGN KEY ("question_list_id") 
          REFERENCES "question_lists"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_grades_student_question_list" UNIQUE ("student_id", "question_list_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_grades_student_id" ON "grades" ("student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_grades_question_list_id" ON "grades" ("question_list_id")
    `);

    // Create invites table
    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "role" user_role NOT NULL DEFAULT 'student',
        "token" varchar(500) NOT NULL UNIQUE,
        "max_uses" int DEFAULT 1,
        "current_uses" int DEFAULT 0,
        "class_id" uuid,
        "class_name" varchar(200),
        "created_by_id" uuid,
        "creator_name" varchar(200),
        "expires_at" timestamp with time zone NOT NULL,
        "is_used" boolean DEFAULT false,
        "used_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_invites_created_by" FOREIGN KEY ("created_by_id") 
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_invites_class" FOREIGN KEY ("class_id") 
          REFERENCES "classes"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_invites_token" ON "invites" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_invites_expires_at" ON "invites" ("expires_at")
    `);

    // Create allowed_ips table
    await queryRunner.query(`
      CREATE TABLE "allowed_ips" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ip" varchar NOT NULL UNIQUE,
        "description" text NOT NULL,
        "active" boolean DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_allowed_ips_ip" ON "allowed_ips" ("ip")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_allowed_ips_active" ON "allowed_ips" ("active")
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp with time zone NOT NULL,
        "is_revoked" boolean DEFAULT false,
        "ip_address" varchar(50),
        "user_agent" varchar(500),
        "family_id" uuid,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        "last_used_at" timestamp with time zone,
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")
    `);

    // Create password_reset_tokens table
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp with time zone NOT NULL,
        "is_used" boolean DEFAULT false,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "fk_password_reset_tokens_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash")
    `);

    // Create token_blacklist table
    await queryRunner.query(`
      CREATE TABLE "token_blacklist" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "token" varchar(500) NOT NULL UNIQUE,
        "expires_at" timestamp with time zone NOT NULL,
        "reason" varchar(100),
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_token_blacklist_token" ON "token_blacklist" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_token_blacklist_expires_at" ON "token_blacklist" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "token_blacklist" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "allowed_ips" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grades" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_list_classes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_list_questions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_lists" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submission_results" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_cases" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "classes" CASCADE`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE IF EXISTS "judge_verdict"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "submission_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "programming_language"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
