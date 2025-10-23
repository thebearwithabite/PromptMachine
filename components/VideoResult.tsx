/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import jsPDF from 'jspdf';
import React, {useEffect, useState} from 'react';
import {
  IngredientImage,
  LogEntry,
  Shot,
  ShotBook,
  ShotStatus,
  VeoShot,
} from '../types';
import ActivityLog from './ActivityLog';
import IngredientManager from './IngredientManager';
import {
  ArrowPathIcon,
  BracesIcon,
  CheckCircle2Icon,
  ClipboardDocumentIcon,
  ClockIcon,
  DownloadIcon,
  FilePenLineIcon,
  FileTextIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from './icons';

interface ShotCardProps {
  shot: Shot;
  onUpdateShot: (shot: Shot) => void;
  onRetryKeyframe: (shotId: string) => void;
  allIngredientImages: IngredientImage[];
  onUpdateShotIngredients: (
    shotId: string,
    newImages: IngredientImage[],
  ) => void;
}

const ShotCard: React.FC<ShotCardProps> = ({
  shot,
  onUpdateShot,
  onRetryKeyframe,
  allIngredientImages,
  onUpdateShotIngredients,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedJson, setEditedJson] = useState(
    shot.veoJson ? JSON.stringify(shot.veoJson, null, 2) : '',
  );
  const [copyButtonText, setCopyButtonText] = useState('Copy JSON');

  useEffect(() => {
    // Sync the local state with the prop when not in editing mode.
    if (!isEditing) {
      setEditedJson(shot.veoJson ? JSON.stringify(shot.veoJson, null, 2) : '');
    }
  }, [shot.veoJson, isEditing]);

  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState<IngredientImage[]>(
    shot.ingredientImages || [],
  );

  const handleEditIngredients = () => {
    setEditedIngredients(shot.ingredientImages || []);
    setIsEditingIngredients(true);
  };

  const handleSaveIngredients = () => {
    onUpdateShotIngredients(shot.id, editedIngredients);
    setIsEditingIngredients(false);
  };

  const handleCancelEditIngredients = () => {
    setIsEditingIngredients(false);
    setEditedIngredients(shot.ingredientImages || []); // Reset to original
  };

  const addIngredient = (image: IngredientImage) => {
    if (editedIngredients.length < 3) {
      setEditedIngredients((prev) => [...prev, image]);
    }
  };

  const removeIngredient = (imageToRemove: IngredientImage) => {
    setEditedIngredients((prev) =>
      prev.filter((img) => img.base64 !== imageToRemove.base64),
    );
  };

  const isIngredientSelected = (image: IngredientImage) => {
    return editedIngredients.some((img) => img.base64 === image.base64);
  };

  const handleApprove = () => {
    onUpdateShot({...shot, status: ShotStatus.APPROVED});
  };

  const handleSaveEdit = () => {
    try {
      const updatedVeoJson: VeoShot = JSON.parse(editedJson);
      // Here you could add validation against a schema
      onUpdateShot({...shot, veoJson: updatedVeoJson});
      setIsEditing(false);
    } catch (error) {
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleCopyToClipboard = () => {
    if (!shot.veoJson) return;
    navigator.clipboard.writeText(JSON.stringify(shot.veoJson, null, 2));
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy JSON'), 2000);
  };

  const getStatusChip = () => {
    switch (shot.status) {
      case ShotStatus.PENDING_JSON:
        return (
          <span className="bg-gray-700 text-gray-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> Queued for JSON
          </span>
        );
      case ShotStatus.GENERATING_JSON:
        return (
          <span className="bg-purple-900 text-purple-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
            Generating JSON...
          </span>
        );
      case ShotStatus.PENDING_GENERATION:
        return (
          <span className="bg-gray-700 text-gray-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> Queued
          </span>
        );
      case ShotStatus.GENERATING_IMAGE:
        return (
          <span className="bg-indigo-900 text-indigo-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
            Generating Keyframe...
          </span>
        );
      case ShotStatus.NEEDS_REVIEW:
        return (
          <span className="bg-yellow-900 text-yellow-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
            Needs Review
          </span>
        );
      case ShotStatus.APPROVED:
        return (
          <span className="bg-green-900 text-green-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2Icon className="w-3 h-3" /> Approved
          </span>
        );
      case ShotStatus.GENERATION_FAILED:
        return (
          <span className="bg-red-900 text-red-300 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
            Generation Failed
          </span>
        );
      default:
        return null;
    }
  };

  const renderImagePlaceholder = () => {
    switch (shot.status) {
      case ShotStatus.PENDING_JSON:
        return (
          <div className="flex flex-col items-center text-gray-500">
            <ClockIcon className="w-8 h-8" />
            <span className="text-sm mt-2">Queued for JSON</span>
          </div>
        );
      case ShotStatus.GENERATING_JSON:
        return (
          <div className="flex flex-col items-center text-gray-500">
            <BracesIcon className="w-8 h-8 animate-pulse text-purple-400" />
            <span className="text-sm mt-2">Writing VEO JSON...</span>
          </div>
        );
      case ShotStatus.PENDING_GENERATION:
        return (
          <div className="flex flex-col items-center text-gray-500">
            <ClockIcon className="w-8 h-8" />
            <span className="text-sm mt-2">Queued for Generation</span>
          </div>
        );
      case ShotStatus.GENERATING_IMAGE:
        return (
          <div className="flex flex-col items-center text-gray-500">
            <SparklesIcon className="w-8 h-8 animate-pulse" />
            <span className="text-sm mt-2">Rendering...</span>
          </div>
        );
      case ShotStatus.GENERATION_FAILED:
        return (
          <div className="flex flex-col items-center text-center p-4">
            <p className="text-sm text-red-400 mb-3">{shot.errorMessage}</p>
            <button
              onClick={() => onRetryKeyframe(shot.id)}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-xs">
              <ArrowPathIcon className="w-3 h-3" />
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        {/* Left Column: Image, Pitch & Ingredients */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-600 mb-3 flex items-center justify-center">
            {shot.keyframeImage ? (
              <img
                src={`data:image/png;base64,${shot.keyframeImage}`}
                alt={`Keyframe for ${shot.id}`}
                className="w-full h-full object-cover"
              />
            ) : (
              renderImagePlaceholder()
            )}
          </div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-indigo-400">
              Pitch for Shot: {shot.id}
            </h3>
            {getStatusChip()}
          </div>
          <p className="text-sm text-gray-300 bg-gray-900/70 p-3 rounded-md">
            {shot.pitch}
          </p>

          {/* Ingredients Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-base font-semibold text-gray-300">
                Ingredients Used
              </h4>
              {!isEditingIngredients && shot.status !== ShotStatus.PENDING_JSON && (
                <button
                  onClick={handleEditIngredients}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                  Edit
                </button>
              )}
            </div>
            {isEditingIngredients ? (
              <div className="p-3 bg-gray-900/70 rounded-md">
                <p className="text-xs text-gray-400 mb-3">
                  Select up to 3 images from your uploaded pool.
                </p>
                <div className="flex flex-wrap gap-2 mb-3 border-b border-gray-700 pb-3">
                  {allIngredientImages.map((image, index) => {
                    const isSelected = isIngredientSelected(image);
                    const isLimitReached = editedIngredients.length >= 3;
                    return (
                      <button
                        key={index}
                        onClick={() => !isSelected && addIngredient(image)}
                        disabled={isSelected || isLimitReached}
                        className="relative disabled:opacity-50 disabled:cursor-not-allowed group"
                        aria-label={`Select ingredient ${index + 1}`}>
                        <img
                          src={`data:${image.mimeType};base64,${image.base64}`}
                          className="w-12 h-12 object-cover rounded"
                          alt={`Ingredient Pool ${index + 1}`}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-green-500/70 flex items-center justify-center rounded">
                            <CheckCircle2Icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {!isSelected && !isLimitReached && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlusIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <h5 className="text-xs text-gray-400 mb-2">
                  Selected for this shot:
                </h5>
                <div className="flex flex-wrap gap-2 min-h-[56px]">
                  {editedIngredients.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`data:${image.mimeType};base64,${image.base64}`}
                        className="w-12 h-12 object-cover rounded"
                        alt={`Selected Ingredient ${index + 1}`}
                      />
                      <button
                        onClick={() => removeIngredient(image)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ingredient ${index + 1}`}>
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {editedIngredients.length === 0 && (
                    <p className="text-xs text-gray-500 italic flex items-center h-12">
                      No ingredients selected.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveIngredients}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-white font-semibold">
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditIngredients}
                    className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-md text-white font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-900/70 rounded-md min-h-[88px]">
                {shot.ingredientImages && shot.ingredientImages.length > 0 ? (
                  shot.ingredientImages.map((image, index) => (
                    <img
                      key={index}
                      src={`data:${image.mimeType};base64,${image.base64}`}
                      className="w-16 h-16 object-cover rounded-md border border-gray-600"
                      alt={`Used Ingredient ${index + 1}`}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic self-center">
                    No ingredients were used for this keyframe.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: JSON & Actions */}
        <div className="w-full md:w-2/3">
          {isEditing ? (
            <textarea
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              className="w-full h-80 font-mono text-xs bg-black border border-indigo-500 rounded-md p-2 focus:outline-none resize-y"
            />
          ) : (
            <pre className="w-full h-80 overflow-auto font-mono text-xs bg-black/50 border border-gray-700 rounded-md p-3">
              <code>
                {shot.veoJson
                  ? JSON.stringify(shot.veoJson, null, 2)
                  : 'VEO JSON has not been generated yet...'}
              </code>
            </pre>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm">
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors text-sm">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {shot.status !== ShotStatus.APPROVED && (
                  <button
                    onClick={handleApprove}
                    disabled={
                      !shot.keyframeImage ||
                      shot.status === ShotStatus.GENERATION_FAILED
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <CheckCircle2Icon className="w-4 h-4" />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={!shot.veoJson}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors text-sm disabled:bg-gray-700 disabled:cursor-not-allowed">
                  <FilePenLineIcon className="w-4 h-4" />
                  Edit JSON
                </button>
              </>
            )}
            <button
              onClick={handleCopyToClipboard}
              disabled={!shot.veoJson}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm ml-auto disabled:bg-gray-700 disabled:cursor-not-allowed">
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copyButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShotBookDisplayProps {
  shotBook: ShotBook;
  logEntries: LogEntry[];
  onNewProject: () => void;
  onUpdateShot: (shot: Shot) => void;
  onRetryKeyframe: (shotId: string) => void;
  allIngredientImages: IngredientImage[];
  onUpdateShotIngredients: (
    shotId: string,
    newImages: IngredientImage[],
  ) => void;
  onUpdateAllIngredients: (newImages: IngredientImage[]) => void;
}

const ShotBookDisplay: React.FC<ShotBookDisplayProps> = ({
  shotBook,
  logEntries,
  onNewProject,
  onUpdateShot,
  onRetryKeyframe,
  allIngredientImages,
  onUpdateShotIngredients,
  onUpdateAllIngredients,
}) => {
  const hasApprovedShots = shotBook.some(
    (shot) => shot.status === ShotStatus.APPROVED,
  );

  const handleDownload = () => {
    const approvedShotsJson = shotBook
      .filter((shot) => shot.status === ShotStatus.APPROVED)
      .map((shot) => shot.veoJson);

    if (approvedShotsJson.length === 0) {
      return;
    }

    const jsonString = JSON.stringify(approvedShotsJson, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veo_shot_book.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const approvedShots = shotBook.filter(
      (shot) =>
        shot.status === ShotStatus.APPROVED &&
        shot.keyframeImage &&
        shot.veoJson,
    );

    if (approvedShots.length === 0) {
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentW = pageW - margin * 2;

    approvedShots.forEach((shot, index) => {
      if (index > 0) doc.addPage();

      let y = margin;

      // Shot ID Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Shot: ${shot.id}`, pageW / 2, y, {align: 'center'});
      y += 30;

      // Image
      const imgData = `data:image/png;base64,${shot.keyframeImage!}`;
      // Assuming 16:9 aspect ratio for the image
      const imgHeight = contentW * (9 / 16);
      doc.addImage(imgData, 'PNG', margin, y, contentW, imgHeight);
      y += imgHeight + 30;

      // Details section
      const addDetail = (label: string, value: string) => {
        if (!value || !value.trim()) return; // Don't add empty fields

        const labelWidth = 65;
        const valueWidth = contentW - labelWidth;
        const valueLines = doc.splitTextToSize(value, valueWidth);
        const requiredHeight = valueLines.length * 12 + 15; // 12pt font size

        if (y + requiredHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, y, {align: 'left'});

        doc.setFont('helvetica', 'normal');
        doc.text(valueLines, margin + labelWidth, y, {align: 'left'});

        y += requiredHeight;
      };

      addDetail('Pitch', shot.pitch);
      addDetail('Shot Call', shot.veoJson!.camera.shot_call);
      addDetail('Movement', shot.veoJson!.camera.movement);
      addDetail('Dialogue', shot.veoJson!.audio.dialogue);
      addDetail('Delivery', shot.veoJson!.audio.delivery);
    });

    doc.save('veo_storyboard.pdf');
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 p-1 md:p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-200">
          Your Interactive Shot Book
        </h2>
        <p className="text-gray-400 mt-2 max-w-2xl">
          Review each shot, edit the VEO JSON as needed, and approve to finalize
          your storyboard.
        </p>
      </div>

      <div className="w-full">
        <IngredientManager
          allIngredientImages={allIngredientImages}
          onUpdateAllIngredients={onUpdateAllIngredients}
        />
      </div>

      <div className="w-full">
        <ActivityLog entries={logEntries} />
      </div>

      <div className="w-full flex flex-col gap-6">
        {shotBook.map((shot) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            onUpdateShot={onUpdateShot}
            onRetryKeyframe={onRetryKeyframe}
            allIngredientImages={allIngredientImages}
            onUpdateShotIngredients={onUpdateShotIngredients}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
          <PlusIcon className="w-5 h-5" />
          New Project
        </button>
        <button
          onClick={handleDownload}
          disabled={!hasApprovedShots}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
          <DownloadIcon className="w-5 h-5" />
          Download Approved JSON
        </button>
        <button
          onClick={handleExportPdf}
          disabled={!hasApprovedShots}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
          <FileTextIcon className="w-5 h-5" />
          Export Storyboard PDF
        </button>
      </div>
    </div>
  );
};

export default ShotBookDisplay;