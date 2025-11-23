import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { PaginatedQuestionResponseDTO } from '../../dtos';
import { QuestionRepository } from '../../repositories';
import { QuestionMapper } from '../../mappers';

export interface GetQuestionsByAuthorInput {
    authorId: string;
    filters?: {
        source?: string;
        tags?: string[];
    };
    page?: number;
    limit?: number;
}

@injectable()
export class GetQuestionsByAuthorUseCase implements IUseCase<GetQuestionsByAuthorInput, PaginatedQuestionResponseDTO> {
    constructor(
        @inject(QuestionRepository) private questionRepository: QuestionRepository
    ) { }

    async execute(input: GetQuestionsByAuthorInput): Promise<PaginatedQuestionResponseDTO> {
        const { authorId, filters, page = 1, limit = 20 } = input;

        const skip = (page - 1) * limit;
        const take = limit;

        const [questions, total] = await this.questionRepository.findByAuthor(
            authorId,
            filters,
            skip,
            take
        );

        return {
            questions: questions.map(question => QuestionMapper.toDTO(question)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
