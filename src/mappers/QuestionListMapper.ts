import { QuestionList } from '../models/QuestionList';
import { QuestionListResponseDTO } from '../dtos/QuestionListDtos';

export class QuestionListMapper {
  static toDTO(list: QuestionList): QuestionListResponseDTO {
    const classIds = list.classes?.map((c: { id: string }) => c.id) || [];
    
    const questions = (list.questions || [])
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .map((q: any) => {
        const judgeType = q.submissionType === 'codeforces' ? 'codeforces' : 'local';
        
        return {
          id: q.id,
          title: q.title,
          statement: q.statement,
          inputFormat: q.inputFormat,
          outputFormat: q.outputFormat,
          constraints: q.constraints,
          notes: q.notes,
          tags: q.tags,
          timeLimitMs: q.timeLimitMs,
          memoryLimitKb: q.memoryLimitKb,
          examples: q.examples,
          judgeType,
          authorId: q.authorId,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          ...(q.submissionType === 'codeforces' && {
            codeforcesContestId: q.contestId,
            codeforcesProblemIndex: q.problemIndex,
            codeforcesLink: q.codeforcesLink
          })
        };
      });
    
    return new QuestionListResponseDTO({
      id: list.id,
      title: list.title,
      description: list.description,
      authorId: list.authorId,
      startDate: list.startDate?.toISOString(),
      endDate: list.endDate?.toISOString(),
      scoringMode: list.scoringMode,
      maxScore: list.maxScore,
      minQuestionsForMaxScore: list.minQuestionsForMaxScore,
      questionGroups: list.questionGroups,
      isRestricted: list.isRestricted,
      classIds,
      questions,
      questionCount: questions.length,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      calculatedStatus: list.getCalculatedStatus()
    });
  }
}
