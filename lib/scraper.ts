import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Product } from './types';
import { config } from './config';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Initialize OpenAI for product extraction
const openai = new ChatOpenAI({
  openAIApiKey: config.langchain.openaiApiKey,
  temperature: 0.2,
  modelName: 'gpt-4-turbo'
});

/**
 * Extract product information from a webpage
 * @param url URL of the product page
 * @param query Original search query
 */
export async function scrapeProductInfo(url: string, query: string): Promise<Product[]> {
  try {
    console.log(`Scraping product info from: ${url}`);
    
    // Get HTML content
    const html = await getPageContent(url);
    if (!html) return [];
    
    // Extract product information using LLM
    const products = await extractProductsWithLLM(html, url, query);
    return products;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

/**
 * Get HTML content from a URL
 */
async function getPageContent(url: string): Promise<string | null> {
  try {
    // Try with Axios first (faster)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': config.scraping.userAgent
      },
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    // Fallback to Puppeteer for JavaScript-heavy sites
    console.log(`Falling back to Puppeteer for ${url}`);
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(config.scraping.userAgent);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = await page.content();
      await browser.close();
      
      return content;
    } catch (puppeteerError) {
      console.error(`Puppeteer error for ${url}:`, puppeteerError);
      return null;
    }
  }
}

/**
 * Use LLM to extract structured product information from HTML
 */
async function extractProductsWithLLM(html: string, url: string, query: string): Promise<Product[]> {
  // Keep only a subset of the HTML to avoid token limits
  const $ = cheerio.load(html);
  
  // Remove unnecessary elements
  $('script, style, nav, footer, iframe, noscript').remove();
  
  // Get main content areas that likely contain product info
  const mainContent = $('#main, #content, .product, .products, main, article').html() || '';
  
  // If main content is not found or too short, get the body content
  const content = mainContent.length > 500 ? mainContent : $('body').html() || '';
  
  // Truncate to avoid token limits (first 15000 chars should be enough for most product pages)
  const truncatedHtml = content.substring(0, 15000);
  
  try {
    const prompt = `
      You are a product information extraction expert. Extract product information from the HTML.
      Focus on products related to the query: "${query}".
      Return a JSON array of products, each with the following fields:
      - name: Name of the product
      - price: Price (as string, include currency)
      - description: Brief description
      - url: Product URL (use the provided URL if direct product links not found)
      - imageUrl: URL of the product image (if found, otherwise null)
      - features: Array of key product features
      - dealScore: Number between 0-100 rating how good of a deal this is
      - specs: Object with key specs as properties
      - brand: Brand name if available
      - category: Product category

      Only include products that are relevant to the query.
      If no products are found, return an empty array.
      
      The query is: ${query}
      The URL is: ${url}
      
      HTML Content:
      ${truncatedHtml}
      
      Extract the product information and respond ONLY with the JSON array.
    `;
    
    const outputParser = new StringOutputParser();
    const chain = openai.pipe(outputParser);
    
    const response = await chain.invoke(prompt);
    
    // Extract JSON from the response (the LLM might wrap it in markdown code blocks)
    const jsonMatch = response.match(/```json([\s\S]*?)```/) || 
                      response.match(/```([\s\S]*?)```/) || 
                      [null, response];
                      
    const jsonStr = jsonMatch[1] ? jsonMatch[1].trim() : response.trim();
    
    try {
      const products = JSON.parse(jsonStr);
      return Array.isArray(products) ? products : [];
    } catch (jsonError) {
      console.error('Error parsing LLM response as JSON:', jsonError);
      return [];
    }
    
  } catch (llmError) {
    console.error('Error using LLM for extraction:', llmError);
    return [];
  }
}
