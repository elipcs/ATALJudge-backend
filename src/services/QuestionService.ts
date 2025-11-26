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
import { Question } from '../models/Question';
import { QuestionList } from '../models/QuestionList';
import { AppDataSource } from '../config/database';
import { NotFoundError, logger } from '../utils';

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

  async createQuestion(data: CreateQuestionDTO): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] createQuestion called', {
      title: data.title,
    });

    const question = new Question();
    question.title = data.title;
    question.text = data.text;
    question.timeLimitMs = data.timeLimitMs || 1000;
    question.memoryLimitKb = data.memoryLimitKb || 128000;
    question.examples = data.examples || [];

    const saved = await this.questionRepository.save(question);

    logger.info('[QUESTION SERVICE] Question created', {
      questionId: saved.id,
      title: saved.title,
    });

    return this.toResponseDTO(saved);
  }

  async updateQuestion(id: string, data: UpdateQuestionDTO): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);

    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    logger.debug('[QUESTION SERVICE] Atualizando questão', {
      questionId: id
    });

    question.title = data.title || question.title;
    question.text = data.text || question.text;
    question.timeLimitMs = data.timeLimitMs || question.timeLimitMs;
    question.memoryLimitKb = data.memoryLimitKb || question.memoryLimitKb;

    question.examples = data.examples || question.examples;

    const saved = await this.questionRepository.save(question);

    logger.info('[QUESTION SERVICE] Questão atualizada', {
      questionId: saved.id
    });

    return this.toResponseDTO(saved);
  }

  async finalizeQuestion(id: string, questionListId?: string): Promise<QuestionResponseDTO> {
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
        questionListId
      });




      const finalQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Questão finalizada na transação', {
        questionId: finalQuestion.id,
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
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
    return baseDTO as QuestionResponseDTO;
  }
}
