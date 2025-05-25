import React from 'react';

function FileUploadForm({
  onFileChange,
  handleUpload,
  selectedFile,
  uploading,
  fileName,
  onFileNameChange,
  tags,
  onTagsChange,
}) {
  return (
    <div className="upload-section">
      <h2>Upload PDF</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={onFileChange}
        disabled={uploading}
      />

      <div className="form-group">
        <label htmlFor="fileNameInput">File Name:</label>
        <input
          type="text"
          id="fileNameInput"
          placeholder="Enter custom file name (optional)"
          value={fileName}
          onChange={onFileNameChange}
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="tagsInput">Tags:</label>
        <input
          type="text"
          id="tagsInput"
          placeholder="Enter tags (comma-separated)"
          value={tags}
          onChange={onTagsChange}
          disabled={uploading}
        />
      </div>

      <button onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}

export default FileUploadForm;
