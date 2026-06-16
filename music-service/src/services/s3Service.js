const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'spotify-project-2-bucket';

/**
 * Upload a file buffer to S3.
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} s3Key - The target key (path) in S3
 * @param {string} mimeType - The file's MIME type
 * @returns {Promise<string>} The uploaded file URL
 */
const uploadToS3 = async (fileBuffer, s3Key, mimeType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    
    // Return the S3 key. We will store the S3 key in MongoDB.
    // When reading, we will generate a signed URL dynamically.
    return s3Key;
  } catch (error) {
    console.error('❌ S3 Upload error:', error.message);
    throw new Error(`S3 Upload failed: ${error.message}`);
  }
};

/**
 * Upload cover image to S3.
 */
const uploadImageToS3 = async (fileBuffer, originalName, mimeType) => {
  const sanitizedName = originalName.replace(/\s+/g, '_');
  const s3Key = `covers/${Date.now()}_${sanitizedName}`;
  return uploadToS3(fileBuffer, s3Key, mimeType);
};

/**
 * Upload audio file to S3.
 */
const uploadAudioToS3 = async (fileBuffer, originalName, mimeType) => {
  const sanitizedName = originalName.replace(/\s+/g, '_');
  const s3Key = `audio/${Date.now()}_${sanitizedName}`;
  return uploadToS3(fileBuffer, s3Key, mimeType);
};

/**
 * Generate a pre-signed GET URL for a given S3 key.
 * @param {string} s3Key - The key of the object in S3
 * @param {number} expiresIn - Expiration time in seconds (default 3600 / 1 hour)
 * @returns {Promise<string>} Pre-signed URL
 */
const generateSignedUrl = async (s3Key, expiresIn = 3600) => {
  try {
    // If the key is already a full http URL (e.g. Google profile image), return it as is.
    if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
      return s3Key;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    // Generate signed URL
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('❌ Failed to generate pre-signed S3 URL:', error.message);
    throw new Error(`S3 Signed URL generation failed: ${error.message}`);
  }
};

module.exports = {
  uploadImageToS3,
  uploadAudioToS3,
  generateSignedUrl,
};
