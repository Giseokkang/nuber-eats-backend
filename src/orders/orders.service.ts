import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entiry';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput } from './dtos/create-order';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}
  async createOrder(user: User, createOrderInput: CreateOrderInput) {
    try {
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create a order',
      };
    }
  }
}
