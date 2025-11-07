/**
 * @module services/SystemResetService
 * @description Service for system data reset operations (admin only).
 * 
 * This service handles:
 * - Bulk deletion of submissions
 * - Bulk deletion of users by role
 * - Bulk deletion of classes
 * - Bulk deletion of question lists
 * - Bulk deletion of invites
 * 
 * WARNING: This is a destructive operation intended for admin use only.
 * 
 * @example
 * const resetService = container.resolve(SystemResetService);
 * const result = await resetService.performSystemReset(options, adminUserId);
 */

import { injectable, inject } from 'tsyringe';
import {
  SubmissionRepository,
  UserRepository,
  ClassRepository,
  QuestionListRepository,
  InviteRepository,
} from '../repositories';

/**
 * Service for system-wide reset operations.
 * 
 * @class SystemResetService
 */
@injectable()
export class SystemResetService {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(InviteRepository) private inviteRepository: InviteRepository,
  ) {}

  /**
   * Performs a system-wide reset based on specified options.
   * 
   * WARNING: This is a destructive operation that permanently deletes data.
   * 
   * @async
   * @param {Object} resetOptions - Configuration for what to reset
   * @param {boolean} resetOptions.resetSubmissions - Delete all submissions
   * @param {boolean} resetOptions.resetStudents - Delete all student users
   * @param {boolean} resetOptions.resetClasses - Delete all classes
   * @param {boolean} resetOptions.resetLists - Delete all question lists
   * @param {boolean} resetOptions.resetMonitors - Delete all assistant users
   * @param {boolean} resetOptions.resetProfessors - Delete all professors (except current user)
   * @param {boolean} resetOptions.resetInvites - Delete all invites
   * @param {string} currentUserId - Current user ID (to protect from deletion)
   * @returns {Promise<{message: string; itemsDeleted: number}>} Reset result
   */
  async performSystemReset(
    resetOptions: {
      resetSubmissions: boolean;
      resetStudents: boolean;
      resetClasses: boolean;
      resetLists: boolean;
      resetMonitors: boolean;
      resetProfessors: boolean;
      resetInvites: boolean;
    },
    currentUserId: string
  ): Promise<{ message: string; itemsDeleted: number }> {
    let totalDeleted = 0;

    try {
      
      if (resetOptions.resetSubmissions) {
        const submissions = await this.submissionRepository.findAll();
        for (const submission of submissions) {
          await this.submissionRepository.delete(submission.id);
          totalDeleted++;
        }
      }

      if (resetOptions.resetStudents) {
        const students = await this.userRepository.findByRole('student');
        for (const student of students) {
          await this.userRepository.delete(student.id);
          totalDeleted++;
        }
      }

      if (resetOptions.resetClasses) {
        const classes = await this.classRepository.findAll();
        for (const clazz of classes) {
          await this.classRepository.delete(clazz.id);
          totalDeleted++;
        }
      }

      if (resetOptions.resetLists) {
        const question_lists = await this.questionListRepository.findAll();
        for (const question_list of question_lists) {
          await this.questionListRepository.delete(question_list.id);
          totalDeleted++;
        }
      }

      if (resetOptions.resetMonitors) {
        const monitors = await this.userRepository.findByRole('assistant');
        for (const monitor of monitors) {
          await this.userRepository.delete(monitor.id);
          totalDeleted++;
        }
      }

      if (resetOptions.resetProfessors) {
        const professors = await this.userRepository.findByRole('professor');
        for (const professor of professors) {
          if (professor.id !== currentUserId) {
            await this.userRepository.delete(professor.id);
            totalDeleted++;
          }
        }
      }

      if (resetOptions.resetInvites) {
        const invites = await this.inviteRepository.findAll();
        for (const invite of invites) {
          await this.inviteRepository.delete(invite.id);
          totalDeleted++;
        }
      }

      return {
        message: 'System reset completed successfully',
        itemsDeleted: totalDeleted
      };
    } catch (error) {
      throw error;
    }
  }
}
