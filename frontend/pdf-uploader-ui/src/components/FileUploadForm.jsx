import React from 'react';
import { Upload, Input, Button, Form } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

function FileUploadForm(props) {
  // Destructure props for easier use
  const {
    onFileChange,
    handleUpload,
    selectedFile,
    uploading,
    fileName,
    onFileNameChange,
    tags,
    onTagsChange
  } = props;

  // Handler for antd Upload component's onChange event
  // This is to ensure we clear the file list visually if the user removes the file
  // and to map the antd file object to what onFileChange expects.
  const handleAntdUploadChange = (info) => {
    if (info.fileList.length === 0) {
      // File removed by user
      onFileChange({ target: { files: [] } });
    } else {
      // File selected by user
      // beforeUpload handles the initial selection and calls onFileChange
      // This part might be redundant if beforeUpload is always sufficient
      // but good for completeness if other actions trigger change.
      // We take the latest file, assuming maxCount={1}
      // const file = info.fileList[0]?.originFileObj;
      // if (file) {
      //   onFileChange({ target: { files: [file] } });
      // }
    }
  };

  return (
    <Form layout="vertical" className="upload-section">
      <Form.Item label="Select PDF">
        <Upload
          accept=".pdf"
          beforeUpload={file => {
            // Call onFileChange with the expected structure
            onFileChange({ target: { files: [file] } });
            return false; // Prevent antd from making an HTTP request
          }}
          onRemove={() => {
            // Call onFileChange with an empty array to signify removal
            onFileChange({ target: { files: [] } });
          }}
          onChange={handleAntdUploadChange} // Handle visual changes like file removal
          maxCount={1}
          disabled={uploading}
          // To display the selected file:
          // fileList expects an array. If selectedFile is present, create an array for it.
          // 'uid' is a required unique key. '-1' is fine for a single file.
          // 'name' is the displayed file name.
          // 'status: 'done'' makes it look like a successfully selected file (not uploading).
          // 'originFileObj' can be useful to store the original File object.
          fileList={selectedFile ? [{ uid: '-1', name: selectedFile.name, status: 'done', originFileObj: selectedFile }] : []}
        >
          <Button icon={<UploadOutlined />} disabled={uploading}>
            {selectedFile ? selectedFile.name : "Click to Select PDF"}
          </Button>
        </Upload>
      </Form.Item>

      <Form.Item label="File Name">
        <Input
          placeholder="Enter custom file name (optional)"
          value={fileName}
          onChange={onFileNameChange} // App.jsx already handles event.target.value
          disabled={uploading}
        />
      </Form.Item>

      <Form.Item label="Tags">
        <Input
          placeholder="Enter tags (comma-separated)"
          value={tags}
          onChange={onTagsChange} // App.jsx already handles event.target.value
          disabled={uploading}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          loading={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default FileUploadForm;
