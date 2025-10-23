/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum ShotStatus {
  PENDING_JSON = 'PENDING_JSON', // Waiting for VEO JSON to be generated
  GENERATING_JSON = 'GENERATING_JSON', // VEO JSON generation in progress
  PENDING_GENERATION = 'PENDING_GENERATION', // JSON created, image not yet requested
  GENERATING_IMAGE = 'GENERATING_IMAGE', // Image generation in progress
  NEEDS_REVIEW = 'NEEDS_REVIEW', // Image generated, awaiting user approval
  APPROVED = 'APPROVED', // User approved
  GENERATION_FAILED = 'GENERATION_FAILED', // Keyframe or JSON generation failed
}

export enum LogType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  STEP = 'STEP',
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: LogType;
}

// Based on VEO 3.1 JSON Schema from user's knowledge doc
export interface VeoShot {
  shot_id: string;
  scene: {
    context: string;
    visual_style: string;
    lighting: string;
    mood: string;
    aspect_ratio: '16:9' | '9:16';
    duration_s: 4 | 6 | 8;
  };
  character: {
    name: string;
    gender_age: string;
    description_lock: string;
    behavior: string;
    expression: string;
  };
  camera: {
    shot_call: string;
    movement: string;
    negatives?: string;
  };
  audio: {
    dialogue: string;
    delivery: string;
    ambience?: string;
    sfx?: string;
  };
  flags: {
    continuity_lock: boolean;
    do_not: string[];
    anti_artifacts: string[];
    conflicts: string[];
    warnings: string[];
    cv_updates: string[];
  };
}

// The interactive shot object used in the app's state
export interface Shot {
  id: string; // A unique ID for React keys, from shot_id
  status: ShotStatus;
  pitch: string; // The natural language pitch
  veoJson?: VeoShot; // Now optional, as it's generated in a separate step
  keyframeImage?: string; // base64 string
  errorMessage?: string; // If image generation fails
  ingredientImages?: IngredientImage[]; // base64 images used for this shot
}

export type ShotBook = Shot[];

// For uploaded reference images
export interface IngredientImage {
  base64: string;
  mimeType: string;
}