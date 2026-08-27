import BottomModal from "./BottomModal";
import { Grid2 } from "@mui/material";
import MessageIsTooShort from "./MessageIsTooShort";
import Panel from "./Panel";
import PressAndHold from "./PressAndHold";
import Questions from "./Questions";
import RecordedAudioPlayback from "./RecordedAudioPlayback";
import Recording from "./Recording";
import RecordReady from "./RecordReady";
import LLMModelSelector from "./LLMModelSelector";
import STTModelSelector from "./STTModelSelector";
import { DialogType, LLMModelOption, State, STTModelOption } from "./type";
import { getLanguageTexts } from "../settings";

export default function STT({
  language,
  state,
  dialog,
  isAskingRestart,
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
  onEnterTap,
}: {
  language: string,
  state: State,
  dialog: DialogType,
  isAskingRestart: boolean,
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
  onEnterTap: () => void,
}) {
  const texts = getLanguageTexts(language);

  const selector = (
    <>
      <STTModelSelector
        language={language}
        models={sttModels}
        currentModel={currentSTTModel}
        disabled={isSTTModelSelectorDisabled}
        isSwitching={isSTTModelSwitching}
        changeModel={changeSTTModel}
      />
      <LLMModelSelector
        language={language}
        models={llmModels}
        currentModel={currentLLMModel}
        disabled={isLLMModelSelectorDisabled}
        isSwitching={isLLMModelSwitching}
        changeModel={changeLLMModel}
      />
    </>
  );

  if (state == State.RECORD_READY && dialog.length == 0)
    return (
      <>
        {selector}
        <RecordReady
          language={language}
          onSpacebarDown={onSpacebarDown}
          onSpacebarUp={onSpacebarUp}
          onEnterTap={onEnterTap}
        />
      </>
    );

  function getShadowLevel(state: State, isAskingRestart: boolean): 0 | 1 | 2 {
    switch (state) {
      case State.RECORD_READY:
      case State.MESSAGE_IS_TOO_SHORT:
        return 1;
      case State.RECORDING:
      case State.ANSWERING:
      case State.ANSWERED:
        return isAskingRestart ? 1 : 0;
      default:
        return 2;
    }
  }

  const shadowLevel = getShadowLevel(state, isAskingRestart);
  const shouldShowRecordingPlayback =
    !!recordedAudioUrl && state != State.RECORD_READY && state != State.RECORDING;

  return (
    <Panel
      title={texts.sttTitle}
      outlined={state == State.RECORDING && isAskingRestart == false}
      shadowLevel={shadowLevel}
    >
      {selector}
      {state == State.RECORDING ?
        <Recording language={language} onSpacebarUp={onSpacebarUp} /> :
        <Grid2
          container
          direction="column"
          justifyContent="space-between"
          alignItems="stretch"
          wrap="nowrap"
          sx={{
            width: "100%",
            minHeight: 0,
          }}
        >
          {state == State.MESSAGE_IS_TOO_SHORT ?
            <Recording language={language} onSpacebarUp={onSpacebarUp} /> :
            <Questions
              state={state}
              questions={dialog.map(qna => qna.question)}
            />
          }
          <Grid2
            container
            justifyContent="flex-start"
            sx={{
              padding: "0px 45px 42px 45px",
              position: "relative",
              zIndex: 2,
            }}
          >
            {shouldShowRecordingPlayback ?
              <RecordedAudioPlayback language={language} audioUrl={recordedAudioUrl} /> :
              null
            }
          </Grid2>
        </Grid2>
      }{state == State.RECORD_READY ?
        <BottomModal>
          <PressAndHold
            language={language}
            onSpacebarDown={onSpacebarDown}
            onSpacebarUp={onSpacebarUp}
            onEnterTap={onEnterTap}
          />
        </BottomModal> :
      state == State.MESSAGE_IS_TOO_SHORT ?
        <BottomModal>
          <MessageIsTooShort language={language} onTryAgain={onSpacebarTap} />
        </BottomModal> :
        null
      }
    </Panel>
  )
}
