"use client";

import { ClipboardList, Package, Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchResult = {
  equipments: Array<{
    id: string;
    code: string;
    name: string;
    category: string | null;
    location: string;
    status: string;
  }>;
  requests: Array<{
    id: string;
    number: string;
    equipmentName: string;
    description: string;
    status: string;
    urgency: string;
  }>;
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(timerRef.current);
    if (value.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => search(value), 300);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setResults(null);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const input = containerRef.current?.querySelector("input");
        input?.focus();
      }
      if (e.key === "Escape") {
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = results && (results.equipments.length > 0 || results.requests.length > 0);
  const noResults = results && results.equipments.length === 0 && results.requests.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
          placeholder="Rechercher... (Ctrl+K)"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {query ? (
          <button type="button" onClick={close} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            Ctrl+K
          </kbd>
        )}
      </div>

      {open && (hasResults || noResults || loading) ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Recherche...</div>
          ) : noResults ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Aucun resultat pour &quot;{query}&quot;</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {results!.equipments.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Equipements</span>
                  </div>
                  {results!.equipments.map((eq) => (
                    <Link
                      key={eq.id}
                      href={`/equipements/${eq.id}`}
                      onClick={close}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-indigo-50 transition border-b border-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{eq.name}</p>
                        <p className="text-xs text-gray-500 truncate">{eq.code} - {eq.location || "Sans localisation"}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{eq.category}</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {results!.requests.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Demandes</span>
                  </div>
                  {results!.requests.map((req) => (
                    <Link
                      key={req.id}
                      href={`/demandes/${req.id}`}
                      onClick={close}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-indigo-50 transition border-b border-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{req.equipmentName}</p>
                        <p className="text-xs text-gray-500 truncate">{req.number} - {req.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
