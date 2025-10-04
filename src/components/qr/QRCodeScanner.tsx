import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => Promise<void>;
  title: string;
  description?: string;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  title,
  description,
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleScan = async (result: any) => {
    if (result?.text) {
      setScanning(false);
      try {
        await onScan(result.text);
        setSuccess(true);
        setError(null);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process QR code');
      }
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
    setError('Camera access denied or unavailable. Please check permissions.');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {!scanning && !success && (
          <Button
            onClick={() => {
              setScanning(true);
              setError(null);
            }}
            className="w-full"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Camera
          </Button>
        )}

        {scanning && (
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-primary bg-muted">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%' }}
                constraints={{
                  video: { facingMode: 'environment' }
                }}
              />
            </div>
            <Button
              onClick={() => setScanning(false)}
              variant="outline"
              className="w-full"
            >
              Cancel Scanning
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-success bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              QR code scanned successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">📱 Position the QR code within the camera view</p>
          <p>🔒 Secure verification via Supabase</p>
        </div>
      </CardContent>
    </Card>
  );
};
