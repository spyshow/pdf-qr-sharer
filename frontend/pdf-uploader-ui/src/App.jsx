import React, { useState, useCallback } from "react";
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

  const handleFileChange = useCallback((event) => {
    // For Antd Upload, event itself is the file list.
    // For standard input, it's event.target.files.
    // The FileUploadForm is now antd, but its onFileChange prop expects { target: { files: [file] } }
    // This handler in App.jsx is correctly expecting an event-like object from FileUploadForm's onFileChange.
    setSelectedFile(event.target.files[0]);
    setErrorMessage(""); // Clear previous errors
  }, []); // setSelectedFile and setErrorMessage are stable

  const handleFileNameChange = useCallback((event) => {
    setFileName(event.target.value);
  }, []); // setFileName is stable

  const handleTagsChange = useCallback((event) => {
    setTags(event.target.value);
  }, []); // setTags is stable

  const handleUpload = useCallback(async () => {
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

      // Specific handling for 409 Conflict
      if (response.status === 409) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "A file with this name or resulting URL already exists. Please adjust the file name or tags.");
        setSelectedFile(null); // Clear only the file, so user can adjust name/tags
        // Do not clear fileName or tags here
        setUploading(false); // Ensure uploading state is reset before early return
        return; 
      }

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

      // If response is ok (e.g. 200)
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
  }, [selectedFile, fileName, tags]); // State setters are stable and not needed here

  const handlePrintQrCode = useCallback(() => {
    window.print();
  }, []); // No dependencies

  return (
    <Layout className="layout">
      <Header>
        <Title level={2} style={{ color: 'white', lineHeight: '64px', margin: 0, textAlign: 'center' }}>
          PDF QR Code Sharer
        </Title>
      </Header>
      <Content style={{ padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
        <Row justify="center">
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
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
                fileName={fileName}
                tags={tags}
              />
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;
