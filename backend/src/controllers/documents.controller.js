const ERROR_STATUS = {
  USER_ID_REQUIRED: 400,
  FILE_REQUIRED: 400,
  INVALID_DOCUMENT_ID: 400,
  DOCUMENT_NOT_FOUND: 404,
};

class DocumentsController {
  constructor(documentsService) {
    this.documentsService = documentsService;
  }

  validateUser = (req, res, next) => {
    const userId = req.get('X-User-Id');

    if (!userId || !userId.trim() || userId.trim().length > 100) {
      return this.sendError(res, 'USER_ID_REQUIRED', 'O identificador do usuário é obrigatório.');
    }

    req.userId = userId.trim();
    next();
  };

  upload = async (req, res, next) => {
    if (!req.file) {
      return this.sendError(res, 'FILE_REQUIRED', 'Um arquivo deve ser enviado.');
    }

    try {
      const document = await this.documentsService.createDocument(req.file, req.userId);
      res.status(201).json({ document });
    } catch (error) {
      next(error);
    }
  };

  list = (req, res, next) => {
    try {
      const documents = this.documentsService.listDocuments(req.userId);
      res.json({ documents });
    } catch (error) {
      next(error);
    }
  };

  download = async (req, res, next) => {
    const documentId = req.params.id?.trim();
    if (!documentId || documentId.length > 200) {
      return this.sendError(res, 'INVALID_DOCUMENT_ID', 'Identificador de documento inválido.');
    }

    try {
      const document = await this.documentsService.getDocumentDownload(documentId, req.userId);
      res.download(document.filePath, document.originalName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  };

  handleError = async (error, req, res, next) => {
    try {
      await this.documentsService.discardUploadedFile(req.file);
    } catch (cleanupError) {
      console.error('Falha ao remover arquivo de upload após erro.', cleanupError);
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return this.sendError(res, 'FILE_TOO_LARGE', 'O arquivo excede o limite permitido.', 413);
    }

    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      const isMultipleFiles = error.code === 'LIMIT_FILE_COUNT' || error.field === 'file';
      const code = isMultipleFiles ? 'MULTIPLE_FILES_NOT_ALLOWED' : 'INVALID_UPLOAD';
      const message = code === 'MULTIPLE_FILES_NOT_ALLOWED'
        ? 'Envie apenas um arquivo por requisição.'
        : 'O upload enviado é inválido.';
      return this.sendError(res, code, message, 400);
    }

    if (error.isInvalidUpload) {
      return this.sendError(res, 'INVALID_UPLOAD', 'O upload enviado é inválido.', 400);
    }

    const status = ERROR_STATUS[error.code];
    if (status) {
      return this.sendError(res, error.code, error.message, status);
    }

    next(error);
  };

  sendError(res, code, message, status = ERROR_STATUS[code] || 500) {
    return res.status(status).json({ error: { code, message } });
  }
}

module.exports = DocumentsController;