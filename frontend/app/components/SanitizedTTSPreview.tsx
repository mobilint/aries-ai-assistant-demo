import { Button } from "@mui/material";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import { getLanguageTexts } from "../settings";

export default function SanitizedTTSPreview({
  language,
  onOpen,
}: {
  language: string,
  onOpen: () => void,
}) {
  const texts = getLanguageTexts(language);

  return (
    <Button
      variant="contained"
      onClick={onOpen}
      aria-label={texts.ttsSanitizedPreviewButton}
      title={texts.ttsSanitizedPreviewButton}
      sx={{
        width: "44px",
        height: "44px",
        minWidth: "44px",
        borderRadius: "50%",
        color: "#4E81E2",
        backgroundColor: "#EAF1FF",
        boxShadow: "none",
        opacity: 0.82,
        "&:hover": {
          backgroundColor: "#DDE9FF",
          boxShadow: "none",
          opacity: 1,
        },
        "& .MuiSvgIcon-root": {
          fontSize: "22px",
        },
      }}
    >
      <TextSnippetIcon />
    </Button>
  );
}
