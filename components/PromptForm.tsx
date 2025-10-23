/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useCallback, useRef, useState} from 'react';
import {IngredientImage} from '../types';
import {
  ArrowRightIcon,
  FileUploadIcon,
  UploadCloudIcon,
  XMarkIcon,
} from './icons';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Setup PDF.js worker from a CDN. The mjs build is required for modules.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

interface ProjectSetupFormProps {
  onGenerate: (script: string, images: IngredientImage[]) => void;
  isGenerating: boolean;
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const ProjectSetupForm: React.FC<ProjectSetupFormProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [script, setScript] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [images, setImages] = useState<IngredientImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const handleScriptChange = useCallback((text: string) => {
    setScript(text);
    if (!text.trim()) {
      setTokenCount(0);
    } else {
      // Simple token approximation: 1 token ~= 4 characters
      setTokenCount(Math.ceil(text.trim().length / 4));
    }
  }, []);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      // FIX: Explicitly type `files` as `File[]` to resolve type inference issue with `event.target.files`.
      const files: File[] = event.target.files
        ? Array.from(event.target.files)
        : [];
      if (files.length === 0) return;
      if (images.length + files.length > 3) {
        setError('You can upload a maximum of 3 ingredient images.');
        return;
      }
      setError(null);

      const newImages = await Promise.all(
        files.map(async (file) => ({
          base64: await fileToBase64(file),
          mimeType: file.type,
        })),
      );
      setImages((prev) => [...prev, ...newImages]);
    },
    [images],
  );

  const handleScriptFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset the input value to allow re-uploading the same file
      if (event.target) {
        event.target.value = '';
      }

      setError(null);

      if (file.name.endsWith('.gdoc')) {
        setError(
          'Google Doc files cannot be uploaded directly. In Google Docs, please use File > Download > Plain Text (.txt) and upload that file.',
        );
        return;
      }

      try {
        let text = '';
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          const pageTexts = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .filter((item): item is {str: string} => 'str' in item)
              .map((item) => item.str)
              .join(' ');
            pageTexts.push(pageText);
          }
          text = pageTexts.join('\n\n');
        } else {
          text = await file.text();
        }
        handleScriptChange(text);
      } catch (e) {
        console.error('Failed to read file:', e);
        setError(
          'Could not read the script file. It may be corrupted or in an unsupported format. Please try again.',
        );
      }
    },
    [handleScriptChange],
  );

  const handleUploadClick = () => {
    scriptFileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (script.trim() && !isGenerating) {
      onGenerate(script, images);
    }
  };

  const isSubmitDisabled = !script.trim() || isGenerating;

  return (
    <div className="w-full max-w-4xl p-4 md:p-8 bg-[#1f1f1f] border border-gray-700 rounded-2xl shadow-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <label
              htmlFor="script-input"
              className="text-xl font-semibold text-gray-200">
              Your Script or Treatment
            </label>
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors text-sm disabled:bg-gray-700 disabled:cursor-not-allowed">
              <FileUploadIcon className="w-4 h-4" />
              <span>Upload from File</span>
            </button>
            <input
              type="file"
              ref={scriptFileInputRef}
              onChange={handleScriptFileUpload}
              className="hidden"
              accept=".txt,.md,.rtf,.pdf,.gdoc"
              disabled={isGenerating}
            />
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Paste your script below, or upload a .txt, .md, .rtf, or .pdf file.
            Google Docs must be downloaded as Plain Text first.
          </p>
          <textarea
            id="script-input"
            value={script}
            onChange={(e) => handleScriptChange(e.target.value)}
            placeholder="Paste your script, treatment, or creative concept here..."
            className="w-full bg-gray-900/50 focus:outline-none resize-y text-base text-gray-200 placeholder-gray-500 min-h-64 rounded-xl p-4 border border-gray-600 focus:ring-2 focus:ring-indigo-500"
            disabled={isGenerating}
          />
          <div className="text-right text-sm text-gray-500 mt-1 pr-1">
            Token Count (est.): {tokenCount}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            'Ingredient' Images (Optional)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Upload up to 3 reference images for characters, environments, or
            items.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-600"
                  alt={`Ingredient ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-indigo-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloudIcon className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                />
              </label>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed md:self-end">
          <span>Generate Shot Book</span>
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

// FIX: Added default export to make the component importable.
export default ProjectSetupForm;