// src/components/forms/CarImageUpload.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import { XCircle, Image as ImageIcon, Move, ArrowUp, ArrowDown } from 'lucide-react';

interface CarImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
}

export default function CarImageUpload({ onImagesChange, maxImages = 5 }: CarImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      const newFiles = [...selectedFiles];
      const newPreviews = [...previews];
      
      // Add only up to the max number of allowed images
      fileArray.slice(0, maxImages - selectedFiles.length).forEach(file => {
        // Only add image files
        if (file.type.startsWith('image/')) {
          newFiles.push(file);
          const fileUrl = URL.createObjectURL(file);
          newPreviews.push(fileUrl);
        }
      });
      
      setSelectedFiles(newFiles);
      setPreviews(newPreviews);
      onImagesChange(newFiles);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove a file
  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Remove the file and its preview
    newFiles.splice(index, 1);
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles);
  };

  // Move an image up in the order
  const moveImageUp = (index: number) => {
    if (index <= 0) return;
    
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Swap with the previous item
    [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
    [newPreviews[index], newPreviews[index - 1]] = [newPreviews[index - 1], newPreviews[index]];
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles);
  };

  // Move an image down in the order
  const moveImageDown = (index: number) => {
    if (index >= selectedFiles.length - 1) return;
    
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Swap with the next item
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDropIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropIndex !== null && draggedIndex !== dropIndex) {
      const newFiles = [...selectedFiles];
      const newPreviews = [...previews];
      
      // Remove item at draggedIndex
      const [draggedFile] = newFiles.splice(draggedIndex, 1);
      const [draggedPreview] = newPreviews.splice(draggedIndex, 1);
      
      // Insert at dropIndex
      newFiles.splice(dropIndex, 0, draggedFile);
      newPreviews.splice(dropIndex, 0, draggedPreview);
      
      setSelectedFiles(newFiles);
      setPreviews(newPreviews);
      onImagesChange(newFiles);
    }
    
    setDraggedIndex(null);
    setDropIndex(null);
  };

  return (
    <div className="my-6">
      <div className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300 relative">
        <div className="mb-4 flex flex-col items-center justify-center">
          <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Car Photos</h3>
          <p className="text-sm text-gray-500 text-center">
            Upload up to {maxImages} images of your car.
            <br />
            The first image will be used as the main photo.
          </p>
        </div>
        
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
          ref={fileInputRef} 
          disabled={selectedFiles.length >= maxImages}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= maxImages}
          className={`w-full py-2.5 rounded-md mt-2 flex items-center justify-center 
            ${selectedFiles.length >= maxImages 
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
              : 'bg-[#8A7D55] text-white hover:bg-[#766b48]'} 
            transition-colors`}
        >
          Select Photos
        </button>
        
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2 font-medium">
              {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-gray-500 mb-2">
              <Move className="inline h-3 w-3 mr-1" />
              Drag and drop or use arrows to reorder
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previews.map((src, index) => (
                <div 
                  key={index}
                  className={`
                    relative p-1 rounded-md 
                    ${index === 0 ? 'ring-2 ring-[#8A7D55]' : 'ring-1 ring-gray-300'} 
                    ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                    ${dropIndex === index ? 'bg-gray-100' : 'bg-white'}
                  `}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={handleDragEnd}
                >
                  <div className="aspect-w-16 aspect-h-9 mb-1 overflow-hidden rounded">
                    <img 
                      src={src} 
                      alt={`Car photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => moveImageUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded-md text-gray-600 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImageDown(index)}
                        disabled={index === selectedFiles.length - 1}
                        className={`p-1 rounded-md text-gray-600 ${index === selectedFiles.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {index === 0 && (
                      <span className="text-xs font-medium text-[#8A7D55] bg-[#f8f5f0] px-2 py-0.5 rounded-md">
                        Main Photo
                      </span>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50"
                      title="Remove image"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}