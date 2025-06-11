# Good Deal Finder AI

An AI-powered application that searches for product deals across the web, stores the information in a Neo4j knowledge graph, and provides intelligent answers to product-related questions.

## Features

- Search for any product (not just mini PCs)
- Web scraping for product information 
- Neo4j knowledge graph storage
- AI-powered analysis using LangChain and LLMs
- Modern Next.js frontend

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Backend**: Next.js API routes (Node.js)
- **Database**: Neo4j (Graph Database)
- **AI/Search**: 
  - LangChain.js for AI workflows
  - OpenAI for natural language processing
  - Exa Search MCP for web searching
  - Smithery for MCP server integration
- **Web Scraping**: Puppeteer, Cheerio, Axios

## Getting Started

### Prerequisites

- Node.js 16+
- Neo4j Database (local or cloud instance)
- API keys for OpenAI, Exa Search, and Smithery

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/good-deal-finder-ai.git
   cd good-deal-finder-ai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Copy `.env.local.example` to `.env.local` and fill in your API keys and configuration

4. Start the Neo4j database using Docker
   ```
   npm run docker:up
   ```

5. Initialize the database schema
   ```
   npm run db:init
   ```

6. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## How It Works

1. User enters a product search query
2. Application searches Neo4j knowledge graph for existing products
3. If not found, it uses Exa Search to find relevant web pages
4. Web scraping extracts product information
5. LangChain.js processes the information and stores it in Neo4j
6. The application returns structured product data to the user
7. Users can ask follow-up questions about the products

## Knowledge Graph Schema

The application uses Neo4j to store product information in a graph structure:

- **Nodes**:
  - `Product`: Represents a product with properties like name, price, description
  - `Feature`: Product features
  - `Brand`: Product manufacturers
  - `Query`: Search queries that led to the product

- **Relationships**:
  - `(Query)-[FOUND]->(Product)`: Connects queries to products
  - `(Product)-[HAS_FEATURE]->(Feature)`: Connects products to their features
  - `(Product)-[MADE_BY]->(Brand)`: Connects products to manufacturers

## Environment Variables

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=dealfinderpassword
OPENAI_API_KEY=your_openai_key_here
SMITHERY_API_KEY=your_smithery_key_here
EXA_API_KEY=your_exa_key_here
MCP_API_KEY=your_mcp_key_here
```

## Docker Commands

- **Start the database**: `npm run docker:up`
- **Stop the database**: `npm run docker:down`
- **View database logs**: `npm run docker:logs`

## Neo4j Browser

Access the Neo4j Browser UI at http://localhost:7474. Use the following credentials:

- Username: `neo4j`
- Password: `dealfinderpassword`

## License

MIT
