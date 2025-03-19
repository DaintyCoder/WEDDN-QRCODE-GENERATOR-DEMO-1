import React, { useState, useEffect } from 'react';
import { QrCode, Terminal } from 'lucide-react';
import QRPlacementTool from './components/QRPlacementTool';
import PreviewPanel from './components/PreviewPanel';
import Preloader from './components/Preloader';
import './App.css';
import JSZip from 'jszip';

// Declare the window.go interface for Wails
declare global {
  interface Window {
    go: {
      main: {
        App: {
          SaveFile: (filename: string, base64Data: string) => Promise<boolean>;
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [toolVersion, setToolVersion] = useState<'v1' | 'v2'>('v2');
  const [zipData, setZipData] = useState<Uint8Array | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'upload' | 'preview'>('upload');

  const handleFileChange = () => {
    setZipData(null);
    setPreviewImage(null);
  };

  // Extract an actual QR-overlaid image from the ZIP for preview
  const extractPreviewFromZip = async (arrayBuffer: ArrayBuffer): Promise<string | null> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(arrayBuffer);
      
      // Look for image files in the zip
      const imageFiles = Object.keys(contents.files).filter(filename => 
        filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')
      );
      
      // If we found image files, extract the first one
      if (imageFiles.length > 0) {
        const firstImage = imageFiles[0];
        const imageBlob = await contents.files[firstImage].async('blob');
        return URL.createObjectURL(imageBlob);
      }
      
      // Fallback to a placeholder if no images are found
      console.error('No image files found in the ZIP');
      return null;
    } catch (error) {
      console.error('Error extracting preview from ZIP:', error);
      return null;
    }
  };

  const handleDownload = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4006/guest/overlay-qr-code-with-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate QR codes');
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const zipDataArray = new Uint8Array(arrayBuffer);
      
      // Extract a preview image from the ZIP
      const preview = await extractPreviewFromZip(arrayBuffer);
      
      // Set ZIP data for download
      setZipData(zipDataArray);
      
      // Set the preview image from the ZIP
      setPreviewImage(preview);
      
      // Switch to preview view
      setCurrentView('preview');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error downloading ZIP:', error);
      alert(`Failed to download QR codes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (zipData) {
      // Convert Uint8Array to base64 in chunks to avoid stack overflow
      const chunkSize = 8192; // Process 8KB at a time
      let binaryString = '';
      for (let i = 0; i < zipData.length; i += chunkSize) {
        const chunk = zipData.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Data = btoa(binaryString);
      try {
        const success = await window.go.main.App.SaveFile('guest_qr_images.zip', base64Data);
        if (success) {
          setZipData(null); // Clear zipData after saving
          setPreviewImage(null); // Clear preview after saving
          setCurrentView('upload'); // Return to upload view
        } else {
          alert('Failed to save the ZIP file. Please try again.');
        }
      } catch (error) {
        console.error('Error saving ZIP file:', error);
        alert('An error occurred while saving the ZIP file.');
      }
    }
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
  };

  return (
    <div className="app-container">
      {loading && <Preloader loading={loading} />}
      
      <header className="app-header">
        <div className="app-logo">
          <QrCode className="app-icon" />
          <h1>QR Code Generator</h1>
        </div>
        
        {currentView === 'upload' && (
          <div className="tool-selector">
            <label>Tool Version:</label>
            <select
              value={toolVersion}
              onChange={(e) => setToolVersion(e.target.value as 'v1' | 'v2')}
            >
              <option value="v1">Version 1 (QR Only)</option>
              <option value="v2">Version 2 (QR + Text)</option>
            </select>
          </div>
        )}
      </header>
      
      <main className="app-content">
        {currentView === 'upload' ? (
          <div className="tool-panel full-width">
            <QRPlacementTool 
              version={toolVersion} 
              onGenerate={handleDownload} 
              onFileChange={handleFileChange} 
            />
          </div>
        ) : (
          <div className="preview-panel full-width">
            <PreviewPanel 
              previewImage={previewImage} 
              zipData={zipData} 
              onSave={handleSave}
              onBack={handleBackToUpload}
            />
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <span>QR Code Generator v1.0</span>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              console.log('QR Code Generator - Built with Wails and React');
            }}
            className="dev-link"
          >
            <Terminal className="footer-icon" />
            <span>Developer Console</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;