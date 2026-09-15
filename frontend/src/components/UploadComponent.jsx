import { useState, useRef } from 'react';
import { uploadDocument } from '../services/api';

/**
 * Componente para seleção e upload de documentos.
 *
 * @param {Object} props
 * @param {string} props.userId - Identificador do usuário que realiza o upload.
 * @param {Function} [props.onUploadSuccess] - Callback chamado após envio bem-sucedido.
 */
export default function UploadComponent({ userId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFeedback({ type: '', message: '' });
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!userId || !userId.trim()) {
      setFeedback({ type: 'error', message: 'Informe um identificador de usuário antes de enviar.' });
      return;
    }

    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Selecione um arquivo para enviar.' });
      return;
    }

    setIsUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      const uploadedDoc = await uploadDocument(selectedFile, userId);
      setFeedback({
        type: 'success',
        message: `Arquivo "${uploadedDoc.originalName || selectedFile.name}" enviado com sucesso!`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadSuccess) {
        onUploadSuccess(uploadedDoc);
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Falha ao realizar o upload do arquivo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section
      style={{
        border: '1px solid #e1e4e8',
        borderRadius: '6px',
        padding: '1.25rem',
        backgroundColor: '#f6f8fa',
        marginBottom: '1.5rem',
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#24292e' }}>
        Enviar Novo Documento
      </h2>
      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            aria-label="Selecionar arquivo para upload"
            style={{
              padding: '0.4rem 0',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="submit"
            disabled={isUploading || !selectedFile || !userId}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: isUploading || !selectedFile || !userId ? 'not-allowed' : 'pointer',
              opacity: isUploading || !selectedFile || !userId ? 0.6 : 1,
              fontWeight: '600',
              fontSize: '0.95rem',
            }}
          >
            {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
          </button>
        </div>

        {feedback.message && (
          <div
            role="alert"
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              backgroundColor: feedback.type === 'success' ? '#dcffe4' : '#ffdce0',
              color: feedback.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${feedback.type === 'success' ? '#34d058' : '#ea4a5a'}`,
            }}
          >
            {feedback.message}
          </div>
        )}
      </form>
    </section>
  );
}
