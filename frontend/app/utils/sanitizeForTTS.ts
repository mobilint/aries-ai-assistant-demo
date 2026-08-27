import { ENG_TO_KOR } from "../settings";

const EMOJI_REGEX = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/gu;
const ENGLISH_TOKEN_BOUNDARY = "A-Za-z0-9&+\\-'.";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDictionaryKey(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function applyEnglishToKoreanDictionary(text: string): string {
  const entries = Object.entries(ENG_TO_KOR).sort((a, b) => b[0].length - a[0].length);
  const dictionary = new Map(entries.map(([source, target]) => [normalizeDictionaryKey(source), target]));
  const alternation = entries
    .map(([source]) => escapeRegExp(source).replace(/\s+/g, "\\s+"))
    .join("|");

  if (!alternation) {
    return text;
  }

  const pattern = new RegExp(
    `(^|[^${ENGLISH_TOKEN_BOUNDARY}])(${alternation})(?=$|[^${ENGLISH_TOKEN_BOUNDARY}])`,
    "gi",
  );

  return text.replace(pattern, (match, prefix, phrase) => {
    const replacement = dictionary.get(normalizeDictionaryKey(phrase));
    return `${prefix}${replacement ?? phrase}`;
  });
}

function normalizeBracketContent(text: string): string {
  return text
    .replace(/\[([^\]]+)\]/g, " $1. ")
    .replace(/\(([^)]+)\)/g, " $1 ")
    .replace(/\{([^}]+)\}/g, " $1 ");
}

export function sanitizeForTTS(input: string, language: string): string {
  let text = input ?? "";

  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]*)`/g, "$1");
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ");
  text = text.replace(/https?:\/\/\S+/g, " ");
  text = text.replace(/^\s{0,3}(#{1,6})\s+/gm, "");
  text = text.replace(/^\s{0,3}>+\s?/gm, "");
  text = text.replace(/^\s*([-*+]|\d+[.)])\s+/gm, ". ");
  text = text.replace(/[*_~]+/g, "");

  if (language === "ko") {
    text = applyEnglishToKoreanDictionary(text);
  }

  text = normalizeBracketContent(text);
  text = text.replace(/[\[\](){}<>]/g, " ");
  text = text.replace(EMOJI_REGEX, " ");
  text = text.replace(/[\t\r\n]+/g, ". ");
  text = text.replace(/[:;]+/g, ". ");
  text = text.replace(/[|/\\]+/g, ", ");
  text = text.replace(/[•·]+/g, ", ");
  text = text.replace(/\.\s*\.\s*\.+/g, ". ");
  text = text.replace(/,\s*,+/g, ", ");
  text = text.replace(/([?!]){2,}/g, "$1");
  text = text.replace(/\s+([.,?!])/g, "$1");
  text = text.replace(/([.,?!])(?!\s|$)/g, "$1 ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
