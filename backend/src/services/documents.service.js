const { randomUUID } = require('node:crypto');

class DocumentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
  }
}

class DocumentsService {
  constructor(documentsRepository) {
    this.documentsRepository = documentsRepository;
  }

  async createDocument(file, owner) {
    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      storageName: file.filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
    };

    try {
      this.documentsRepository.save(document);
      return this.toPublicDocument(document);
    } catch (error) {
      await this.documentsRepository.removeFile(file.filename);
      throw error;
    }
  }

  listDocuments(owner) {
    return this.documentsRepository
      .findByOwner(owner)
      .map((document) => this.toPublicDocument(document));
  }

  async getDocumentDownload(id, owner) {
    const document = this.documentsRepository.findById(id);

    if (!document || document.owner !== owner) {
      throw new DocumentError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    const exists = await this.documentsRepository.fileExists(document.storageName);
    if (!exists) {
      throw new DocumentError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    return {
      filePath: this.documentsRepository.resolveFilePath(document.storageName),
      originalName: document.originalName,
    };
  }

  async discardUploadedFile(file) {
    if (file?.filename) {
      await this.documentsRepository.removeFile(file.filename);
    }
  }

  toPublicDocument(document) {
    const { id, originalName, size, uploadedAt, owner } = document;
    return { id, originalName, size, uploadedAt, owner };
  }
}

module.exports = { DocumentsService, DocumentError };