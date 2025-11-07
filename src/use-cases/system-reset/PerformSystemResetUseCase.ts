import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import {
  SubmissionRepository,
  UserRepository,
  ClassRepository,
  QuestionListRepository,
  InviteRepository,
} from '../../repositories';

interface PerformSystemResetInput {
  resetOptions: {
    resetSubmissions: boolean;
    resetStudents: boolean;
    resetClasses: boolean;
    resetLists: boolean;
    resetMonitors: boolean;
    resetProfessors: boolean;
    resetInvites: boolean;
  };
  currentUserId: string;
}

interface PerformSystemResetOutput {
  message: string;
  itemsDeleted: number;
}

@injectable()
export class PerformSystemResetUseCase implements IUseCase<PerformSystemResetInput, PerformSystemResetOutput> {
  constructor(
    @inject(SubmissionRepository) private submissionRepository: SubmissionRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ClassRepository) private classRepository: ClassRepository,
    @inject(QuestionListRepository) private questionListRepository: QuestionListRepository,
    @inject(InviteRepository) private inviteRepository: InviteRepository,
  ) {}

  async execute(input: PerformSystemResetInput): Promise<PerformSystemResetOutput> {
    const { resetOptions, currentUserId } = input;
    let totalDeleted = 0;

    try {
      // Reset submissions
      if (resetOptions.resetSubmissions) {
        const submissions = await this.submissionRepository.findAll();
        for (const submission of submissions) {
          await this.submissionRepository.delete(submission.id);
          totalDeleted++;
        }
      }

      // Reset students
      if (resetOptions.resetStudents) {
        const students = await this.userRepository.findByRole('student');
        for (const student of students) {
          await this.userRepository.delete(student.id);
          totalDeleted++;
        }
      }

      // Reset classes
      if (resetOptions.resetClasses) {
        const classes = await this.classRepository.findAll();
        for (const clazz of classes) {
          await this.classRepository.delete(clazz.id);
          totalDeleted++;
        }
      }

      // Reset question lists
      if (resetOptions.resetLists) {
        const questionLists = await this.questionListRepository.findAll();
        for (const questionList of questionLists) {
          await this.questionListRepository.delete(questionList.id);
          totalDeleted++;
        }
      }

      // Reset monitors (assistants)
      if (resetOptions.resetMonitors) {
        const monitors = await this.userRepository.findByRole('assistant');
        for (const monitor of monitors) {
          await this.userRepository.delete(monitor.id);
          totalDeleted++;
        }
      }

      // Reset professors (except current user)
      if (resetOptions.resetProfessors) {
        const professors = await this.userRepository.findByRole('professor');
        for (const professor of professors) {
          if (professor.id !== currentUserId) {
            await this.userRepository.delete(professor.id);
            totalDeleted++;
          }
        }
      }

      // Reset invites
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
