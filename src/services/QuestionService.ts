import { QuestionRepository } from '../repositories';
import { CreateQuestionDTO, UpdateQuestionDTO, QuestionResponseDTO } from '../dtos';
import { CreateLocalQuestionDTO } from '../dtos/LocalQuestionDtos';
import { CreateCodeforcesQuestionDTO } from '../dtos/CodeforcesQuestionDtos';
import { Question } from '../models/Question';
import { LocalQuestion } from '../models/LocalQuestion';
import { CodeforcesQuestion } from '../models/CodeforcesQuestion';
import { AppDataSource } from '../config/database';
import { NotFoundError, ValidationError } from '../utils';
import { JudgeType } from '../enums/JudgeType';

export class QuestionService {
  private questionRepository: QuestionRepository;

  constructor(questionRepository: QuestionRepository) {
    this.questionRepository = questionRepository;
  }

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

  async createQuestion(data: CreateQuestionDTO | any, authorId?: string): Promise<QuestionResponseDTO> {
    
    const judgeType = data.judgeType || (data.contestId ? 'codeforces' : 'local');

    if (judgeType === 'codeforces') {
      return this.createCodeforcesQuestion(data, authorId);
    } else {
      return this.createLocalQuestion(data, authorId);
    }
  }

  async createLocalQuestion(data: CreateLocalQuestionDTO, authorId?: string): Promise<QuestionResponseDTO> {
    const repository = AppDataSource.getRepository(LocalQuestion);

    const question = repository.create({
      title: data.title,
      statement: data.statement,
      inputFormat: data.inputFormat || '',
      outputFormat: data.outputFormat || '',
      constraints: data.constraints || '',
      notes: data.notes || '',
      tags: data.tags || [],
      timeLimitMs: data.timeLimitMs,
      memoryLimitKb: data.memoryLimitKb,
      examples: data.examples || [],
      authorId
    });

    await repository.save(question);
    
    return this.toResponseDTO(question);
  }

  async createCodeforcesQuestion(data: CreateCodeforcesQuestionDTO, authorId?: string): Promise<QuestionResponseDTO> {
    const repository = AppDataSource.getRepository(CodeforcesQuestion);

    const question = repository.create({
      title: data.title,
      statement: data.statement,
      inputFormat: data.inputFormat || '',
      outputFormat: data.outputFormat || '',
      constraints: data.constraints || '',
      notes: data.notes || '',
      tags: data.tags || [],
      timeLimitMs: data.timeLimitMs,
      memoryLimitKb: data.memoryLimitKb,
      examples: data.examples || [],
      contestId: data.contestId,
      problemIndex: data.problemIndex,
      codeforcesLink: data.codeforcesLink,
      authorId
    });

    if (!question.codeforcesLink) {
      question.generateCodeforcesLink();
    }

    await repository.save(question);
    
    return this.toResponseDTO(question);
  }

  async updateQuestion(id: string, data: UpdateQuestionDTO | any): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);
    
    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    if (data.title) question.title = data.title;
    if (data.statement) question.statement = data.statement;
    if (data.inputFormat !== undefined) question.inputFormat = data.inputFormat;
    if (data.outputFormat !== undefined) question.outputFormat = data.outputFormat;
    if (data.constraints !== undefined) question.constraints = data.constraints;
    if (data.notes !== undefined) question.notes = data.notes;
    if (data.tags) question.tags = data.tags;
    if (data.timeLimitMs) question.timeLimitMs = data.timeLimitMs;
    if (data.memoryLimitKb) question.memoryLimitKb = data.memoryLimitKb;
    if (data.examples) question.examples = data.examples;

    if (question instanceof CodeforcesQuestion) {
      if (data.contestId) question.contestId = data.contestId;
      if (data.problemIndex) question.problemIndex = data.problemIndex;
      if (data.codeforcesLink !== undefined) question.codeforcesLink = data.codeforcesLink;

      if (data.contestId || data.problemIndex) {
        question.generateCodeforcesLink();
      }
    }

    let savedQuestion: Question;
    if (question instanceof CodeforcesQuestion) {
      savedQuestion = await AppDataSource.getRepository(CodeforcesQuestion).save(question);
    } else if (question instanceof LocalQuestion) {
      savedQuestion = await AppDataSource.getRepository(LocalQuestion).save(question);
    } else {
      throw new ValidationError('Tipo de questão desconhecido', 'INVALID_QUESTION_TYPE');
    }
    
    return this.toResponseDTO(savedQuestion);
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
      updatedAt: question.updatedAt
    };

    if (question instanceof CodeforcesQuestion) {
      baseDTO.judgeType = JudgeType.CODEFORCES;
      baseDTO.codeforcesContestId = question.contestId;
      baseDTO.codeforcesProblemIndex = question.problemIndex;
      baseDTO.codeforcesLink = question.codeforcesLink;
    } else if (question instanceof LocalQuestion) {
      baseDTO.judgeType = JudgeType.LOCAL;
      
    }

    return new QuestionResponseDTO(baseDTO);
  }
}
