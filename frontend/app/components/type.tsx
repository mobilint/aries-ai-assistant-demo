export type QNA = {
  question: string,
  answer: null | string,
};

export type DialogType = QNA[];

export type RawHistory = { role: string, content: string }[];

export type STTModelOption = {
  id: string,
  label: string,
  family: "whisper" | "qwen3-asr" | string,
  supports_language_hint: boolean,
  default?: boolean,
};

export type STTModelsState = {
  models: STTModelOption[],
  current_model: string,
  is_switching?: boolean,
  message?: string | null,
};

export type LLMModelOption = {
  id: string,
  label: string,
  family: string,
  system_prompt_path: string,
  inter_prompt_path: string,
  generation_config_path: string,
  default?: boolean,
};

export type LLMModelsState = {
  models: LLMModelOption[],
  current_model: string,
  is_switching?: boolean,
  message?: string | null,
};

export function parseHistory(raw_history: RawHistory) {
  if (raw_history.length <= 1)
    return [];

  let result: DialogType = [];
  for (let i = 1; i < raw_history.length; i++) {
    const elem = raw_history[i];
    if (elem.role == "user")
      result.push({ question: elem.content, answer: null });
    else if (elem.role == "assistant")
      result[result.length - 1].answer = elem.content;
  }

  return result;
}

export enum State {
  RECORD_READY,
  RECORDING,
  MESSAGE_IS_TOO_SHORT,
  TRANSCRIBING,
  ANSWERING,
  ANSWERED,
  SYNTHESIZING,
  PLAYING_WITH_SYNTHESIZING,
  PLAYING_WITHOUT_SYNTHESIZING,
  FINISHED,
}