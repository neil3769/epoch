import type { Walkthrough } from '../schema';
import { urlShortener } from './url-shortener';

/** Design walkthroughs in the order they unlock. */
export const walkthroughs: Walkthrough[] = [urlShortener];
