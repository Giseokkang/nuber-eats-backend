import { Module } from '@nestjs/common';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entiry';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Order, OrderItem, Dish]),
    CommonModule,
  ],
  providers: [OrdersResolver, OrdersService],
})
export class OrdersModule {}
