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
  ) {}

  async getAllQuestions(): Promise<QuestionResponseDTO[]> {
    const questions = await this.questionRepository.findAll();
    return questions.map(q => this.toResponseDTO(q));
  }

  async getQuestionById(id: string): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);
    
    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }
    
    return this.toResponseDTO(question);
  }

  async createQuestion(data: CreateQuestionDTO | any, authorId?: string, listId?: string): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] createQuestion chamado', {
      title: data.title,
      authorId,
      listId,
      submissionType: data.submissionType
    });

    const submissionType: SubmissionType = data.submissionType || (data.contestId ? 'codeforces' : 'local');

    if (!data.submissionType) {
      return await this.createBasicQuestion(data, authorId, listId, submissionType);
    }

    if (!listId) {
      return this.createQuestionDirect(data, authorId, submissionType);
    }

    return await this.createQuestionAndAddToList(data, authorId, listId, submissionType);
  }

  private async createBasicQuestion(
    data: any, 
    authorId?: string, 
    listId?: string,
    submissionType: SubmissionType = 'local'
  ): Promise<QuestionResponseDTO> {
    logger.debug('[QUESTION SERVICE] Criando questão básica (sem tipo definido)', {
      title: data.title,
      authorId,
      listId,
      submissionType
    });

    if (!listId) {
      const question = new Question();
      question.title = data.title;
      question.statement = data.statement;
      question.inputFormat = data.inputFormat || '';
      question.outputFormat = data.outputFormat || '';
      question.constraints = data.constraints || '';
      question.notes = data.notes || '';
      question.tags = data.tags || [];
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;

      const saved = await this.questionRepository.save(question);
      
      logger.info('[QUESTION SERVICE] Questão básica criada', {
        questionId: saved.id,
        title: saved.title,
        authorId: saved.authorId,
        submissionType: saved.submissionType
      });

      return this.toResponseDTO(saved);
    }

    return await this.createBasicQuestionAndAddToList(data, authorId, listId, submissionType);
  }

  private async createBasicQuestionAndAddToList(
    data: any, 
    authorId: string | undefined, 
    listId: string,
    submissionType: SubmissionType = 'local'
  ): Promise<QuestionResponseDTO> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      logger.debug('[QUESTION SERVICE] Iniciando transação para criar questão básica e adicionar à lista', {
        title: data.title,
        listId,
        submissionType
      });

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const question = new Question();
      question.title = data.title;
      question.statement = data.statement;
      question.inputFormat = data.inputFormat || '';
      question.outputFormat = data.outputFormat || '';
      question.constraints = data.constraints || '';
      question.notes = data.notes || '';
      question.tags = data.tags || [];
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;

      const savedQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Questão básica criada na transação', {
        questionId: savedQuestion.id,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      const list = await queryRunner.manager.findOne(QuestionList, {
        where: { id: listId }
      });

      if (!list) {
        throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
      }

      logger.debug('[QUESTION SERVICE] Lista encontrada, adicionando questão', {
        listId,
        questionId: savedQuestion.id
      });

      await queryRunner.manager.query(
        `INSERT INTO question_list_questions (list_id, question_id) VALUES ($1, $2)
         ON CONFLICT (list_id, question_id) DO NOTHING`,
        [listId, savedQuestion.id]
      );

      logger.debug('[QUESTION SERVICE] Questão adicionada ao relacionamento', {
        listId,
        questionId: savedQuestion.id
      });

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Transação concluída com sucesso para questão básica', {
        questionId: savedQuestion.id,
        listId,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      return this.toResponseDTO(savedQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Erro na transação de questão básica, revertendo', {
        title: data.title,
        listId,
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
    logger.debug('[QUESTION SERVICE] Criando questão completa', {
      title: data.title,
      submissionType
    });

    const question = new Question();
    question.title = data.title;
    question.statement = data.statement;
    question.inputFormat = data.inputFormat || '';
    question.outputFormat = data.outputFormat || '';
    question.constraints = data.constraints || '';
    question.notes = data.notes || '';
    question.tags = data.tags || [];
    question.timeLimitMs = data.timeLimitMs || 1000;
    question.memoryLimitKb = data.memoryLimitKb || 64000;
    question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
    question.examples = data.examples || [];
    question.authorId = authorId;
    question.submissionType = submissionType;

    if (submissionType === 'codeforces') {
      question.contestId = data.contestId;
      question.problemIndex = data.problemIndex;
      question.generateCodeforcesLink();
    }

    const saved = await this.questionRepository.save(question);

    logger.info('[QUESTION SERVICE] Questão completa criada', {
      questionId: saved.id,
      title: saved.title,
      submissionType: saved.submissionType
    });

    return this.toResponseDTO(saved);
  }

  private async createQuestionAndAddToList(
    data: CreateQuestionDTO | any,
    authorId: string | undefined,
    listId: string,
    submissionType: SubmissionType
  ): Promise<QuestionResponseDTO> {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      logger.debug('[QUESTION SERVICE] Iniciando transação para criar questão e adicionar à lista', {
        title: data.title,
        listId,
        submissionType
      });

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const question = new Question();
      question.title = data.title;
      question.statement = data.statement;
      question.inputFormat = data.inputFormat || '';
      question.outputFormat = data.outputFormat || '';
      question.constraints = data.constraints || '';
      question.notes = data.notes || '';
      question.tags = data.tags || [];
      question.timeLimitMs = data.timeLimitMs || 1000;
      question.memoryLimitKb = data.memoryLimitKb || 64000;
      question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
      question.examples = data.examples || [];
      question.authorId = authorId;
      question.submissionType = submissionType;

      if (submissionType === 'codeforces') {
        question.contestId = data.contestId;
        question.problemIndex = data.problemIndex;
        question.generateCodeforcesLink();
      }

      const savedQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Questão criada na transação', {
        questionId: savedQuestion.id,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      const list = await queryRunner.manager.findOne(QuestionList, {
        where: { id: listId }
      });

      if (!list) {
        throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
      }

      logger.debug('[QUESTION SERVICE] Lista encontrada, adicionando questão', {
        listId,
        questionId: savedQuestion.id
      });

      await queryRunner.manager.query(
        `INSERT INTO question_list_questions (list_id, question_id) VALUES ($1, $2)
         ON CONFLICT (list_id, question_id) DO NOTHING`,
        [listId, savedQuestion.id]
      );

      logger.debug('[QUESTION SERVICE] Questão adicionada ao relacionamento', {
        listId,
        questionId: savedQuestion.id
      });

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Transação concluída com sucesso', {
        questionId: savedQuestion.id,
        listId,
        title: savedQuestion.title,
        submissionType: savedQuestion.submissionType
      });

      return this.toResponseDTO(savedQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Erro na transação, revertendo', {
        title: data.title,
        listId,
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
    question.statement = data.statement || question.statement;
    question.inputFormat = data.inputFormat !== undefined ? data.inputFormat : question.inputFormat;
    question.outputFormat = data.outputFormat !== undefined ? data.outputFormat : question.outputFormat;
    question.constraints = data.constraints !== undefined ? data.constraints : question.constraints;
    question.notes = data.notes !== undefined ? data.notes : question.notes;
    question.tags = data.tags || question.tags;
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

  async finalizeQuestion(id: string, data: any, listId?: string): Promise<QuestionResponseDTO> {
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
        listId
      });

      question.submissionType = data.submissionType || question.submissionType;

      if (question.submissionType === 'codeforces') {
        question.contestId = data.contestId;
        question.problemIndex = data.problemIndex;
        question.generateCodeforcesLink();
      }

      if (data.wallTimeLimitSeconds) {
        question.wallTimeLimitSeconds = data.wallTimeLimitSeconds;
      }

      const finalQuestion = await queryRunner.manager.save(question);

      logger.debug('[QUESTION SERVICE] Questão finalizada na transação', {
        questionId: finalQuestion.id,
        submissionType: finalQuestion.submissionType
      });

      if (listId) {
        const list = await queryRunner.manager.findOne(QuestionList, {
          where: { id: listId }
        });

        if (!list) {
          throw new NotFoundError('Lista não encontrada', 'LIST_NOT_FOUND');
        }

        logger.debug('[QUESTION SERVICE] Lista encontrada, adicionando questão à lista', {
          listId,
          questionId: finalQuestion.id
        });

        await queryRunner.manager.query(
          `INSERT INTO question_list_questions (list_id, question_id) VALUES ($1, $2)
           ON CONFLICT (list_id, question_id) DO NOTHING`,
          [listId, finalQuestion.id]
        );

        logger.debug('[QUESTION SERVICE] Questão adicionada ao relacionamento', {
          listId,
          questionId: finalQuestion.id
        });
      }

      await queryRunner.commitTransaction();

      logger.info('[QUESTION SERVICE] Questão finalizada com sucesso', {
        questionId: finalQuestion.id,
        listId,
        submissionType: finalQuestion.submissionType,
        title: finalQuestion.title
      });

      return this.toResponseDTO(finalQuestion);
    } catch (error) {
      logger.error('[QUESTION SERVICE] Erro na transação de finalização, revertendo', {
        questionId: id,
        listId,
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
      statement: question.statement,
      inputFormat: question.inputFormat,
      outputFormat: question.outputFormat,
      constraints: question.constraints,
      notes: question.notes,
      tags: question.tags,
      timeLimitMs: question.timeLimitMs,
      memoryLimitKb: question.memoryLimitKb,
      examples: question.examples,
      authorId: question.authorId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      submissionType: question.submissionType
    };

    if (question.isCodeforces()) {
      baseDTO.judgeType = JudgeType.CODEFORCES;
      baseDTO.codeforcesContestId = question.contestId;
      baseDTO.codeforcesProblemIndex = question.problemIndex;
      baseDTO.codeforcesLink = question.codeforcesLink;
    } else {
      baseDTO.judgeType = JudgeType.LOCAL;
    }

    return baseDTO as QuestionResponseDTO;
  }
}
