const { test } = require('node:test');
const assert = require('node:assert');

const { DocumentsService, DocumentError } = require('../src/services/documents.service');

function createRepositoryDouble(overrides = {}) {
  return {
    save(document) {
      return document;
    },
    findById() {
      return null;
    },
    findByOwner() {
      return [];
    },
    async fileExists() {
      return true;
    },
    resolveFilePath(storageName) {
      return `/storage/${storageName}`;
    },
    async removeFile() {},
    ...overrides,
  };
}

test('createDocument retorna apenas os campos públicos do documento', async () => {
  const documentsService = new DocumentsService(createRepositoryDouble());

  const document = await documentsService.createDocument({
    originalname: 'relatorio.pdf',
    filename: 'stored-file.pdf',
    size: 128,
  }, 'user-1');

  assert.ok(document.id);
  assert.deepStrictEqual(Object.keys(document).sort(), [
    'id',
    'originalName',
    'owner',
    'size',
    'uploadedAt',
  ]);
  assert.strictEqual(document.originalName, 'relatorio.pdf');
  assert.strictEqual(document.owner, 'user-1');
  assert.strictEqual(document.size, 128);
  assert.ok(Date.parse(document.uploadedAt));
});

test('createDocument remove o arquivo enviado quando a persistência falha', async () => {
  let removedFileName;
  const documentsService = new DocumentsService(createRepositoryDouble({
    save() {
      throw new Error('save failed');
    },
    async removeFile(storageName) {
      removedFileName = storageName;
    },
  }));

  await assert.rejects(
    documentsService.createDocument({
      originalname: 'relatorio.pdf',
      filename: 'stored-file.pdf',
      size: 128,
    }, 'user-1'),
    /save failed/
  );

  assert.strictEqual(removedFileName, 'stored-file.pdf');
});

test('listDocuments retorna apenas os campos públicos dos documentos do usuário', () => {
  const documentsService = new DocumentsService(createRepositoryDouble({
    findByOwner() {
      return [
        {
          id: 'doc-1',
          originalName: 'relatorio.pdf',
          storageName: 'stored-file.pdf',
          size: 128,
          uploadedAt: '2026-09-15T00:00:00.000Z',
          owner: 'user-1',
        },
      ];
    },
  }));

  assert.deepStrictEqual(documentsService.listDocuments('user-1'), [
    {
      id: 'doc-1',
      originalName: 'relatorio.pdf',
      size: 128,
      uploadedAt: '2026-09-15T00:00:00.000Z',
      owner: 'user-1',
    },
  ]);
});

test('getDocumentDownload retorna erro quando o documento não pertence ao usuário', async () => {
  const documentsService = new DocumentsService(createRepositoryDouble({
    findById() {
      return {
        id: 'doc-1',
        originalName: 'relatorio.pdf',
        storageName: 'stored-file.pdf',
        size: 128,
        uploadedAt: '2026-09-15T00:00:00.000Z',
        owner: 'other-user',
      };
    },
  }));

  await assert.rejects(
    documentsService.getDocumentDownload('doc-1', 'user-1'),
    (error) => {
      assert.ok(error instanceof DocumentError);
      assert.strictEqual(error.code, 'DOCUMENT_NOT_FOUND');
      assert.strictEqual(error.message, 'Documento não encontrado.');
      return true;
    }
  );
});

test('getDocumentDownload retorna erro quando o arquivo não existe no storage', async () => {
  const documentsService = new DocumentsService(createRepositoryDouble({
    findById() {
      return {
        id: 'doc-1',
        originalName: 'relatorio.pdf',
        storageName: 'stored-file.pdf',
        size: 128,
        uploadedAt: '2026-09-15T00:00:00.000Z',
        owner: 'user-1',
      };
    },
    async fileExists() {
      return false;
    },
  }));

  await assert.rejects(
    documentsService.getDocumentDownload('doc-1', 'user-1'),
    (error) => {
      assert.ok(error instanceof DocumentError);
      assert.strictEqual(error.code, 'DOCUMENT_NOT_FOUND');
      assert.strictEqual(error.message, 'Documento não encontrado.');
      return true;
    }
  );
});

test('getDocumentDownload retorna o caminho e o nome original quando o arquivo existe', async () => {
  const documentsService = new DocumentsService(createRepositoryDouble({
    findById() {
      return {
        id: 'doc-1',
        originalName: 'relatorio.pdf',
        storageName: 'stored-file.pdf',
        size: 128,
        uploadedAt: '2026-09-15T00:00:00.000Z',
        owner: 'user-1',
      };
    },
    resolveFilePath(storageName) {
      return `/tmp/${storageName}`;
    },
  }));

  const document = await documentsService.getDocumentDownload('doc-1', 'user-1');

  assert.deepStrictEqual(document, {
    filePath: '/tmp/stored-file.pdf',
    originalName: 'relatorio.pdf',
  });
});

test('discardUploadedFile ignora uploads sem filename e remove arquivos válidos', async () => {
  const removedFiles = [];
  const documentsService = new DocumentsService(createRepositoryDouble({
    async removeFile(storageName) {
      removedFiles.push(storageName);
    },
  }));

  await documentsService.discardUploadedFile(undefined);
  await documentsService.discardUploadedFile({});
  await documentsService.discardUploadedFile({ filename: 'stored-file.pdf' });

  assert.deepStrictEqual(removedFiles, ['stored-file.pdf']);
});
