import { useEffect, useRef, useState } from 'react';

interface TransparentImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TransparentImage({ src, alt = '', className = '', style = {} }: TransparentImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedSrc, setProcessedSrc] = useState<string>('');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Make white pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is white or very close to white, make it transparent
        if (r > 240 && g > 240 && b > 240) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to data URL
      setProcessedSrc(canvas.toDataURL());
    };

    img.src = src;
  }, [src]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {processedSrc && (
        <img 
          src={processedSrc} 
          alt={alt} 
          className={className}
          style={style}
        />
      )}
    </>
  );
}
