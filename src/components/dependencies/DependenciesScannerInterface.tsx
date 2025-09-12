import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, ScanLine, Loader2, FileUp, X } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

interface DependenciesScannerInterfaceProps {
    onScan: (options: { packageJson: string; packageLock?: string }) => void;
    isLoading: boolean;
}

export default function DependenciesScannerInterface({ onScan, isLoading }: DependenciesScannerInterfaceProps) {
    const [packageJson, setPackageJson] = useState({ content: '', filename: '', mode: 'file' }); // 'file' or 'paste'
    const [packageLock, setPackageLock] = useState({ content: '', filename: '', mode: 'file' });
    const [isDragging, setIsDragging] = useState(false);
    const packageJsonRef = useRef(null);
    const packageLockRef = useRef(null);
    const [errors, setErrors] = useState<{packageJson?: string; packageLock?: string}>({});

    const validatePackageJson = (content) => {
        if (!content.trim()) {
            return 'package.json content is required';
        }
        try {
            const parsed = JSON.parse(content);
            if (!parsed.dependencies && !parsed.devDependencies) {
                return 'No dependencies found in package.json';
            }
            return null;
        } catch (e) {
            return 'Invalid JSON format';
        }
    };

    const validatePackageLock = (content) => {
        if (!content.trim()) return null; // Optional
        try {
            JSON.parse(content);
            return null;
        } catch (e) {
            return 'Invalid JSON format';
        }
    };

    const handleFileChange = (files, type) => {
        if (files && files[0]) {
            const file = files[0];
            if (!file.name.endsWith('.json')) {
                setErrors(prev => ({
                    ...prev,
                    [type]: 'Only .json files are allowed'
                }));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (type === 'packageJson') {
                    setPackageJson({ content, filename: file.name, mode: 'file' });
                    setErrors(prev => ({ ...prev, packageJson: validatePackageJson(content) }));
                } else {
                    setPackageLock({ content, filename: file.name, mode: 'file' });
                    setErrors(prev => ({ ...prev, packageLock: validatePackageLock(content) }));
                }
            };
            reader.readAsText(file);
        }
    };

    const handlePasteChange = (content, type) => {
        if (type === 'packageJson') {
            setPackageJson({ content, filename: '', mode: 'paste' });
            setErrors(prev => ({ ...prev, packageJson: validatePackageJson(content) }));
        } else {
            setPackageLock({ content, filename: '', mode: 'paste' });
            setErrors(prev => ({ ...prev, packageLock: validatePackageLock(content) }));
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

    const onDrop = useCallback((e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files, type);
            e.dataTransfer.clearData();
        }
    }, []);

    const canScan = !isLoading && packageJson.content && !errors.packageJson && !errors.packageLock;

    const handleScanClick = () => {
        onScan({ 
            packageJson: packageJson.content, 
            packageLock: packageLock.content || undefined 
        });
    };

    const clearFile = (type) => {
        if (type === 'packageJson') {
            setPackageJson({ content: '', filename: '', mode: 'file' });
            setErrors(prev => ({ ...prev, packageJson: null }));
        } else {
            setPackageLock({ content: '', filename: '', mode: 'file' });
            setErrors(prev => ({ ...prev, packageLock: null }));
        }
    };

    const FileUploadArea = ({ type, required = false }) => {
        const data = type === 'packageJson' ? packageJson : packageLock;
        const error = errors[type];
        const ref = type === 'packageJson' ? packageJsonRef : packageLockRef;
        
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#374151]">
                        {type === 'packageJson' ? 'package.json' : 'package-lock.json'} 
                        {required && <span className="text-red-500 ml-1">*</span>}
                        {!required && <span className="text-[#6B7280] ml-1">(optional)</span>}
                    </h3>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (data.mode === 'file') {
                                    handlePasteChange('', type);
                                } else {
                                    clearFile(type);
                                }
                            }}
                            className="text-xs text-[#6B7280] hover:text-[#AFCB0E]"
                        >
                            {data.mode === 'file' ? 'Paste JSON' : 'Upload File'}
                        </Button>
                        {data.content && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearFile(type)}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {data.mode === 'file' ? (
                    <div
                        className={`group relative rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                            isDragging 
                                ? 'border-2 border-[#AFCB0E] bg-[#FAFAF8]' 
                                : `border ${error ? 'border-red-300 bg-red-50' : 'border-[#F3F4F6] bg-white hover:border-[#E2E8F0] hover:bg-[#FAFAFA]'}`
                        }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, type)}
                        onClick={() => ref.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={ref} 
                            onChange={(e) => handleFileChange(e.target.files, type)}
                            className="hidden"
                            accept=".json"
                        />
                        <div className="flex flex-col items-center justify-center text-gray-600">
                            <FileUp className="mx-auto h-6 w-6 text-[#E5E7EB] mb-3" strokeWidth={1.5}/>
                            {data.filename ? (
                                <p className="font-medium text-gray-700">{data.filename}</p>
                            ) : (
                                <>
                                    {isDragging ? (
                                        <p className="font-medium text-gray-700">Release to upload</p>
                                    ) : (
                                        <>
                                            <p className="font-medium text-gray-700">
                                                Drop {type === 'packageJson' ? 'package.json' : 'package-lock.json'} or <span className="text-[#AFCB0E]">click to browse</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">JSON files only</p>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <Textarea
                        placeholder={`Paste ${type === 'packageJson' ? 'package.json' : 'package-lock.json'} content here...`}
                        value={data.content}
                        onChange={(e) => handlePasteChange(e.target.value, type)}
                        className={`min-h-32 font-mono text-sm ${error ? 'border-red-300 bg-red-50' : ''}`}
                    />
                )}

                {error && (
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileUploadArea type="packageJson" required />
                <FileUploadArea type="packageLock" />
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-[#F3F4F6]">
                <Button 
                    variant="outline"
                    onClick={() => {
                        setPackageJson({ content: '', filename: '', mode: 'file' });
                        setPackageLock({ content: '', filename: '', mode: 'file' });
                        setErrors({});
                    }}
                    disabled={isLoading}
                    className="text-[#6B7280] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                >
                    Reset
                </Button>
                
                <Button 
                    className="bg-[#AFCB0E] hover:brightness-105 text-white font-semibold rounded-lg px-8 py-3 text-base transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#AFCB0E]"
                    disabled={!canScan}
                    onClick={handleScanClick}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <ScanLine className="w-5 h-5 mr-2" strokeWidth={1.5}/>}
                    {isLoading ? 'Scanning Dependencies...' : 'Scan Dependencies'}
                </Button>
            </div>
        </div>
    );
}