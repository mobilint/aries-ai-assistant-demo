import { Button, Grid2 } from "@mui/material";
import Image from "next/image";

export default function MobilintButton({
  text,
  iconSrc,
  width,
  height,
  isActive,
  isPointColor,
  onClick,
}: {
  text: string,
  iconSrc?: string,
  width?: number,
  height?: number,
  isActive: boolean,
  isPointColor?: boolean,
  onClick: () => void,
}) {
  return (
    <Button
      variant="contained"
      disableElevation
      disableRipple
      onClick={(e) => onClick()}
      sx={{
        borderRadius: "10px",
        padding: "10px 15px",
        textTransform: "none",
        fontSize: "16px",
        fontWeight: "regular",
        lineHeight: "130%",
        letterSpacing: "-0.2%",
        color: isPointColor ? "#FFFFFF" : "#FFFFFF",
        justifyContent: "flex-start",
        "startIcon": {
          margin: 0,
        },
        backgroundColor: isPointColor ? "#003E8B" : (isActive ? "#464646 !important" : "transparent !important"),
        ":hover": {
          backgroundColor: isPointColor ? undefined : "#2D2D2D !important",
        }
      }}
    >
    {iconSrc && width && height &&
      <Grid2
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          width: "25px",
          height: "25px",
          marginRight: "18px",
          color: "#000000",
        }}
      >
        <Image
          src={iconSrc}
          width={20}
          height={20 / width * height}
          alt={"icon"}
        />
      </Grid2>
    }
      {text}
    </Button>
  )
}