"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, X, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface Option {
    value: string | number;
    label: string;
    sublabel?: string;
    image?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | undefined;
    onChange: (value: any) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Pilih...",
    searchPlaceholder = "Cari...",
    noResultsText = "Hasil tidak ditemukan",
    label,
    className,
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );

    const isSearching = searchTerm !== debouncedSearch;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block mb-1.5 ml-1">
                    {label}
                </label>
            )}
            
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-3 clay-inset rounded-2xl px-4 py-3 text-xs sm:text-sm transition-all duration-200 outline-none text-zinc-800 dark:text-zinc-200",
                    isOpen && "ring-2 ring-blue-500/20",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-2.5 truncate">
                    {selectedOption?.image ? (
                        <img src={selectedOption.image} alt="" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                    ) : (
                        <div className="w-6 h-6 rounded-full clay-button flex items-center justify-center text-zinc-400">
                            <User size={13} />
                        </div>
                    )}
                    <div className="text-left truncate">
                        <div className={cn("font-black truncate", !selectedOption && "text-zinc-400 font-normal")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </div>
                        {selectedOption?.sublabel && (
                            <div className="text-[10px] text-zinc-400 font-bold truncate -mt-0.5">
                                {selectedOption.sublabel}
                            </div>
                        )}
                    </div>
                </div>
                <ChevronDown 
                    size={16} 
                    className={cn("text-zinc-400 transition-transform duration-300", isOpen && "rotate-180")} 
                />
            </button>

            {/* Dropdown Menu */}
            <div className={cn(
                "absolute top-[calc(100%+8px)] left-0 w-full clay-surface rounded-[28px] shadow-2xl overflow-hidden transition-all duration-300 origin-top z-[100]",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            )}>
                {/* Search Header */}
                <div className="p-3 border-b border-zinc-200/60 dark:border-white/5">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 h-3.5 w-3.5 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            className="w-full clay-inset rounded-xl pl-9 pr-9 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none placeholder:text-zinc-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isSearching ? (
                                <Loader2 size={13} className="text-blue-500 animate-spin" />
                            ) : searchTerm ? (
                                <button 
                                    onClick={() => setSearchTerm("")}
                                    className="p-1 clay-button rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Options List */}
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={cn(
                                    "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all group/opt",
                                    value === opt.value
                                        ? "clay-pill-blue text-white shadow-sm"
                                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/10"
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {opt.image ? (
                                        <img src={opt.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full clay-button flex items-center justify-center text-zinc-400 flex-shrink-0">
                                            <User size={13} />
                                        </div>
                                    )}
                                    <div className="text-left truncate">
                                        <div className="truncate font-black">{opt.label}</div>
                                        {opt.sublabel && (
                                            <div className={cn("text-[9px] font-bold truncate uppercase tracking-wider", value === opt.value ? "text-blue-100" : "text-zinc-400")}>
                                                {opt.sublabel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {value === opt.value && (
                                    <Check size={14} className="text-white flex-shrink-0" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="py-8 px-4 text-center">
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{noResultsText}</p>
                            <p className="text-[10px] text-zinc-400 mt-1 font-bold">Coba kata kunci lain</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
