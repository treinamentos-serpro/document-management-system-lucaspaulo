# Especificação - Document Management System

> Documento de referência para a implementação do DMS usando desenvolvimento
> guiado por especificação. Esta versão define o contrato funcional, técnico e
> de integração do primeiro incremento do sistema.

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários identificados possam enviar,
consultar e baixar seus documentos, mantendo os arquivos no filesystem local e
os metadados em memória durante o ciclo de execução da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Armazenamento do conteúdo no filesystem local em `backend/storage`.
- Geração de identificador único para cada documento.
- Registro em memória dos metadados do documento.
- Listagem dos documentos pertencentes ao usuário informado na requisição.
- Download do conteúdo pelo identificador do documento.
- Identificação simples do usuário por meio do header `X-User-Id`.
- Interface React para upload, listagem e download.
- Comunicação do frontend com o backend por `fetch` usando o prefixo `/api`.
- Tratamento de entradas inválidas e erros de recurso inexistente.

### Fora do escopo

- Autenticação, login, emissão de tokens ou autorização completa.
- Persistência dos metadados após o processo ser encerrado.
- Versionamento, edição ou exclusão de documentos.
- Busca textual, filtros avançados ou paginação.
- Compartilhamento entre usuários.
- Armazenamento em banco de dados, nuvem ou qualquer provedor externo.
- Conversão, pré-visualização ou processamento do conteúdo dos arquivos.
- Upload múltiplo na mesma requisição.
- Auditoria, notificações e controle avançado de permissões.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o upload de exatamente um arquivo por requisição `POST /upload`. |
| RF-02 | O arquivo do upload deve ser enviado no campo multipart/form-data chamado `file`. |
| RF-03 | O sistema deve exigir um identificador de usuário no header `X-User-Id`. |
| RF-04 | O sistema deve rejeitar requisições sem arquivo, com mais de um arquivo ou com identificador de usuário ausente ou inválido. |
| RF-05 | O sistema deve gravar o conteúdo recebido em `backend/storage` usando `multer` configurado com `diskStorage`. |
| RF-06 | O sistema deve gerar um `id` único e registrar os metadados do documento somente depois que o upload for gravado com sucesso. |
| RF-07 | O sistema deve retornar os metadados do documento criado em caso de upload bem-sucedido. |
| RF-08 | O sistema deve listar somente os documentos associados ao usuário informado no header `X-User-Id`. |
| RF-09 | O sistema deve retornar uma lista vazia quando o usuário válido ainda não possuir documentos. |
| RF-10 | O sistema deve permitir o download de um documento por `GET /documents/:id/download`, desde que o documento exista e pertença ao usuário informado. |
| RF-11 | O sistema deve enviar o conteúdo do arquivo como resposta binária e preservar o nome original no header de download. |
| RF-12 | O sistema deve impedir que um usuário acesse ou baixe o documento pertencente a outro usuário. O recurso deve ser tratado como inexistente para evitar exposição de informações. |
| RF-13 | O sistema deve retornar erro consistente para identificador inexistente, arquivo físico ausente ou entrada inválida, sem expor stack trace ao cliente. |
| RF-14 | O frontend deve permitir selecionar e enviar um arquivo, atualizar a listagem após o upload e iniciar o download de um documento listado. |
| RF-15 | Ao reiniciar o processo, os metadados em memória devem ser descartados. Arquivos que permanecerem no diretório local não devem ser apresentados como documentos válidos sem seus metadados correspondentes. |

### 3.1. Regras de validação

- `X-User-Id` é obrigatório, deve ser uma string não vazia depois do trim e deve
  ter no máximo 100 caracteres.
- O nome original deve ser preservado apenas como metadado e no nome sugerido
  para download. Ele não deve ser usado diretamente para construir o caminho
  físico do arquivo.
- O nome físico deve ser gerado pela aplicação, sem aceitar caminhos enviados
  pelo cliente, para evitar traversal e colisões.
- O tamanho deve ser maior ou igual a zero e corresponder ao tamanho gravado
  pelo middleware de upload.
- A primeira versão não impõe uma whitelist de extensão ou MIME type, mas deve
  aplicar o limite de tamanho definido pela configuração da aplicação.
- O limite de upload deve ser configurável por variável de ambiente, com valor
  padrão documentado na implementação e erro de validação quando excedido.
