import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/eitities/core.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";
import { Restaurant } from "./restaurant.entity";


@Entity()
@InputType('DishInputType',{isAbstract:true})
@ObjectType()
export class Dish extends CoreEntity {
    @Field(() => String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(() => Int)
    @Column()
    @IsNumber()
    price: string;

    @Field(type => String, { nullable: true })
    @Column({ nullable: true })
    @IsString()
    photo: string;

    @Field(() => String)
    @Column()
    @IsString()
    @Length(5,140)
    description: string;

    @Field(type => Restaurant)
    @ManyToOne(
      type => Restaurant,
      restaurant => restaurant.menu,
      { onDelete: 'CASCADE' },
    )
    restaurant: Restaurant;

    @RelationId((dish: Dish) => dish.restaurant)
    restaurantId: number;
}
