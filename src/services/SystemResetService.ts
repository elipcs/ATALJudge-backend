import {
  SubmissionRepository,
  UserRepository,
  ClassRepository,
  QuestionListRepository,
  InviteRepository,
} from '../repositories';

export class SystemResetService {
  constructor(
    private submissionRepository: SubmissionRepository,
    private userRepository: UserRepository,
    private classRepository: ClassRepository,
    private questionListRepository: QuestionListRepository,
    private inviteRepository: InviteRepository,
  ) {}

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
        const lists = await this.questionListRepository.findAll();
        for (const list of lists) {
          await this.questionListRepository.delete(list.id);
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
        message: 'Reset do sistema realizado com sucesso',
        itemsDeleted: totalDeleted
      };
    } catch (error) {
      throw error;
    }
  }
}
