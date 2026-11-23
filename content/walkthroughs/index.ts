import type { Walkthrough } from '../schema';
import { autocomplete } from './autocomplete';
import { chat } from './chat';
import { fileSync } from './file-sync';
import { kvStore } from './kv-store';
import { newsFeed } from './news-feed';
import { notificationService } from './notification-service';
import { rateLimiter } from './rate-limiter';
import { urlShortener } from './url-shortener';
import { webCrawler } from './web-crawler';

/** Design walkthroughs in the order they unlock. */
export const walkthroughs: Walkthrough[] = [
  urlShortener,
  newsFeed,
  kvStore,
  rateLimiter,
  notificationService,
  webCrawler,
  autocomplete,
  chat,
  fileSync,
];
