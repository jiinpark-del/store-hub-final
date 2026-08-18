/**
 * OCR Cache Module
 * Handles Redis-based caching for OCR results with SHA256 hashing
 */

import crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';
import { OCRResult, OCRCacheEntry } from './types';

const CACHE_TTL_DAYS = 7;
const CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 24 * 60 * 60;
const CACHE_KEY_PREFIX = 'ocr:result:';

export class OCRCache {
  private client: RedisClientType | null = null;
  private isConnected = false;

  /**
   * Initialize Redis client
   */
  async connect(redisUrl?: string): Promise<void> {
    try {
      const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({ url });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.debug('Connected to Redis');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.warn(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Cache is optional - continue without it
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        console.debug('Disconnected from Redis');
      } catch (error) {
        console.warn('Error disconnecting from Redis:', error);
      }
    }
  }

  /**
   * Generate SHA256 hash of image buffer
   */
  static generateImageHash(imageBuffer: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex');
  }

  /**
   * Get cache key for image hash
   */
  private getCacheKey(imageHash: string): string {
    return `${CACHE_KEY_PREFIX}${imageHash}`;
  }

  /**
   * Get cached OCR result
   */
  async getCachedResult(imageHash: string): Promise<OCRResult | null> {
    if (!this.isConnected || !this.client) {
      console.debug('Redis cache not available, skipping cache read');
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(imageHash);
      const cached = await this.client.get(cacheKey);

      if (cached) {
        console.debug(`Cache HIT for image hash: ${imageHash}`);
        const cacheEntry: OCRCacheEntry = JSON.parse(cached);
        return cacheEntry.result;
      }

      console.debug(`Cache MISS for image hash: ${imageHash}`);
      return null;
    } catch (error) {
      console.warn(`Error reading from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Set OCR result in cache
   */
  async setCachedResult(imageHash: string, result: OCRResult): Promise<void> {
    if (!this.isConnected || !this.client) {
      console.debug('Redis cache not available, skipping cache write');
      return;
    }

    try {
      const cacheKey = this.getCacheKey(imageHash);
      const cacheEntry: OCRCacheEntry = {
        result,
        timestamp: Date.now()
      };

      await this.client.setEx(
        cacheKey,
        CACHE_TTL_SECONDS,
        JSON.stringify(cacheEntry)
      );

      console.debug(`Cached OCR result for image hash: ${imageHash} (TTL: ${CACHE_TTL_DAYS} days)`);
    } catch (error) {
      console.warn(`Error writing to cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Non-fatal error - OCR will still work without cache
    }
  }

  /**
   * Clear specific cache entry
   */
  async clearCacheEntry(imageHash: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(imageHash);
      await this.client.del(cacheKey);
      console.debug(`Cleared cache for image hash: ${imageHash}`);
    } catch (error) {
      console.warn(`Error clearing cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all OCR cache
   */
  async clearAllCache(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pattern = `${CACHE_KEY_PREFIX}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.debug(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.warn(`Error clearing all cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ connected: boolean; availableKeys?: number }> {
    return {
      connected: this.isConnected,
      availableKeys: this.isConnected ? await this.getAvailableKeysCount() : undefined
    };
  }

  /**
   * Count available cache keys
   */
  private async getAvailableKeysCount(): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const pattern = `${CACHE_KEY_PREFIX}*`;
      const keys = await this.client.keys(pattern);
      return keys.length;
    } catch (error) {
      console.warn('Error counting cache keys:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const ocrCache = new OCRCache();
