/**
 * OCR Pipeline Type Definitions
 */

export interface OCRConfidenceScores {
  supplier: number;
  number: number;
  amount: number;
  date: number;
}

export interface OCRResult {
  supplier_name: string;
  invoice_number: string;
  total_amount: number;
  invoice_date: string;
  confidence_scores: OCRConfidenceScores;
  raw_ocr_output?: string;
  processing_time_ms?: number;
}

export interface OCRCacheEntry {
  result: OCRResult;
  timestamp: number;
}

export interface PreprocessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  rotated: boolean;
}
