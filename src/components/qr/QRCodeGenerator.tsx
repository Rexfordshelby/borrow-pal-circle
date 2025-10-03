import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Clock } from 'lucide-react';

interface QRCodeGeneratorProps {
  value: string;
  title: string;
  description?: string;
  status?: 'active' | 'scanned' | 'expired';
  onDownload?: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  title,
  description,
  status = 'active',
  onDownload,
}) => {
  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${value}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${title.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    onDownload?.();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'scanned':
        return (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Scanned</span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Expired</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Active - Ready to Scan</span>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="pt-2">{getStatusBadge()}</div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <QRCodeSVG
            id={`qr-code-${value}`}
            value={value}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        <div className="text-center text-sm text-muted-foreground max-w-xs">
          Show this QR code to complete the transaction
        </div>

        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full"
          disabled={status === 'expired'}
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  );
};
