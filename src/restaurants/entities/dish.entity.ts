import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/eitities/core.entity';
import { Column, Entity, ManyToMany, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Order } from 'src/orders/entities/order.entiry';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@Entity()
@InputType('DishInputType', { isAbstract: true })
@ObjectType()
export class Dish extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  @Length(0, 15)
  name: string;

  @Field(() => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo: string;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field((type) => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];

  @Field((type) => [Order])
  @ManyToMany((type) => Order, (order) => order.items, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  orders: Order[];
}
