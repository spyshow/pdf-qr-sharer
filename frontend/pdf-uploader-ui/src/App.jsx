import React, { useState } from "react";
// import "./App.css"; // Removed as per instructions
import FileUploadForm from "./components/FileUploadForm";
import QRCodeDisplay from "./components/QRCodeDisplay";
import ErrorMessage from "./components/ErrorMessage";
import { Layout, Typography, Row, Col } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState("");

  const handleFileChange = (event) => {
    // For Antd Upload, event itself is the file list.
    // For standard input, it's event.target.files.
    // The FileUploadForm is now antd, but its onFileChange prop expects { target: { files: [file] } }
    // This handler in App.jsx is correctly expecting an event-like object from FileUploadForm's onFileChange.
    setSelectedFile(event.target.files[0]);
    setErrorMessage(""); // Clear previous errors
  };

  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleTagsChange = (event) => {
    setTags(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a PDF file first.");
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setQrCodeDataUrl("");
    setPdfUrl("");

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("fileName", fileName);
    formData.append("tags", tags);

    try {
      const response = await fetch("http://192.168.0.48:3001/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({
            message: "Failed to upload file. Server returned an error.",
          }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setPdfUrl(data.pdfUrl);
      setSelectedFile(null); 
      setFileName(""); 
      setTags(""); 
      // The Antd Upload component's file list is controlled by its fileList prop.
      // Resetting selectedFile to null will clear it.
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      setSelectedFile(null); 
      setFileName("");
      setTags("");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handlePrintQrCode = () => {
    window.print();
  };

  return (
    <Layout className="layout">
      <Header>
        <Title level={2} style={{ color: 'white', lineHeight: '64px', margin: 0, textAlign: 'center' }}>
          PDF QR Code Sharer
        </Title>
      </Header>
      <Content style={{ padding: '20px 50px', minHeight: 'calc(100vh - 64px)' }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <div style={{ background: '#fff', padding: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <ErrorMessage errorMessage={errorMessage} />
              <FileUploadForm
                onFileChange={handleFileChange}
                handleUpload={handleUpload}
                selectedFile={selectedFile}
                uploading={uploading}
                fileName={fileName}
                onFileNameChange={handleFileNameChange}
                tags={tags}
                onTagsChange={handleTagsChange}
              />
              <QRCodeDisplay
                qrCodeDataUrl={qrCodeDataUrl}
                pdfUrl={pdfUrl}
                handlePrintQrCode={handlePrintQrCode}
              />
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;
