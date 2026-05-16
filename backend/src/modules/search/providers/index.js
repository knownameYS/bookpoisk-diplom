import { curateWithDeepSeek } from './deepseek.js';
import { curateWithGenApi } from './genapi.js';
import { curateWithGemini } from './gemini.js';
import { curateWithOpenAi } from './openai.js';
import { env } from '../../../config/env.js';
import { interpretWithDeepSeek } from './deepseek.js';
import { interpretWithGenApi } from './genapi.js';
import { interpretWithGemini } from './gemini.js';
import { interpretWithOpenAi } from './openai.js';
import { recommendWithDeepSeek } from './deepseek.js';
import { recommendWithGenApi } from './genapi.js';
import { recommendWithGemini } from './gemini.js';
import { recommendWithOpenAi } from './openai.js';
import { suggestWithDeepSeek } from './deepseek.js';
import { suggestWithGenApi } from './genapi.js';
import { suggestWithGemini } from './gemini.js';
import { suggestWithOpenAi } from './openai.js';

export async function curateAiSearch(prompt) {
  if (env.aiProvider === 'genapi') {
    return curateWithGenApi(prompt);
  }

  if (env.aiProvider === 'openai') {
    return curateWithOpenAi(prompt);
  }

  if (env.aiProvider === 'deepseek') {
    return curateWithDeepSeek(prompt);
  }

  return curateWithGemini(prompt);
}

export async function interpretSearchPrompt(prompt) {
  if (env.aiProvider === 'genapi') {
    return interpretWithGenApi(prompt);
  }

  if (env.aiProvider === 'openai') {
    return interpretWithOpenAi(prompt);
  }

  if (env.aiProvider === 'deepseek') {
    return interpretWithDeepSeek(prompt);
  }

  return interpretWithGemini(prompt);
}

export async function recommendBooksWithAi(prompt, candidates) {
  if (env.aiProvider === 'genapi') {
    return recommendWithGenApi(prompt, candidates);
  }

  if (env.aiProvider === 'openai') {
    return recommendWithOpenAi(prompt, candidates);
  }

  if (env.aiProvider === 'deepseek') {
    return recommendWithDeepSeek(prompt, candidates);
  }

  return recommendWithGemini(prompt, candidates);
}

export async function suggestBooksWithAi(prompt) {
  if (env.aiProvider === 'genapi') {
    return suggestWithGenApi(prompt);
  }

  if (env.aiProvider === 'openai') {
    return suggestWithOpenAi(prompt);
  }

  if (env.aiProvider === 'deepseek') {
    return suggestWithDeepSeek(prompt);
  }

  return suggestWithGemini(prompt);
}
