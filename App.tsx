/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useCallback, useEffect, useState} from 'react';
import ActivityLog from './components/ActivityLog';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import ProjectSetupForm from './components/PromptForm';
import ShotBookDisplay from './components/VideoResult';
import {
  generateKeyframe,
  generateShotList,
  generateVeoJson,
} from './services/geminiService';
import {
  AppState,
  IngredientImage,
  LogEntry,
  LogType,
  Shot,
  ShotBook,
  ShotStatus,
} from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [shotBook, setShotBook] = useState<ShotBook | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<{
    script: string;
    images: IngredientImage[];
  } | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const addLogEntry = useCallback((message: string, type: LogType) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogEntries((prev) => [...prev, {timestamp, message, type}]);
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn('aistudio.hasSelectedApiKey check failed.', error);
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleGenerate = useCallback(
    async (script: string, images: IngredientImage[]) => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
            return;
          }
        } catch (error) {
          console.warn('aistudio.hasSelectedApiKey check failed.', error);
          setShowApiKeyDialog(true);
          return;
        }
      }

      setAppState(AppState.LOADING);
      setErrorMessage(null);
      setShotBook(null);
      setLastPrompt({script, images});
      setLogEntries([]); // Clear logs
      addLogEntry('Starting new shot book generation...', LogType.INFO);

      try {
        // Step 1: Generate the shot list for immediate structural feedback.
        addLogEntry('Analyzing script to create shot list...', LogType.STEP);
        const shotList = await generateShotList(script);
        addLogEntry(
          `Successfully created shot list with ${shotList.length} shots.`,
          LogType.SUCCESS,
        );
        const initialShotBook: ShotBook = shotList.map((shot) => ({
          id: shot.id,
          pitch: shot.pitch,
          status: ShotStatus.PENDING_JSON,
        }));
        setShotBook(initialShotBook);
        setAppState(AppState.SUCCESS); // Show the shot book UI immediately

        // Step 2 & 3: Sequentially process each shot completely (JSON then Keyframe).
        for (const initialShot of initialShotBook) {
          let currentShot: Shot = {...initialShot};
          addLogEntry(`Processing Shot: ${currentShot.id}`, LogType.INFO);

          // Generate VEO JSON for the current shot
          try {
            setShotBook((current) =>
              current!.map((s) =>
                s.id === currentShot.id
                  ? {...s, status: ShotStatus.GENERATING_JSON}
                  : s,
              ),
            );
            addLogEntry('Generating VEO JSON...', LogType.STEP);
            const veoJson = await generateVeoJson(
              currentShot.pitch,
              currentShot.id,
              script,
            );
            addLogEntry('VEO JSON generated successfully.', LogType.SUCCESS);
            currentShot = {
              ...currentShot,
              veoJson,
              status: ShotStatus.PENDING_GENERATION,
            };
            setShotBook((current) =>
              current!.map((s) => (s.id === currentShot.id ? currentShot : s)),
            );
          } catch (jsonError) {
            console.error(
              `Failed to generate JSON for ${currentShot.id}:`,
              jsonError,
            );
            const jsonErrorMessage =
              jsonError instanceof Error
                ? jsonError.message
                : 'VEO JSON generation failed.';
            addLogEntry(
              `Failed to generate VEO JSON: ${jsonErrorMessage}`,
              LogType.ERROR,
            );
            const failedShot = {
              ...currentShot,
              status: ShotStatus.GENERATION_FAILED,
              errorMessage: jsonErrorMessage,
            };
            setShotBook((current) =>
              current!.map((s) => (s.id === currentShot.id ? failedShot : s)),
            );
            continue; // Skip to the next shot in the loop if JSON fails
          }

          // Generate Keyframe for the current shot
          try {
            setShotBook((current) =>
              current!.map((s) =>
                s.id === currentShot.id
                  ? {...s, status: ShotStatus.GENERATING_IMAGE}
                  : s,
              ),
            );
            addLogEntry('Generating keyframe...', LogType.STEP);
            const keyframeImage = await generateKeyframe(currentShot, images);
            addLogEntry(
              'Keyframe generated. Ready for review.',
              LogType.SUCCESS,
            );
            const finishedShot = {
              ...currentShot,
              keyframeImage,
              status: ShotStatus.NEEDS_REVIEW,
              errorMessage: undefined,
              ingredientImages: images, // Store the images used for this shot
            };
            setShotBook((current) =>
              current!.map((s) =>
                s.id === currentShot.id ? finishedShot : s,
              ),
            );
          } catch (keyframeError) {
            console.error(
              `Failed to generate keyframe for ${currentShot.id}:`,
              keyframeError,
            );
            const keyframeErrorMessage =
              keyframeError instanceof Error
                ? keyframeError.message
                : 'Keyframe generation failed.';
            addLogEntry(
              `Failed to generate keyframe: ${keyframeErrorMessage}`,
              LogType.ERROR,
            );
            const failedShot = {
              ...currentShot,
              status: ShotStatus.GENERATION_FAILED,
              errorMessage: keyframeErrorMessage,
            };
            setShotBook((current) =>
              current!.map((s) => (s.id === currentShot.id ? failedShot : s)),
            );
          }
        }
        addLogEntry(
          'Shot book generation complete. Ready for your review.',
          LogType.INFO,
        );
      } catch (error) {
        console.error('Shot list generation failed:', error);
        const errMessage =
          error instanceof Error ? error.message : 'An unknown error occurred.';

        let userFriendlyMessage = `Shot list generation failed: ${errMessage}`;
        addLogEntry(userFriendlyMessage, LogType.ERROR);
        let shouldOpenDialog = false;

        if (typeof errMessage === 'string') {
          if (errMessage.includes('Requested entity was not found.')) {
            userFriendlyMessage =
              'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.';
            shouldOpenDialog = true;
          } else if (
            errMessage.includes('API_KEY_INVALID') ||
            errMessage.includes('API key not valid') ||
            errMessage.toLowerCase().includes('permission denied')
          ) {
            userFriendlyMessage =
              'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.';
            shouldOpenDialog = true;
          }
        }

        setErrorMessage(userFriendlyMessage);
        setAppState(AppState.ERROR);
        if (shouldOpenDialog) setShowApiKeyDialog(true);
      }
    },
    [addLogEntry],
  );

  const handleRetryKeyframe = async (shotId: string) => {
    if (!lastPrompt || !shotBook) return;

    const shotToRetry = shotBook.find((s) => s.id === shotId);
    if (!shotToRetry) return;

    // Set status to generating
    setShotBook((currentShotBook) =>
      currentShotBook!.map((s) =>
        s.id === shotId
          ? {...s, status: ShotStatus.GENERATING_IMAGE, errorMessage: undefined}
          : s,
      ),
    );

    try {
      const keyframeImage = await generateKeyframe(
        shotToRetry,
        shotToRetry.ingredientImages || [],
      );
      setShotBook((currentShotBook) =>
        currentShotBook!.map((s) =>
          s.id === shotId
            ? {
                ...s,
                keyframeImage,
                status: ShotStatus.NEEDS_REVIEW,
              }
            : s,
        ),
      );
    } catch (keyframeError) {
      console.error(`Failed to retry keyframe for ${shotId}:`, keyframeError);
      const keyframeErrorMessage =
        keyframeError instanceof Error
          ? keyframeError.message
          : 'Keyframe generation failed.';
      setShotBook((currentShotBook) =>
        currentShotBook!.map((s) =>
          s.id === shotId
            ? {
                ...s,
                status: ShotStatus.GENERATION_FAILED,
                errorMessage: keyframeErrorMessage,
              }
            : s,
        ),
      );
    }
  };

  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      handleGenerate(lastPrompt.script, lastPrompt.images);
    }
  }, [lastPrompt, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) await window.aistudio.openSelectKey();
    if (appState === AppState.ERROR && lastPrompt) handleRetry();
  };

  const handleNewProject = useCallback(() => {
    setAppState(AppState.IDLE);
    setShotBook(null);
    setErrorMessage(null);
    setLastPrompt(null);
    setLogEntries([]);
  }, []);

  const handleUpdateShot = (updatedShot: Shot) => {
    setShotBook(
      (prev) =>
        prev?.map((shot) => (shot.id === updatedShot.id ? updatedShot : shot)) ??
        null,
    );
  };

  const handleUpdateShotIngredients = (
    shotId: string,
    newImages: IngredientImage[],
  ) => {
    setShotBook(
      (prev) =>
        prev?.map((shot) => {
          if (shot.id === shotId) {
            // If the shot was approved, changing ingredients means it needs review again.
            const newStatus =
              shot.status === ShotStatus.APPROVED
                ? ShotStatus.NEEDS_REVIEW
                : shot.status;
            return {...shot, ingredientImages: newImages, status: newStatus};
          }
          return shot;
        }) ?? null,
    );
  };

  const handleUpdateAllIngredients = (newImages: IngredientImage[]) => {
    if (!lastPrompt) return;
    setLastPrompt((prev) => ({
      ...prev!,
      images: newImages,
    }));
  };

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleRetry}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      <header className="py-4 flex justify-center items-center px-4 md:px-8 relative z-10 shrink-0">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          VEO 3.1 Prompt Machine
        </h1>
      </header>
      <main className="w-full max-w-7xl mx-auto flex-grow flex flex-col p-2 md:p-4 overflow-y-auto">
        {/* FIX: Renders the form for both IDLE and LOADING states to fix a TypeScript error and improve UX. */}
        {appState === AppState.IDLE || appState === AppState.LOADING ? (
          <div className="flex-grow flex flex-col justify-center items-center pb-8">
            <ProjectSetupForm
              onGenerate={handleGenerate}
              isGenerating={appState === AppState.LOADING}
            />
            {appState === AppState.LOADING && (
              <div className="mt-8">
                <LoadingIndicator />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.SUCCESS && shotBook && (
              <ShotBookDisplay
                shotBook={shotBook}
                logEntries={logEntries}
                onNewProject={handleNewProject}
                onUpdateShot={handleUpdateShot}
                onRetryKeyframe={handleRetryKeyframe}
                allIngredientImages={lastPrompt?.images ?? []}
                onUpdateShotIngredients={handleUpdateShotIngredients}
                onUpdateAllIngredients={handleUpdateAllIngredients}
              />
            )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;