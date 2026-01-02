import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { USER_ROLES } from '../../common/types/user-roles.type';
import * as bcrypt from 'bcrypt';
import { Token } from '../../tokens/entities/token.entity';
import { Slot } from '../../slots/entities/slot.entity';

@Entity('users')
export class User extends BaseTimeEntity {
  @Column('enum', { enum: USER_ROLES })
  role!: USER_ROLES;
  @Column('text', { name: 'first_name' })
  firstName!: string;
  @Column('text', { name: 'last_name' })
  lastName!: string;
  @Column('text', { name: 'email', unique: true })
  email!: string;
  @Column('text')
  password!: string;
  @Column('text', { name: 'phone', unique: true })
  phone!: string;

  @OneToMany(() => Token, (token) => token.user)
  tokens?: Token[];

  @OneToMany(() => Slot, (slot) => slot.user)
  slots?: Slot[];

  async hashPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
