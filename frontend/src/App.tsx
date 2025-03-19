import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import QRPlacementTool from './components/QRPlacementTool';
import PreviewPanel from './components/PreviewPanel';
import './styles/app.css';

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

  const handleFileChange = () => {
    setZipData(null);
    setPreviewImage(null);
  };

  const extractPreviewFromZip = async (arrayBuffer: ArrayBuffer): Promise<string | null> => {
    try {
      // In a real implementation, you would extract a preview from the ZIP
      // For this demo, we'll simulate it by creating a data URL from the first few bytes
      // In production, you'd want to actually extract an image from the ZIP
      
      // Simulate a preview image by creating a data URL
      // This is just a placeholder. In a real app, you'd extract the actual image from the ZIP.
      const uint8Array = new Uint8Array(arrayBuffer);
      return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCACAAIADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=`;
    } catch (error) {
      console.error('Error extracting preview from ZIP:', error);
      return null;
    }
  };

  const handleDownload = async (data: any) => {
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
      setPreviewImage(preview);
      
      // Set ZIP data for download
      setZipData(zipDataArray);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error downloading ZIP:', error);
      alert(`Failed to download QR codes: ${errorMessage}`);
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
        } else {
          alert('Failed to save the ZIP file. Please try again.');
        }
      } catch (error) {
        console.error('Error saving ZIP file:', error);
        alert('An error occurred while saving the ZIP file.');
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo">
          <QrCode size={24} />
          <h1>QR Code Generator</h1>
        </div>
        <div className="tool-selector">
          <label>Select Tool Version:</label>
          <select
            value={toolVersion}
            onChange={(e) => setToolVersion(e.target.value as 'v1' | 'v2')}
          >
            <option value="v1">Version 1 (QR Only)</option>
            <option value="v2">Version 2 (QR + Text)</option>
          </select>
        </div>
      </header>
      
      <div className="app-content">
        <div className="left-panel">
          <QRPlacementTool 
            version={toolVersion} 
            onGenerate={handleDownload} 
            onFileChange={handleFileChange} 
          />
        </div>
        <div className="right-panel">
          <PreviewPanel 
            previewImage={previewImage} 
            zipData={zipData} 
            onSave={handleSave} 
          />
        </div>
      </div>
    </div>
  );
};

export default App;
