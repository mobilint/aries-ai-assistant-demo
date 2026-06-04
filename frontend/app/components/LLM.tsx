import BottomModal from "./BottomModal";
import Panel from "./Panel";
import { DialogType, State } from "./type";
import Answers from "./Answers";
import YesNoQuestion from "./YesNoQuestion";
import { getLanguageTexts } from "../settings";

export default function LLM({
  language,
  state,
  isReasoningModel,
  dialog,
  recentAnswer,
  isAskingRestart,
  isExampleMode,
  onSpacebarTap,
  onEscTap,
}: {
  language: string,
  state: State,
  isReasoningModel: boolean,
  dialog: DialogType,
  recentAnswer: string | null,
  isAskingRestart: boolean,
  isExampleMode: boolean,
  onSpacebarTap: () => void,
  onEscTap: () => void,
}) {
  const texts = getLanguageTexts(language);

  function getShadowLevel(state: State, isAskingRestart: boolean): 0 | 1 | 2 {
    switch (state) {
      case State.ANSWERING:
      case State.ANSWERED:
      case State.SYNTHESIZING:
      case State.PLAYING_WITH_SYNTHESIZING:
      case State.PLAYING_WITHOUT_SYNTHESIZING:
        return isAskingRestart ? 1 : 0;
      case State.FINISHED:
        return 1;
      default:
        return 2;
    }
  }

  const shadowLevel = getShadowLevel(state, isAskingRestart);

  return (
    <Panel
      title={texts.llmTitle}
      outlined={state == State.ANSWERING && isAskingRestart == false}
      shadowLevel={shadowLevel}
    >
      <Answers
        language={language}
        state={state}
        isReasoningModel={isReasoningModel}
        answers={dialog.map(qna => qna.answer).filter(answer => answer != null)}
        recentAnswer={recentAnswer}
        isExampleMode={isExampleMode}
        onEscTap={onEscTap}
      />
    {isAskingRestart && [State.ANSWERING, State.ANSWERED].includes(state) &&
      <BottomModal>
        <YesNoQuestion
          question={texts.restartQuestion}
          yes={texts.restartKeepGoing}
          no={texts.restartNow}
          onYes={onEscTap}
          onNo={onSpacebarTap}
        />
      </BottomModal>
    }
    </Panel>
  );
}
