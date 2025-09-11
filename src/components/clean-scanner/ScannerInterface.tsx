import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, ScanLine, Loader2, FileUp } from 'lucide-react';

export default function ScannerInterface({ onScan, isLoading }) {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (files) => {
        if (files && files[0]) {
            setFile(files[0]);
        }
    };
    
    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, []);

    const canScan = !isLoading && file;

    const handleScanClick = () => {
        onScan({ file });
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
            <div
                className={`group relative rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                        ? 'border-2 border-[#AFCB0E] bg-[#FAFAF8]' 
                        : 'border border-[#F3F4F6] bg-white hover:border-[#E2E8F0] hover:bg-[#FAFAFA]'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="hidden" 
                />
                <div className="flex flex-col items-center justify-center text-gray-600">
                    <FileUp className="mx-auto h-8 w-8 text-[#E5E7EB] mb-4" strokeWidth={1.5}/>
                    {file ? (
                        <p className="font-medium text-gray-700">{file.name}</p>
                    ) : (
                        <>
                            {isDragging ? (
                                <p className="font-medium text-gray-700">Release to scan</p>
                            ) : (
                                <>
                                    <p className="font-medium text-gray-700">
                                        Drag & drop a file or <span className="text-[#AFCB0E]">click to browse</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Upload your source code file for analysis</p>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <Button 
                    className="w-full md:w-auto bg-[#AFCB0E] hover:brightness-105 text-white font-semibold rounded-lg px-8 py-3 text-base transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#AFCB0E]"
                    disabled={!canScan}
                    onClick={handleScanClick}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <ScanLine className="w-5 h-5 mr-2" strokeWidth={1.5}/>}
                    {isLoading ? 'Scanning...' : 'Scan File'}
                </Button>
            </div>
        </div>
    );
}