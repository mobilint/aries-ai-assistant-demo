import { Box, Grid2, Typography } from "@mui/material";
import { State } from "./type";
import Answer from "./Answer";
import { useEffect, useRef, useState } from "react";
import { getLanguageTexts } from "../settings";

function RotatingText({
  items,
  interval,
}: {
  items: string[],
  interval: number
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!items?.length || items.length === 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);

    return () => clearInterval(id);
  }, [items, interval]);

  return <span>{items?.[index] ?? ""}</span>;
}

export default function Answers({
  language,
  state,
  isReasoningModel,
  answers,
  recentAnswer,
  isExampleMode,
  onEscTap,
}: {
  language: string,
  state: State,
  isReasoningModel: boolean,
  answers: (string | null)[],
  recentAnswer: string | null,
  isExampleMode: boolean,
  onEscTap: () => void,
}) {
  const texts = getLanguageTexts(language);
  const scrollGridRef = useRef<HTMLDivElement | null>(null);
  const bottomDivRef = useRef<HTMLDivElement | null>(null);
  
  const scrollToBottom = () => {
    bottomDivRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  }

  useEffect(() => {
    if (scrollGridRef.current != null) {
      scrollToBottom();
    }
  }, [answers.length, recentAnswer]);

  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent={"flex-start"}
      alignItems={"stretch"}
      rowSpacing={"30px"}
      sx={{
        padding: "50px 45px",
      }}
    >
      <Grid2
        container
        size="grow"
        wrap="nowrap"
        direction="column"
        justifyContent={"stretch"}
        alignItems={"flex-start"}
        sx={{
          overflowY: "auto",
        }}
        ref={scrollGridRef}
      >
        {answers.map((answer, i) =>
          <Grid2
            key={i}
            container
            justifyContent={"flex-start"}
            sx={{
              borderRadius: "10px",
              backgroundColor: "#F3F5F8",
              padding: "30px",
              color: i == answers.length - 1 && state != State.ANSWERING ? "#222222" : "#818181",
            }}
          >
            <Answer
              answer={answer}
              isReasoningModel={isReasoningModel}
            />
          </Grid2>
        )}{recentAnswer &&
          <Grid2
            container
            justifyContent={"flex-start"}
            rowSpacing={"27px"}
            sx={{
              borderRadius: "10px",
              backgroundColor: "#F3F5F8",
              padding: "30px",
              color: "#222222",
            }}
          >
            <Typography
              sx={{
                fontFamily: "CascadiaCode",
                fontWeight: 400,
                fontSize: "24px",
                lineHeight: "130%",
                letterSpacing: "-0.2px",
                textAlign: "left",
                verticalAlign: "middle",
                color: "#1D50B3",
              }}
            >
              <RotatingText
                items={texts.inferenceStatuses}
                interval={2000}
              />
            </Typography>
            <Grid2
              container
            >
              <Answer
                answer={recentAnswer}
                isReasoningModel={isReasoningModel}
              />
            </Grid2>
          </Grid2>
        }
        <div ref={bottomDivRef} style={{ marginTop: "-30px" }}></div>
      </Grid2>
      {state == State.ANSWERING &&
        <Box
          component="button"
          type="button"
          aria-label={isExampleMode ? texts.exitExampleMode : texts.quitHint}
          onClick={onEscTap}
          sx={{
            border: "none",
            background: "transparent",
            margin: 0,
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            "&:hover, &:active": {
              background: "transparent",
            },
            "&:focus": {
              outline: "none",
            },
            "&:focus-visible": {
              outline: "3px solid #4E81E2",
              outlineOffset: "4px",
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: "24px",
              lineHeight: "130%",
              letterSpacing: "-0.2px",
              textAlign: "center",
              verticalAlign: "middle",
              color: "#919294",
              padding: "12px 0px",
            }}
          >
            {isExampleMode ? texts.exitExampleMode : texts.quitHint}
          </Typography>
        </Box>
      }
    </Grid2>
  );
}
