import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const username = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'dealfinderpassword';

async function initializeDatabase() {
  console.log('Connecting to Neo4j database...');
  console.log(`URI: ${uri}`);
  
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
  );

  const session = driver.session();

  try {
    console.log('Creating schema constraints...');
    
    // Create constraints for unique Product URLs
    await session.run(`
      CREATE CONSTRAINT product_url_unique IF NOT EXISTS
      FOR (p:Product) REQUIRE p.url IS UNIQUE
    `);
    
    // Create constraints for unique Query text
    await session.run(`
      CREATE CONSTRAINT query_text_unique IF NOT EXISTS
      FOR (q:Query) REQUIRE q.text IS UNIQUE
    `);
    
    // Create constraints for unique Feature names
    await session.run(`
      CREATE CONSTRAINT feature_name_unique IF NOT EXISTS
      FOR (f:Feature) REQUIRE f.name IS UNIQUE
    `);
    
    // Create constraint for unique Brand name
    await session.run(`
      CREATE CONSTRAINT brand_name_unique IF NOT EXISTS
      FOR (b:Brand) REQUIRE b.name IS UNIQUE
    `);
    
    // Create constraint for unique Category name
    await session.run(`
      CREATE CONSTRAINT category_name_unique IF NOT EXISTS
      FOR (c:Category) REQUIRE c.name IS UNIQUE
    `);

    // Create indices for better performance
    await session.run(`
      CREATE INDEX product_name_index IF NOT EXISTS
      FOR (p:Product) ON (p.name)
    `);
    
    await session.run(`
      CREATE INDEX product_price_index IF NOT EXISTS
      FOR (p:Product) ON (p.price)
    `);
    
    await session.run(`
      CREATE INDEX product_dealscore_index IF NOT EXISTS
      FOR (p:Product) ON (p.dealScore)
    `);

    console.log('Database schema and constraints created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await session.close();
  }

  await driver.close();
}

initializeDatabase()
  .then(() => {
    console.log('Database initialization complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
