const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentsRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
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
    return path.join(this.storageDirectory, path.basename(storageName));
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