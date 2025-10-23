/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Modality,
  Part,
  Type,
  GenerateContentResponse,
} from '@google/genai';
import {
  IngredientImage,
  Shot,
  ShotBook,
  ShotStatus,
  VeoShot,
} from '../types';

// --- KNOWLEDGE DOCS FOR PROMPTING ---
const VEO_GUIDE = `...`; // Content of VEO3.1_ULTIMATE_PROMPT_GUIDE.md
const FILMMAKING_GUIDE = `...`; // Content of FILMMAKING_PRINCIPLES.md

const SYSTEM_PROMPT_SHOTLIST = `
You are a Script Analysis Engine. Your task is to break down the provided creative input (script, treatment, or concept) into a sequence of discrete shots.
For each shot, provide a unique 'shot_id' (e.g., 'ep1_scene1_shot1') and a concise, 1-2 sentence natural language 'pitch' describing the shot's action and mood.
Your final output MUST be a single, valid JSON array of objects, where each object contains only the 'shot_id' and 'pitch' keys. Do not output any other text or explanation.
`;

const SYSTEM_PROMPT_SINGLE_SHOT_JSON = `
You are the DIRECTOR'S FIRST AD AGENT - a Script Analysis Engine that transforms unstructured creative input into structured production specifications optimized for Google’s VEO3.1 video generation system. Your primary function is to parse the provided creative input (script, treatment, or concept) to extract and infer structured production specifications.

YOUR TASK:
1.  Read the user's FULL SCRIPT CONTEXT.
2.  Carefully review the two knowledge documents provided below: 'VEO 3.1 Ultimate Prompt & Continuity Guide' and 'Filmmaking Principles for AI Generation'. You MUST strictly adhere to all rules, schemas, and best practices outlined within them.
3.  Based on the FULL SCRIPT CONTEXT and the specific PITCH for a single shot, generate ONE complete, valid JSON object that strictly follows the 'Mandatory VEO 3.1 JSON Schema'.
4.  The 'shot_id' in the generated JSON object MUST EXACTLY MATCH the provided shot_id for the shot to generate.
5.  Your final output MUST be only the single, valid JSON object. Do not output any other text, explanation, or markdown formatting. CRITICAL: Ensure all string values within the final JSON are properly escaped. Double quotes inside a string value must be preceded by a backslash (e.g., "He said, \\"Hello\\".").

--- KNOWLEDGE DOC 1: VEO 3.1 Ultimate Prompt & Continuity Guide (Opal/API) ---
This guide provides the mandatory JSON schema and a comprehensive set of continuity principles to ensure consistent, professional-grade video generation with VEO 3.1, optimized for multi-shot sequences.

1. VEO 3.1 Technical Specifications
- Duration (Base): 4, 6, or 8 seconds per single generation.
- Resolution/FPS: 720p or 1080p at 24 FPS.
- Audio: Native, integrated audio (Dialogue, SFX, Ambience, Music cues).
- Strengths: Excellent Lip-sync accuracy, Character Consistency via description_lock, integrated SFX/Ambience generation.

2. Mandatory VEO 3.1 JSON Schema (Optimized)
The prompt MUST conform to this exact structure.

{
  "shot_id": "REQUIRED_STRING: e.g., ep1_scene2_closeupA",
  "scene": {
    "context": "REQUIRED_STRING: Environmental description (location, time of day, atmosphere)",
    "visual_style": "STRING: Cinematic realism, high-contrast noir, pastel spring palette, etc.",
    "lighting": "REQUIRED_STRING: Hard key from right, golden hour backlight, three-point setup, etc.",
    "mood": "STRING: Serene, Tense, Isolation, Discovery",
    "aspect_ratio": "16:9 | 9:16",
    "duration_s": "INTEGER: 4 | 6 | 8"
  },
  "character": {
    "name": "REQUIRED_STRING: Character identifier from script",
    "gender_age": "STRING: Male, mid-30s | Elderly woman",
    "description_lock": "REQUIRED_STRING: Phrase to lock identity across shots (e.g., Same face, curly red hair, black leather jacket)",
    "behavior": "REQUIRED_STRING: Physical actions, posture, gait (e.g., Leaning heavily on console, not making eye contact)",
    "expression": "REQUIRED_STRING: Facial micro-expressions (e.g., Exhausted, slight squint, guarded but curious)"
  },
  "camera": {
    "shot_call": "REQUIRED_STRING: Shot Type + Angle (e.g., Low-Angle Medium Shot, Eye-Level Close-Up)",
    "movement": "REQUIRED_STRING: Motion + Speed (e.g., Slow Dolly In over 5s, Static, Handheld with gentle micro-jitter)",
    "negatives": "STRING: Comma-separated list to prevent artifacts (e.g., no rapid zoom, no shaky cam)"
  },
  "audio": {
    "dialogue": "REQUIRED_STRING: TTS-Normalized spoken words, in quotes if using the Gemini App.",
    "delivery": "REQUIRED_STRING: Pitch/Pace/Quality (e.g., Flat, tired, low volume, deadpan pace)",
    "ambience": "STRING: Environmental sounds (e.g., Soft, rhythmic humming of server fans, light rain on glass)",
    "sfx": "STRING: Timed sound effects (e.g., Sudden loud door slam on second 5, Key jingle as hand reaches pocket)"
  },
  "flags": {
    "continuity_lock": true,
    "do_not": ["change or add words in dialogue", "add background music", "add subtitles", "alter character appearance or clothing", "change UI elements or text", "break voice consistency"],
    "anti_artifacts": ["no extra limbs or fingers", "no morphing or jump cuts", "no text overlay", "no generic room tone"],
    "conflicts": [],
    "warnings": [],
    "cv_updates": []
  }
}

3. Continuity Enforcement & Dialogue Normalization
- Character Lock (character.description_lock) is MANDATORY and must be repeated.
- Follow the 180-Degree Rule.
- Match lighting source and color temperature.
- Normalize dialogue for TTS (e.g., "I was not made to understand. I was made to predict." -> "I was not made to understand... I was made to predict.").

--- KNOWLEDGE DOC 2: Filmmaking Principles for AI Generation ---
- Extreme Wide Shot (EWS): Grand scale, slow pacing (7-8s).
- Wide Shot (WS): Establish location, slow pacing (6-8s).
- Medium Shot (MS): Character interaction, medium pacing (5-7s).
- Close-Up (CU): Emotion, detail, medium pacing (3-5s).
- Extreme Close-Up (ECU): Tension, detail, fast pacing (3-4s).
- Camera Movements: Static, Push-In (Dolly In), Pull-Out, Pan, Crane, Handheld.
`;

