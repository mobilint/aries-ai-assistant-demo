import { Close } from "@mui/icons-material";
import { Modal, Box, Grid2, Typography, IconButton, Button } from "@mui/material";
import { ReactNode } from "react";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: '#FFFFFF',
  border: 'none',
  borderRadius: "20px",
  boxShadow: 50,
  p: "30px",
};

export default function MobilintModal({
  title,
  open,
  onClose,
  onReset,
  children,
}: {
  title: string,
  open: boolean,
  onClose: () => void,
  onReset: () => void,
  children?: ReactNode,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        boxShadow: "0px 6px 50px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Box sx={style}>
        <Grid2
          container
          direction="column"
          justifyContent="flex-start"
        >
          <Grid2 container alignItems={"center"} justifyContent="space-between">
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "20px",
                lineHeight: "150%",
                letterSpacing: "-1%",
                color: "#303843",
              }}
            >
              {title}
            </Typography>
            <IconButton disableRipple aria-label="close" onClick={(e) => onClose()} sx={{padding: 0}}>
              <Close sx={{color: "black"}}/>
            </IconButton>
          </Grid2>
          <div
            style={{
              borderBottom: "1px solid #DEDEDE",
              margin: "22px 0px",
            }}
          ></div>
          <Grid2
            container
            justifyContent={"center"}
          >
            {children}
          </Grid2>
          <Grid2
            container
            justifyContent="flex-end"
            columnSpacing={"16px"}
            sx={{
              marginTop: "60px",
            }}
          >
            <Button
              variant="outlined"
              disableRipple
              sx={{
                borderRadius: "40px",
                padding: "10px 20px",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "regular",
                lineHeight: "150%",
                letterSpacing: "-1%",
                color: "#303843",
                borderColor: "#B0B0B0",
              }}
              onClick={(e) => onClose()}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              disableRipple
              sx={{
                borderRadius: "40px",
                padding: "10px 20px",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "regular",
                lineHeight: "150%",
                letterSpacing: "-1%",
                color: "#FFFFFF",
                backgroundColor: "#006BEF",
              }}
              onClick={(e) => {onClose(); onReset();}}
            >
              Get Creative New Chat
            </Button>
          </Grid2>
        </Grid2>
      </Box>
    </Modal>
  )
}