import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const DEFAULT_COLLECTIONS: Record<string, AnyRecord[]> = {
  users: [],
  notebooks: [],
  leaves: [],
  flashcards: [],
  studySessions: [],
};

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dbPath: string;
  private inMemoryDb: Record<string, AnyRecord[]> | null = null;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'db.json');
  }

  async onModuleInit() {
    await this.loadDb();
  }

  private async loadDb(): Promise<Record<string, AnyRecord[]>> {
    if (this.inMemoryDb) return this.inMemoryDb;
    try {
      const content = await fs.readFile(this.dbPath, 'utf8');
      this.inMemoryDb = JSON.parse(content) as Record<string, AnyRecord[]>;

      for (const [key, defaultValue] of Object.entries(DEFAULT_COLLECTIONS)) {
        if (!this.inMemoryDb[key]) {
          this.inMemoryDb[key] = defaultValue as Record<string, unknown>[];
        }
      }
    } catch {
      this.inMemoryDb = { ...DEFAULT_COLLECTIONS };
      await this.saveDb();
    }
    return this.inMemoryDb;
  }

  private async saveDb(): Promise<void> {
    if (!this.inMemoryDb) return;
    await fs.writeFile(
      this.dbPath,
      JSON.stringify(this.inMemoryDb, null, 2),
      'utf8',
    );
  }

  async get<T = AnyRecord>(collection: string): Promise<T[]> {
    const data = await this.loadDb();
    return (data[collection] || []) as T[];
  }

  async save<T = AnyRecord>(
    collection: string,
    items: T[],
  ): Promise<void> {
    const data = await this.loadDb();
    data[collection] = items as AnyRecord[];
    await this.saveDb();
  }

  async insert<T = AnyRecord>(
    collection: string,
    item: T,
  ): Promise<T> {
    const data = await this.loadDb();
    if (!data[collection]) data[collection] = [];
    data[collection].push(item as AnyRecord);
    await this.saveDb();
    return item;
  }

  async update<T = AnyRecord>(
    collection: string,
    id: string,
    updates: Partial<T>,
  ): Promise<T | null> {
    const data = await this.loadDb();
    const items = (data[collection] || []) as AnyRecord[];
    const index = items.findIndex((item: AnyRecord) => item.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.saveDb();
    return items[index] as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const data = await this.loadDb();
    const items = (data[collection] || []) as AnyRecord[];
    data[collection] = items.filter((item: AnyRecord) => item.id !== id);
    await this.saveDb();
    return true;
  }
}
