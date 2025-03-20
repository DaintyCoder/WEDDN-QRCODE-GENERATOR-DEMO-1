import React, { useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Upload, Loader2 } from 'lucide-react';

interface Coords { 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
}

interface QRPlacementToolProps {
  version: 'v1' | 'v2';
  onGenerate: (data: any) => Promise<void>;
  onFileChange: () => void;
}

const QRPlacementTool: React.FC<QRPlacementToolProps> = ({ version, onGenerate, onFileChange }) => {
  const [image, setImage] = useState<string | null>(null);
  const [qrCoords, setQrCoords] = useState<Coords>({ x: 50, y: 50, width: 100, height: 100 });
  const [textCoords, setTextCoords] = useState<Coords>({ x: 50, y: 200, width: 200, height: 50 });
  const [email, setEmail] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      setImageDimensions({ width: img.width, height: img.height });
      setImage(imgURL);
      onFileChange();
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

  return (
    <div className="qr-placement-tool">
      <div 
        className={`file-drop-area ${isDragging ? 'active' : ''} ${image ? 'hidden' : ''}`}
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

      {image && (
        <div className="canvas-container">
          <canvas ref={canvasRef} />
          <Rnd
            size={{ width: qrCoords.width, height: qrCoords.height }}
            position={{ x: qrCoords.x, y: qrCoords.y }}
            bounds="parent"
            onDragStop={(e, d) => setQrCoords({ ...qrCoords, x: d.x, y: d.y })}
            onResizeStop={(e, dir, ref, delta, pos) => setQrCoords({
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              x: pos.x,
              y: pos.y,
            })}
            className="qr-drag-handle"
          >
            <div className="drag-handle-label qr-label">QR Code</div>
          </Rnd>
          {version === 'v2' && (
            <Rnd
              size={{ width: textCoords.width, height: textCoords.height }}
              position={{ x: textCoords.x, y: textCoords.y }}
              bounds="parent"
              onDragStop={(e, d) => setTextCoords({ ...textCoords, x: d.x, y: d.y })}
              onResizeStop={(e, dir, ref, delta, pos) => setTextCoords({
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: pos.x,
                y: pos.y,
              })}
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