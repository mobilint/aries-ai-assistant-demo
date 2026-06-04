import enTexts from "./i18n/en.json";
import koTexts from "./i18n/ko.json";
import { exampleQuestionsByLanguage } from "./questions/catalog";

export type LanguageText = {
  appTitle: string,
  liveDemo: string,
  noMicrophone: string,
  sttTitle: string,
  llmTitle: string,
  ttsTitle: string,
  pressAndHold: string,
  spacebar: string,
  sampleQuestionHint: string,
  messageTooShort: string,
  tryAgain: string,
  recordingReviewTitle: string,
  recordingReviewHint: string,
  playRecording: string,
  pauseRecording: string,
  ttsSanitizedPreviewButton: string,
  ttsSanitizedPreviewTitle: string,
  ttsSanitizedPreviewHint: string,
  ttsSanitizedPreviewEmpty: string,
  ttsSanitizedPreviewClose: string,
  recordingLanguageHint: string,
  releaseSpacebarToSendPrefix: string,
  releaseSpacebarToSendSuffix: string,
  sttModelSelectorLabel: string,
  sttModelSwitching: string,
  sttModelUnavailable: string,
  llmModelSelectorLabel: string,
  llmModelSwitching: string,
  llmModelUnavailable: string,
  restartQuestion: string,
  restartKeepGoing: string,
  restartNow: string,
  continueConversationQuestion: string,
  continueConversationYes: string,
  continueConversationNo: string,
  exitExampleMode: string,
  quitHint: string,
  inferenceStatuses: string[],
};

export type PromptBundle = {
  language: string,
  system_prompt: string,
  inter_prompt: string,
};

export const DEFAULT_LANGUAGE = "en";
export const AVAILABLE_LANGUAGES = ["en", "ko"] as const;

export const example_questions_by_language = exampleQuestionsByLanguage;

export const language_labels: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export const language_texts: Record<string, LanguageText> = {
  en: enTexts,
  ko: koTexts,
};

export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

export const ENG_TO_KOR: Record<string, string> = {
  "Neural Processing Unit": "뉴럴 프로세싱 유닛",
  "ARIES": "애리스",
  "REGULUS": "레귤러스",
  "Mobilint, Inc.": "모빌린트",
  "Mobilint": "모빌린트",
  "Google": "구글",
  "Google Cloud": "구글 클라우드",
  "DeepMind": "딥마인드",
  "TPU": "티피유",
  "Tensor Processing Unit": "텐서 프로세싱 유닛",
  "AMD": "에이엠디",
  "Intel": "인텔",
  "NVIDIA": "엔비디아",
  "ARM": "암",
  "LPU": "엘피유",
  "Language Processing Unit": "랭귀지 프로세싱 유닛",
  "Groq": "그록",
  "OpenAI": "오픈에이아이",
  "Anthropic": "앤트로픽",
  "Meta": "메타",
  "Microsoft": "마이크로소프트",
  "Azure": "애저",
  "AWS": "에이더블유에스",
  "Amazon Web Services": "아마존 웹 서비스",
  "Claude": "클로드",
  "ChatGPT": "챗지피티",
  "Gemini": "제미나이",
  "Qwen": "큐웬",
  "Llama": "라마",
  "Mistral": "미스트랄",
  "Falcon": "팰컨",
  "DeepSeek": "딥시크",
  "Whisper": "위스퍼",
  "Gemma": "젬마",
  "Phi": "파이",
  "BERT": "버트",
  "RoBERTa": "로버타",
  "T5": "티파이브",
  "FLAN-T5": "플랜 티파이브",
  "PaLM": "팜",
  "Vicuna": "비쿠냐",
  "Yi": "이",
  "Command R": "커맨드 알",
  "Command R+": "커맨드 알 플러스",
  "Mixtral": "믹스트랄",
  "Hugging Face": "허깅 페이스",
  "CUDA": "쿠다",
  "ROCm": "록엠",
  "XLA": "엑스엘에이",
  "MLIR": "엠엘아이알",
  "RAG": "알에이지",
  "MoE": "엠오이",
  "GPU": "지피유",
  "CPU": "씨피유",
  "DSP": "디에스피",
  "qb": "큐비",
  "SDK": "에스디케이",
  "NPU": "엔피유",
  "CES": "씨이에스",
  "TOPS": "톱스",
  "AIoT": "에이아이오티",
  "TensorFlow": "텐서플로",
  "PyTorch": "파이토치",
  "ONNX": "오닉스",
  "SoC": "에스오씨",
  "System on Chip": "시스템 온 칩",
  "Internet of Things": "인터넷 오브 띵즈",
  "EXAONE": "엑사원",
  "LG": "엘지",
  "Research": "리서치",
};

export function getLanguageTexts(language: string): LanguageText {
  return language_texts[language] ?? language_texts[DEFAULT_LANGUAGE];
}

async function fetchPromptText(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load prompt bundle file: ${path} (${response.status})`);
  }

  return response.text();
}

export async function loadPromptBundle(language: string): Promise<PromptBundle> {
  const locale = AVAILABLE_LANGUAGES.includes(language as typeof AVAILABLE_LANGUAGES[number])
    ? language
    : DEFAULT_LANGUAGE;

  const [systemPrompt, interPrompt] = await Promise.all([
    fetchPromptText(`/prompt-bundles/${locale}/system.txt`),
    fetchPromptText(`/prompt-bundles/${locale}/inter.txt`),
  ]);

  return {
    language: locale,
    system_prompt: systemPrompt.trim(),
    inter_prompt: interPrompt.trim(),
  };
}
