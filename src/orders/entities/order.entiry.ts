import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/eitities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { OrderItem } from '../dtos/order-item';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  customer?: User;

  @Field((type) => String)
  @ManyToOne((type) => User, (user) => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  driver?: User;

  @Field((type) => String)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  restaurant: Restaurant;

  @Field((type) => String)
  @ManyToMany((type) => Dish, (dish) => dish.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  items: OrderItem[];

  @Column({ nullable: true })
  @Field((type) => Int, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ type: 'enum', enum: OrderStatus })
  @Field((type) => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