- O download deve validar o identificador recebido e resolver o caminho a partir
  do metadado controlado pelo repositório, nunca diretamente de `req.params.id`.

### 3.2. Critérios de aceite funcionais

- Um upload válido cria um arquivo em `backend/storage`, retorna `201` e devolve
  metadados com `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- Um upload sem arquivo ou sem `X-User-Id` não cria metadado nem deixa arquivo
  parcial controlável pela aplicação; retorna erro HTTP documentado.
- Dois uploads válidos recebem identificadores diferentes, mesmo que tenham o
  mesmo nome original.
- A listagem de um usuário não contém documentos de outro usuário.
- A listagem de um usuário sem documentos retorna `200` com `documents: []`.
- O download de um documento válido retorna o mesmo conteúdo enviado e um
  `Content-Disposition` com o nome original.
- O download de um `id` inexistente, de outro usuário ou sem arquivo físico
  retorna `404` sem revelar o caminho interno.
- Após reiniciar a aplicação, a coleção de metadados começa vazia, conforme a
  limitação explícita de armazenamento em memória.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local da aplicação, em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase; não deve haver banco de dados ou serviço externo. |
| RNF-03 | O backend deve usar Node.js, Express e CommonJS, sem introduzir TypeScript. |
| RNF-04 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-05 | As camadas internas não devem conhecer detalhes de transporte HTTP ou de frameworks externos além da borda necessária para integração. |
| RNF-06 | O frontend deve usar React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`. |
| RNF-07 | O frontend deve acessar a API usando `fetch` e o prefixo `/api`; o proxy do Vite deve encaminhar as chamadas ao backend local. |
| RNF-08 | Configurações operacionais, como porta, diretório de armazenamento e limite de upload quando aplicável, devem ser obtidas por variáveis de ambiente com defaults locais seguros. |
| RNF-09 | Erros de entrada, filesystem e middleware devem ser tratados nas fronteiras HTTP e convertidos em respostas previsíveis. |
| RNF-10 | Os caminhos físicos dos arquivos não devem ser retornados pela API nem derivados diretamente de entrada do cliente. |
| RNF-11 | A API deve responder em JSON para sucesso de operações de metadados e para erros, exceto o conteúdo binário do download. |
| RNF-12 | A implementação deve ser simples, legível e compatível com as dependências já presentes nos `package.json`. |

### 4.1. Formato padrão de erro

Respostas de erro JSON devem seguir o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

O campo `code` é estável para consumo do frontend e testes. O campo `message`
é uma mensagem segura para o usuário, em português, sem stack trace, caminho
interno ou detalhes de implementação.

Códigos mínimos previstos:

| Código | Uso | Status típico |
| --- | --- | --- |
| `USER_ID_REQUIRED` | Header `X-User-Id` ausente ou inválido | `400` |
| `FILE_REQUIRED` | Nenhum arquivo enviado | `400` |
| `MULTIPLE_FILES_NOT_ALLOWED` | Mais de um arquivo enviado | `400` |
| `FILE_TOO_LARGE` | Limite de tamanho excedido | `413` |
| `INVALID_UPLOAD` | Multipart ou arquivo inválido | `400` |
| `DOCUMENT_NOT_FOUND` | Metadado inexistente, de outro usuário ou arquivo ausente | `404` |
| `INTERNAL_ERROR` | Falha inesperada não exposta ao cliente | `500` |

## 5. Modelo de dados

### 5.1. Metadados do documento

Os metadados devem ser mantidos por um repositório em memória, usando uma
coleção adequada para busca por `id` e filtragem por `owner`.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único e opaco do documento, gerado pelo servidor. UUID ou equivalente seguro é aceitável. |
| `originalName` | `string` | Sim | Nome original informado pelo cliente, usado para exibição e nome sugerido no download. |
| `storageName` | `string` | Sim | Nome físico gerado pelo servidor dentro de `backend/storage`; nunca é fornecido pelo cliente. |
| `size` | `number` | Sim | Tamanho do arquivo em bytes. Deve ser inteiro não negativo. |
| `uploadedAt` | `string` | Sim | Data e hora de criação em ISO 8601, preferencialmente UTC. |
| `owner` | `string` | Sim | Valor validado do header `X-User-Id` que originou o documento. |

O caminho físico completo é uma responsabilidade do repositório e deve ser
resolvido a partir de `storageName` e do diretório configurado. Ele não faz
parte da resposta pública de metadados.

