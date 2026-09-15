const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const DocumentsRepository = require('../src/repositories/documents.repository');
const { DocumentsService } = require('../src/services/documents.service');

async function createRepository() {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  return {
    repository: new DocumentsRepository(storageDirectory),
    storageDirectory,
  };
}

test('resolveFilePath aceita apenas arquivo físico dentro do storage', async () => {
  const { repository, storageDirectory } = await createRepository();

  assert.equal(
    repository.resolveFilePath('123e4567-e89b-12d3-a456-426614174000.pdf'),
    path.join(storageDirectory, '123e4567-e89b-12d3-a456-426614174000.pdf'),
  );
  assert.throws(() => repository.resolveFilePath('../fora'), /Nome físico de arquivo inválido/);
  assert.throws(() => repository.resolveFilePath('/tmp/fora'), /Nome físico de arquivo inválido/);
});

test('download só retorna documento pertencente ao usuário informado', async () => {
  const { repository, storageDirectory } = await createRepository();
  const storageName = '123e4567-e89b-12d3-a456-426614174000.txt';
  const filePath = path.join(storageDirectory, storageName);
  await fs.writeFile(filePath, 'conteúdo de teste');
  repository.save({
    id: 'document-1',
    originalName: 'arquivo.txt',
    storageName,
    size: 16,
    uploadedAt: new Date().toISOString(),
    owner: 'user-1',
  });

  const service = new DocumentsService(repository);
  const download = await service.getDocumentDownload('document-1', 'user-1');
  assert.equal(download.filePath, filePath);
  await assert.rejects(
    service.getDocumentDownload('document-1', 'user-2'),
    { code: 'DOCUMENT_NOT_FOUND' },
  );
});

test('download trata arquivo físico ausente como documento inexistente', async () => {
  const { repository } = await createRepository();
  repository.save({
    id: 'document-2',
    originalName: 'ausente.txt',
    storageName: '123e4567-e89b-12d3-a456-426614174000.txt',
    size: 0,
    uploadedAt: new Date().toISOString(),
    owner: 'user-1',
  });

  const service = new DocumentsService(repository);
  await assert.rejects(
    service.getDocumentDownload('document-2', 'user-1'),
    { code: 'DOCUMENT_NOT_FOUND' },
  );
});
