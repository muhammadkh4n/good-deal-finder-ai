import neo4j from 'neo4j-driver';
import { config } from './config';

// Singleton to manage Neo4j driver
class Neo4jDatabase {
  private static instance: Neo4jDatabase;
  private driver: neo4j.Driver | null = null;

  private constructor() {
    this.initDriver();
  }

  private initDriver(): void {
    try {
      this.driver = neo4j.driver(
        config.neo4j.uri,
        neo4j.auth.basic(config.neo4j.username, config.neo4j.password)
      );
    } catch (error) {
      console.error('Failed to create Neo4j driver:', error);
      this.driver = null;
    }
  }

  public static getInstance(): Neo4jDatabase {
    if (!Neo4jDatabase.instance) {
      Neo4jDatabase.instance = new Neo4jDatabase();
    }
    return Neo4jDatabase.instance;
  }

  public getDriver(): neo4j.Driver | null {
    return this.driver;
  }

  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  public async runQuery<T>(cypher: string, params: Record<string, any> = {}): Promise<T[]> {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized');
    }

    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = this.parseNeo4jValue(record.get(key));
        });
        return obj as T;
      });
    } finally {
      await session.close();
    }
  }

  private parseNeo4jValue(value: any): any {
    if (neo4j.isInt(value)) {
      return value.toNumber();
    } else if (Array.isArray(value)) {
      return value.map(v => this.parseNeo4jValue(v));
    } else if (typeof value === 'object' && value !== null) {
      if (value.constructor && value.constructor.name === 'Node') {
        const node: any = { id: value.identity.toNumber() };
        Object.entries(value.properties).forEach(([key, prop]) => {
          node[key] = this.parseNeo4jValue(prop);
        });
        return node;
      } else if (value.constructor && value.constructor.name === 'Relationship') {
        const rel: any = {
          id: value.identity.toNumber(),
          type: value.type,
          start: value.start.toNumber(),
          end: value.end.toNumber(),
        };
        Object.entries(value.properties).forEach(([key, prop]) => {
          rel[key] = this.parseNeo4jValue(prop);
        });
        return rel;
      } else {
        const obj: any = {};
        Object.entries(value).forEach(([key, val]) => {
          obj[key] = this.parseNeo4jValue(val);
        });
        return obj;
      }
    }
    return value;
  }
}

export default Neo4jDatabase;
