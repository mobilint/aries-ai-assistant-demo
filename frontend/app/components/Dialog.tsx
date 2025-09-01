import { Grid2, Typography } from "@mui/material";
import { Fragment, MutableRefObject, useEffect, useRef } from "react";
import Answer from "./Answer";
import { QNA } from "./type";

export default function Dialog({
  dialog,
  tasksNum,
  isAnswering,
  isPlayStarted,
  isPlayEnded,
  playingIndex,
  recentAnswer,
  read,
  abortTTS,
  scrollGridRef,
}: {
  dialog: QNA[],
  tasksNum: number,
  isAnswering: boolean,
  isPlayStarted: boolean,
  isPlayEnded: boolean,
  playingIndex: number | null,
  recentAnswer: string | null,
  read: (index: number, text: string) => void,
  abortTTS: () => void,
  scrollGridRef: MutableRefObject<HTMLDivElement | null>,
}) {
  const bottomDivRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomDivRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  }

  useEffect(() => {
    if (scrollGridRef.current != null) {
      const diff = scrollGridRef.current.scrollHeight - scrollGridRef.current.offsetHeight - scrollGridRef.current.scrollTop;
      if (-100 < diff && diff < 100)
        scrollToBottom();
    }
  }, [recentAnswer])

  useEffect(() => {
    scrollToBottom();
  }, [dialog.length])

  return (
    <Fragment>
      {dialog.map((qna, index) =>
        <Fragment key={`${index}`}>
          <Grid2 container justifyContent="flex-end">
            <Typography
              sx={{
                backgroundColor: "#F5F5F5",
                padding: "25px",
                borderRadius: "25px",
                fontWeight: "regular",
                fontSize: "18px",
                lineHeight: "170%",
                letterSpacing: "-0.2px",
                color: "#292929",
                maxWidth: "500px",
              }}
            >
              {qna.question}
            </Typography>
          </Grid2>
          {!(isAnswering == true && index == dialog.length - 1) &&
            <Answer
              index={index}
              answer={qna.answer}
              tasksNum={tasksNum}
              isAnswering={false}
              isPlayStarted={isPlayStarted}
              isPlayEnded={isPlayEnded}
              playingIndex={playingIndex}
              read={read}
              abortTTS={abortTTS}
            />
          }
        </Fragment>
      )}
      {isAnswering &&
        <Answer
          index={-1}
          answer={recentAnswer}
          tasksNum={tasksNum}
          isAnswering={isAnswering}
          isPlayStarted={isPlayStarted}
          isPlayEnded={isPlayEnded}
          playingIndex={playingIndex}
          read={read}
          abortTTS={abortTTS}
        />
      }
      <div ref={bottomDivRef}></div>
    </Fragment>
  );
}