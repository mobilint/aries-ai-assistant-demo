export type QNA = {
  question: string,
  answer: null | string,
};

export type DialogType = QNA[];

export type RawHistory = { role: string, content: string }[];

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