/**
 * Cliente de API para comunicação com o backend do DMS via /api.
 */

const API_BASE_URL = '/api';

/**
 * Extrai a mensagem de erro da resposta HTTP ou retorna uma mensagem padrão.
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function parseErrorMessage(response) {
  try {
    const data = await response.json();
    if (data?.error?.message) {
      return data.error.message;
    }
  } catch {
    // Se a resposta não for JSON, ignora e usa statusText
  }
  return `Erro na requisição (${response.status}: ${response.statusText})`;
}

/**
 * Envia um arquivo para o backend.
 * @param {File} file - Arquivo a ser enviado.
 * @param {string} userId - Identificador do usuário.
 * @returns {Promise<Object>} Dados do documento criado.
 */
export async function uploadDocument(file, userId) {
  if (!file) {
    throw new Error('Nenhum arquivo selecionado para upload.');
  }
  if (!userId || !userId.trim()) {
    throw new Error('Identificador de usuário é obrigatório.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'X-User-Id': userId.trim(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.document;
}

/**
 * Obtém a lista de documentos pertencentes ao usuário.
 * @param {string} userId - Identificador do usuário.
 * @returns {Promise<Array>} Lista de documentos.
 */
export async function listDocuments(userId) {
  if (!userId || !userId.trim()) {
    throw new Error('Identificador de usuário é obrigatório.');
  }

  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId.trim(),
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.documents || [];
}

/**
 * Realiza o download de um documento pelo seu identificador.
 * @param {string} documentId - Identificador do documento.
 * @param {string} userId - Identificador do usuário.
 * @param {string} [fallbackFilename] - Nome de arquivo padrão para download caso não venha no header.
 */
export async function downloadDocument(documentId, userId, fallbackFilename = 'documento') {
  if (!documentId) {
    throw new Error('Identificador do documento é obrigatório.');
  }
  if (!userId || !userId.trim()) {
    throw new Error('Identificador de usuário é obrigatório.');
  }

  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/download`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId.trim(),
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    throw new Error(errorMessage);
  }

  // Tenta extrair o nome do arquivo do header Content-Disposition
  let filename = fallbackFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
