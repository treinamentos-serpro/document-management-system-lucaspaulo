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
    const document = this.buildDocument(file, owner);

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
    const document = this.findOwnedDocumentOrThrow(id, owner);
    await this.ensureStoredFileExistsOrThrow(document);

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

  buildDocument(file, owner) {
    return {
      id: randomUUID(),
      originalName: file.originalname,
      storageName: file.filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
    };
  }

  findOwnedDocumentOrThrow(id, owner) {
    const document = this.documentsRepository.findById(id);

    if (!document || document.owner !== owner) {
      throw this.createDocumentNotFoundError();
    }

    return document;
  }

  async ensureStoredFileExistsOrThrow(document) {
    const exists = await this.documentsRepository.fileExists(document.storageName);

    if (!exists) {
      throw this.createDocumentNotFoundError();
    }
  }

  createDocumentNotFoundError() {
    return new DocumentError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }
}

module.exports = { DocumentsService, DocumentError };