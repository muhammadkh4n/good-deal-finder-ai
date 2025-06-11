import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/searchService';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Searching for products with query: ${query}`);
    const results = await searchProducts(query);
    console.log(`Found ${results.length} results`);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
