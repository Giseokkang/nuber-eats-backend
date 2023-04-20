import { v4 as uuidv4 } from 'uuid';
import { CoreEntity } from 'src/common/eitities/core.entity';
import { Entity, Column, OneToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field((type) => String)
  code: string;

  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuidv4();
  }
}