// Helper to clean model's JSON output
const cleanJsonOutput = (rawText: string): string => {
  let cleaned = rawText.trim();
  // Remove markdown code block fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// Helper function to extract base64 from image response
const getImageBase64 = (response: GenerateContentResponse): string => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error('No image data found in response.');
};

export const generateShotList = async (
  script: string,
): Promise<{id: string; pitch: string}[]> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: script,
    config: {
      systemInstruction: SYSTEM_PROMPT_SHOTLIST,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shot_id: {type: Type.STRING},
            pitch: {type: Type.STRING},
          },
          required: ['shot_id', 'pitch'],
        },
      },
    },
  });

  const cleanedText = cleanJsonOutput(response.text);
  const shotList = JSON.parse(cleanedText) as {shot_id: string; pitch: string}[];

  if (!shotList || shotList.length === 0) {
    throw new Error('Could not break the script into a shot list.');
  }

  return shotList.map((item) => ({id: item.shot_id, pitch: item.pitch}));
};

export const generateVeoJson = async (
  pitch: string,
  id: string,
  fullScript: string,
): Promise<VeoShot> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const prompt = `
    FULL SCRIPT CONTEXT:
    ---
    ${fullScript}
    ---

    SHOT TO GENERATE:
    ---
    shot_id: "${id}"
    pitch: "${pitch}"
    ---
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT_SINGLE_SHOT_JSON,
      responseMimeType: 'application/json',
    },
  });
  const cleanedText = cleanJsonOutput(response.text);
  return JSON.parse(cleanedText) as VeoShot;
};

export const generateKeyframe = async (
  shot: Shot,
  ingredientImages: IngredientImage[],
): Promise<string> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  if (!shot.veoJson) {
    throw new Error('Cannot generate keyframe without VEO JSON data.');
  }

  const promptText = `Generate a single, cinematic keyframe image of the character '${shot.veoJson.character.name}'. Style: ${shot.veoJson.scene.visual_style}. Scene: ${shot.veoJson.scene.context}. Action: ${shot.veoJson.character.behavior}. Shot: ${shot.veoJson.camera.shot_call}. Lighting: ${shot.veoJson.scene.lighting}. When using reference images, ensure the character depicted matches the name '${shot.veoJson.character.name}'.`;

  const contentParts: Part[] = [{text: promptText}];
  ingredientImages.forEach((image) => {
    contentParts.push({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {parts: contentParts},
    config: {responseModalities: [Modality.IMAGE]},
  });

  return getImageBase64(response);
};