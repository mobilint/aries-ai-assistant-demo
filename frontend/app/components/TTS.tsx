import BottomModal from "./BottomModal";
import Panel from "./Panel";
import { State } from "./type";
import YesNoQuestion from "./YesNoQuestion";
import CenterModal from "./CenterModal";
import Playing from "./Playing";
import SanitizedTTSPreview from "./SanitizedTTSPreview";
import { Grid2 } from "@mui/material";
import { getLanguageTexts } from "../settings";

export default function TTS({
  language,
  state,
  isAskingRestart,
  isExampleMode,
  hasSanitizedTTSInput,
  onOpenSanitizedPreview,
  onSpacebarTap,
  onEscTap,
}: {
  language: string,
  state: State,
  isAskingRestart: boolean,
  isExampleMode: boolean,
  hasSanitizedTTSInput: boolean,
  onOpenSanitizedPreview: () => void,
  onSpacebarTap: () => void,
  onEscTap: () => void,
}) {
  const texts = getLanguageTexts(language);

  function getShadowLevel(state: State, isAskingRestart: boolean): 0 | 1 | 2 {
    switch (state) {
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
      title={texts.ttsTitle}
      outlined={[State.SYNTHESIZING, State.PLAYING_WITH_SYNTHESIZING, State.PLAYING_WITHOUT_SYNTHESIZING].includes(state) && isAskingRestart == false}
      shadowLevel={shadowLevel}
    >
      {hasSanitizedTTSInput && state !== State.FINISHED && (
        <Grid2
          container
          justifyContent="flex-end"
          sx={{
            position: "absolute",
            bottom: "42px",
            right: "45px",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <Grid2 sx={{ pointerEvents: "auto" }}>
            <SanitizedTTSPreview language={language} onOpen={onOpenSanitizedPreview} />
          </Grid2>
        </Grid2>
      )}
    {[State.SYNTHESIZING, State.PLAYING_WITH_SYNTHESIZING, State.PLAYING_WITHOUT_SYNTHESIZING, State.FINISHED].includes(state) &&
      <Playing
        language={language}
        state={state}
        isAskingRestart={isAskingRestart}
        isExampleMode={isExampleMode}
        onEscTap={onEscTap}
      />
    }{isAskingRestart && [State.SYNTHESIZING, State.PLAYING_WITH_SYNTHESIZING, State.PLAYING_WITHOUT_SYNTHESIZING].includes(state) &&
      <BottomModal>
        <YesNoQuestion
          question={texts.restartQuestion}
          yes={texts.restartKeepGoing}
          no={texts.restartNow}
          onYes={onEscTap}
          onNo={onSpacebarTap}
        />
      </BottomModal>
    }{state == State.FINISHED &&
      <CenterModal>
        <YesNoQuestion
          question={texts.continueConversationQuestion}
          yes={texts.continueConversationYes}
          no={texts.continueConversationNo}
          onYes={onSpacebarTap}
          onNo={onEscTap}
        />
      </CenterModal>
    }
    </Panel>
  );
}
