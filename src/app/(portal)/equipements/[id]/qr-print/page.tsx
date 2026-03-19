"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const SIZES = [
  { label: "5 cm (etiquette)", cm: 5 },
  { label: "7 cm", cm: 7 },
  { label: "10 cm", cm: 10 },
] as const;

export default function QrPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [size, setSize] = useState<number>(5);
  const [copies, setCopies] = useState(1);
  const [equipmentInfo, setEquipmentInfo] = useState<{ code: string; name: string; qrCode: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/equipment-info/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEquipmentInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Chargement...</div>;
  }

  if (!equipmentInfo) {
    return <div className="flex h-64 items-center justify-center text-rose-500">Equipement introuvable</div>;
  }

  const pxSize = size * 37.8; // ~1cm = 37.8px at 96dpi

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-print-zone, #qr-print-zone * { visibility: visible !important; }
          #qr-print-zone {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8mm !important;
            padding: 5mm !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controls — hidden on print */}
      <div className="no-print mb-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Imprimer QR code</h1>
          <p className="mt-1 text-sm text-slate-500">{equipmentInfo.name} — {equipmentInfo.code}</p>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Taille</label>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.cm}
                  onClick={() => setSize(s.cm)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    size === s.cm
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre de copies</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{copies}</span>
              <button
                onClick={() => setCopies((c) => Math.min(20, c + 1))}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="primary-button gap-2"
        >
          Imprimer
        </button>
      </div>

      {/* Print zone */}
      <div id="qr-print-zone" className="flex flex-wrap gap-6">
        {Array.from({ length: copies }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center border border-dashed border-slate-300 rounded-lg p-2"
            style={{ width: `${size}cm`, height: `${size + 1.2}cm` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qrcode/${equipmentInfo.qrCode}`}
              alt={`QR ${equipmentInfo.code}`}
              style={{ width: `${pxSize}px`, height: `${pxSize}px` }}
            />
            <p
              className="mt-1 text-center font-bold text-slate-900 leading-tight"
              style={{ fontSize: `${Math.max(8, size * 2)}px` }}
            >
              {equipmentInfo.code}
            </p>
            <p
              className="text-center text-slate-600 leading-tight truncate w-full"
              style={{ fontSize: `${Math.max(6, size * 1.5)}px` }}
            >
              {equipmentInfo.name}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
