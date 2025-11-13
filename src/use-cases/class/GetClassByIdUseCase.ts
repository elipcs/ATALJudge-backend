import { injectable, inject } from 'tsyringe';
import { IUseCase } from '../interfaces/IUseCase';
import { ClassResponseDTO } from '../../dtos';
import { ClassRepository } from '../../repositories';
import { NotFoundError } from '../../utils';
import { ClassMapper } from '../../mappers';

export interface GetClassByIdInput {
  classId: string;
  includeRelations?: boolean;
}

@injectable()
export class GetClassByIdUseCase implements IUseCase<GetClassByIdInput, ClassResponseDTO> {
  constructor(
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}

  async execute(input: GetClassByIdInput): Promise<ClassResponseDTO> {
    const { classId, includeRelations = false } = input;

    const classEntity = includeRelations
      ? await this.classRepository.findByIdWithRelations(classId, true, true) // includeStudents: true, includeProfessor: true
      : await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    }

    return ClassMapper.toDTO(classEntity);
  }
}
