# OCR Pipeline Module

## Overview

The OCR Pipeline MVP provides invoice image processing and text extraction using Tesseract.js with Redis caching.

### Features
- **Image Preprocessing**: EXIF rotation detection, resizing, brightness adjustment
- **Text Extraction**: Tesseract.js-based OCR with confidence scoring
- **Intelligent Field Parsing**: Extracts supplier, invoice number, amount, and date
- **Redis Caching**: SHA256-based image deduplication with 7-day TTL
- **Error Handling**: Graceful degradation when Redis is unavailable
- **Performance Metrics**: Processing time tracking per invoice

## Architecture

```
Invoice Image
    ↓
[Preprocessing] → Rotate (EXIF) → Resize → Brightness Adjust
    ↓
[Hash Check] → SHA256 of image buffer
    ↓
[Cache Lookup] → Redis (7 days TTL)
    ↓ (if cache miss)
[OCR Extraction] → Tesseract.js
    ↓
[Field Parsing] → Regex patterns
    ↓
[Result Caching] → Redis
    ↓
Return: OCRResult with confidence_scores
```

## File Structure

```
src/modules/ocr/
├── types.ts                    # Type definitions
├── image-preprocessing.ts      # Image processing (60 lines)
├── ocr-engine.ts              # Tesseract OCR (100 lines)
├── ocr-cache.ts               # Redis caching (50 lines)
├── ocr.service.ts             # Orchestration (80 lines)
├── ocr.test.ts                # Tests (60 lines)
├── index.ts                   # Exports
└── README.md                  # This file
```

## Installation

```bash
npm install tesseract.js redis sharp
```

## Usage

### Basic Usage

```typescript
import { ocrService } from './src/modules/ocr';
import * as fs from 'fs';

// Initialize cache (optional, gracefully handles connection failure)
await ocrService.initializeCache('redis://localhost:6379');

// Read invoice image
const imageBuffer = fs.readFileSync('./invoice.png');

// Process invoice
const result = await ocrService.processInvoice(imageBuffer);

console.log(result);
// Output:
// {
//   supplier_name: 'ABC Supplier',
//   invoice_number: 'INV-2024-001',
//   total_amount: 1234.56,
//   invoice_date: '2024-08-18',
//   confidence_scores: {
//     supplier: 0.85,
//     number: 0.90,
//     amount: 0.88,
//     date: 0.92
//   },
//   processing_time_ms: 1245
// }

// Close cache connection when done
await ocrService.closeCache();
```

### Batch Processing

```typescript
const imageBuffers = [
  fs.readFileSync('./invoice1.png'),
  fs.readFileSync('./invoice2.png'),
  fs.readFileSync('./invoice3.png')
];

const results = await ocrService.processInvoicesBatch(
  imageBuffers,
  (current, total) => {
    console.log(`Processing ${current}/${total}`);
  }
);
```

### Direct Module Usage

```typescript
import {
  preprocessImage,
  extractOCRDataFromBuffer,
  OCRCache
} from './src/modules/ocr';

// Preprocess image
const preprocessed = await preprocessImage(imageBuffer);

// Extract OCR data
const result = await extractOCRDataFromBuffer(preprocessed);

// Manual cache operations
const cache = new OCRCache();
await cache.connect();

const imageHash = OCRCache.generateImageHash(imageBuffer);
const cached = await cache.getCachedResult(imageHash);
```

## API Reference

### OCRService

#### processInvoice(imageBuffer: Buffer): Promise<OCRResult>
Process a single invoice image and return extracted data with confidence scores.

- **Input**: Image file buffer (PNG, JPEG)
- **Output**: OCRResult object
- **Caching**: Automatic SHA256-based caching with 7-day TTL
- **Error Handling**: Throws error on failure

#### processInvoicesBatch(imageBuffers: Buffer[], onProgress?): Promise<OCRResult[]>
Process multiple images in batch.

- **Parameters**:
  - `imageBuffers`: Array of image buffers
  - `onProgress`: Optional callback for progress tracking
- **Returns**: Array of OCRResult objects

#### initializeCache(redisUrl?: string): Promise<void>
Connect to Redis cache (optional).

#### closeCache(): Promise<void>
Disconnect from Redis cache.

#### getCacheStats(): Promise<{connected, availableKeys?}>
Get cache connection status and key count.

