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

/**
 * Service para gerenciamento de questões
 */
export class QuestionService {
  private questionRepository: QuestionRepository;

  constructor(questionRepository: QuestionRepository) {
    this.questionRepository = questionRepository;
  }

  /**
   * Lista todas as questões
   */
  async getAllQuestions(): Promise<QuestionResponseDTO[]> {
    const questions = await this.questionRepository.findAll();
    
    return questions.map(q => this.toResponseDTO(q));
  }

  /**
   * Busca questão por ID
   */
  async getQuestionById(id: string): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);
    
    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }
    
    return this.toResponseDTO(question);
  }

  /**
   * Cria uma questão (detecta tipo automaticamente)
   */
  async createQuestion(data: CreateQuestionDTO | any, authorId?: string): Promise<QuestionResponseDTO> {
    // Detectar tipo de questão baseado nos campos
    const judgeType = data.judgeType || (data.contestId ? 'codeforces' : 'local');

    if (judgeType === 'codeforces') {
      return this.createCodeforcesQuestion(data, authorId);
    } else {
      return this.createLocalQuestion(data, authorId);
    }
  }

  /**
   * Cria uma questão local
   */
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

  /**
   * Cria uma questão do Codeforces
   */
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

    // Gerar link automaticamente se não fornecido
    if (!question.codeforcesLink) {
      question.generateCodeforcesLink();
    }

    await repository.save(question);
    
    return this.toResponseDTO(question);
  }

  /**
   * Atualiza uma questão
   */
  async updateQuestion(id: string, data: UpdateQuestionDTO | any): Promise<QuestionResponseDTO> {
    const question = await this.questionRepository.findById(id);
    
    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }

    // Atualizar campos comuns
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

    // Se for CodeforcesQuestion, atualizar campos específicos
    if (question instanceof CodeforcesQuestion) {
      if (data.contestId) question.contestId = data.contestId;
      if (data.problemIndex) question.problemIndex = data.problemIndex;
      if (data.codeforcesLink !== undefined) question.codeforcesLink = data.codeforcesLink;
      
      // Regenerar link se contestId ou problemIndex mudaram
      if (data.contestId || data.problemIndex) {
        question.generateCodeforcesLink();
      }
    }

    // Salvar usando o repositório apropriado
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

  /**
   * Deleta uma questão
   */
  async deleteQuestion(id: string): Promise<void> {
    const question = await this.questionRepository.findById(id);
    
    if (!question) {
      throw new NotFoundError('Questão não encontrada', 'QUESTION_NOT_FOUND');
    }
    
    await this.questionRepository.delete(id);
  }

  /**
   * Converte entidade para DTO de resposta
   */
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

    // Adicionar campos específicos baseado no tipo
    if (question instanceof CodeforcesQuestion) {
      baseDTO.judgeType = JudgeType.CODEFORCES;
      baseDTO.codeforcesContestId = question.contestId;
      baseDTO.codeforcesProblemIndex = question.problemIndex;
      baseDTO.codeforcesLink = question.codeforcesLink;
    } else if (question instanceof LocalQuestion) {
      baseDTO.judgeType = JudgeType.LOCAL;
      // Test cases seriam carregados separadamente se necessário
    }

    return new QuestionResponseDTO(baseDTO);
  }
}
