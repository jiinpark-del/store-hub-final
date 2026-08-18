/**
 * OCR Engine Module
 * Uses Tesseract.js to extract text from invoice images
 */

import Tesseract from 'tesseract.js';
import { OCRResult, OCRConfidenceScores } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extract text from image using Tesseract.js
 */
async function extractTextFromImage(imagePath: string): Promise<{ text: string; confidence: number }> {
  try {
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: (message) => {
        if (message.status === 'recognizing text') {
          console.debug(`OCR progress: ${Math.round(message.progress * 100)}%`);
        }
      }
    });

    const text = result.data.text;
    const confidence = result.data.confidence / 100; // Convert to 0-1 scale

    return { text, confidence };
  } catch (error) {
    throw new Error(`Tesseract OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract supplier name from OCR text
 */
function extractSupplier(text: string): { value: string; confidence: number } {
  // Common patterns: "Supplier:", "Company:", "From:", "Bill From:"
  const patterns = [
    /(?:supplier|company|from|bill\s+from)\s*:?\s*([A-Za-z\s&\.,-]+?)(?:\n|$)/i,
    /^([A-Za-z][A-Za-z\s&\.,-]{3,}?)(?:\n|$)/m
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const supplier = match[1].trim().slice(0, 255); // Max 255 chars
      return {
        value: supplier,
        confidence: 0.75 // Medium confidence for text extraction
      };
    }
  }

  return { value: 'Unknown Supplier', confidence: 0.3 };
}

/**
 * Extract invoice number from OCR text
 */
function extractInvoiceNumber(text: string): { value: string; confidence: number } {
  // Common patterns: "Invoice #", "Invoice No.", "INV-", "Ref:", "Reference #"
  const patterns = [
    /(?:invoice|inv|ref|reference)\s*(?:#|no\.?|number)?\s*:?\s*([A-Za-z0-9\-\.\/]+)/i,
    /(?:invoice|inv)\s*([0-9]{4,})/i,
    /([A-Z]{2,}[\-\/]?[0-9]{4,})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const invoiceNumber = match[1].trim().slice(0, 50); // Max 50 chars
      return {
        value: invoiceNumber,
        confidence: 0.7
      };
    }
  }

  return { value: 'NOT_FOUND', confidence: 0.2 };
}

/**
 * Extract total amount from OCR text
 */
function extractAmount(text: string): { value: number; confidence: number } {
  // Common patterns: "Total:", "Amount:", "Grand Total:", "$123.45", "AUD 1,234.50"
  const patterns = [
    /(?:total|amount|grand\s+total|balance\s+due)\s*:?\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /\$\s*([\d,]+\.?\d{0,2})/,
    /(\d{1,}(?:,\d{3})*(?:\.\d{2})?)\s*(?:aud|usd|gbp|eur)?$/im
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0 && amount < 1000000) { // Reasonable amount range
          return {
            value: amount,
            confidence: 0.8
          };
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
  }

  return { value: 0, confidence: 0.1 };
}

/**
 * Extract invoice date from OCR text
 */
function extractDate(text: string): { value: string; confidence: number } {
  // Common patterns: "Date:", "Invoice Date:", "2024-01-15", "15/01/2024", "Jan 15, 2024"
  const patterns = [
    /(?:date|dated)\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
    /([A-Za-z]{3,}\s+\d{1,2},?\s+\d{4})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1];
      try {
        // Try to normalize date format to YYYY-MM-DD
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const normalizedDate = date.toISOString().split('T')[0];
          return {
            value: normalizedDate,
            confidence: 0.75
          };
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
  }

  return { value: new Date().toISOString().split('T')[0], confidence: 0.2 }; // Default to today
}

/**
 * Parse OCR text and extract structured data
 */
function parseOCRText(text: string, overallConfidence: number): OCRResult {
  const supplier = extractSupplier(text);
  const invoiceNumber = extractInvoiceNumber(text);
  const amount = extractAmount(text);
  const date = extractDate(text);

  // Average confidence scores
  const avgConfidence = (supplier.confidence + invoiceNumber.confidence + amount.confidence + date.confidence) / 4;

  return {
    supplier_name: supplier.value,
    invoice_number: invoiceNumber.value,
    total_amount: amount.value,
    invoice_date: date.value,
    confidence_scores: {
      supplier: supplier.confidence * 0.9, // Apply slight penalty for extraction uncertainty
      number: invoiceNumber.confidence * 0.9,
      amount: amount.confidence * 0.9,
      date: date.confidence * 0.9
    },
    raw_ocr_output: text
  };
}

/**
 * Main OCR extraction function
 */
export async function extractOCRData(imagePath: string): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // Verify file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Extract text from image using Tesseract
    console.debug(`Starting OCR extraction for: ${imagePath}`);
    const { text, confidence } = await extractTextFromImage(imagePath);

    console.debug(`OCR text extracted (confidence: ${(confidence * 100).toFixed(2)}%)`);

    // Parse extracted text to get structured data
    const result = parseOCRText(text, confidence);

    // Add processing time
    result.processing_time_ms = Date.now() - startTime;

    return result;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'} (${processingTime}ms)`);
  }
}

/**
 * Extract OCR data from image buffer (without file)
 */
export async function extractOCRDataFromBuffer(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    // Create temporary file
    const tempDir = path.join('/tmp', `ocr-${Date.now()}`);
    const tempPath = path.join(tempDir, 'temp-image.png');

    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write buffer to temp file
    fs.writeFileSync(tempPath, imageBuffer);

    try {
      // Extract OCR data using file-based function
      const result = await extractOCRData(tempPath);
      result.processing_time_ms = Date.now() - startTime;
      return result;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    }
  } catch (error) {
    throw new Error(`OCR extraction from buffer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
