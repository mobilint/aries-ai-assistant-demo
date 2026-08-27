import { Box, Grid2, Typography } from "@mui/material";
import { getLanguageTexts } from "../settings";

export default function PressAndHold({
  language,
  onSpacebarDown,
  onSpacebarUp,
  onEnterTap,
}: {
  language: string,
  onSpacebarDown: () => void,
  onSpacebarUp: () => void,
  onEnterTap: () => void,
}) {
  const texts = getLanguageTexts(language);
  const resetButtonSx = {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    font: "inherit",
    cursor: "pointer",
    color: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    textAlign: "inherit",
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
  };

  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent={"center"}
      alignItems={"center"}
      rowSpacing={"35px"}
    >
      <Box
        component="button"
        type="button"
        aria-label={`${texts.pressAndHold} ${texts.spacebar}`}
        onPointerDown={onSpacebarDown}
        onPointerUp={onSpacebarUp}
        onPointerCancel={onSpacebarUp}
        onPointerLeave={onSpacebarUp}
        sx={resetButtonSx}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "48px",
            lineHeight: "130%",
            letterSpacing: "-0.1px",
            textAlign: "center",
            verticalAlign: "middle",
            color: "#222222",
          }}
          >
          {texts.pressAndHold}
          <br />
          <span style={{ color: "#2362DB" }}>{texts.spacebar}</span>
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        aria-label={texts.sampleQuestionHint}
        onClick={onEnterTap}
        sx={{
          ...resetButtonSx,
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
      <Grid2
        container
        direction="row"
        wrap="nowrap"
        justifyContent={"center"}
        alignItems={"center"}
      >
        <svg width="25" height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_910_247)">
            <path d="M12.4999 0.962891C6.11791 0.962891 0.925781 6.36271 0.925781 12.9999C0.925781 19.6371 6.11791 25.037 12.4999 25.037C18.8818 25.037 24.0739 19.6371 24.0739 12.9999C24.0739 6.36271 18.8818 0.962891 12.4999 0.962891ZM12.4999 22.6296C7.39453 22.6296 3.2406 18.3095 3.2406 12.9999C3.2406 7.69039 7.39453 3.3703 12.4999 3.3703C17.6052 3.3703 21.7591 7.69039 21.7591 12.9999C21.7591 18.3095 17.6052 22.6296 12.4999 22.6296Z" fill="#4E81E2" />
            <path d="M11.1113 11.7476H13.8891V19.2588H11.1113V11.7476ZM11.1113 6.74023H13.8891V9.24394H11.1113V6.74023Z" fill="#4E81E2" />
          </g>
          <defs>
            <clipPath id="clip0_910_247">
              <rect width="25" height="26" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <Typography
          sx={{
            marginLeft: "10px",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: "130%",
            letterSpacing: "-0.1px",
            textAlign: "left",
            verticalAlign: "middle",
            color: "#4E81E2",
          }}
        >
          {texts.sampleQuestionHint}
        </Typography>
      </Grid2>
      </Box>
    </Grid2>
  )
}
