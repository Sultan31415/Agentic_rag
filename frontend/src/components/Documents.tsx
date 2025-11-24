import { useState, useEffect, useRef } from 'react';
import type { Document } from '../types';
import { documentAPI } from '../api';
import './Documents.css';

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.list();
      setDocuments(response.documents || []);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setError('Only PDF and TXT files are supported');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(`Uploading ${file.name}...`);

      const response = await documentAPI.upload(file);
      
      setUploadProgress(`Processing ${file.name}...`);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(`Successfully added ${file.name} to knowledge base!`);
      
      // Reload documents
      await loadDocuments();
      
      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 3000);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await documentAPI.delete(filename);
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>Knowledge Base Documents</h1>
        <p>Upload PDF or TXT files to add them to your knowledge base</p>
      </div>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        <button
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳ Uploading...' : '📎 Upload Document'}
        </button>
        
        {uploadProgress && (
          <div className="upload-progress">
            {uploadProgress}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      <div className="documents-list">
        {loading ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents yet. Upload your first document to get started!</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.filename} className="document-card">
                <div className="document-icon">
                  {doc.filename.endsWith('.pdf') ? '📄' : '📝'}
                </div>
                <div className="document-info">
                  <div className="document-name">{doc.filename}</div>
                  <div className="document-meta">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.modified)}</span>
                  </div>
                </div>
                <button
                  className="delete-document-btn"
                  onClick={() => handleDelete(doc.filename)}
                  title="Delete document"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

