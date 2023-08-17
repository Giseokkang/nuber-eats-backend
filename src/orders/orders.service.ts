import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entiry';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput } from './dtos/create-order';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}
  async createOrder(user: User, { restaurantId, items }: CreateOrderInput) {
    try {
      const restaurant = await this.restaurants.findOne({
        where: {
          id: restaurantId,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
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
