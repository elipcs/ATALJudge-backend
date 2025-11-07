/**
 * @module __tests__/repositories
 * @description Base Repository Unit Tests
 */

class BaseRepositoryDemo {
  protected data: any[] = [];
  protected id = 0;

  async save(entity: any) {
    if (entity.id) {
      const index = this.data.findIndex(e => e.id === entity.id);
      if (index !== -1) {
        this.data[index] = entity;
      }
    } else {
      entity.id = `${++this.id}`;
      this.data.push(entity);
    }
    return entity;
  }

  async findById(id: string) {
    return this.data.find(e => e.id === id) || null;
  }

  async findAll() {
    return this.data;
  }

  async delete(id: string) {
    this.data = this.data.filter(e => e.id !== id);
    return true;
  }

  async findByCondition(condition: (e: any) => boolean) {
    return this.data.filter(condition);
  }

  async count() {
    return this.data.length;
  }

  async findPaginated(page: number, limit: number) {
    const start = (page - 1) * limit;
    const data = this.data.slice(start, start + limit);
    const total = this.data.length;
    return { data, total, page, limit };
  }
}

describe('BaseRepository', () => {
  let repo: BaseRepositoryDemo;

  beforeEach(() => {
    repo = new BaseRepositoryDemo();
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should create new entity', async () => {
      const entity = { name: 'Test' };
      const result = await repo.save(entity);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test');
    });

    it('should update existing entity', async () => {
      const entity = { name: 'Original' };
      const saved = await repo.save(entity);
      saved.name = 'Updated';
      const updated = await repo.save(saved);
      expect(updated.name).toBe('Updated');
    });

    it('should assign unique ids', async () => {
      const e1 = await repo.save({ name: 'Entity1' });
      const e2 = await repo.save({ name: 'Entity2' });
      expect(e1.id).not.toEqual(e2.id);
    });
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const entity = await repo.save({ name: 'Test' });
      const found = await repo.findById(entity.id);
      expect(found).toEqual(entity);
    });

    it('should return null when not found', async () => {
      const found = await repo.findById('invalid');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all entities', async () => {
      await repo.save({ name: 'Entity1' });
      await repo.save({ name: 'Entity2' });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no entities', async () => {
      const all = await repo.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      const entity = await repo.save({ name: 'Test' });
      await repo.delete(entity.id);
      const found = await repo.findById(entity.id);
      expect(found).toBeNull();
    });
  });

  describe('findByCondition', () => {
    it('should find entities by condition', async () => {
      await repo.save({ name: 'Entity1', active: true });
      await repo.save({ name: 'Entity2', active: false });
      const active = await repo.findByCondition(e => e.active === true);
      expect(active).toHaveLength(1);
    });
  });

  describe('count', () => {
    it('should count entities', async () => {
      await repo.save({ name: 'Entity1' });
      await repo.save({ name: 'Entity2' });
      const count = await repo.count();
      expect(count).toBe(2);
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.save({ name: `Entity${i}` });
      }
      const result = await repo.findPaginated(1, 2);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should handle second page', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.save({ name: `Entity${i}` });
      }
      const result = await repo.findPaginated(2, 2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(2);
    });
  });
});
