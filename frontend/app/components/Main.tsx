import { Grid2 } from "@mui/material";
import { DialogType, LLMModelOption, State, STTModelOption } from "./type";
import STT from "./STT";
import LLM from "./LLM";
import TTS from "./TTS";

export default function Main({
  language,
  state,
  isReasoningModel,
  dialog,
  recentAnswer,
  hasSanitizedTTSInput,
  onOpenSanitizedPreview,
  isAskingRestart,
  isExampleMode,
  recordedAudioUrl,
  sttModels,
  currentSTTModel,
  isSTTModelSwitching,
  isSTTModelSelectorDisabled,
  llmModels,
  currentLLMModel,
  isLLMModelSwitching,
  isLLMModelSelectorDisabled,
  changeSTTModel,
  changeLLMModel,
  onSpacebarDown,
  onSpacebarUp,
  onSpacebarTap,
  onEscTap,
  onEnterTap,
}: {
  language: string,
  state: State,
  isReasoningModel: boolean,
  dialog: DialogType,
  recentAnswer: string | null,
  hasSanitizedTTSInput: boolean,
  onOpenSanitizedPreview: () => void,
  isAskingRestart: boolean,
  isExampleMode: boolean,
  recordedAudioUrl?: string,
  sttModels: STTModelOption[],
  currentSTTModel: string,
  isSTTModelSwitching: boolean,
  isSTTModelSelectorDisabled: boolean,
  llmModels: LLMModelOption[],
  currentLLMModel: string,
  isLLMModelSwitching: boolean,
  isLLMModelSelectorDisabled: boolean,
  changeSTTModel: (modelId: string) => void,
  changeLLMModel: (modelId: string) => void,
  onSpacebarDown: () => void,
  onSpacebarUp: () => void,
  onSpacebarTap: () => void,
  onEscTap: () => void,
  onEnterTap: () => void,
}) {
  return (
    <Grid2
      container
      size="grow"
      columnSpacing={"26px"}
      justifyItems={"space-between"}
      sx={{
        margin: "0px 34px 34px 34px",
      }}
    >
      <STT
        language={language}
        state={state}
        dialog={dialog}
        isAskingRestart={isAskingRestart}
        recordedAudioUrl={recordedAudioUrl}
        sttModels={sttModels}
        currentSTTModel={currentSTTModel}
        isSTTModelSwitching={isSTTModelSwitching}
        isSTTModelSelectorDisabled={isSTTModelSelectorDisabled}
        llmModels={llmModels}
        currentLLMModel={currentLLMModel}
        isLLMModelSwitching={isLLMModelSwitching}
        isLLMModelSelectorDisabled={isLLMModelSelectorDisabled}
        changeSTTModel={changeSTTModel}
        changeLLMModel={changeLLMModel}
        onSpacebarDown={onSpacebarDown}
        onSpacebarUp={onSpacebarUp}
        onSpacebarTap={onSpacebarTap}
        onEnterTap={onEnterTap}
      />
      <LLM
        language={language}
        state={state}
        dialog={dialog}
        isReasoningModel={isReasoningModel}
        recentAnswer={recentAnswer}
        isAskingRestart={isAskingRestart}
        isExampleMode={isExampleMode}
        onSpacebarTap={onSpacebarTap}
        onEscTap={onEscTap}
      />
      <TTS
        language={language}
        state={state}
        isAskingRestart={isAskingRestart}
        isExampleMode={isExampleMode}
        hasSanitizedTTSInput={hasSanitizedTTSInput}
        onOpenSanitizedPreview={onOpenSanitizedPreview}
        onSpacebarTap={onSpacebarTap}
        onEscTap={onEscTap}
      />
    </Grid2 >
  )
}
