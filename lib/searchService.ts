import { Smithery } from '@smithery/sdk';
import { ModelContextProtocolClient } from '@modelcontextprotocol/sdk';
import { ChatOpenAI } from "@langchain/openai";
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph';
import { config } from './config';
import Neo4jDatabase from './database';
import { scrapeProductInfo } from './scraper';
import { Product } from './types';

// Initialize Smithery with MCP
const smithery = new Smithery();
const exaSearch = smithery.connectTo('exa-search');

// Fallback to direct MCP client if needed
const mcpClient = new ModelContextProtocolClient();

async function initializeNeo4jGraph() {
  try {
    const neo4j = Neo4jDatabase.getInstance();
    const driver = neo4j.getDriver();

    if (!driver) {
      throw new Error('Neo4j driver not initialized');
    }

    // Initialize LangChain Neo4j Graph
    const graph = await Neo4jGraph.initialize({
      url: config.neo4j.uri,
      username: config.neo4j.username,
      password: config.neo4j.password,
    });

    return graph;
  } catch (error) {
    console.error('Failed to initialize Neo4j graph:', error);
    throw error;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // Step 1: Check if we already have this product in our knowledge graph
    const existingProducts = await searchProductsInKnowledgeGraph(query);
    
    if (existingProducts.length > 0) {
      console.log('Found products in knowledge graph:', existingProducts.length);
      return existingProducts;
    }

    // Step 2: If not found, search using Exa Search API
    let urls: string[] = [];
    
    try {
      const searchResults = await exaSearch.search({
        query: `best deals for ${query} product information price comparison`,
        numResults: 10
      });
      
      // Step 3: Extract relevant URLs from search results
      urls = searchResults.results
        .filter(result => !result.url.includes('youtube.com') && !result.url.includes('facebook.com'))
        .map(result => result.url)
        .slice(0, 5); // Limit to first 5 urls
    } catch (error) {
      console.error('Error using Exa Search:', error);
      
      // Fallback to MCP client if Smithery connection fails
      try {
        const mcpResponse = await mcpClient.send({
          server: 'exa-mcp-server',
          method: 'search',
          arguments: {
            query: `best deals for ${query} product information price comparison`,
            numResults: 10
          }
        });
        
        if (mcpResponse && Array.isArray(mcpResponse.results)) {
          urls = mcpResponse.results
            .filter((result: any) => 
              result.url && 
              !result.url.includes('youtube.com') && 
              !result.url.includes('facebook.com')
            )
            .map((result: any) => result.url)
            .slice(0, 5);
        }
      } catch (mcpError) {
        console.error('Error using MCP client:', mcpError);
      }
    }

    // Step 4: Scrape product information from these URLs
    const scrapingPromises = urls.map(url => scrapeProductInfo(url, query));
    const scrapedResults = await Promise.all(scrapingPromises);
    
    // Filter out null results and flatten the array
    const products = scrapedResults
      .filter(result => result !== null && result.length > 0)
      .flat();

    // Step 5: Store these products in our knowledge graph
    if (products.length > 0) {
      await storeProductsInKnowledgeGraph(products, query);
    }

    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

async function searchProductsInKnowledgeGraph(query: string): Promise<Product[]> {
  try {
    const neo4j = Neo4jDatabase.getInstance();
    
    // Split query into keywords
    const keywords = query.toLowerCase().split(/\s+/);
    
    // Create query parts for each keyword
    const whereConditions = keywords.map((keyword, index) => {
      return `toLower(p.name) CONTAINS $keyword${index} OR toLower(p.description) CONTAINS $keyword${index}`;
    }).join(' OR ');
    
    // Create params object
    const params: Record<string, any> = {};
    keywords.forEach((keyword, index) => {
      params[`keyword${index}`] = keyword;
    });

    // Execute Cypher query
    const cypher = `
      MATCH (p:Product)
      WHERE ${whereConditions}
      RETURN p.name as name, 
             p.price as price, 
             p.description as description, 
             p.url as url, 
             p.dealScore as dealScore
      ORDER BY p.dealScore DESC
      LIMIT 10
    `;

    const results = await neo4j.runQuery<Product>(cypher, params);
    return results;
  } catch (error) {
    console.error('Error searching Neo4j:', error);
    return [];
  }
}

async function storeProductsInKnowledgeGraph(products: Product[], query: string): Promise<void> {
  try {
    const neo4j = Neo4jDatabase.getInstance();
    
    // First, let's create/find the search query node
    const queryNode = `
      MERGE (q:Query {text: $queryText})
      RETURN q
    `;
    await neo4j.runQuery(queryNode, { queryText: query });
    
    // Now, store each product and connect to the query
    for (const product of products) {
      const cypher = `
        MERGE (p:Product {url: $url})
        SET p.name = $name,
            p.price = $price,
            p.description = $description,
            p.dealScore = $dealScore,
            p.lastUpdated = timestamp()
        WITH p
        MATCH (q:Query {text: $queryText})
        MERGE (q)-[r:FOUND]->(p)
        RETURN p
      `;
      
      await neo4j.runQuery(cypher, {
        url: product.url,
        name: product.name,
        price: product.price,
        description: product.description,
        dealScore: product.dealScore || 0,
        queryText: query
      });
      
      // Add product features/attributes as separate nodes connected to the product
      if (product.features && product.features.length > 0) {
        for (const feature of product.features) {
          const featureCypher = `
            MATCH (p:Product {url: $url})
            MERGE (f:Feature {name: $featureName})
            MERGE (p)-[r:HAS_FEATURE]->(f)
          `;
          
          await neo4j.runQuery(featureCypher, {
            url: product.url,
            featureName: feature
          });
        }
      }
    }
  } catch (error) {
    console.error('Error storing products in Neo4j:', error);
    throw error;
  }
}
