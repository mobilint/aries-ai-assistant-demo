import { Box, Grid2, Typography } from "@mui/material";
import { getLanguageTexts } from "../settings";

export default function RecordReady({
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
      outline: "3px solid #FFFFFF",
      outlineOffset: "4px",
    },
  };

  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent={"flex-end"}
      alignItems={"center"}
      wrap="nowrap"
      sx={{
        borderRadius: "20px",
        overflow: "hidden",
        background: "linear-gradient(#1C4EAF, #002D66)",
        paddingBottom: "69px",
      }}
    >
      <Grid2
        container
        size="grow"
        direction="column"
        justifyContent={"center"}
        alignItems={"center"}
        rowSpacing={"35px"}
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
            backgroundColor: "#FFFFFF0A",
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
              backgroundColor: "#FFFFFF14",
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
                backgroundColor: "#FFFFFF1E",
              }}
            >
              <svg width="112" height="140" viewBox="0 0 112 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.9873 70.0723C13.9873 93.2108 32.8041 112.027 55.9424 112.027C79.0806 112.027 97.8975 93.2107 97.8975 70.0723H111.883C111.883 98.5531 90.4781 122.069 62.9346 125.53V139.998H48.9492V125.53C21.4059 122.069 0.00195312 98.546 0.00195312 70.0723H13.9873ZM56.0898 0C71.4313 0.00012469 83.9131 12.6147 83.9131 28.1172V70.0732C83.9128 85.4987 71.3678 98.043 55.9424 98.043C40.5172 98.0428 27.9729 85.4986 27.9727 70.0732V28.1172C27.9822 20.9291 30.7543 14.0194 35.7158 8.81836C40.6773 3.6174 47.4485 0.522956 54.6279 0.174805C55.1069 0.0615918 55.5977 0.0029572 56.0898 0Z" fill="white" />
              </svg>
            </Grid2>
          </Grid2>
        </Grid2>
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
              color: "#FFFFFF",
            }}
          >
            {texts.pressAndHold}
            <br />
            {texts.spacebar}
          </Typography>
        </Box>
      </Grid2>
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
