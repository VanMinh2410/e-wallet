import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/Button';
import styles from './QrScanner.module.css';

interface QrScannerProps {
  onScan: (text: string) => void;
  onError?: (message: string) => void;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
  const reactId = useId();
  const regionId = `qr-reader-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* ignore stop race */
      }
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  const startCamera = async () => {
    setBusy(true);
    try {
      await stopScanner();
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          onScan(decoded);
          void stopScanner();
        },
        () => undefined,
      );
      setScanning(true);
    } catch {
      onError?.('Không mở được camera. Hãy cấp quyền hoặc dùng tải ảnh QR.');
    } finally {
      setBusy(false);
    }
  };

  const scanFile = async (file: File) => {
    setBusy(true);
    try {
      await stopScanner();
      const scanner = new Html5Qrcode(regionId);
      const text = await scanner.scanFile(file, true);
      onScan(text);
    } catch {
      onError?.('Không đọc được mã QR trong ảnh. Vui lòng thử ảnh khác.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div id={regionId} className={styles.reader} />
      <div className={styles.actions}>
        {!scanning ? (
          <Button type="button" variant="secondary" onClick={startCamera} disabled={busy}>
            {busy ? 'Đang mở...' : 'Quét bằng camera'}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={stopScanner} disabled={busy}>
            Tắt camera
          </Button>
        )}
        <label className={styles.uploadBtn}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void scanFile(file);
              e.target.value = '';
            }}
          />
          Tải ảnh QR
        </label>
      </div>
    </div>
  );
}
