import { CoreOutput } from './../../common/dtos/output.dto';
import { Restaurant } from './../entities/restaurant.entity';
import { InputType, OmitType, ObjectType } from '@nestjs/graphql';

@InputType()
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  InputType,
) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
