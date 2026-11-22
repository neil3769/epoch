import type { Walkthrough } from '../schema';
import { newsFeed } from './news-feed';
import { notificationService } from './notification-service';
import { rateLimiter } from './rate-limiter';
import { urlShortener } from './url-shortener';

/** Design walkthroughs in the order they unlock. */
export const walkthroughs: Walkthrough[] = [urlShortener, newsFeed, rateLimiter, notificationService];
