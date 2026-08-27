import Grid2 from "@mui/material/Grid2"
import { Fragment } from 'react';
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from 'rehype-highlight'

export default function Answer({
  answer,
  isReasoningModel,
}: {
  answer: string | null,
  isReasoningModel: boolean,
}) {
  const thought_and_answer = !!answer && (isReasoningModel ? (answer.includes("<think>") ? answer.split("<think>")[1].split("</think>") : answer.split("</thought>")) : ["", answer]);
  const thought = thought_and_answer && thought_and_answer[0];
  const real_answer = thought_and_answer && thought_and_answer[1];

  return (
    <Grid2
      container
      size="grow"
      direction="column"
      alignItems="flex-start"
      sx={{
        fontFamily: "Pretendard",
        fontWeight: 400,
        fontSize: "24px",
        lineHeight: "130%",
        letterSpacing: "-0.2px",
        textAlign: "left",
        verticalAlign: "middle",
        "& pre, & code": { fontFamily: "CascadiaCode" },
      }}
    >
      {thought_and_answer &&
        <Fragment>
          {thought &&
            <Grid2
              container
              direction="column"
              alignItems="flex-start"
              sx={{
                color: "#898E94",
                "& > *:first-of-type": { marginTop: 0 },
                "& > *:last-of-type": { marginBottom: 0 },
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
              >
                {thought}
              </ReactMarkdown>
            </Grid2>
          }{real_answer &&
            <Grid2
              container
              direction="column"
              alignItems="flex-start"
              sx={{
                "& > *:first-of-type": { marginTop: 0 },
                "& > *:last-of-type": { marginBottom: 0 },
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
              >
                {real_answer}
              </ReactMarkdown>
            </Grid2>
          }
        </Fragment>
      }
    </Grid2>
  );
}