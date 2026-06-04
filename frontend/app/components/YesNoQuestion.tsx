import { Box, Grid2, Typography } from "@mui/material";

export default function YesNoQuestion({
  question,
  yes,
  no,
  onYes,
  onNo,
}: {
  question: string,
  yes: string,
  no: string,
  onYes: () => void,
  onNo: () => void,
}) {
  return (
    <Grid2
      container
      direction="column"
      wrap="nowrap"
      justifyContent={"center"}
      alignItems={"center"}
      rowSpacing={"30px"}
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
        {question}
      </Typography>
      <Grid2
        container
        direction="row"
        wrap="nowrap"
        columnSpacing={"30px"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Box
          component="button"
          type="button"
          aria-label={yes}
          onClick={onYes}
          sx={{
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
            {yes}
          </Typography>
        </Box>
        <Box
          component="button"
          type="button"
          aria-label={no}
          onClick={onNo}
          sx={{
            padding: "17px 27px",
            borderRadius: "10px",
            backgroundColor: "#D3DFF7",
            border: "none",
            margin: 0,
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            "&:hover, &:active": {
              backgroundColor: "#D3DFF7",
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
              fontWeight: 500,
              fontSize: "24px",
              lineHeight: "130%",
              letterSpacing: "-0.1px",
              textAlign: "center",
              verticalAlign: "middle",
              color: "#153A83",
            }}
          >
            {no}
          </Typography>
        </Box>
      </Grid2>
    </Grid2>
  )
}