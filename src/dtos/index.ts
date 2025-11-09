/**
 * Data Transfer Objects (DTOs) Module Exports
 * 
 * Central export point for all DTO classes used throughout the application.
 * DTOs define the structure of request and response payloads.
 * 
 * @module dtos
 */

export {
  UserRegisterDTO,
  UserLoginDTO,
  UserResponseDTO,
  UserGrade,
  UpdateProfileDTO,
  ChangePasswordDTO,
  RequestPasswordResetDTO,
  ResetPasswordDTO,
  RefreshTokenDTO
} from './UserDtos';

export {
  QuestionExampleDTO,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  UpdateCodeforcesFieldsDTO,
  QuestionResponseDTO
} from './QuestionDtos';

export {
  CreateSubmissionDTO,
  SubmissionResponseDTO,
  TestCaseResultDTO,
  SubmissionDetailDTO
} from './SubmissionDtos';

export {
  CreateInviteDTO,
  InviteResponseDTO
} from './InviteDtos';

export {
  CreateClassDTO,
  ClassResponseDTO
} from './ClassDtos';

export {
  CreateTestCaseDTO,
  UpdateTestCaseDTO,
  TestCaseResponseDTO
} from './TestCaseDtos';

export {
  QuestionGroupDTO,
  CreateQuestionListDTO,
  UpdateQuestionListDTO,
  UpdateQuestionListScoringDTO,
  QuestionListResponseDTO
} from './QuestionListDtos';

export {
  CreateGradeDTO,
  UpdateGradeDTO,
  GradeResponseDTO
} from './GradeDtos';

export {
  AllowedIPDTO,
  CreateAllowedIPDTO,
  UpdateAllowedIPDTO
} from './AllowedIPDtos';

