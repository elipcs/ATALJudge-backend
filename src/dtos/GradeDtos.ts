/**
 * Grade Data Transfer Objects (DTOs)
 * 
 * Defines request/response data structures for grade management operations.
 * Handles student grades for question lists.
 * 
 * @module dtos/GradeDtos
 */
import { IsUUID, IsOptional } from 'class-validator';
import { IsValidScore } from '../utils/validators';

/**
 * DTO for creating a grade
 * 
 * @class CreateGradeDTO
 */
export class CreateGradeDTO {
  /** UUID of the student being graded */
  @IsUUID()
  studentId!: string;

  /** UUID of the question list */
  @IsUUID()
  questionListId!: string;

  /** Score for the student on this list */
  @IsValidScore()
  score!: number;
}

/**
 * DTO for updating a grade
 * 
 * @class UpdateGradeDTO
 */
export class UpdateGradeDTO {
  /** Updated score (optional) */
  @IsOptional()
  @IsValidScore()
  score?: number;
}

/**
 * DTO for grade response
 * 
 * Contains grade details including associated student and list information.
 * 
 * @class GradeResponseDTO
 */
export class GradeResponseDTO {
  /** Grade identifier */
  id!: string;
  
  /** Student identifier */
  studentId!: string;
  
  /** Question list identifier */
  questionListId!: string;
  
  /** Grade score */
  score!: number;
  
  /** Grade creation timestamp */
  createdAt!: Date;
  
  /** Grade last update timestamp */
  updatedAt!: Date;

  /** Student's name (optional) */
  studentName?: string;
  
  /** Question list title (optional) */
  questionListTitle?: string;

  constructor(partial: Partial<GradeResponseDTO>) {
    Object.assign(this, partial);
  }
}

