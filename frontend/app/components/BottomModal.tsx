import { Grid2 } from "@mui/material";
import React from "react";

export default function BottomModal({
  children
}: Readonly<{
  children?: React.ReactNode
}>) {
  return (
    <Grid2
      container
      size="grow"
      direction="column"
      justifyContent={"flex-end"}
      alignItems={"stretch"}
      wrap="nowrap"
      sx={{
        position: "absolute",
        borderRadius: "20px",
        overflow: "hidden",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <Grid2
        container
        sx={{
          zIndex: 2,
          borderRadius: "20px",
          backgroundColor: "#FFFFFF",
          padding: "62px 60px",
          boxShadow: "0px 4px 4px #0000004F"
        }}
      >
        {children}
      </Grid2>
    </Grid2>
  )
}