### OCRCache

#### static generateImageHash(buffer: Buffer): string
Generate SHA256 hash of image buffer for deduplication.

#### getCachedResult(imageHash: string): Promise<OCRResult | null>
Retrieve cached OCR result by image hash.

#### setCachedResult(imageHash: string, result: OCRResult): Promise<void>
Cache OCR result with 7-day TTL.

#### clearAllCache(): Promise<void>
Clear all OCR cache entries.

## Data Structures

### OCRResult
```typescript
interface OCRResult {
  supplier_name: string;              // Max 255 chars
  invoice_number: string;             // Max 50 chars
  total_amount: number;               // Decimal amount
  invoice_date: string;               // YYYY-MM-DD format
  confidence_scores: {
    supplier: number;                 // 0.0 - 1.0
    number: number;                   // 0.0 - 1.0
    amount: number;                   // 0.0 - 1.0
    date: number;                     // 0.0 - 1.0
  };
  raw_ocr_output?: string;            // Full text from Tesseract
  processing_time_ms?: number;        // Time in milliseconds
}
```

## Database Integration

### Store OCR Result

```typescript
// After processing invoice
const result = await ocrService.processInvoice(imageBuffer);

// Store in database
await db.query(
  `INSERT INTO invoice_ocr_results 
   (invoice_id, supplier_name, invoice_number, total_amount, invoice_date, confidence_scores, processing_time_ms)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [
    invoiceId,
    result.supplier_name,
    result.invoice_number,
    result.total_amount,
    result.invoice_date,
    JSON.stringify(result.confidence_scores),
    result.processing_time_ms
  ]
);
```

## Performance Characteristics

### Processing Time
- Image preprocessing: 50-100ms
- OCR extraction: 800-1500ms
- Total: 1-2 seconds per invoice

### Caching
- Cache lookup: < 5ms (Redis hit)
- Cache write: < 10ms
- Deduplication: Automatic via SHA256 hash

### Confidence Scores
- 0.7-0.9: High confidence (reliable)
- 0.5-0.7: Medium confidence (review recommended)
- < 0.5: Low confidence (manual entry recommended)

## Error Handling

### Graceful Degradation
- Redis unavailable: Pipeline continues without caching
- Invalid image format: Returns error with processing context
- OCR timeout: Throws error with partial results if available

### Logging
- Debug: Preprocessing steps, cache operations
- Info: Processing start/completion
- Warn: Non-fatal errors (Redis connection, parsing issues)
- Error: Fatal processing failures

## Configuration

### Environment Variables
```
REDIS_URL=redis://localhost:6379
OCR_LANGUAGE=eng                    # Tesseract language code
OCR_CACHE_TTL_DAYS=7              # Cache expiration
```

### Cache Configuration
- TTL: 7 days
- Key Prefix: `ocr:result:`
- Hash Algorithm: SHA256
- Storage: Redis

## Testing

Run tests:
```bash
npm test
```

Test coverage:
- Image hashing consistency
- Image preprocessing
- Cache operations
- OCR result structure validation
- Confidence score validation
- Service initialization

## Limitations & Future Improvements

### Current Limitations (MVP)
- Tesseract.js only (no Google Vision API)
- English language only
- ~70-80% accuracy on typical invoices
- No advanced angle correction
- No table/structured data extraction

### Future Enhancements
- Multi-language support
- Google Vision API integration
- Advanced preprocessing (deskew, despeckle)
- Table structure detection
- Confidence-based quality scoring
- Automatic retry logic
- Performance optimization
- Web dashboard for manual review

## Troubleshooting

### OCR Not Finding Text
- Check image quality (brightness, contrast)
- Ensure image is properly oriented
- Try manual angle adjustment
- Verify invoice format is supported

### Cache Not Working
- Verify Redis connection: `redis-cli ping`
- Check Redis URL in environment
- Confirm Redis is running on port 6379
- Monitor Redis memory usage

### Slow Processing
- Monitor image preprocessing time
- Check Tesseract.js resource usage
- Verify Redis connection overhead
- Consider batch processing

## Support

For issues or questions about the OCR Pipeline, refer to:
- API Specification: `api-specification-openapi.yaml`
- Database Schema: `database-schema-final.sql`
- Architecture Plan: `architecture-plan.md`
