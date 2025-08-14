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

/**
 * Find which skip marker is present in the text
 * @param text - Text to check for skip markers
 * @returns The matched skip marker text or null if not found
 */
export function findSkipMarker(text: string): string | null {
  for (const marker of SKIP_MARKERS) {
    if (marker.test(text)) {
      // Get the actual matched string from the text
      const match = text.match(marker);
      return match ? match[0] : null;
    }
  }
  return null;
}
