import { useState } from 'react';
import { downloadDocument } from '../services/api';

/**
 * Componente de botão reutilizável para download de documentos.
 *
 * @param {Object} props
 * @param {string} props.documentId - Identificador único do documento.
 * @param {string} props.filename - Nome do arquivo para download.
 * @param {string} props.userId - Identificador do usuário proprietário.
 * @param {Function} [props.onError] - Callback executado em caso de falha no download.
 */
export default function DownloadButton({ documentId, filename, userId, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadDocument(documentId, userId, filename);
    } catch (error) {
      if (onError) {
        onError(error.message);
      } else {
        alert(`Erro ao baixar arquivo: ${error.message}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading || !userId}
      style={{
        padding: '0.4rem 0.8rem',
        backgroundColor: '#0366d6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: isDownloading || !userId ? 'not-allowed' : 'pointer',
        opacity: isDownloading || !userId ? 0.6 : 1,
        fontSize: '0.9rem',
        fontWeight: '500',
      }}
    >
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
