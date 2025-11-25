/**
 * @module services/QuestionService
 * @description Service for managing programming questions in the system.
 * Provides operations to create, update, delete, and retrieve questions,
 * as well as manage their types, test cases, and relationships with question lists.
 * @class QuestionService
 */
import { injectable, inject } from 'tsyringe';
import { QuestionRepository } from '../repositories';
import { CreateQuestionDTO, UpdateQuestionDTO, QuestionResponseDTO } from '../dtos';
import { Question, SubmissionType } from '../models/Question';
import { QuestionList } from '../models/QuestionList';
import { AppDataSource } from '../config/database';
import { NotFoundError, logger } from '../utils';
import { JudgeType } from '../enums/JudgeType';

@injectable()
export class QuestionService {
  constructor(
    @inject(QuestionRepository) private questionRepository: QuestionRepository
  ) { }

  async getAllQuestions(): Promise<QuestionResponseDTO[]> {
    const questions = await this.questionRepository.findAll();
    return questions.map(q => this.toResponseDTO(q));
  }

  async getQuestionById(id: string): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new NotFoundError('Question not found', 'QUESTION_NOT_FOUND');
    }

    return this.toResponseDTO(question);
  }

  async createQuestion(data: CreateQuestionDTO | any, authorId?: string, questionListId?: string): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] createQuestion called', {
      title: data.title,
      authorId,
      questionListId,
      submissionType: data.submissionType
    });

    const submissionType: SubmissionType = 'local';

    if (!data.submissionType) {
      return await this.createBasicQuestion(data, authorId, questionListId, submissionType);
    }

    if (!questionListId) {
      return this.createQuestionDirect(data, authorId, submissionType);
    }

    return await this.createQuestionAndAddToList(data, authorId, questionListId, submissionType);
  }

  private async createBasicQuestion(
    data: any,
    authorId?: string,
    questionListId?: string,
    submissionType: SubmissionType = 'local'
  ): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] Creating basic question (no type defined)', {
      title: data.title,
      authorId,
      questionListId,
      submissionType
    });

    if (!questionListId) {
      const question = new Question();
      question.title = data.title;
      question.text = data.text;
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;

      const saved = await this.questionRepository.save(question);

      logger.info('[QUESTION SERVICE] Basic question created', {
        questionId: saved.id,
        title: saved.title,
        authorId: saved.authorId,
        submissionType: saved.submissionType
      });

      return this.toResponseDTO(saved);
    }

    return await this.createBasicQuestionAndAddToList(data, authorId, questionListId, submissionType);
  }

  private async createBasicQuestionAndAddToList(
    data: any,
    authorId: string | undefined,
    questionListId: string,
    submissionType: SubmissionType = 'local'
  ): Promise<QuestionResponseDTO> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      logger.debug('[QUESTION SERVICE] Starting transaction to create basic question and add to list', {
        title: data.title,
        questionListId,
        submissionType
      });

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const question = new Question();
      question.title = data.title;
      question.text = data.text;
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;

      const savedQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Basic question created in transaction', {
        questionId: savedQuestion.id,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      const questionList = await queryRunner.manager.findOne(QuestionList, {
        where: { id: questionListId }
      });

      if (!questionList) {
        throw new NotFoundError('Question list not found', 'LIST_NOT_FOUND');
      }

      logger.debug('[QUESTION SERVICE] Question list found, adding question', {
        questionListId,
        questionId: savedQuestion.id
      });

      await queryRunner.manager.query(
        `INSERT INTO question_list_questions (question_list_id, question_id) VALUES ($1, $2)
         ON CONFLICT (question_list_id, question_id) DO NOTHING`,
        [questionListId, savedQuestion.id]
      );

      logger.debug('[QUESTION SERVICE] Question added to relationship', {
        questionListId,
        questionId: savedQuestion.id
      });

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Transaction completed successfully for basic question', {
        questionId: savedQuestion.id,
        questionListId,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      return this.toResponseDTO(savedQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Error in basic question transaction, rolling back', {
        title: data.title,
        questionListId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createQuestionDirect(
    data: CreateQuestionDTO | any,
    authorId: string | undefined,
    submissionType: SubmissionType
  ): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] Creating complete question', {
      title: data.title,
      submissionType
    });

    const question = new Question();
    question.title = data.title;
    question.text = data.text;
    question.timeLimitMs = data.timeLimitMs || 1000;
    question.memoryLimitKb = data.memoryLimitKb || 64000;
    question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
    question.examples = data.examples || [];
    question.authorId = authorId;
    question.submissionType = submissionType;



    const saved = await this.questionRepository.save(question);

    logger.info('[QUESTION SERVICE] Complete question created', {
      questionId: saved.id,
      title: saved.title,
      submissionType: saved.submissionType
    });

    return this.toResponseDTO(saved);
  }

  private async createQuestionAndAddToList(
    data: CreateQuestionDTO | any,
    authorId: string | undefined,
    questionListId: string,
    submissionType: SubmissionType
  ): Promise<QuestionResponseDTO> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      logger.debug('[QUESTION SERVICE] Starting transaction to create question and add to list', {
        title: data.title,
        questionListId,
        submissionType
      });

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const question = new Question();
      question.title = data.title;
      question.text = data.text;
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;



      const savedQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Question created in transaction', {
        questionId: savedQuestion.id,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      const questionList = await queryRunner.manager.findOne(QuestionList, {
        where: { id: questionListId }
      });

      if (!questionList) {
        throw new NotFoundError('Question list not found', 'LIST_NOT_FOUND');
      }

      logger.debug('[QUESTION SERVICE] Question list found, adding question', {
        questionListId,
        questionId: savedQuestion.id
      });

      await queryRunner.manager.query(
        `INSERT INTO question_list_questions (question_list_id, question_id) VALUES ($1, $2)
         ON CONFLICT (question_list_id, question_id) DO NOTHING`,
        [questionListId, savedQuestion.id]
      );

      logger.debug('[QUESTION SERVICE] Question added to relationship', {
        questionListId,
        questionId: savedQuestion.id
      });

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Transaction completed successfully', {
        questionId: savedQuestion.id,
        questionListId,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      return this.toResponseDTO(savedQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Error in transaction, rolling back', {
        title: data.title,
        questionListId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuestion(id: string, data: UpdateQuestionDTO): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    logger.debug('[QUESTION SERVICE] Atualizando questão', {
      questionId: id,
      submissionType: question.submissionType
    });

    question.title = data.title || question.title;
    question.text = data.text || question.text;
    question.timeLimitMs = data.timeLimitMs || question.timeLimitMs;
    question.memoryLimitKb = data.memoryLimitKb || question.memoryLimitKb;
    question.wallTimeLimitSeconds = data.wallTimeLimitSeconds || question.wallTimeLimitSeconds;
    question.examples = data.examples || question.examples;

    const saved = await this.questionRepository.save(question);

    logger.info('[QUESTION SERVICE] Questão atualizada', {
      questionId: saved.id
    });

    return this.toResponseDTO(saved);
  }

  async finalizeQuestion(id: string, data: any, questionListId?: string): Promise<QuestionResponseDTO> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const question = await queryRunner.manager.findOne(Question, {
        where: { id }
      });

      if (!question) {
        throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
      }

      logger.debug('[QUESTION SERVICE] Finalizando questão', {
        questionId: id,
        newSubmissionType: data.submissionType,
        questionListId
      });

      question.submissionType = data.submissionType || question.submissionType;

      if (data.wallTimeLimitSeconds) {
        question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
      }

      const finalQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Questão finalizada na transação', {
        questionId: finalQuestion.id,
        submissionType: finalQuestion.submissionType
      });

      if (questionListId) {
        const questionList = await queryRunner.manager.findOne(QuestionList, {
          where: { id: questionListId }
        });

        if (!questionList) {
          throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
        }

        logger.debug('[QUESTION SERVICE] Lista encontrada, adicionando questão à lista', {
          questionListId,
          questionId: finalQuestion.id
        });

        await queryRunner.manager.query(
          `INSERT INTO question_list_questions (question_list_id, question_id) VALUES ($1, $2)
           ON CONFLICT (question_list_id, question_id) DO NOTHING`,
          [questionListId, finalQuestion.id]
        );

        logger.debug('[QUESTION SERVICE] Questão adicionada ao relacionamento', {
          questionListId,
          questionId: finalQuestion.id
        });
      }

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Questão finalizada com sucesso', {
        questionId: finalQuestion.id,
        questionListId,
        submissionType: finalQuestion.submissionType,
        title: finalQuestion.title
      });

      return this.toResponseDTO(finalQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Erro na transação de finalização, revertendo', {
        questionId: id,
        questionListId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    await this.questionRepository.delete(id);
  }

  private toResponseDTO(question: Question): QuestionResponseDTO {
    const baseDTO: Partial<QuestionResponseDTO> = {
      id: question.id,
      title: question.title,
      text: question.text,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      examples: question.examples,
      authorId: question.authorId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      submissionType: question.submissionType
    };

    baseDTO.judgeType = JudgeType.LOCAL;

    return baseDTO as QuestionResponseDTO;
  }
}