### 5.2. Invariantes

- `id` é único dentro do processo e não pode ser alterado depois da criação.
- `storageName` é único dentro do diretório de armazenamento.
- `originalName` não altera o local físico do arquivo.
- `uploadedAt` não muda após a criação.
- `owner` é usado em todas as operações de listagem e download.
- Um registro de metadado só pode ser publicado após a gravação bem-sucedida do
  arquivo.
- Se a gravação do arquivo ocorrer, mas o registro do metadado falhar, a camada
  de serviço deve tentar remover o arquivo órfão e retornar erro interno.
- Metadados são voláteis: reiniciar o processo esvazia a coleção, mesmo que
  arquivos permaneçam no diretório local. A limpeza desses arquivos órfãos não
  faz parte deste primeiro incremento.

### 5.3. Representação pública

A API deve retornar os campos abaixo, sem `storageName` e sem caminho físico:

```json
{
  "id": "a-valid-document-id",
  "originalName": "contrato.pdf",
  "size": 2048,
  "uploadedAt": "2026-09-15T12:00:00.000Z",
  "owner": "user-123"
}
```

## 6. Contratos de API

As rotas abaixo são expostas pelo backend sem o prefixo `/api`. No ambiente do
frontend, o Vite remove `/api` e encaminha as requisições para o backend local.

### 6.1. `POST /upload`

Cria um documento para o usuário identificado.

**Headers**

```http
X-User-Id: user-123
Content-Type: multipart/form-data; boundary=...
```

**Corpo**

- Tipo: `multipart/form-data`.
- Campo obrigatório: `file`.
- Deve conter exatamente um arquivo.

Exemplo conceitual de cliente:

```js
const formData = new FormData();
formData.append('file', selectedFile);

fetch('/api/upload', {
  method: 'POST',
  headers: { 'X-User-Id': userId },
  body: formData
});
```

O cliente não deve definir manualmente o header `Content-Type` ao usar
`FormData`; o navegador deve gerar o boundary.

**Sucesso**

- Status: `201 Created`.
- Content-Type: `application/json`.

```json
{
  "document": {
    "id": "a-valid-document-id",
    "originalName": "contrato.pdf",
    "size": 2048,
    "uploadedAt": "2026-09-15T12:00:00.000Z",
    "owner": "user-123"
  }
}
```

**Erros**

- `400` para usuário ausente, arquivo ausente, múltiplos arquivos, multipart
  inválido ou entrada inválida.
- `413` quando o limite de tamanho for excedido.
- `500` quando ocorrer falha inesperada ao gravar o arquivo ou metadado.

### 6.2. `GET /documents`

Lista os documentos do usuário identificado.

**Headers**

```http
X-User-Id: user-123
Accept: application/json
```

**Query parameters**

Nenhum parâmetro é obrigatório ou suportado na primeira versão. Paginação,
busca e ordenação avançadas ficam fora do escopo.

**Sucesso**

- Status: `200 OK`.
- Content-Type: `application/json`.
- A ordem padrão deve ser estável e documentada pela implementação; a opção
  recomendada é do mais recente para o mais antigo.

```json
{
  "documents": [
    {
      "id": "a-valid-document-id",
      "originalName": "contrato.pdf",
      "size": 2048,
      "uploadedAt": "2026-09-15T12:00:00.000Z",
      "owner": "user-123"
    }
  ]
}
```

Para um usuário sem documentos:

```json
{
  "documents": []
}
```

**Erros**

- `400` quando `X-User-Id` estiver ausente ou inválido.
- `500` para falha inesperada ao acessar o repositório em memória.

### 6.3. `GET /documents/:id/download`

Baixa o conteúdo do documento identificado.

**Headers**

```http
X-User-Id: user-123
Accept: application/octet-stream
```

**Path parameter**

- `id`: identificador retornado pela API no upload ou na listagem.
- O valor deve ser validado e usado somente para localizar o metadado; nunca
  deve ser concatenado diretamente a um caminho físico.

**Sucesso**

- Status: `200 OK`.
- Content-Type: deve refletir o tipo conhecido pelo arquivo quando disponível;
  caso contrário, `application/octet-stream`.
- `Content-Length`: tamanho do arquivo quando disponível.
- `Content-Disposition`: `attachment` com o `originalName` sanitizado para
  transporte no header.
- Corpo: bytes exatos do arquivo armazenado.

