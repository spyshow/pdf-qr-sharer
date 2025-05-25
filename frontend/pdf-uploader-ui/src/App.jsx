import React, { useState } from "react";
import "./App.css";
import FileUploadForm from "./components/FileUploadForm";
import QRCodeDisplay from "./components/QRCodeDisplay";
import ErrorMessage from "./components/ErrorMessage";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState("");

  const handleFileChange = (event) => {
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
      setSelectedFile(null); // Clear the file input
      setFileName(""); // Clear the fileName input
      setTags(""); // Clear the tags input
      // Clear the actual file input element by resetting its value if possible, or tell user
      // This is tricky as file input is largely uncontrolled for security reasons
      // For now, clearing selectedFile state is the main part.
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = "";
      }
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      setSelectedFile(null); 
      setFileName("");
      setTags("");
      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = "";
      }
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      // Resetting file, filename and tags if they were not reset due to an error before catch.
      // However, this might clear user input if upload is retried without re-selecting file.
      // For this subtask, let's ensure they are cleared if an error occurred and not cleared in success.
      // The current placement in try/catch should handle it.
      // If selectedFile is still present, it means upload failed before success or explicit error handling
      // if (selectedFile) { 
      //    setSelectedFile(null);
      //    setFileName("");
      //    setTags("");
      // }
    }
  };

  const handlePrintQrCode = () => {
    window.print();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF QR Code Sharer</h1>
      </header>
      <main>
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
      </main>
    </div>
  );
}

export default App;
