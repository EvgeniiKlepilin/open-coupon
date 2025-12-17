/**
 * Coupon Service
 * Business logic for coupon operations
 */

import { db } from '../lib/db.ts';
import { NotFoundError } from '../lib/errors.ts';
import type { Coupon } from '../generated/prisma/index.js';

/**
 * Extract hostname from a URL string
 * @param url - Full URL or domain string
 * @returns Normalized hostname (e.g., "nike.com")
 */
function extractHostname(url: string): string {
  try {
    // If it's already just a domain (no protocol), add one temporarily
    const urlWithProtocol = url.includes('://') ? url : `https://${url}`;
    const hostname = new URL(urlWithProtocol).hostname;

    // Remove 'www.' prefix if present for consistent matching
    return hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, return the cleaned input
    return url.replace(/^www\./, '').toLowerCase();
  }
}

/**
 * Find coupons for a given retailer domain
 * @param domain - The retailer's domain (e.g., "nike.com" or "https://www.nike.com")
 * @returns Array of coupons ordered by success rate
 * @throws NotFoundError if retailer is not found
 */
export async function getCouponsByDomain(domain: string): Promise<Coupon[]> {
  const hostname = extractHostname(domain);

  // Find the retailer by domain
  const retailer = await db.retailer.findUnique({
    where: { domain: hostname },
    include: {
      coupons: {
        orderBy: {
          successCount: 'desc',
        },
      },
    },
  });

  if (!retailer) {
    throw new NotFoundError(`No retailer found for domain: ${hostname}`);
  }

  // Only return active retailers
  if (!retailer.isActive) {
    throw new NotFoundError(`Retailer is not active: ${hostname}`);
  }

  return retailer.coupons;
}
