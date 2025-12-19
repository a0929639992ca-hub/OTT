
export interface StreamingPlatform {
  id: string;
  name: string;
  logo?: string;
}

export interface SearchResult {
  title: string;
  description: string;
  availablePlatforms: string[];
  sources: Array<{ uri: string; title: string }>;
  year?: string;
  genre?: string;
  rating?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NOT_FOUND = 'NOT_FOUND'
}
