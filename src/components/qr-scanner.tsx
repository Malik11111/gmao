"use client";

import { Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function QrScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    stopCamera();
    setOpen(false);
    setError(null);
    setManualCode("");
  }, [stopCamera]);

  const handleResult = useCallback(
    (code: string) => {
      stopCamera();
      try {
        const url = new URL(code);
        if (url.pathname.startsWith("/scan/")) {
          router.push(url.pathname);
          setOpen(false);
          return;
        }
      } catch {
        // not a URL, try as equipment code
      }

      router.push(`/scan/${encodeURIComponent(code)}`);
      setOpen(false);
    },
    [router, stopCamera],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scanningRef.current = true;
          scanFrame();
        }
      } catch {
        if (!cancelled) {
          setError("Impossible d'acceder a la camera. Utilise le code manuel ci-dessous.");
        }
      }
    }

    function scanFrame() {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
          formats: ["qr_code", "ean_13", "code_128"],
        });

        detector.detect(canvas).then((barcodes) => {
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleResult(barcodes[0].rawValue);
            return;
          }
          if (scanningRef.current) requestAnimationFrame(scanFrame);
        }).catch(() => {
          if (scanningRef.current) requestAnimationFrame(scanFrame);
        });
      } catch {
        // BarcodeDetector not supported, show manual input
        setError("Le scan automatique n'est pas supporte par ce navigateur. Utilise le code manuel.");
        stopCamera();
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, handleResult, stopCamera]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      handleResult(manualCode.trim());
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
      >
        <Camera className="h-4 w-4" />
        Scanner un QR code
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="panel w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">Scanner un equipement</h2>
              <button type="button" onClick={close} className="rounded-full p-2 hover:bg-slate-100 transition">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-48 w-48 rounded-3xl border-4 border-white/60" />
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700">Ou saisir le code manuellement :</p>
              <form onSubmit={handleManualSubmit} className="mt-3 flex gap-3">
                <input
                  className="field flex-1"
                  type="text"
                  placeholder="EQ-00001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <button type="submit" className="secondary-button">
                  Rechercher
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
