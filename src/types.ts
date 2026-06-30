/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VocabItem {
  id: string;
  vi: string;
  en: string;
  topic: string;
  example?: string;
  exampleEn?: string;
  memorized: boolean;
}

export interface GrammarPuzzle {
  id: string;
  viSentence: string;
  enSentence: string;
  lesson: string;
  hintWords?: string[];
}

export interface WhiteboardWord {
  id: string;
  vi: string;
  en: string;
}

export interface WhiteboardLine {
  id: string;
  viText: string;
  fullEnText: string;
  words: WhiteboardWord[];
  grammar?: string;
}

export interface WhiteboardTab {
  id: string;
  title: string;
  lines: WhiteboardLine[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation: string;
}
