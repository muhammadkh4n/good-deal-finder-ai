import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const username = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'dealfinderpassword';

async function testConnection() {
  console.log('Testing Neo4j connection...');
  console.log(`URI: ${uri}`);
  console.log(`Username: ${username}`);
  
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password)
  );

  const session = driver.session();

  try {
    const result = await session.run('RETURN "Connection successful" AS message');
    const message = result.records[0].get('message');
    console.log(`\n✅ ${message}`);
    
    // Get Neo4j version
    const versionResult = await session.run('CALL dbms.components() YIELD name, versions RETURN name, versions');
    const name = versionResult.records[0].get('name');
    const versions = versionResult.records[0].get('versions')[0];
    console.log(`Connected to ${name} version ${versions}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await session.close();
  }

  await driver.close();
}

testConnection()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
