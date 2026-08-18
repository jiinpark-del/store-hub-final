/**
 * OCR Service Module
 * Orchestrates image preprocessing, OCR extraction, and caching
 */

import { preprocessImage } from './image-preprocessing';
import { extractOCRDataFromBuffer } from './ocr-engine';
import { ocrCache, OCRCache } from './ocr-cache';
import { OCRResult } from './types';

export class OCRService {
  private cache: OCRCache;

  constructor(cache?: OCRCache) {
    this.cache = cache || ocrCache;
  }

  /**
   * Process an invoice image and extract OCR data
   * Handles: preprocessing → caching check → OCR → caching result
   */
  async processInvoice(imageBuffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      console.debug('Starting invoice processing...');

      // Step 1: Generate image hash for caching
      const imageHash = OCRCache.generateImageHash(imageBuffer);
      console.debug(`Image hash: ${imageHash}`);

      // Step 2: Check cache
      const cachedResult = await this.cache.getCachedResult(imageHash);
      if (cachedResult) {
        console.debug(`Using cached result (saved ${Date.now() - startTime}ms)`);
        return {
          ...cachedResult,
          processing_time_ms: Date.now() - startTime
        };
      }

      // Step 3: Preprocess image
      console.debug('Preprocessing image...');
      const preprocessingStart = Date.now();
      const preprocessedBuffer = await preprocessImage(imageBuffer);
      const preprocessingTime = Date.now() - preprocessingStart;
      console.debug(`Image preprocessing completed in ${preprocessingTime}ms`);

      // Step 4: Extract OCR data
      console.debug('Extracting OCR data...');
      const ocrStart = Date.now();
      const ocrResult = await extractOCRDataFromBuffer(preprocessedBuffer);
      const ocrTime = Date.now() - ocrStart;
      console.debug(`OCR extraction completed in ${ocrTime}ms`);

      // Step 5: Cache the result
      await this.cache.setCachedResult(imageHash, ocrResult);

      // Step 6: Return result with total processing time
      const totalTime = Date.now() - startTime;
      return {
        ...ocrResult,
        processing_time_ms: totalTime
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Invoice processing failed: ${errorMessage}`);

      throw new Error(`Invoice processing failed: ${errorMessage} (${totalTime}ms)`);
    }
  }

  /**
   * Process multiple invoices in batch
   */
  async processInvoicesBatch(
    imageBuffers: Buffer[],
    onProgress?: (index: number, total: number) => void
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      try {
        if (onProgress) {
          onProgress(i + 1, imageBuffers.length);
        }

        const result = await this.processInvoice(imageBuffers[i]);
        results.push(result);
      } catch (error) {
        console.error(`Batch processing failed at index ${i}:`, error);
        results.push({
          supplier_name: 'ERROR',
          invoice_number: 'ERROR',
          total_amount: 0,
          invoice_date: new Date().toISOString().split('T')[0],
          confidence_scores: {
            supplier: 0,
            number: 0,
            amount: 0,
            date: 0
          }
        });
      }
    }

    return results;
  }

  /**
   * Initialize cache connection
   */
  async initializeCache(redisUrl?: string): Promise<void> {
    await this.cache.connect(redisUrl);
  }

  /**
   * Close cache connection
   */
  async closeCache(): Promise<void> {
    await this.cache.disconnect();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ connected: boolean; availableKeys?: number }> {
    return await this.cache.getStats();
  }

  /**
   * Clear cache (useful for testing)
   */
  async clearCache(): Promise<void> {
    await this.cache.clearAllCache();
  }
}

// Export singleton instance
export const ocrService = new OCRService();
