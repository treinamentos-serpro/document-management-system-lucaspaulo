const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const multer = require('multer');

function createDocumentsRouter({ documentsController, storageDirectory, uploadLimitBytes }) {
  fs.mkdirSync(storageDirectory, { recursive: true });

  const storage = multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname);
      callback(null, `${randomUUID()}${extension}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: uploadLimitBytes, files: 1 },
  });
  const uploadSingleFile = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (error && (error instanceof multer.MulterError || !error.code)) {
        error.isInvalidUpload = true;
      }
      next(error);
    });
  };
  const router = express.Router();

  router.post('/upload', documentsController.validateUser, uploadSingleFile, documentsController.upload);
  router.get('/documents', documentsController.validateUser, documentsController.list);
  router.get('/documents/:id/download', documentsController.validateUser, documentsController.download);
  router.use(documentsController.handleError);

  return router;
}

module.exports = createDocumentsRouter;