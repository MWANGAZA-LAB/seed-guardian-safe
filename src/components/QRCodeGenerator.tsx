import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  QrCode, 
  Download, 
  Copy, 
  RefreshCw,
  Settings
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';

interface QRCodeGeneratorProps {
  data?: string;
  size?: number;
  showControls?: boolean;
  onDataChange?: (data: string) => void;
}

interface QRCodeOptions {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    dark: string;
    light: string;
  };
}

export default function QRCodeGenerator({ 
  data = '', 
  size = 256, 
  showControls = true,
  onDataChange 
}: QRCodeGeneratorProps) {
  const [qrData, setQrData] = useState(data);
  const [options, setOptions] = useState<QRCodeOptions>({
    size: size,
    errorCorrectionLevel: 'M',
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrData) {
      generateQRCode();
    }
  }, [qrData, options]);

  const generateQRCode = async () => {
    if (!qrData || !canvasRef.current) return;

    try {
      setIsGenerating(true);
      
      if (!qrData.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter data to encode',
          variant: 'destructive'
        });
        return;
      }

      const canvas = canvasRef.current;

      // Generate QR code using the qrcode library
      await QRCodeLib.toCanvas(canvas, qrData, {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.color.dark,
          light: options.color.light
        },
        errorCorrectionLevel: options.errorCorrectionLevel
      });

      logger.info('QR code generated successfully');
      toast({
        title: 'Success',
        description: 'QR code generated successfully'
      });
      
    } catch (err) {
      logger.error('Failed to generate QR code', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDataChange = (newData: string) => {
    setQrData(newData);
    onDataChange?.(newData);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: "QR code downloaded successfully",
    });
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        });
      });

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      toast({
        title: "Copied",
        description: "QR code copied to clipboard",
      });
    } catch (err) {
      logger.error('Failed to copy QR code', err instanceof Error ? err : new Error(String(err)));
      toast({
        title: "Error",
        description: "Failed to copy QR code",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    generateQRCode();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Input */}
        {showControls && (
          <div>
            <Label htmlFor="qrData">Data to Encode</Label>
            <Input
              id="qrData"
              value={qrData}
              onChange={(e) => handleDataChange(e.target.value)}
              placeholder="Enter text, URL, or data to encode"
            />
          </div>
        )}

        {/* Options */}
        {showOptions && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">Size (px)</Label>
                <Input
                  id="size"
                  type="number"
                  min="100"
                  max="1000"
                  value={options.size}
                  onChange={(e) => setOptions({ ...options, size: parseInt(e.target.value) || 256 })}
                />
              </div>
              <div>
                <Label htmlFor="margin">Margin</Label>
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="20"
                  value={options.margin}
                  onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="errorLevel">Error Correction</Label>
              <select
                id="errorLevel"
                value={options.errorCorrectionLevel}
                onChange={(e) => setOptions({ ...options, errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="darkColor">Dark Color</Label>
                <Input
                  id="darkColor"
                  type="color"
                  value={options.color.dark}
                  onChange={(e) => setOptions({ 
                    ...options, 
                    color: { ...options.color, dark: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="lightColor">Light Color</Label>
                <Input
                  id="lightColor"
                  type="color"
                  value={options.color.light}
                  onChange={(e) => setOptions({ 
                    ...options, 
                    color: { ...options.color, light: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={options.size}
              height={options.size}
              className="border rounded-lg"
            />
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Options
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!qrData || isGenerating}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrData || isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Data Preview */}
        {qrData && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Encoded Data:</p>
            <p className="text-sm font-mono break-all">{qrData}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
