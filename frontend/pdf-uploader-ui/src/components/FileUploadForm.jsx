import React, { useState, useEffect } from 'react';
import { Upload, Input, Button, Form, Select, Tag } from 'antd'; // Ensure Select and Tag are imported
import { UploadOutlined } from '@ant-design/icons';

// Custom tag rendering function
const customTagRender = (tagProps) => {
  const { label, value, closable, onClose, disabled } = tagProps;
  return (
    <Tag
      color="blue" // Example color
      onClose={onClose}
      closable={!disabled && closable} // Ensure tags are not closable when the component is disabled
      style={{ marginRight: 3 }}
    >
      {label}
    </Tag>
  );
};

function FileUploadForm(props) {
  const [allDbTags, setAllDbTags] = useState([]);
  const [selectedTagValues, setSelectedTagValues] = useState([]); // Renamed from selectedTagsForFile

  // Destructure props for easier use
  const {
    onFileChange,
    handleUpload,
    selectedFile,
    uploading,
    fileName,
    onFileNameChange,
    tags, // This is the comma-separated string from App.jsx
    onTagsChange // This expects an event-like object with { target: { value: "comma,separated,tags" } }
  } = props;

  // Effect to fetch all existing tags from DB for AutoComplete
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('http://192.168.0.48:3001/api/tags');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedTags = await response.json();
        setAllDbTags(fetchedTags); // Store all tags from DB
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };
    fetchTags();
  }, []);

  // Effect to initialize selectedTagValues from props.tags (e.g., when form is cleared/reloaded)
  useEffect(() => {
    setSelectedTagValues(tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []);
  }, [tags]);

  // Effect to update props.onTagsChange when selectedTagValues changes
  useEffect(() => {
    onTagsChange({ target: { value: selectedTagValues.join(',') } });
  }, [selectedTagValues, onTagsChange]);
  
  const handleTagChange = (newSelectedValues) => {
    // Filter out any empty strings that might be introduced if user creates an empty tag
    const validTags = newSelectedValues.map(tag => tag.trim()).filter(tag => tag);
    setSelectedTagValues(validTags);
  };

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
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="Type or select tags"
          value={selectedTagValues}
          onChange={handleTagChange}
          options={allDbTags.map(tag => ({ label: tag, value: tag }))}
          disabled={uploading}
          tagRender={customTagRender}
          tokenSeparators={[',']}
          filterOption={(inputValue, option) =>
            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
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
