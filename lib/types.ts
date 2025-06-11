export interface Product {
  name: string;
  price: string | number;
  description: string;
  url: string;
  imageUrl?: string;
  dealScore?: number;
  features?: string[];
  specs?: Record<string, string>;
  category?: string;
  brand?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

export interface ExaSearchResponse {
  results: SearchResult[];
}
