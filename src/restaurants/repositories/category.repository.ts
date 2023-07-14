import { Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async getOrCreate(name: string) {
    const categoryName = name.trim().toLocaleLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    let category = await this.findOne({
      where: {
        slug: categorySlug,
      },
    });
    if (!category) {
      category = await this.save(
        this.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
