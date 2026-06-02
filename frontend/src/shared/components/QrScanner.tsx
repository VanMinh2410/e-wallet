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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {busy ? 'Đang mở...' : 'Quét camera'}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={stopScanner} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Tải ảnh QR
        </label>
      </div>
    </div>
  );
}
