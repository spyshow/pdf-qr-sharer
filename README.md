# PDF QR Sharer

PDF QR Sharer is a simple full-stack web application that allows you to upload PDF files and generates a QR code for easy sharing and access across devices on the same Local Area Network (LAN). The application is designed to work offline within your LAN, making it convenient for sharing documents without internet access.

## Features

*   **Upload PDF files:** Easily upload PDF documents through a web interface.
*   **QR Code Generation:** Automatically generates a QR code for the uploaded PDF.
*   **LAN Access:** The QR code links to the PDF served by a local backend server, accessible from any device on the same LAN.
*   **Serves PDFs Locally:** Uploaded PDFs are stored and served by the backend server.
*   **Works Offline:** Fully functional within a LAN environment without needing an active internet connection (after initial setup).
*   **Print QR Code:** Button to print the generated QR code and its associated link for physical sharing or record-keeping.

## Prerequisites

*   Node.js (which includes npm) must be installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

## Setup and Installation

1.  **Clone the repository** (or download and extract the files):
    ```bash
    git clone <repository-url>
    cd pdf-qr-sharer
    ```

2.  **Install dependencies:**
    You need to install dependencies for the root project, the backend, and the frontend separately.

    *   **Root project dependencies:**
        Navigate to the root `pdf-qr-sharer` directory and run:
        ```bash
        npm install
        ```

    *   **Backend dependencies:**
        Navigate to the `backend` directory:
        ```bash
        cd backend
        npm install
        cd .. 
        ```
        Alternatively, from the root directory:
        ```bash
        npm install --prefix backend
        ```

    *   **Frontend dependencies:**
        Navigate to the `frontend/pdf-uploader-ui` directory:
        ```bash
        cd frontend/pdf-uploader-ui
        npm install
        cd ../.. 
        ```
        Alternatively, from the root directory:
        ```bash
        npm install --prefix frontend/pdf-uploader-ui
        ```

    **Note:** Running `npm install` in the root directory *only* installs dependencies for the root `package.json` (which includes `concurrently` for running both parts of the app). It does not automatically install dependencies for the backend or frontend workspaces.

## Running the Application

1.  **Navigate to the root `pdf-qr-sharer` directory.**
    If you're not already there:
    ```bash
    cd path/to/pdf-qr-sharer
    ```

2.  **Start the application:**
    Run the `dev` script using npm:
    ```bash
    npm run dev
    ```

3.  **How it works:**
    *   This command uses `concurrently` to start both the backend server and the frontend development server.
    *   **Backend:** The Express.js server will typically start on `http://localhost:3001`. It will also log the server's IP address and port to the console (e.g., `Server is running on http://192.168.1.X:3001`). This IP address is what other devices on your LAN will use to access the PDFs via the QR code.
    *   **Frontend:** The React (Vite) development server will typically start on `http://localhost:5173` (or another port if 5173 is busy). Your browser might open automatically to this address, or you can navigate to it manually.

4.  **Accessing the application:**
    *   Open your web browser and go to the frontend URL (e.g., `http://localhost:5173`) to use the PDF uploader.
    *   Once a PDF is uploaded, a QR code will be displayed. Scan this QR code with another device (e.g., a smartphone or tablet) on the same LAN to view the PDF.

## How it Works

1.  The user selects a PDF file using the frontend interface and clicks "Upload."
2.  The PDF is sent to the backend server.
3.  The backend saves the PDF to the `pdf-qr-sharer/backend/uploads/` directory.
4.  The backend generates a unique URL pointing to the saved PDF (using its local IP address and port).
5.  The backend generates a QR code image from this URL.
6.  The backend sends the PDF URL and the QR code data (as a data URL) back to the frontend.
7.  The frontend displays the QR code image and the direct link to the PDF.
8.  The user can then scan the QR code with any device on the same LAN to download or view the PDF, or use the "Print QR Code" button to print this information.

## Folder Structure

*   `/` (root `pdf-qr-sharer` directory)
    *   `package.json`: Manages overall project scripts, including `concurrently` to run both backend and frontend.
    *   `README.md`: This file.
*   `/backend`
    *   `package.json`: Manages backend dependencies (Express, multer, qrcode, ip).
    *   `index.js`: The main Express.js server file. Handles file uploads, QR code generation, and serving PDFs.
    *   `/uploads`: (Created at runtime) Directory where uploaded PDF files are stored.
*   `/frontend/pdf-uploader-ui`
    *   `package.json`: Manages frontend dependencies (React, Vite).
    *   `/src`: Contains the React application source code.
        *   `App.jsx`: The main React component for the UI.
    *   `vite.config.js`: Vite configuration file.
    *   `index.html`: The main HTML file for the React application.
