"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { forwardGeocode, type GeocodeSuggestion } from "@/lib/geocode";

interface WedgeSearchProps {
  locationLabel: string;
  onRequestLocation: () => void;
  onManualLocation: (query: string, coords?: { lat: number; lng: number }) => void;
  locationStatus: "idle" | "requesting" | "granted" | "denied" | "timeout" | "unavailable";
}

export function WedgeSearch({ locationLabel, onRequestLocation, onManualLocation, locationStatus }: WedgeSearchProps) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (locationLabel && locationLabel !== "Set location") {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (suggestionsOpen) {
          setSuggestionsOpen(false);
        } else {
          setPickerOpen(false);
        }
      }
    }
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [pickerOpen, suggestionsOpen]);

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setNoResults(false);
      return;
    }
    const results = await forwardGeocode(query);
    setSuggestions(results);
    setSuggestionsOpen(true);
    setSelectedIdx(-1);
    setNoResults(results.length === 0);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(addressInput), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [addressInput, search]);

  const selectSuggestion = useCallback((s: GeocodeSuggestion) => {
    onManualLocation(s.shortLabel, { lat: s.lat, lng: s.lng });
    setPickerOpen(false);
    setAddressInput("");
    setSuggestions([]);
    setSuggestionsOpen(false);
  }, [onManualLocation]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIdx]);
    }
  };

  const handleSearch = () => {
    router.push("/eat-smart");
  };

  const locationError =
    locationStatus === "denied" ? "Location blocked. Enter an address below." :
    locationStatus === "timeout" || locationStatus === "unavailable" ? "Couldn't get your location. Enter an address below." :
    null;

  return (
    <div className="max-w-[720px] mx-auto px-4">
      <div className="bg-white border border-[#E6E5DE] rounded-[20px] p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0" style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)" }}>
        {/* WHERE */}
        <div className="relative flex-1" ref={pickerRef}>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#F8F8F5] transition-colors text-left"
            onClick={() => setPickerOpen(!pickerOpen)}
            aria-expanded={pickerOpen}
            aria-haspopup="dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B716B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6B716B] flex items-center gap-1.5">
                WHERE
                {showSaved && (
                  <span className="text-[10px] font-normal normal-case tracking-normal text-[#6B716B] animate-fade-in-up">✓ saved</span>
                )}
              </div>
              <div className="text-[15px] font-medium text-[#1A1A1A] truncate">{locationLabel}</div>
            </div>
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-[#E6E5DE] rounded-xl p-3 shadow-lg z-20 w-[320px]" role="dialog" aria-label="Set your location">
              <button
                onClick={() => {
                  onRequestLocation();
                  setPickerOpen(false);
                }}
                disabled={locationStatus === "requesting"}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1A1A1A] text-white text-[14px] font-medium rounded-lg hover:bg-[#333] transition-colors mb-2 disabled:opacity-70"
              >
                {locationStatus === "requesting" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
                )}
                {locationStatus === "requesting" ? "Getting your location…" : "Use my current location"}
              </button>

              {locationError && (
                <p className="text-[12px] text-[#C45A4A] mb-2 px-1">{locationError}</p>
              )}

              <div className="border-t border-[#E6E5DE] pt-2 mt-1 relative">
                <label htmlFor="address-lookup" className="text-[11px] font-semibold tracking-[0.5px] uppercase text-[#6B716B] block mb-1">
                  Or enter an address
                </label>
                <input
                  ref={inputRef}
                  id="address-lookup"
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. 147 E 47th St, New York, NY"
                  className="w-full px-3 py-2 text-[14px] border border-[#E6E5DE] rounded-lg text-[#1A1A1A] placeholder:text-[#6B716B] outline-none focus:border-[#2F8F4D]/50"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestionsOpen}
                  aria-autocomplete="list"
                  aria-controls="address-suggestions"
                />

                {/* Suggestions dropdown */}
                {suggestionsOpen && (suggestions.length > 0 || noResults) && (
                  <ul
                    id="address-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E6E5DE] rounded-lg shadow-lg z-30 overflow-hidden max-h-[220px] overflow-y-auto"
                  >
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        role="option"
                        aria-selected={i === selectedIdx}
                        className={`px-3 py-2.5 cursor-pointer text-[13px] transition-colors ${i === selectedIdx ? "bg-[#F0F7F1]" : "hover:bg-[#F8F8F5]"}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(s);
                        }}
                        onMouseEnter={() => setSelectedIdx(i)}
                      >
                        <div className="text-[#1A1A1A] font-medium truncate">{s.shortLabel}</div>
                        {(s.neighborhood || s.borough) && (
                          <div className="text-[11px] text-[#6B716B] mt-0.5 truncate">
                            {[s.neighborhood, s.borough].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </li>
                    ))}
                    {noResults && (
                      <li className="px-3 py-2.5 text-[12px] text-[#6B716B]">
                        No matches in NYC. Try a different query.
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-1 mt-2 px-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B716B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span className="text-[10px] text-[#6B716B]">Location saved locally on your device, never stored on our servers.</span>
              </div>
            </div>
          )}

          {locationLabel !== "Set location" && !pickerOpen && (
            <button
              onClick={() => setPickerOpen(true)}
              className="text-[11px] text-[#2A6BC9] font-medium hover:underline px-3 -mt-1 text-left"
            >
              Update location
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-[#E6E5DE] flex-shrink-0" />

        {/* WHEN */}
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 cursor-default" aria-label="Showing spots open right now">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B716B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6B716B]">WHEN</div>
            <div className="text-[15px] font-medium text-[#1A1A1A]">Now</div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSearch}
          className="bg-[#2F8F4D] hover:bg-[#267A3F] text-white font-semibold text-[15px] px-5 py-3.5 rounded-[14px] flex items-center justify-center gap-2 transition-colors flex-shrink-0"
          aria-label="Find food"
        >
          Find food
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  );
}
