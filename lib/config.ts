export const config = {
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  },
  langchain: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  scraping: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    requestDelay: 1000, // ms between requests to avoid rate limiting
    maxConcurrentRequests: 5,
  },
  braveSearch: {
    apiKey: process.env.BRAVE_SEARCH_API_KEY,
  },
  exaSearch: {
    apiKey: process.env.EXA_API_KEY,
  },
  smithery: {
    apiKey: process.env.SMITHERY_API_KEY,
  },
  mcp: {
    apiKey: process.env.MCP_API_KEY,
  }
}
