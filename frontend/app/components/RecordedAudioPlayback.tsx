import { useRef, useState } from "react";
import { Button } from "@mui/material";
import { Grid2 } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { getLanguageTexts } from "../settings";

export default function RecordedAudioPlayback({
  language,
  audioUrl,
}: {
  language: string,
  audioUrl?: string,
}) {
  const texts = getLanguageTexts(language);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const isPlaying = playingAudioUrl === audioUrl;

  if (!audioUrl)
    return null;

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio)
      return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    audio.play().catch((error) => {
      console.error("Failed to play recorded audio", error);
    });
  }

  return (
    <Grid2
      container
      justifyContent="flex-start"
      alignItems="center"
      sx={{
        width: "100%",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Button
        variant="contained"
        onClick={togglePlayback}
        aria-label={isPlaying ? texts.pauseRecording : texts.playRecording}
        sx={{
          width: "44px",
          height: "44px",
          minWidth: "44px",
          borderRadius: "50%",
          color: "#4E81E2",
          backgroundColor: "#EAF1FF",
          boxShadow: "none",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: "120%",
          textTransform: "none",
          opacity: 0.82,
          "&:hover": {
            backgroundColor: "#DDE9FF",
            boxShadow: "none",
            opacity: 1,
          },
          "& .MuiSvgIcon-root": {
            fontSize: "26px",
          },
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </Button>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlayingAudioUrl(audioUrl)}
        onPause={() => setPlayingAudioUrl(null)}
        onEnded={(event) => {
          setPlayingAudioUrl(null);
          event.currentTarget.currentTime = 0;
        }}
      />
    </Grid2>
  )
}