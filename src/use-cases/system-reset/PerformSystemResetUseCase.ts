import { injectable } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { AppDataSource } from '../../config/database';
import { logger } from '../../utils';
import { Invite } from '../../models/Invite';
import { Class } from '../../models/Class';
import { User } from '../../models/User';
import { Submission } from '../../models/Submission';
import { QuestionList } from '../../models/QuestionList';
import { Question } from '../../models/Question';
import { AllowedIP } from '../../models/AllowedIP';
import { UserRole } from '../../enums';

interface PerformSystemResetInput {
  resetOptions: {
    resetSubmissions: boolean;
    resetStudents: boolean;
    resetClasses: boolean;
    resetLists: boolean;
    resetMonitors: boolean;
    resetProfessors: boolean;
    resetInvites: boolean;
    resetAllowedIPs: boolean;
  };
  currentUserId: string;
}

interface PerformSystemResetOutput {
  message: string;
  itemsDeleted: number;
}

@injectable()
export class PerformSystemResetUseCase implements IUseCase<PerformSystemResetInput, PerformSystemResetOutput> {
  constructor() {}

  async execute(input: PerformSystemResetInput): Promise<PerformSystemResetOutput> {
    const { resetOptions, currentUserId } = input;
    let totalDeleted = 0;

    // Use a transaction to ensure all deletions happen atomically
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      logger.info('[SystemReset] Starting system reset', { resetOptions, currentUserId });

      // Reset invites FIRST (before classes, as invites have foreign key to classes)
      if (resetOptions.resetInvites) {
        logger.info('[SystemReset] Deleting invites');
        try {
          // Use raw query to delete all invites at once
          const result = await queryRunner.query(`DELETE FROM invites`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted invites', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting invites', { error });
          // If batch delete fails, try individual deletes
          const invites = await queryRunner.manager.find(Invite);
          for (const invite of invites) {
            try {
              await queryRunner.manager.remove(invite);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting invite', { inviteId: invite.id, error: err });
            }
          }
        }
      }

      // Reset submissions (before users, as submissions have foreign key to users)
      if (resetOptions.resetSubmissions) {
        logger.info('[SystemReset] Deleting submissions');
        try {
          // Use raw query to delete all submissions at once (CASCADE will handle submission_results)
          const result = await queryRunner.query(`DELETE FROM submissions`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted submissions', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting submissions', { error });
          // If batch delete fails, try individual deletes
          const submissions = await queryRunner.manager.find(Submission);
          for (const submission of submissions) {
            try {
              await queryRunner.manager.remove(submission);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting submission', { submissionId: submission.id, error: err });
            }
          }
        }
      }

      // Reset students (before classes, as users may have foreign key to classes)
      // Note: Students must be deleted before classes because users.class_id references classes
      if (resetOptions.resetStudents) {
        logger.info('[SystemReset] Deleting students');
        try {
          // First, set class_id to NULL for all students to avoid foreign key constraints
          await queryRunner.query(`UPDATE users SET class_id = NULL WHERE role = 'student'`);
          // Then delete all students
          const result = await queryRunner.query(`DELETE FROM users WHERE role = 'student'`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted students', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting students', { error });
          // If batch delete fails, try individual deletes
          const students = await queryRunner.manager.find(User, { where: { role: UserRole.STUDENT } });
          for (const student of students) {
            try {
              // Set class_id to NULL first using raw query
              await queryRunner.query(`UPDATE users SET class_id = NULL WHERE id = $1`, [student.id]);
              // Then delete
              await queryRunner.manager.remove(student);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting student', { studentId: student.id, error: err });
            }
          }
        }
      }

      // Reset classes (after invites and users, as they may reference classes)
      // Note: Before deleting classes, we need to ensure:
      // 1. All users.class_id are set to NULL (done when deleting students)
      // 2. All invites.class_id are set to NULL (handled by ON DELETE SET NULL)
      if (resetOptions.resetClasses) {
        logger.info('[SystemReset] Deleting classes');
        try {
          // First, set class_id to NULL for all users that might still reference classes
          await queryRunner.query(`UPDATE users SET class_id = NULL WHERE class_id IS NOT NULL`);
          // Then delete all classes (CASCADE will handle question_list_classes junction table)
          const result = await queryRunner.query(`DELETE FROM classes`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted classes', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting classes', { error });
          // If batch delete fails, try individual deletes
          const classes = await queryRunner.manager.find(Class);
          for (const clazz of classes) {
            try {
              // Set class_id to NULL for all users in this class
              await queryRunner.query(`UPDATE users SET class_id = NULL WHERE class_id = $1`, [clazz.id]);
              // Delete the class
              await queryRunner.manager.remove(clazz);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting class', { classId: clazz.id, error: err });
            }
          }
        }
      }

      // Reset question lists
      // Note: This should be done after deleting classes to avoid foreign key issues with question_list_classes
      // Also deletes related questions and their test cases
      if (resetOptions.resetLists) {
        logger.info('[SystemReset] Deleting question lists and related questions/test cases');
        try {
          // First, delete all test cases for questions that belong to lists
          // This is done before deleting questions to avoid foreign key issues
          const testCasesResult = await queryRunner.query(`
            DELETE FROM test_cases 
            WHERE question_id IN (
              SELECT id FROM questions WHERE question_list_id IS NOT NULL
            )
          `);
          const testCasesDeleted = testCasesResult.rowCount || 0;
          totalDeleted += testCasesDeleted;
          logger.info('[SystemReset] Deleted test cases from lists', { count: testCasesDeleted });
          
          // Then delete all questions that belong to lists
          const questionsResult = await queryRunner.query(`DELETE FROM questions WHERE question_list_id IS NOT NULL`);
          const questionsDeleted = questionsResult.rowCount || 0;
          totalDeleted += questionsDeleted;
          logger.info('[SystemReset] Deleted questions from lists', { count: questionsDeleted });
          
          // Finally, delete all question lists
          const result = await queryRunner.query(`DELETE FROM question_lists`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted question lists', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting question lists', { error });
          // If batch delete fails, try individual deletes
          const questionLists = await queryRunner.manager.find(QuestionList);
          for (const questionList of questionLists) {
            try {
              // Delete related questions first
              const questions = await queryRunner.manager.find(Question, {
                where: { questionListId: questionList.id } as any
              });
              for (const question of questions) {
                try {
                  // Delete test cases first
                  await queryRunner.query(`DELETE FROM test_cases WHERE question_id = $1`, [question.id]);
                  // Then delete the question
                  await queryRunner.manager.remove(question);
                  totalDeleted++;
                } catch (err) {
                  logger.error('[SystemReset] Error deleting question', { questionId: question.id, error: err });
                }
              }
              // Then delete the list
              await queryRunner.manager.remove(questionList);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting question list', { questionListId: questionList.id, error: err });
            }
          }
        }
      }

      // Reset monitors (assistants)
      if (resetOptions.resetMonitors) {
        logger.info('[SystemReset] Deleting monitors');
        try {
          // Use raw query to delete all assistants at once
          const result = await queryRunner.query(`DELETE FROM users WHERE role = 'assistant'`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted monitors', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting monitors', { error });
          // If batch delete fails, try individual deletes
          const monitors = await queryRunner.manager.find(User, { where: { role: UserRole.ASSISTANT } });
          for (const monitor of monitors) {
            try {
              await queryRunner.manager.remove(monitor);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting monitor', { monitorId: monitor.id, error: err });
            }
          }
        }
      }

      // Reset professors (except current user)
      if (resetOptions.resetProfessors) {
        logger.info('[SystemReset] Deleting professors');
        try {
          // Use raw query to delete all professors except current user
          const result = await queryRunner.query(
            `DELETE FROM users WHERE role = 'professor' AND id != $1`,
            [currentUserId]
          );
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted professors', { count: deletedCount, currentUserId });
        } catch (error) {
          logger.error('[SystemReset] Error deleting professors', { error });
          // If batch delete fails, try individual deletes
          const professors = await queryRunner.manager.find(User, { where: { role: UserRole.PROFESSOR } });
          for (const professor of professors) {
            if (professor.id !== currentUserId) {
              try {
                await queryRunner.manager.remove(professor);
                totalDeleted++;
              } catch (err) {
                logger.error('[SystemReset] Error deleting professor', { professorId: professor.id, error: err });
              }
            }
          }
        }
      }

      // Reset allowed IPs
      if (resetOptions.resetAllowedIPs) {
        logger.info('[SystemReset] Deleting allowed IPs');
        try {
          // Use raw query to delete all allowed IPs at once
          const result = await queryRunner.query(`DELETE FROM allowed_ips`);
          const deletedCount = result.rowCount || 0;
          totalDeleted += deletedCount;
          logger.info('[SystemReset] Deleted allowed IPs', { count: deletedCount });
        } catch (error) {
          logger.error('[SystemReset] Error deleting allowed IPs', { error });
          // If batch delete fails, try individual deletes
          const allowedIPs = await queryRunner.manager.find(AllowedIP);
          for (const allowedIP of allowedIPs) {
            try {
              await queryRunner.manager.remove(allowedIP);
              totalDeleted++;
            } catch (err) {
              logger.error('[SystemReset] Error deleting allowed IP', { ipId: allowedIP.id, error: err });
            }
          }
        }
      }

      // Commit transaction
      await queryRunner.commitTransaction();
      logger.info('[SystemReset] System reset completed successfully', { totalDeleted });

      return {
        message: 'System reset completed successfully',
        itemsDeleted: totalDeleted
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      logger.error('[SystemReset] Error during system reset, rolling back', { error });
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
