const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentsRepository {
  constructor(storageDirectory) {
    this.storageDirectory = path.resolve(storageDirectory);
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  findByOwner(owner) {
    return Array.from(this.documents.values())
      .filter((document) => document.owner === owner)
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
  }

  resolveFilePath(storageName) {
    if (typeof storageName !== 'string' || !/^[0-9a-f-]{36}(?:\.[a-z0-9]+)?$/i.test(storageName)) {
      const error = new Error('Nome físico de arquivo inválido.');
      error.code = 'INVALID_STORAGE_NAME';
      throw error;
    }

    const filePath = path.resolve(this.storageDirectory, storageName);
    const storagePrefix = `${this.storageDirectory}${path.sep}`;
    if (!filePath.startsWith(storagePrefix)) {
      const error = new Error('Caminho de arquivo fora do armazenamento permitido.');
      error.code = 'INVALID_STORAGE_NAME';
      throw error;
    }

    return filePath;
  }

  async fileExists(storageName) {
    try {
      await fs.access(this.resolveFilePath(storageName));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async removeFile(storageName) {
    try {
      await fs.unlink(this.resolveFilePath(storageName));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = DocumentsRepository;