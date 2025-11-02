import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AllowedIPDTO {
  id!: string;
  ip!: string;
  description!: string;
  active!: boolean;
  createdAt!: string;

  constructor(data: any) {
    this.id = data.id;
    this.ip = data.ip;
    this.description = data.description;
    this.active = data.active;
    this.createdAt = data.createdAt instanceof Date 
      ? data.createdAt.toISOString() 
      : data.createdAt;
  }
}

export class CreateAllowedIPDTO {
  @IsString({ message: 'IP deve ser uma string' })
  ip!: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  description!: string;
}

export class UpdateAllowedIPDTO {
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  active?: boolean;
}
