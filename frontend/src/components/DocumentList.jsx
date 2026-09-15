import DownloadButton from './DownloadButton';

/**
 * Formata o tamanho em bytes para representação legível (Bytes, KB, MB).
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return '-';
  }
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const normalizedIndex = Math.min(index, units.length - 1);
  const size = (bytes / Math.pow(1024, normalizedIndex)).toFixed(1);

  return `${size.endsWith('.0') ? size.slice(0, -2) : size} ${units[normalizedIndex]}`;
}

/**
 * Formata uma data ISO para o padrão legível pt-BR.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return '-';
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Componente que exibe a listagem de documentos do usuário com ação de download.
 *
 * @param {Object} props
 * @param {Array} props.documents - Lista de documentos retornados pela API.
 * @param {string} props.userId - Identificador do usuário atual.
 * @param {boolean} [props.isLoading] - Indicador de carregamento da listagem.
 * @param {Function} [props.onDownloadError] - Callback em caso de erro no download.
 */
export default function DocumentList({ documents = [], userId, isLoading = false, onDownloadError }) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ padding: '1.5rem', textAlign: 'center', color: '#586069' }}
      >
        <em>Carregando documentos...</em>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f6f8fa',
          border: '1px dashed #d1d5da',
          borderRadius: '6px',
          color: '#586069',
        }}
      >
        <p style={{ margin: 0 }}>Nenhum documento encontrado para este usuário.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-busy={isLoading}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.95rem',
        }}
      >
        <caption
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Documentos disponíveis para download
        </caption>
        <thead>
          <tr style={{ borderBottom: '2px solid #e1e4e8', backgroundColor: '#f6f8fa' }}>
            <th scope="col" style={{ padding: '0.75rem', fontWeight: '600' }}>Nome do Arquivo</th>
            <th scope="col" style={{ padding: '0.75rem', fontWeight: '600', width: '120px' }}>Tamanho</th>
            <th scope="col" style={{ padding: '0.75rem', fontWeight: '600', width: '180px' }}>Data de Envio</th>
            <th scope="col" style={{ padding: '0.75rem', fontWeight: '600', width: '100px', textAlign: 'center' }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              style={{
                borderBottom: '1px solid #e1e4e8',
                transition: 'background-color 0.15s',
              }}
            >
              <td style={{ padding: '0.75rem', wordBreak: 'break-word', fontWeight: '500' }}>
                {doc.originalName}
              </td>
              <td style={{ padding: '0.75rem', color: '#586069' }}>
                {formatFileSize(doc.size)}
              </td>
              <td style={{ padding: '0.75rem', color: '#586069' }}>
                {formatDate(doc.uploadedAt)}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                <DownloadButton
                  documentId={doc.id}
                  filename={doc.originalName}
                  userId={userId}
                  onError={onDownloadError}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
