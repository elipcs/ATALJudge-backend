import { injectable, inject } from 'tsyringe';
import { UserRepository, ClassRepository } from '../repositories';
import { TokenManager, JwtPayload } from '../utils/TokenManager';
import { UserRegisterDTO, UserResponseDTO, InviteResponseDTO } from '../dtos';
import { RefreshTokenService } from './RefreshTokenService';
import { InviteService } from './InviteService';
import { config } from '../config';
import { UserRole } from '../enums/UserRole';
import { logger, ConflictError } from '../utils';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Professor } from '../models/Professor';


@injectable()
export class UserRegistrationService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @inject(InviteService) private inviteService: InviteService,
    @inject(ClassRepository) private classRepository: ClassRepository
  ) {}


  async registerWithInvite(dto: UserRegisterDTO): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictError('Email já está em uso', 'EMAIL_IN_USE');
    }

    let inviteData: InviteResponseDTO | null = null;
    let targetClassId: string | undefined = dto.classId;

    if (dto.inviteToken) {
      inviteData = await this.inviteService.validateInvite(dto.inviteToken);
      targetClassId = inviteData.classId;
    }

    const userRole = dto.role || UserRole.STUDENT;

    let user: User;
    
    if (userRole === UserRole.STUDENT) {
      const student = new Student();
      student.studentRegistration = dto.studentRegistration;
      user = student;
    } else if (userRole === UserRole.PROFESSOR) {
      user = new Professor();
    } else {
      user = new User();
    }

    user.name = dto.name;
    user.email = dto.email;
    user.role = userRole;
    await user.setPassword(dto.password);

    const savedUser = await this.userRepository.create(user);
    logger.info('[REGISTRATION] Usuário registrado', { userId: savedUser.id, role: savedUser.role });

    if (dto.inviteToken) {
      await this.inviteService.useInvite(dto.inviteToken);
    }

    if (userRole === UserRole.STUDENT && targetClassId) {
      try {
        await this.classRepository.addStudent(targetClassId, savedUser.id);
        logger.info('[REGISTRATION] Estudante adicionado à turma', { 
          userId: savedUser.id, 
          classId: targetClassId 
        });
      } catch (error) {
        logger.error('[REGISTRATION] Falha ao adicionar estudante à turma', { 
          error, 
          userId: savedUser.id, 
          classId: targetClassId 
        });
      }
    }

    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    };

    const { accessToken, refreshToken } = TokenManager.generateTokenPair(payload);

    await this.refreshTokenService.saveRefreshToken(
      savedUser.id,
      refreshToken,
      config.jwt.refreshExpires
    );

    await this.refreshTokenService.enforceTokenLimit(savedUser.id, 5);

    return {
      user: new UserResponseDTO(savedUser),
      accessToken,
      refreshToken
    };
  }
}
