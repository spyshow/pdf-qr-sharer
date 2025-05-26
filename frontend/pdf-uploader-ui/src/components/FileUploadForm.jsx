import React, { useState, useEffect } from 'react';
import { Upload, Input, Button, Form, AutoComplete, Tag, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

function FileUploadForm(props) {
  const [allDbTags, setAllDbTags] = useState([]);
  const [currentTagInputValue, setCurrentTagInputValue] = useState('');
  const [selectedTagsForFile, setSelectedTagsForFile] = useState([]);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

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

  // Effect to initialize selectedTagsForFile from props.tags (e.g., when form is cleared/reloaded)
  useEffect(() => {
    setSelectedTagsForFile(tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []);
  }, [tags]);

  // Effect to update props.onTagsChange when selectedTagsForFile changes
  useEffect(() => {
    onTagsChange({ target: { value: selectedTagsForFile.join(',') } });
  }, [selectedTagsForFile, onTagsChange]);
  
  // Effect to update AutoComplete options based on currentTagInputValue and allDbTags
  useEffect(() => {
    if (currentTagInputValue) {
      const filtered = allDbTags
        .filter(tag => tag.toLowerCase().includes(currentTagInputValue.toLowerCase()))
        .filter(tag => !selectedTagsForFile.includes(tag)); // Don't suggest already selected tags
      setAutoCompleteOptions(filtered.map(tag => ({ value: tag })));
    } else {
      setAutoCompleteOptions([]);
    }
  }, [currentTagInputValue, allDbTags, selectedTagsForFile]);


  const handleAddTag = (tagValue) => {
    const trimmedValue = tagValue.trim();
    if (trimmedValue && !selectedTagsForFile.includes(trimmedValue)) {
      setSelectedTagsForFile([...selectedTagsForFile, trimmedValue]);
    }
    setCurrentTagInputValue(''); // Clear input field
    setAutoCompleteOptions([]); // Clear suggestions
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTagsForFile(selectedTagsForFile.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (value) => {
    // For AutoComplete, `value` is the string. For Input, it's `e.target.value`.
    // AutoComplete's onChange provides the value directly.
    setCurrentTagInputValue(typeof value === 'string' ? value : value.target.value);
  };
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && currentTagInputValue) {
      e.preventDefault();
      handleAddTag(currentTagInputValue);
    }
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <AutoComplete
            options={autoCompleteOptions}
            style={{ width: '100%' }}
            onSelect={handleAddTag} // value from option is passed directly
            value={currentTagInputValue} // Controlled by the same state as Input
            onChange={handleInputChange} // Handles text changes in AutoComplete's input
            disabled={uploading}
            onKeyDown={handleInputKeyDown} // Allow Enter from AutoComplete's input too
            placeholder="Type or select a tag"
          >
            {/* We can use a custom Input component if more control is needed, 
                but AutoComplete by default renders an Input. 
                If using a separate Input and AutoComplete, ensure their states are managed.
                For simplicity, this setup uses AutoComplete's built-in input,
                and `handleInputChange` + `handleInputKeyDown` are bound to it.
            */}
          </AutoComplete>
          
          <div style={{ marginTop: 8 }}>
            {selectedTagsForFile.map((tag) => (
              <Tag
                closable
                key={tag}
                onClose={() => handleRemoveTag(tag)}
                style={{ marginBottom: 4 }}
                disabled={uploading}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </Space>
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
