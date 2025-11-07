import { User } from '../models/User';
import { Student } from '../models/Student';
import { UserResponseDTO, UserRegisterDTO, UpdateProfileDTO } from '../dtos/UserDtos';
import { UserRole } from '../enums';

/**
 * Mapper para transformação entre User (Domain) e DTOs
 */
export class UserMapper {
  /**
   * Converte User (Domain) para UserResponseDTO
   */
  static toDTO(user: User): UserResponseDTO {
    const dto: Partial<UserResponseDTO> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    // Adiciona propriedades específicas de Student
    if (user instanceof Student) {
      const student = user as Student;
      dto.studentRegistration = student.studentRegistration;
      
      if (student.class) {
        dto.classId = student.class.id;
        dto.className = student.class.name;
      }
    }

    return new UserResponseDTO(dto);
  }

  /**
   * Converte lista de Users para lista de DTOs
   */
  static toDTOList(users: User[]): UserResponseDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Aplica dados de UserRegisterDTO ao User (Domain)
   * Não cria a instância, apenas aplica os dados
   */
  static applyCreateDTO(user: User, dto: UserRegisterDTO): void {
    user.name = dto.name;
    user.email = dto.email;
    user.role = dto.role || UserRole.STUDENT;
    
    // Se for estudante e tem studentRegistration
    if (user instanceof Student && dto.studentRegistration) {
      user.studentRegistration = dto.studentRegistration;
    }
  }

  /**
   * Aplica dados de UpdateProfileDTO ao User (Domain)
   */
  static applyUpdateDTO(user: User, dto: UpdateProfileDTO): void {
    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    // Aplica propriedades específicas de Student
    if (user instanceof Student && dto.studentRegistration !== undefined) {
      (user as Student).studentRegistration = dto.studentRegistration;
    }
  }

  /**
   * Cria um DTO simplificado (apenas id, name, email)
   * Útil para respostas que não precisam de todos os dados
   */
  static toSimpleDTO(user: User): Pick<UserResponseDTO, 'id' | 'name' | 'email' | 'role'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}

