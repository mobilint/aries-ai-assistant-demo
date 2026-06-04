import { Box, Grid2, Typography } from "@mui/material";
import { getLanguageTexts } from "../settings";

export default function MessageIsTooShort({
  language,
  onTryAgain,
}: {
  language: string,
  onTryAgain: () => void,
}) {
  const texts = getLanguageTexts(language);

  return (
    <Grid2
      container
      size="grow"
      direction="column"
      rowSpacing={"30px"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "36px",
          lineHeight: "130%",
          letterSpacing: "-0.1px",
          textAlign: "center",
          verticalAlign: "middle",
          color: "#222222",
        }}
        >
        {texts.messageTooShort}
      </Typography>
      <Box
        component="button"
        type="button"
        aria-label={texts.tryAgain}
        onClick={onTryAgain}
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          columnGap: "2px",
          padding: "17px 27px",
          borderRadius: "10px",
          backgroundColor: "#153A83",
          border: "none",
          margin: 0,
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          "&:hover, &:active": {
            backgroundColor: "#153A83",
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
        <svg width="28" height="27" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.8756 11.3681C22.6325 10.7951 22.3353 10.2466 21.9879 9.73013L20.1227 10.989C20.6603 11.7881 21.0374 12.6841 21.2331 13.6271C21.4325 14.6101 21.4325 15.6231 21.2331 16.6061C21.1354 17.0809 20.9906 17.5448 20.8011 17.991C20.6168 18.4294 20.3895 18.8484 20.1227 19.242C19.5895 20.0284 18.9114 20.7061 18.1247 21.2389C17.3263 21.7762 16.4311 22.1533 15.4888 22.3492C14.5063 22.5461 13.4946 22.5461 12.5121 22.3492C11.098 22.0587 9.80043 21.3593 8.78044 20.3377C8.10668 19.6636 7.5689 18.8661 7.19644 17.9887C7.00851 17.5426 6.86458 17.0791 6.76669 16.605C6.46972 15.1409 6.61944 13.6214 7.19644 12.2434C7.56747 11.3662 8.10501 10.5692 8.77932 9.89663C9.45332 9.224 10.2499 8.68669 11.1261 8.31375C11.5704 8.12587 12.0373 7.98075 12.5098 7.884C12.6302 7.85925 12.7528 7.848 12.8743 7.82888V11.25L18.4993 6.75L12.8743 2.25V5.55525C12.6008 5.58553 12.3287 5.62719 12.0587 5.68012C10.8259 5.93275 9.65492 6.4259 8.61282 7.13138C6.76161 8.38015 5.40154 10.2331 4.76503 12.3734C4.12851 14.5138 4.25507 16.8088 5.12307 18.8663C5.6063 20.0118 6.30741 21.0525 7.18744 21.9307C8.06629 22.8079 9.10551 23.508 10.2486 23.9929C12.0456 24.7532 14.0313 24.9489 15.9422 24.5543C17.4718 24.2381 18.9018 23.5553 20.1093 22.5646C21.3168 21.5738 22.2657 20.3047 22.8744 18.8663C23.1219 18.2812 23.3121 17.6726 23.4369 17.0573C23.6978 15.7766 23.6978 14.4566 23.4369 13.176C23.3088 12.5566 23.1208 11.9512 22.8756 11.3681Z" fill="white" />
        </svg>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: "24px",
            lineHeight: "130%",
            letterSpacing: "-0.1px",
            textAlign: "center",
            verticalAlign: "middle",
            color: "#FFFFFF",
          }}
        >
          {texts.tryAgain}
        </Typography>
      </Box>
    </Grid2>
  )
}