Exemplo:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 2048
Content-Disposition: attachment; filename="contrato.pdf"
```

**Erros**

- `400` quando `X-User-Id` estiver ausente ou inválido, ou quando o id não
  atender à validação básica.
- `404` quando o documento não existir, pertencer a outro usuário ou não tiver
  arquivo físico disponível.
- `500` para falha inesperada de leitura sem expor o caminho interno.

### 6.4. Comportamento HTTP comum

- A API deve usar os códigos HTTP definidos acima de forma consistente.
- Erros de rota não prevista devem seguir o formato padrão de erro quando
  possível, sem retornar HTML para o cliente da aplicação.
- O CORS não é necessário no fluxo de desenvolvimento previsto porque o Vite
  usa proxy; qualquer necessidade futura deve ser tratada na borda HTTP.
- O frontend deve exibir mensagens de erro baseadas em `error.message`, sem
  depender de texto para decidir lógica; decisões de lógica devem usar
  `error.code`.

## 7. Decisões arquiteturais

### 7.1. Backend

O backend deve usar a Clean Architecture simples definida pelo projeto:

```text
routes -> controllers -> services -> repositories
```

- **`routes/`**: registra os caminhos HTTP, o middleware de upload e a
  associação com os controllers. Não contém regra de negócio.
- **`controllers/`**: lê headers, parâmetros, arquivo e corpo da requisição;
  executa validações básicas; chama o service; transforma o resultado em
  resposta HTTP e encaminha erros para o tratamento da aplicação.
- **`services/`**: aplica as regras de negócio, como associação ao usuário,
  criação de metadados, verificação de ownership, coordenação entre arquivo e
  metadado e tratamento de documentos inexistentes. Não deve depender de
  objetos Express.
- **`repositories/`**: encapsula o armazenamento dos metadados em memória e a
  resolução/leitura dos arquivos no filesystem local. Não deve decidir status
  HTTP nem formatar respostas da API.

A composição das dependências deve ocorrer na inicialização da aplicação. As
camadas internas recebem suas dependências de forma explícita quando isso
reduzir acoplamento, mantendo a implementação simples.

### 7.2. Upload e filesystem

- O middleware deve usar `multer.diskStorage`.
- O diretório padrão é `backend/storage`; a criação do diretório deve ser
  garantida pela inicialização da aplicação ou pela configuração do storage.
- O `destination` deve ser controlado pela aplicação.
- O `filename` deve ser gerado pelo servidor e não pode confiar no nome enviado
  pelo cliente.
- O metadata repository deve guardar o `storageName` necessário para localizar
  o conteúdo, mas a API pública não deve expô-lo.
- A implementação deve evitar path traversal, sobrescrita acidental e acesso
  de um usuário a arquivo de outro usuário.
- O tratamento de falha deve remover arquivo parcial ou órfão quando for seguro
  fazê-lo.

### 7.3. Frontend

- O frontend usa React + Vite em módulos ESM.
- A interface deve ser composta por componentes funcionais com Hooks.
- `UploadComponent` controla seleção e envio do arquivo.
- `DocumentList` carrega e apresenta os metadados do usuário atual.
- `DownloadButton` inicia o download de um documento sem duplicar a lógica de
  construção da URL.
- Um serviço de API centraliza as chamadas `fetch`, o header `X-User-Id`, o
  parse de erros e o prefixo `/api`.
- O usuário corrente pode ser representado por uma configuração simples da
  primeira versão; a especificação não exige tela de autenticação.

### 7.4. Configuração e observabilidade mínima

- `PORT` deve controlar a porta do backend, mantendo o default atual do seed.
- O diretório de armazenamento e o limite de upload devem aceitar configuração
  por ambiente, com defaults apropriados para desenvolvimento local.
- Logs podem registrar método, rota e resultado resumido, mas não devem exibir
  conteúdo do arquivo, credenciais ou caminhos internos desnecessários.
- A implementação deve preservar o endpoint `/health` existente quando integrar
  as rotas de documentos.

## 8. Plano de execução

O plano abaixo descreve a implementação futura. Nesta etapa, nenhum arquivo de
backend, frontend, teste ou CI deve ser alterado como consequência deste
plano.

### Etapa 1 - Preparar o contrato e a composição

**Dependência:** nenhuma.

1. Revisar esta especificação e confirmar nomes de campos, status e códigos de
   erro.
2. Mapear a composição das dependências no `app.js` sem remover o `/health`.
3. Definir as configurações de porta, diretório e limite de upload.
4. Confirmar que `backend/storage` está disponível e não deve ser versionado.

**Validação:** revisar a árvore de dependências e executar o teste de fumaça
existente antes de ampliar o comportamento.

### Etapa 2 - Implementar o backend de documentos

**Dependência:** Etapa 1.

1. Criar o repositório de metadados em memória.
2. Criar a configuração de `multer.diskStorage` para `backend/storage`.
3. Criar o service com as regras de upload, listagem, ownership e download.
4. Criar controllers para entrada, saída e tradução de erros HTTP.
5. Criar routes para `POST /upload`, `GET /documents` e
   `GET /documents/:id/download`.
6. Registrar as rotas no app seguindo `routes -> controllers -> services ->
   repositories`.

**Validação:** `cd backend && npm test`, incluindo casos de sucesso, validação,
isolamento por usuário, arquivo inexistente e limpeza de falhas de upload.

### Etapa 3 - Ampliar os testes do backend

**Dependência:** Etapa 2.

1. Testar upload de arquivo válido e conferir metadados retornados.
2. Testar ausência de arquivo, ausência de usuário e limite de tamanho.
3. Testar listagem vazia, listagem preenchida e isolamento entre usuários.
4. Testar download e comparação dos bytes enviados.
5. Testar `404` para id inexistente, outro usuário e arquivo físico ausente.
6. Isolar o diretório de testes e remover artefatos criados ao final de cada
   caso, sem alterar o armazenamento de desenvolvimento do usuário.

**Validação:** `cd backend && npm test` deve passar sem depender de servidor
externo ou serviço de armazenamento externo.

### Etapa 4 - Implementar o frontend

**Dependência:** Etapas 2 e 3.

1. Criar o serviço de API centralizado com `fetch` e prefixo `/api`.
2. Criar os componentes de upload, listagem e download.
3. Montar a página principal em `App.jsx`.
4. Exibir estados de carregamento, lista vazia, sucesso e erro.
5. Atualizar a listagem após upload bem-sucedido.
6. Garantir que nomes longos, erros e estados vazios não quebrem o layout.

**Validação:** `cd frontend && npm run build`.

### Etapa 5 - Validar a integração local

**Dependência:** Etapa 4.

1. Iniciar o backend com `cd backend && npm run dev`.
2. Iniciar o frontend com `cd frontend && npm run dev`.
3. Confirmar o proxy `/api` para o backend local.
4. Enviar um arquivo pela interface.
5. Confirmar que o documento aparece na listagem.
6. Baixar o documento e comparar o conteúdo com o arquivo original.
7. Confirmar que erros de upload e documento inexistente são apresentados sem
   detalhes internos.

**Validação:** fluxo manual completo de upload, listagem e download.

### Etapa 6 - Automatizar qualidade e entrega

**Dependência:** Etapas 3, 4 e 5.

1. Criar o workflow de CI para instalar dependências do backend e frontend.
2. Executar os testes do backend.
3. Executar o build do frontend.
4. Garantir que a pipeline rode em push e pull request.
5. Revisar se nenhum arquivo de armazenamento local ou segredo é versionado.

**Validação:** workflow concluído com sucesso em uma execução limpa.

### Etapa 7 - Revisão final

**Dependência:** Etapa 6.

1. Conferir todos os requisitos funcionais e não funcionais desta
   especificação.
2. Conferir o fluxo de dependências e a ausência de regras de negócio nas
   routes.
3. Revisar segurança de nomes, caminhos, ownership e mensagens de erro.
4. Revisar documentação e critérios de aceite.
5. Executar a suíte backend e o build frontend antes da entrega.

## 9. Critérios de conclusão do incremento

O incremento será considerado concluído quando:

- Os três endpoints estiverem implementados conforme os contratos desta
  especificação.
- O upload usar `multer.diskStorage` e gravar somente em `backend/storage`.
- Os metadados forem mantidos em memória e não dependerem de banco ou serviço
  externo.
- O isolamento por `X-User-Id` estiver coberto por testes.
- O frontend consumir a API pelo proxy `/api` e permitir upload, listagem e
  download.
- Os testes do backend passarem e o build do frontend for concluído.
- O fluxo de CI executar instalação, testes e build.
- Nenhum caminho físico ou detalhe interno for exposto nas respostas públicas.
