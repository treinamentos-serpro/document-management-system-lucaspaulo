// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('node:path');
const DocumentsRepository = require('./repositories/documents.repository');
const { DocumentsService } = require('./services/documents.service');
const DocumentsController = require('./controllers/documents.controller');
const createDocumentsRouter = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../storage');
const configuredUploadLimit = Number.parseInt(process.env.UPLOAD_LIMIT_BYTES, 10);
const uploadLimitBytes = Number.isInteger(configuredUploadLimit) && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 10 * 1024 * 1024;

const documentsRepository = new DocumentsRepository(storageDirectory);
const documentsService = new DocumentsService(documentsRepository);
const documentsController = new DocumentsController(documentsService);

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(createDocumentsRouter({
  documentsController,
  storageDirectory,
  uploadLimitBytes,
}));

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
