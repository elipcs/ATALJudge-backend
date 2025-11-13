import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ClassResponseDTO } from '../../dtos';
import { ClassRepository } from '../../repositories';
import { ClassMapper } from '../../mappers';

export interface GetAllClassesInput {
  includeRelations?: boolean;
}

@injectable()
export class GetAllClassesUseCase implements IUseCase<GetAllClassesInput, ClassResponseDTO[]> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: GetAllClassesInput): Promise<ClassResponseDTO[]> {
    const { includeRelations = false } = input;

    const classes = includeRelations
      ? await this.classRepository.findAllWithRelations(true, true) // includeStudents: true, includeProfessor: true
      : await this.classRepository.findAll();

    return classes.map(c => ClassMapper.toDTO(c));
  }
}
