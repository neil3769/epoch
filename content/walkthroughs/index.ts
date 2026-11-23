import type { Walkthrough } from '../schema';
import { autocomplete } from './autocomplete';
import { chat } from './chat';
import { codeReview } from './code-review';
import { dataAgent } from './data-agent';
import { docExtraction } from './doc-extraction';
import { fileSync } from './file-sync';
import { kvStore } from './kv-store';
import { modelGateway } from './model-gateway';
import { nearby } from './nearby';
import { newsFeed } from './news-feed';
import { notificationService } from './notification-service';
import { payments } from './payments';
import { rag } from './rag';
import { rateLimiter } from './rate-limiter';
import { supportBot } from './support-bot';
import { urlShortener } from './url-shortener';
import { video } from './video';
import { webCrawler } from './web-crawler';

/** Design walkthroughs in the order they unlock; the four AI designs last, listed in both tracks. */
export const walkthroughs: Walkthrough[] = [
  urlShortener,
  newsFeed,
  kvStore,
  rateLimiter,
  notificationService,
  payments,
  webCrawler,
  autocomplete,
  chat,
  fileSync,
  video,
  nearby,
  rag,
  modelGateway,
  supportBot,
  docExtraction,
  dataAgent,
  codeReview,
];
