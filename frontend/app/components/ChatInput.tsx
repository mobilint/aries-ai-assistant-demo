import { Stop, ArrowUpward } from "@mui/icons-material";
import { FormControl, FilledInput, InputAdornment, IconButton, Modal, Box, Grid2, Typography, Button } from "@mui/material";
import { Fragment, RefObject, Suspense, useEffect, useState } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import Image from "next/image";
import React from "react";

const LiveAudioVisualizer = React.lazy(async () => {
  const { LiveAudioVisualizer } = await import("react-audio-visualize");
  return { default: LiveAudioVisualizer };
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "100vw",
  height: "100vh",
  bgcolor: 'rgb(0 0 0 / 0.8)',
  boxShadow: 50,
};

export default function ChatInput({
  isAnswering,
  isTranscribing,
  isPlaying,
  question,
  inputRef,
  setQuestion,
  ask,
  abort,
  sendVoice,
}: {
  isAnswering: boolean,
  isTranscribing: boolean,
  isPlaying: boolean,
  question: string,
  inputRef: RefObject<HTMLInputElement | null>,
  setQuestion: (question: string) => void,
  ask: () => void,
  abort: () => void,
  sendVoice: (blob: Blob) => void,
}) {
  const {
    startRecording,
    stopRecording,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAudioRecorder({
        noiseSuppression: true,
        echoCancellation: true,
    });

  const [shouldSave, setShouldSave] = useState<boolean>(false);
  
  const stopAudioRecorder: (save?: boolean) => void = (
    save: boolean = true
  ) => {
    setShouldSave(save);
    stopRecording();
  };

  useEffect(() => {
    if (recordingBlob != null && shouldSave) {
      sendVoice(recordingBlob);
    }
  }, [recordingBlob]);

  return (
    <Fragment>
      <FormControl
        fullWidth
        variant="standard"
        disabled={isAnswering || isTranscribing || isPlaying}
      >
        <FilledInput
          placeholder="Feel free to use the newly added STT and TTS features!"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disableUnderline
          sx={{
            backgroundColor: "transparent !important",
            border: "1px solid #ABABAB",
            borderRadius: "25px",
            padding: "25px",
            minHeight: "139px",
            "&.Mui-focused": {
              border: "1px solid #006BEF",
            },
          }}

          endAdornment={
          question || isAnswering ?
            <InputAdornment
              position="end"
              sx={{
                alignSelf: "flex-end",
                width: "48px",
                height: "48px",
                marginLeft: "20px",
              }}
            >
              <IconButton
                disabled={isTranscribing || isPlaying}
                disableRipple
                onClick={(e) => isAnswering ? abort() : ask()}
                sx={{
                  color: "white",
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#006BEF !important",
                }}
              >
              {isAnswering ?
                <Stop sx={{ color: "white" }} /> :
                <svg width="26" height="16" viewBox="0 0 26 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 12.8229L3.22096 16L13 6.35416L22.779 16L26 12.8229L13 0L0 12.8229Z" fill="currentColor"/>
                </svg>
              }
              </IconButton>
            </InputAdornment> :
            <InputAdornment
              position="end"
              sx={{
                alignSelf: "flex-end",
                marginLeft: "20px",
                maxHeight: "45px !important"
              }}
            >
              <Button
                aria-label="ask with voice"
                disabled={isTranscribing || isPlaying || isAnswering}
                disableRipple
                onClick={(e) => question ? ask() : startRecording()}
                sx={{
                  color: "#FFFFFF",
                  padding: "10px 16px",
                  borderRadius: "15px",
                  background: "linear-gradient(to top, #064BB0 0%, #007DEA 100%)",
                  "&:hover": {
                    color: "#B1D4FF",
                  },
                  "&:disabled": {
                    color: "#B1D4FF",
                    background: "linear-gradient(to top, #064BB0CC 0%, #007DEACC 100%)",
                  },
                }}
              >
                <span style={{
                  fontWeight: "500",
                  fontSize: "18px",
                  lineHeight: "150%",
                  letterSpacing: "-0.2px",
                  marginRight: "8px"
                }}>
                  ASK ME
                </span>
                <svg width="22" height="19.8" viewBox="0 0 22 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.0488 0.000514848C12.2474 -0.00896085 12.4448 0.0357036 12.6201 0.129421C12.7956 0.223347 12.9426 0.364003 13.0449 0.534695C13.1471 0.705305 13.2011 0.900286 13.2012 1.09915V18.7007C13.2013 18.8998 13.1472 19.0953 13.0449 19.2661C12.9426 19.437 12.7957 19.5774 12.6201 19.6714C12.4444 19.7648 12.2466 19.809 12.0479 19.7993C11.8492 19.7896 11.6569 19.7266 11.4912 19.6167L5.16699 15.4009H2.2002C0.986872 15.4009 0.000143669 14.414 0 13.2007V6.60012C0 5.38671 0.986784 4.39995 2.2002 4.39993H5.16699L11.4922 0.184109C11.6578 0.0739203 11.8501 0.0100208 12.0488 0.000514848ZM21 1.99954C21.5523 1.99954 22 2.44725 22 2.99954V16.9995C21.9998 17.5517 21.5522 17.9995 21 17.9995C20.4478 17.9995 20.0002 17.5517 20 16.9995V2.99954C20 2.44725 20.4477 1.99954 21 1.99954ZM6.11133 6.41458C6.08383 6.43218 6.04911 6.43518 6.02051 6.45169C5.89094 6.52087 5.74867 6.56374 5.60254 6.57864C5.5676 6.58201 5.537 6.6 5.50098 6.60012H2.2002V13.2007H5.50098C5.53597 13.2008 5.56557 13.2179 5.60059 13.2212C5.74781 13.2346 5.89066 13.2785 6.02051 13.3491C6.04911 13.3634 6.08383 13.3666 6.11133 13.3853L11.001 16.646V3.15384L6.11133 6.41458ZM17 4.99954C17.5523 4.99954 18 5.44725 18 5.99954V13.9995C17.9998 14.5517 17.5522 14.9995 17 14.9995C16.4478 14.9995 16.0002 14.5517 16 13.9995V5.99954C16 5.44725 16.4477 4.99954 17 4.99954Z" fill="currentColor"/>
                </svg>
              </Button>
            </InputAdornment>
          }

          inputProps={{
            ref: inputRef,
            onKeyDown: (e) => {
              if (e.key === "Enter" && !isAnswering && !isTranscribing && !isPlaying) {
                e.preventDefault();
                ask();
              }
            },
            style: {
              fontWeight: "400",
              fontSize: "18px",
              lineHeight: "170%",
              letterSpacing: "-0.2px",
              padding: 0,
              alignSelf: "flex-start"
            },
            maxLength: 500,
          }}

          multiline
        />
      </FormControl>
      <Modal
        open={isRecording}
        onClose={() => stopAudioRecorder(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid2
            container
            direction="column"
            justifyContent={"center"}
            alignItems={"center"}
            sx={{width: "100%", height: "100%"}}
          >
            <Grid2
              container
              justifyContent={"center"}
              alignItems={"center"}
              sx={{
                width: "159.05px",
                height: "158px",
                borderRadius: "88.88px",
                background: "linear-gradient(#1692FF 0%, #013EBA 100%)",
              }}
            >
              <Image
                src="/recording.svg"
                width={75.05}
                height={71.1}
                alt="recording"
              />
            </Grid2>
            <Grid2 container sx={{margin: "85px 0px 55px 0px"}}>
              {mediaRecorder && (
                <Suspense fallback={<></>}>
                  <LiveAudioVisualizer
                    mediaRecorder={mediaRecorder}
                    barWidth={2}
                    gap={2}
                    width={512}
                    height={30}
                    fftSize={512}
                    maxDecibels={-10}
                    minDecibels={-80}
                    smoothingTimeConstant={0.4}
                  />
                </Suspense>
              )}
            </Grid2>
            <Typography
              sx={{
                fontWeight: "400",
                fontSize: "32px",
                lineHeight: "28px",
                letterSpacing: "-0.5px",
                color: "#FFFFFF",
              }}
            >
              We're listening to you. Feel free to speak naturally.
            </Typography>
          </Grid2>
          <Grid2
            container
            justifyContent={"center"}
            columnSpacing={"20px"}
            sx={{
              position: "absolute",
              width: "100%",
              bottom: "81px",
            }}
          >
            <IconButton
              disableRipple
              onClick={(e) => stopAudioRecorder(false)}
              sx={{
                width: "45px",
                height: "45px",
                border: "1px solid #D0D0D0",
                borderRadius: "23px",
                backgroundColor: "#FFFFFF26",
                ":hover": {
                  backgroundColor: "#FFFFFFA6",
                },
              }}
            >
              <Image
                src="/cancel.svg"
                width={17}
                height={17}
                alt="cancel"
              />
            </IconButton>
            <IconButton
              disableRipple
              onClick={(e) => stopAudioRecorder(true)}
              sx={{
                width: "45px",
                height: "45px",
                border: "1px solid #D0D0D0",
                borderRadius: "23px",
                backgroundColor: "#FFFFFF26",
                ":hover": {
                  backgroundColor: "#FFFFFFA6",
                },
              }}
            >
              <Image
                src="/ok.svg"
                width={20}
                height={15}
                alt="ok"
              />
            </IconButton>
          </Grid2>
        </Box>
      </Modal>
    </Fragment>
  );
}