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
  const [toast, setToast] = useState<string | null>(null);

  const handleFileChange = () => {
    setZipData(null);
    setPreviewImage(null);
  };

  const extractPreviewFromZip = async (arrayBuffer: ArrayBuffer): Promise<string | null> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(arrayBuffer);
      
      const imageFiles = Object.keys(contents.files).filter(filename => 
        filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')
      );
      
      if (imageFiles.length > 0) {
        const firstImage = imageFiles[0];
        const imageBlob = await contents.files[firstImage].async('blob');
        return URL.createObjectURL(imageBlob);
      }
      
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
      
      const preview = await extractPreviewFromZip(arrayBuffer);
      
      setZipData(zipDataArray);
      setPreviewImage(preview);
      setCurrentView('preview');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error downloading ZIP:', error);
      if (errorMessage === "The email provided is not valid") {
        setToast('Invalid email provided. Please use a registered email address.');
      } else {
        setToast(`Failed to generate QR codes: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (zipData) {
      const chunkSize = 8192;
      let binaryString = '';
      for (let i = 0; i < zipData.length; i += chunkSize) {
        const chunk = zipData.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Data = btoa(binaryString);
      try {
        const success = await window.go.main.App.SaveFile('guest_qr_images.zip', base64Data);
        if (success) {
          setZipData(null);
          setPreviewImage(null);
          setCurrentView('upload');
        } else {
          setToast('Failed to save the ZIP file. Please try again.');
        }
      } catch (error) {
        console.error('Error saving ZIP file:', error);
        setToast('An error occurred while saving the ZIP file.');
      }
    }
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="app-container">
      {loading && <Preloader loading={loading} />}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
      
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