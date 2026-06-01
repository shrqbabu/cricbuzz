import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useImageUpload } from '../../hooks/useImageUpload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, accept = 'image/*', className }: ImageUploadProps) {
  const { upload, uploading, error } = useImageUpload();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onChange(url);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video flex items-center justify-center bg-slate-50 dark:bg-slate-800">
          <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all',
            dragOver
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800',
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              <p className="text-sm text-slate-500">Uploading...</p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-3">
                {dragOver ? <ImageIcon className="text-emerald-500" size={24} /> : <Upload className="text-slate-400" size={24} />}
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {dragOver ? 'Drop to upload' : 'Click or drag & drop'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
