import { ChildEntity } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';

@ChildEntity(UserRole.ASSISTANT)
export class Assistant extends User {

}

