/**
 * Image Preprocessing Module
 * Handles basic image processing for OCR: rotation detection, resizing, brightness adjustment
 */

import sharp from 'sharp';
import { PreprocessedImage } from './types';

const MAX_WIDTH = 320;
const MAX_HEIGHT = 240;

/**
 * Detect EXIF rotation from image metadata
 */
async function detectExifRotation(imageBuffer: Buffer): Promise<number> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return metadata.orientation || 0;
  } catch (error) {
    console.warn('Failed to detect EXIF rotation:', error);
    return 0;
  }
}

/**
 * Apply EXIF rotation to image
 */
async function applyExifRotation(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const orientation = await detectExifRotation(imageBuffer);

    let pipeline = sharp(imageBuffer);

    switch (orientation) {
      case 3:
        pipeline = pipeline.rotate(180);
        break;
      case 6:
        pipeline = pipeline.rotate(90);
        break;
      case 8:
        pipeline = pipeline.rotate(270);
        break;
      default:
        // No rotation needed
        break;
    }

    return await pipeline.toBuffer();
  } catch (error) {
    console.warn('Failed to apply EXIF rotation:', error);
    return imageBuffer;
  }
}

/**
 * Resize image to maximum dimensions while maintaining aspect ratio
 */
async function resizeImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 0, height = 0 } = metadata;

    // If image is already smaller than max dimensions, skip resizing
    if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
      return imageBuffer;
    }

    return await sharp(imageBuffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();
  } catch (error) {
    console.warn('Failed to resize image:', error);
    return imageBuffer;
  }
}

/**
 * Enhance brightness and contrast for better OCR
 */
async function adjustBrightness(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .normalise() // Normalize image to enhance contrast
      .modulate({
        brightness: 1.1, // Slightly increase brightness
        contrast: 1.2    // Slightly increase contrast
      })
      .toBuffer();
  } catch (error) {
    console.warn('Failed to adjust brightness:', error);
    return imageBuffer;
  }
}

/**
 * Main preprocessing function
 * Applies all preprocessing steps in sequence
 */
export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Step 1: Apply EXIF rotation
    let processed = await applyExifRotation(imageBuffer);

    // Step 2: Resize to optimal dimensions
    processed = await resizeImage(processed);

    // Step 3: Adjust brightness and contrast
    processed = await adjustBrightness(processed);

    return processed;
  } catch (error) {
    console.error('Error in image preprocessing:', error);
    throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image metadata for logging/debugging
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<PreprocessedImage> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      buffer: imageBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      rotated: (metadata.orientation || 0) > 0
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
