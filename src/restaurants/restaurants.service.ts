import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishs: Repository<Dish>,
    private readonly categories: CategoryRepository,
  ) {}

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: {
          id: restaurantId,
        },
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find restaurant',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const PAGE_LIMIT = 25;
      const [restaurants, totalCounts] = await this.restaurants.findAndCount({
        take: PAGE_LIMIT,
        skip: (1 - page) * PAGE_LIMIT,
      });
      return {
        ok: true,
        results: restaurants,
        totalCounts,
        totalPages: Math.ceil(totalCounts / PAGE_LIMIT),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load restaurants',
      };
    }
  }

  async searchRestaurantByName({
    page,
    query,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const PAGE_LIMIT = 25;
      const [restaurants, totalCounts] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        take: PAGE_LIMIT,
        skip: (1 - page) * PAGE_LIMIT,
      });
      return {
        ok: true,
        totalCounts,
        restaurants,
        totalPages: Math.ceil(totalCounts / PAGE_LIMIT),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not search for restaurants',
      };
    }
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      console.log('error', error);
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      editRestaurantInput;
      const restaurant = await this.restaurants.findOne({
        where: {
          owner: {
            id: owner.id,
          },
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'unauthorized',
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      console.log('error', error);
      return {
        ok: false,
        error: 'Could not edit restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOneOrFail({
        where: {
          id: restaurantId,
        },
      });
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'unauthorized',
        };
      }
      await this.restaurants.delete(restaurantId);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'could not delete restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  countRestaurants(category: Category): Promise<number> {
    return this.restaurants.count({
      where: {
        category: {
          id: category.id,
        },
      },
    });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    const PAGE_LIMIT = 25;
    try {
      const category = await this.categories.findOne({
        where: {
          slug,
        },
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      const restaurants = await this.restaurants.find({
        where: {
          category: {
            slug,
          },
        },
        take: PAGE_LIMIT,
        skip: (1 - page) * PAGE_LIMIT,
      });

      const totalResults = await this.countRestaurants(category);
      return {
        ok: true,
        category,
        restaurants,
        totalPages: Math.ceil(totalResults / PAGE_LIMIT),
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load category',
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const { error, restaurant } = await this.findRestaurantById({
        restaurantId: createDishInput.restaurantId,
      });
      if (!restaurant) {
        return {
          ok: false,
          error,
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'unauthorized',
        };
      }

      await this.dishs.save(
        this.dishs.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create a dish',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishs.findOne({
        where: {
          id: editDishInput.dishId,
        },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'Not Found',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'unauthorized',
        };
      }

      await this.dishs.save([
        {
          id: dish.id,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit a dish',
      };
    }
  }

  async deleteDish(
    owner: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishs.findOne({
        where: {
          id: deleteDishInput.dishId,
        },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'Not Found',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'unauthorized',
        };
      }

      await this.dishs.delete(dish.id);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not edit a dish',
      };
    }
  }
}
