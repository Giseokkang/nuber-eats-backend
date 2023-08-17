import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Order } from './entities/order.entiry';
import { OrdersService } from './orders.service';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order';

@Resolver((of) => Order)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Mutation((type) => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() user: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ) {
    return this.ordersService.createOrder(user, createOrderInput);
  }
}
