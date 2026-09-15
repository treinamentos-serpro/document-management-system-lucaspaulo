import { useState, useEffect, useCallback } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/api';

/**
 * Componente principal da aplicação Document Management System (DMS).
 * Gerencia a identificação do usuário, upload, listagem e download de documentos.
 */
export default function App() {
  const [userId, setUserId] = useState('user-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const loadDocuments = useCallback(async (currentUserId, signal) => {
    if (!currentUserId || !currentUserId.trim()) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setGlobalError('');

    try {
      const docs = await listDocuments(currentUserId, signal);
      setDocuments(docs);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setGlobalError(error.message || 'Falha ao carregar lista de documentos.');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(userId, controller.signal);

    return () => controller.abort();
  }, [userId, loadDocuments]);

  const handleUploadSuccess = () => {
    loadDocuments(userId);
  };

  const handleDownloadError = (errorMessage) => {
    setGlobalError(`Erro no download: ${errorMessage}`);
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#24292e',
      }}
    >
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e1e4e8', paddingBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#1a1f23' }}>
          Document Management System
        </h1>
        <p style={{ margin: 0, color: '#586069' }}>
          Gerencie o envio, listagem e download dos seus documentos locais.
        </p>
      </header>

      {/* Seção de Identificação do Usuário */}
      <section
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <label htmlFor="user-id-input" style={{ fontWeight: '600', fontSize: '0.95rem' }}>
          Identificador do Usuário:
        </label>
        <input
          id="user-id-input"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Ex: user-1"
          style={{
            padding: '0.4rem 0.6rem',
            border: '1px solid #d1d5da',
            borderRadius: '4px',
            fontSize: '0.95rem',
            minWidth: '220px',
          }}
        />
        <button
          type="button"
          onClick={() => loadDocuments(userId)}
          disabled={isLoading || !userId.trim()}
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: '#f6f8fa',
            border: '1px solid #d1d5da',
            borderRadius: '4px',
            cursor: isLoading || !userId.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {isLoading ? 'Atualizando...' : 'Recarregar'}
        </button>
      </section>

      {/* Mensagem de Erro Global */}
      {globalError && (
        <div
          role="alert"
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            backgroundColor: '#ffdce0',
            color: '#86181d',
            border: '1px solid #ea4a5a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#86181d',
            }}
            aria-label="Fechar mensagem de erro"
          >
            ✕
          </button>
        </div>
      )}

      {/* Componente de Upload */}
      <UploadComponent userId={userId} onUploadSuccess={handleUploadSuccess} />

      {/* Seção de Listagem de Documentos */}
      <section
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#24292e' }}>
            Meus Documentos
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#586069' }}>
            {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        <DocumentList
          documents={documents}
          userId={userId}
          isLoading={isLoading}
          onDownloadError={handleDownloadError}
        />
      </section>
    </div>
  );
}

