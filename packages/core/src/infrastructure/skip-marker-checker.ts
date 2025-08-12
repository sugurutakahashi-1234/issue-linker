// Infrastructure layer - Skip marker detection

import { SKIP_MARKERS } from "../domain/constants.js";

/**
 * Check if text contains a skip marker
 * @param text - Text to check for skip markers
 * @returns true if skip marker is found
 */
export function hasSkipMarker(text: string): boolean {
  return SKIP_MARKERS.some((marker) => marker.test(text));
}
