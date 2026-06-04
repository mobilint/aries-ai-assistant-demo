import { Grid2, Typography } from "@mui/material";

export default function Panel({
  title,
  outlined,
  shadowLevel,
  children,
}: Readonly<{
  title: string,
  outlined: boolean,
  shadowLevel: 0 | 1 | 2,
  children?: React.ReactNode
}>) {
  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent={"stretch"}
      alignItems={"stretch"}
      wrap="nowrap"
      sx={{
        borderRadius: "20px",
        border: outlined ? "7px solid #2362DB" : undefined,
        overflow: "hidden",
        position: "relative",
        "&::after": shadowLevel ? {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: shadowLevel == 2 ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
          pointerEvents: "none",
        } : {}
      }}
    >
      <Grid2
        container
        justifyContent={"center"}
        alignItems={"center"}
        padding={outlined ? "15px 0px 22px 0px" : "22px 0px"}
        sx={{
          backgroundColor: "#2362DB",
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "32px",
            lineHeight: "130%",
            letterSpacing: "-0.2px",
            textAlign: "left",
            verticalAlign: "middle",
            color: "#F0F0F0",
          }}
        >
          {title}
        </Typography>
      </Grid2>
      <Grid2
        container
        size="grow"
        sx={{
          backgroundColor: "#FFFFFF",
        }}
      >
        {children}
      </Grid2>
    </Grid2>
  )
}