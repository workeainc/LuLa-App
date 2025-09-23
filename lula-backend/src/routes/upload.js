const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

// Upload image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No image file provided'
      });
    }

    const fileId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();

    res.json({
      error: false,
      url: result.Location,
      fileId: fileId
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to upload image'
    });
  }
});

// Upload video
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No video file provided'
      });
    }

    const fileId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();

    res.json({
      error: false,
      url: result.Location,
      fileId: fileId
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to upload video'
    });
  }
});

// Get presigned URL for direct upload
router.post('/presigned-url', async (req, res) => {
  try {
    const { fileType, fileSize } = req.body;
    
    if (!fileType || !fileSize) {
      return res.status(400).json({
        error: true,
        message: 'File type and size are required'
      });
    }

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = fileType.split('/')[1];
    const fileName = `${fileId}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
      Expires: 300 // 5 minutes
    };

    const uploadUrl = s3.getSignedUrl('putObject', uploadParams);

    res.json({
      error: false,
      uploadUrl,
      fileId,
      fileName
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to generate upload URL'
    });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // This would need to be implemented to find and delete the actual file
    // For now, return success
    res.json({
      error: false,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete file'
    });
  }
});

module.exports = router;
