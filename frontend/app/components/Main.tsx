import { Grid2, Typography, IconButton, Button } from "@mui/material";
import ChatInput from "./ChatInput";
import { DialogType } from "./type";
import Dialog from "./Dialog";
import { RefObject, useRef } from "react";
import Greetings from "./Greetings";
import Image from "next/image";
import MobilintButton from "./MobilintButton";

export default function Main({
  isAnswering,
  isTranscribing,
  isPlayStarted,
  isPlayEnded,
  playingIndex,
  question,
  setQuestion,
  dialog,
  tasksNum,
  recentAnswer,
  ask,
  abort,
  inputRef,
  sendVoice,
  read,
  abortTTS,
  historyIndex,
  history,
}: {
  isAnswering: boolean,
  isTranscribing: boolean,
  isPlayStarted: boolean,
  isPlayEnded: boolean,
  playingIndex: number | null,
  question: string,
  setQuestion: (question: string) => void,
  dialog: DialogType,
  tasksNum: number,
  recentAnswer: string | null,
  ask: (question: string) => void,
  abort: () => void,
  inputRef: RefObject<HTMLInputElement | null>,
  sendVoice: (blob: Blob) => void,
  read: (index: number, text: string) => void,
  abortTTS: () => void,
  historyIndex: number | null,
  history: DialogType[],
}) {
  const scrollGridRef = useRef<HTMLDivElement | null>(null);

  return (
    <Grid2
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      size="grow"
      sx={{
        backgroundColor: "#FFFFFF",
      }}
    >
      <Grid2
        container
        justifyContent={"space-between"}
        alignItems={"center"}
        wrap="nowrap"
        sx={{
          width: "100%",
          padding: "29px 34px 23px 41px",
          borderBottom: "1px solid #B8B8B8",
        }}
      >
        <Typography
          sx={{
            fontWeight: "600",
            fontSize: "32px",
            lineHeight: "130%",
            letterSpacing: "-0.2px",
            color: "#292929",
            verticalAlign: "middle",
          }}
        >
          MLA100 AI Assistant Demo
        </Typography>
      </Grid2>
      
      <Grid2
        container
        size="grow"
        direction="column"
        wrap="nowrap"
        justifyContent={historyIndex == null && dialog.length == 0 ? "center" : undefined}
        alignItems="stretch"
        rowSpacing={"45px"}
        sx={{
          width: "880px",
          overflowY: "scroll",
          margin: "70px 0px",
        }}
        ref={scrollGridRef}
      >
        {historyIndex == null ?
          dialog.length == 0 ?
            <Greetings /> :
            <Dialog
              dialog={dialog}
              tasksNum={tasksNum}
              isAnswering={isAnswering}
              isPlayStarted={isPlayStarted}
              isPlayEnded={isPlayEnded}
              playingIndex={playingIndex}
              recentAnswer={recentAnswer}
              read={read}
              abortTTS={abortTTS}
              scrollGridRef={scrollGridRef}
            /> :
          <Dialog
            dialog={history[historyIndex]}
            tasksNum={tasksNum}
            isAnswering={false}
            isPlayStarted={isPlayStarted}
            isPlayEnded={isPlayEnded}
            playingIndex={playingIndex}
            recentAnswer={null}
            read={read}
            abortTTS={abortTTS}
            scrollGridRef={scrollGridRef}
          />
        }
      </Grid2>
      {historyIndex == null &&
        <Grid2
          container
          sx={{
            width: "880px",
            paddingBottom: "64px",
          }}
        >
          <ChatInput
            isAnswering={isAnswering}
            isTranscribing={isTranscribing}
            isPlaying={playingIndex != null}
            question={question}
            inputRef={inputRef}
            setQuestion={setQuestion}
            ask={() => ask(question)}
            abort={abort}
            sendVoice={sendVoice}
          />
        </Grid2>
      }
    </Grid2>
  )
}