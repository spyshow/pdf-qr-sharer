import React from 'react';

function FileUploadForm({ onFileChange, handleUpload, selectedFile, uploading }) {
  return (
    <div className="upload-section">
      <h2>Upload PDF</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={onFileChange}
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}

export default FileUploadForm;
