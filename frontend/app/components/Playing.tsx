import { Box, Grid2, Typography } from "@mui/material";
import { State } from "./type";
import { getLanguageTexts } from "../settings";

export default function Playing({
  language,
  state,
  isAskingRestart,
  isExampleMode,
  onEscTap,
}: {
  language: string,
  state: State,
  isAskingRestart: boolean,
  isExampleMode: boolean,
  onEscTap: () => void,
}) {
  const texts = getLanguageTexts(language);

  return (
    <Grid2
      container
      direction="column"
      size="grow"
      justifyContent={"center"}
      alignItems={"center"}
      rowSpacing={"82px"}
    >
      <Grid2
        container
        justifyContent={"center"}
        alignItems={"center"}
        sx={{
          position: "relative",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          backgroundColor: "#1C4EAF0A",
        }}
      >
        <Grid2
          container
          justifyContent={"center"}
          alignItems={"center"}
          sx={{
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            backgroundColor: "#1C4EAF14",
          }}
        >
          <Grid2
            container
            justifyContent={"center"}
            alignItems={"center"}
            sx={{
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              backgroundColor: "#1C4EAF1E",
            }}
          >
            <svg width="149" height="140" viewBox="0 0 149 140" fill="#1C4EAF" xmlns="http://www.w3.org/2000/svg">
              <path d="M107.611 0.5C103.316 0.5 99.8332 3.982 99.833 8.27734V131.723C99.8332 136.018 103.316 139.5 107.611 139.5C111.907 139.5 115.388 136.018 115.389 131.723V8.27734C115.388 3.98206 111.907 0.500116 107.611 0.5ZM41.3887 18C37.0934 18.0001 33.6116 21.4821 33.6113 25.7773V114.223C33.6116 118.518 37.0934 122 41.3887 122C45.6841 122 49.1668 118.518 49.167 114.223V25.7773C49.1668 21.482 45.6841 18 41.3887 18ZM74.5 44.25C70.2046 44.25 66.7229 47.732 66.7227 52.0273V87.9727C66.7229 92.268 70.2046 95.75 74.5 95.75C78.7954 95.75 82.2771 92.268 82.2773 87.9727V52.0273C82.2771 47.732 78.7954 44.25 74.5 44.25ZM140.723 53C136.427 53 132.945 56.482 132.944 60.7773V79.2227C132.945 83.518 136.427 87 140.723 87C145.018 86.9998 148.5 83.5179 148.5 79.2227V60.7773C148.5 56.4821 145.018 53.0002 140.723 53ZM8.27734 61.75C3.98214 61.7502 0.500231 65.2321 0.5 69.5273V70.4727C0.500234 74.7679 3.98214 78.2498 8.27734 78.25C12.5727 78.25 16.0554 74.768 16.0557 70.4727V69.5273C16.0554 65.232 12.5727 61.75 8.27734 61.75Z" fill="#1C4EAF" stroke="black" />
            </svg>
          </Grid2>
        </Grid2>
        {[State.SYNTHESIZING, State.PLAYING_WITH_SYNTHESIZING, State.PLAYING_WITHOUT_SYNTHESIZING].includes(state) && isAskingRestart == false && [1, 2, 3].map(i => (
          <Grid2
            key={i}
            sx={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              border: "3px solid rgba(28, 78, 175, .35)",
              transform: "scale(1.0)",
              opacity: 0,
              animation: "ripple 2.4s ease-out infinite",
              animationDelay: [undefined, "0.8s", "1.6s"][i],
            }}
          />
        ))}
      </Grid2>
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
    </Grid2>
  )
}
