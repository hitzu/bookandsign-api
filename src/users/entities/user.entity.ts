import { Column, Entity, OneToMany } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import * as bcrypt from 'bcrypt';
import { Token } from '../../tokens/entities/token.entity';
import { USER_ROLE } from '../constants/user_role.enum';
import { USER_STATUS } from '../constants/user_status.enum';
import { Contract } from '../../contracts/entities/contract.entity';

@Entity('users')
export class User extends BaseTimeEntity {
  @Column('enum', { enum: USER_ROLE })
  role!: USER_ROLE;

  @Column('text', { name: 'first_name' })
  firstName!: string;

  @Column('text', { name: 'last_name' })
  lastName!: string;

  @Column('text', { name: 'email', nullable: true })
  email: string | null = null;

  @Column('text')
  password!: string;

  @Column('text', { name: 'phone', nullable: true })
  phone: string | null = null;

  @Column('enum', { enum: USER_STATUS, default: USER_STATUS.ACTIVE })
  status: USER_STATUS = USER_STATUS.ACTIVE;

  @OneToMany(() => Token, (token) => token.user)
  tokens?: Token[];

  @OneToMany(() => Contract, (contract) => contract.user)
  contracts?: Contract[];

  async hashPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
