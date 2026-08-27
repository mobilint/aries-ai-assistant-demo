import enQuestions from "./locales/en.json";
import koQuestions from "./locales/ko.json";

const MODEL_IDS = [
  "LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct",
  "LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct",
  "LGAI-EXAONE/EXAONE-4.0-1.2B",
  "LGAI-EXAONE/EXAONE-Deep-2.4B",
  "LGAI-EXAONE/EXAONE-Deep-7.8B",
  "naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-0.5B",
  "naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B",
  "meta-llama/Llama-3.2-1B-Instruct",
  "meta-llama/Llama-3.2-3B-Instruct",
  "meta-llama/Llama-3.1-8B-Instruct",
  "Qwen/Qwen2.5-0.5B-Instruct",
  "Qwen/Qwen2.5-1.5B-Instruct",
  "Qwen/Qwen2.5-3B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
  "Qwen/Qwen3-0.6B",
  "Qwen/Qwen3-1.7B",
  "Qwen/Qwen3-4B",
  "Qwen/Qwen3-8B"
] as const;

type ExampleQuestions = Record<string, string[]>;

function buildCatalog(questions: string[]): ExampleQuestions {
  return Object.fromEntries(MODEL_IDS.map((modelId) => [modelId, questions]));
}

export const exampleQuestionsByLanguage: Record<string, ExampleQuestions> = {
  en: buildCatalog(enQuestions),
  ko: buildCatalog(koQuestions),
};
