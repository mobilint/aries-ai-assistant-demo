import { Grid2, Typography } from "@mui/material"
import { State } from "./type";
import { useRef, useEffect } from "react";

export default function Questions({
  state,
  questions,
}: {
  state: State,
  questions: (string | null)[]
}) {
  const scrollGridRef = useRef<HTMLDivElement | null>(null);
  const bottomDivRef = useRef<HTMLDivElement | null>(null);
    
  const scrollToBottom = () => {
    bottomDivRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" })
  }

  useEffect(() => {
    if (scrollGridRef.current != null) {
      scrollToBottom();
    }
  }, [questions.length]);

  const new_questions = state == State.TRANSCRIBING ? [...questions, "..."] : questions

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
        justifyContent={"flex-start"}
        alignItems={"stretch"}
        sx={{
          overflowY: "auto",
        }}
        ref={scrollGridRef}
      >
        {new_questions.map((question, i) =>
          <Grid2
            key={i}
            container
            justifyContent={"flex-end"}
            sx={{
              borderRadius: "10px",
              backgroundColor: "#F3F5F8",
              padding: "30px",
            }}
          >
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: "24px",
                lineHeight: "130%",
                letterSpacing: "-0.2px",
                textAlign: "right",
                verticalAlign: "middle",
                color: i == new_questions.length - 1 ? "#222222" : "#818181",
              }}
            >
              {question}
            </Typography>
          </Grid2>
        )}
        <div ref={bottomDivRef} style={{ marginTop: "-30px" }}></div>
      </Grid2>
    </Grid2>
  );
}