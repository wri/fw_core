import { Logger } from '@nestjs/common';
import mongoose from 'mongoose';
import { Model } from 'mongoose';

export abstract class BaseService<
  T extends mongoose.Document,
  CreateDTO,
  UpdateDTO extends mongoose.UpdateQuery<T>,
> {
  private readonly logger: Logger;

  constructor(name: string, protected model: Model<T>) {
    this.logger = new Logger(name);
  }

  /**
   * Find a single entity by its ID
   * @param id id to query
   * @returns The entity if found or null otherwise
   */
  async findById(id: string): Promise<T | null> {
    this.logger.log(`Find by id: ${id}`);
    return this.model.findById(id);
  }

  /**
   * Find a list of entities by a filter
   * @param filter the criteria by which to search for entitites
   * @returns The entity list
   */
  async find(filter: mongoose.FilterQuery<T>): Promise<T[]> {
    this.logger.log(`Find by filter: ${JSON.stringify(filter)}`);
    return this.model.find(filter);
  }

  /**
   * Create and add an entity to the DB
   * @param dto The values that are to be added
   * @returns The entity added
   */
  async create(dto: CreateDTO): Promise<T> {
    this.logger.log(`Create with: ${JSON.stringify(dto)}`);
    return this.model.create(dto);
  }

  /**
   * Update the entity by id
   * @param id Id of entity to update
   * @param dto Values to be updated
   * @returns The updated entity if update succeeded or null otherwise
   */
  async update(id: string, dto: UpdateDTO): Promise<T | null> {
    this.logger.log(`Update ${id} with: ${JSON.stringify(dto)}`);
    return this.model.findByIdAndUpdate(id, dto);
  }

  /**
   * Delete the entity by id
   * @param id Id of entity to delete
   * @returns The deleted entity if successful or null otherwise
   */
  async delete(id: string): Promise<T | null> {
    this.logger.log(`Delete ${id}`);
    return this.model.findByIdAndDelete(id);
  }

  /**
   * Count the number of entities in the db that match the criteria
   * @param filter Criteria for entities to be included in count
   * @returns Total numbe rof entitites matching the criteria
   */
  async count(filter: mongoose.FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
