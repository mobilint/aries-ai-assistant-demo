import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Chip, ListItemText, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { getLanguageTexts } from "../settings";
import { LLMModelOption } from "./type";

export default function LLMModelSelector({
  language,
  models,
  currentModel,
  disabled,
  isSwitching,
  changeModel,
}: {
  language: string,
  models: LLMModelOption[],
  currentModel: string,
  disabled: boolean,
  isSwitching: boolean,
  changeModel: (modelId: string) => void,
}) {
  const texts = getLanguageTexts(language);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = anchorEl != null;
  const currentOption = models.find((model) => model.id == currentModel);
  const label = currentOption?.label ?? texts.llmModelUnavailable;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        position: "fixed",
        top: "90px",
        left: "35px",
        zIndex: 20,
      }}
    >
      <Button
        disabled={disabled || models.length == 0}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<AutoAwesomeIcon />}
        endIcon={<ExpandMoreIcon />}
        variant="contained"
        sx={{
          alignSelf: "flex-start",
          borderRadius: "999px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #D7DFEF",
          boxShadow: "0 10px 24px rgba(13, 35, 67, 0.10)",
          color: "#1F344D",
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "none",
          maxWidth: "360px",
          "&:hover": {
            backgroundColor: "#F4F8FD",
            boxShadow: "0 12px 28px rgba(13, 35, 67, 0.14)",
          },
          "&.Mui-disabled": {
            color: "#8EA1B8",
            backgroundColor: "#F5F7FA",
            borderColor: "#E2E8F0",
          },
        }}
      >
        {isSwitching ? texts.llmModelSwitching : label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: "10px",
              borderRadius: "14px",
              border: "1px solid #D7DFEF",
              boxShadow: "0 20px 40px rgba(13, 35, 67, 0.12)",
              minWidth: "360px",
              maxHeight: "68vh",
              overflow: "auto",
            },
          },
        }}
      >
        {models.map((model) => {
          const isActive = model.id == currentModel;

          return (
            <MenuItem
              key={model.id}
              selected={isActive}
              onClick={() => {
                setAnchorEl(null);
                if (model.id != currentModel)
                  changeModel(model.id);
              }}
              sx={{
                minHeight: "52px",
                backgroundColor: isActive ? "#EEF4FC" : "#FFFFFF",
                gap: "10px",
              }}
            >
              <ListItemText
                primary={model.label}
                secondary={model.id}
                primaryTypographyProps={{
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                  color: "#1F344D",
                }}
                secondaryTypographyProps={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#7A8CA2",
                }}
              />
              {model.default ? <Chip size="small" label="Default" /> : null}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}