/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useCallback, useState} from 'react';
import {IngredientImage} from '../types';
import {
  ChevronDownIcon,
  RectangleStackIcon,
  UploadCloudIcon,
  XMarkIcon,
} from './icons';

interface IngredientManagerProps {
  allIngredientImages: IngredientImage[];
  onUpdateAllIngredients: (newImages: IngredientImage[]) => void;
}

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const IngredientManager: React.FC<IngredientManagerProps> = ({
  allIngredientImages,
  onUpdateAllIngredients,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files: File[] = event.target.files
        ? Array.from(event.target.files)
        : [];
      if (files.length === 0) return;
      setError(null);

      try {
        const newImages = await Promise.all(
          files.map(async (file) => ({
            base64: await fileToBase64(file),
            mimeType: file.type,
          })),
        );
        onUpdateAllIngredients([...allIngredientImages, ...newImages]);
      } catch (e) {
        console.error('Failed to process image upload:', e);
        setError('There was an error processing one or more images.');
      } finally {
        // Reset the input value to allow re-uploading the same file
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [allIngredientImages, onUpdateAllIngredients],
  );

  const removeImage = (index: number) => {
    const newImages = allIngredientImages.filter((_, i) => i !== index);
    onUpdateAllIngredients(newImages);
  };

  return (
    <div className="w-full bg-[#1f1f1f] border border-gray-700 rounded-2xl shadow-lg mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 text-left">
        <div className="flex items-center gap-3">
          <RectangleStackIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-200">
            Ingredient Pool (Global)
          </h3>
          <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {allIngredientImages.length} images
          </span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-4">
            Add or remove reference images from the global pool. These will be
            available to use when editing ingredients for individual shots.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {allIngredientImages.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-600"
                  alt={`Ingredient ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ingredient ${index + 1}`}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800/50 hover:border-indigo-500 transition-colors">
              <div className="flex flex-col items-center justify-center text-center p-2">
                <UploadCloudIcon className="w-8 h-8 mb-2 text-gray-500" />
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Add more</span>
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleImageUpload}
                multiple
                accept="image/png, image/jpeg, image/webp"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default IngredientManager;