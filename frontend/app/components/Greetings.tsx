import { Grid2, Typography } from "@mui/material";

export default function Greetings() {
  return (
    <Grid2
      container
      justifyContent="center"
      direction="column"
      wrap="nowrap"
      rowSpacing={"14px"}
    >
      <Typography
        sx={{
          fontWeight: "600",
          fontSize: "50px",
          lineHeight: "130%", 
          letterSpacing: "-0.2px",
          textAlign: "center",
          background: "linear-gradient(to right, #000000 0%, #006BEF 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Create AI Chat at the Edge!
      </Typography>
      <Typography
        sx={{
          fontWeight: "400",
          fontSize: "22px",
          lineHeight: "150%", 
          letterSpacing: "-0.2px",
          textAlign: "center",
          color: "#4D4D4D",
        }}
      >
        ARIES can run generative AI models in an edge environment.
        <br />
        Just simply type — and generate a chat entirely offline!
      </Typography>
    </Grid2>
  )
}