import React, { useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Upload, Loader2, Info, ArrowLeft } from 'lucide-react';

interface Coords { 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
}

interface QRPlacementToolProps {
  version: 'v1' | 'v2';
  onGenerate: (data: any) => Promise<void>;
  onFileChange: (image: string | null, dimensions: { width: number; height: number } | null) => void;
  image: string | null;
  qrCoords: Coords;
  textCoords: Coords;
  imageDimensions: { width: number; height: number } | null;
  onCoordsChange: (qrCoords: Coords, textCoords: Coords) => void;
}

const QRPlacementTool: React.FC<QRPlacementToolProps> = ({
  version,
  onGenerate,
  onFileChange,
  image,
  qrCoords,
  textCoords,
  imageDimensions,
  onCoordsChange,
}) => {
  const [email, setEmail] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const imgURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = imgURL;
    img.onload = () => {
      console.log('Image loaded:', imgURL);
      onFileChange(imgURL, { width: img.width, height: img.height });
    };
  };

  const drawCanvas = () => {
    if (image && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = image;
        img.onload = () => {
          const maxWidth = 800;
          canvasRef.current!.width = Math.min(img.width, maxWidth);
          canvasRef.current!.height = (img.height / img.width) * canvasRef.current!.width;
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
        };
        if (img.complete) {
          const maxWidth = 800;
          canvasRef.current!.width = Math.min(img.width, maxWidth);
          canvasRef.current!.height = (img.height / img.width) * canvasRef.current!.width;
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
        }
      }
    }
  };

  useEffect(() => {
    console.log('Image prop changed:', image);
    drawCanvas();
  }, [image]);

  const handleGenerate = async () => {
    if (image && imageDimensions && canvasRef.current) {
      setLoading(true);
      try {
        const response = await fetch(image);
        const blob = await response.blob();
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const qrCoordinates = {
          x: Math.round(qrCoords.x * imageDimensions.width / canvasRef.current!.width),
          y: Math.round(qrCoords.y * imageDimensions.height / canvasRef.current!.height),
          width: Math.round(qrCoords.width * imageDimensions.width / canvasRef.current!.width),
          height: Math.round(qrCoords.height * imageDimensions.height / canvasRef.current!.height),
        };

        const data = {
          image: base64Image,
          qrCoordinates,
          textCoordinates: version === 'v2' ? {
            x: Math.round(textCoords.x * imageDimensions.width / canvasRef.current!.width),
            y: Math.round(textCoords.y * imageDimensions.height / canvasRef.current!.height),
            width: Math.round(textCoords.width * imageDimensions.width / canvasRef.current!.width),
            height: Math.round(textCoords.height * imageDimensions.height / canvasRef.current!.height),
          } : {},
          email: email
        };

        await onGenerate(data);
      } catch (error) {
        console.error('Error generating QR codes:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQrDragStop = (e: any, d: any) => {
    const newQrCoords = { ...qrCoords, x: d.x, y: d.y };
    onCoordsChange(newQrCoords, textCoords);
  };

  const handleQrResizeStop = (e: any, dir: any, ref: any, delta: any, pos: any) => {
    const newQrCoords = {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
      x: pos.x,
      y: pos.y,
    };
    onCoordsChange(newQrCoords, textCoords);
  };

  const handleTextDragStop = (e: any, d: any) => {
    const newTextCoords = { ...textCoords, x: d.x, y: d.y };
    onCoordsChange(qrCoords, newTextCoords);
  };

  const handleTextResizeStop = (e: any, dir: any, ref: any, delta: any, pos: any) => {
    const newTextCoords = {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
      x: pos.x,
      y: pos.y,
    };
    onCoordsChange(qrCoords, newTextCoords);
  };

  const handleBackClick = () => {
    console.log('Back button clicked, resetting image');
    onFileChange(null, null);
  };

  return (
    <div className="qr-placement-tool">
      <div className="editor-controls">
        <button 
          className="info-button"
          onClick={() => setShowInfo(!showInfo)}
          title="About this tool"
        >
          <Info className="info-icon" />
        </button>
      </div>

      {showInfo && (
        <div className="info-panel">
          <p>This QR Code Generator allows you to overlay QR codes and text onto your images. Drag and resize the QR Code and Text boxes to position them, enter your email, and generate a ZIP file containing your customized images.</p>
        </div>
      )}

      {!image ? (
        <div 
          className={`file-drop-area ${isDragging ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file.type.includes('image/')) {
                processFile(file);
              }
            }
          }}
        >
          <div className="file-drop-content">
            <Upload size={48} className="file-drop-icon" />
            <p className="file-drop-text">Click or drag an image here</p>
            <p className="file-drop-hint">Supported formats: JPG, PNG, SVG</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="canvas-container">
          <button className="editor-back-button" onClick={handleBackClick}>
            <ArrowLeft className="back-arrow" />
          </button>
          <canvas ref={canvasRef} />
          <Rnd
            size={{ width: qrCoords.width, height: qrCoords.height }}
            position={{ x: qrCoords.x, y: qrCoords.y }}
            bounds="parent"
            onDragStop={handleQrDragStop}
            onResizeStop={handleQrResizeStop}
            className="qr-drag-handle"
          >
            <div className="drag-handle-label qr-label">QR Code</div>
          </Rnd>
          {version === 'v2' && (
            <Rnd
              size={{ width: textCoords.width, height: textCoords.height }}
              position={{ x: textCoords.x, y: textCoords.y }}
              bounds="parent"
              onDragStop={handleTextDragStop}
              onResizeStop={handleTextResizeStop}
              className="text-drag-handle"
            >
              <div className="drag-handle-label text-label">Text</div>
            </Rnd>
          )}
        </div>
      )}

      <div className="button-container">
        {image && (
          <>
            <div className="email-input-container">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="email-input"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="generate-button"
              disabled={!image || loading || !email}
            >
              {loading ? (
                <div className="loading-indicator">
                  <Loader2 className="loading-icon" />
                  <span>Generating...</span>
                </div>
              ) : (
                <span>Generate QR Codes</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRPlacementTool;