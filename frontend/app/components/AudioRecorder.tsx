"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { IconButton, Tooltip } from "@mui/material";
import { ArrowUpward, Delete, Mic } from "@mui/icons-material";

export interface recorderControls {
  startRecording: () => void;
  stopRecording: () => void;
  togglePauseResume: () => void;
  recordingBlob?: Blob;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaRecorder?: MediaRecorder;
}

export type MediaAudioTrackConstraints = Pick<
  MediaTrackConstraints,
  | "deviceId"
  | "groupId"
  | "autoGainControl"
  | "channelCount"
  | "echoCancellation"
  | "noiseSuppression"
  | "sampleRate"
  | "sampleSize"
>;

const LiveAudioVisualizer = React.lazy(async () => {
  const { LiveAudioVisualizer } = await import("react-audio-visualize");
  return { default: LiveAudioVisualizer };
});

function AudioRecorder({
  onRecordingComplete,
  onNotAllowedOrFound,
  recorderControls,
  audioTrackConstraints,
  showVisualizer,
  mediaRecorderOptions,
  disabled,
}: {
  onRecordingComplete?: (blob: Blob) => void;
  onNotAllowedOrFound?: (exception: DOMException) => any;
  recorderControls?: recorderControls;
  audioTrackConstraints?: MediaAudioTrackConstraints;
  showVisualizer?: boolean;
  mediaRecorderOptions?: MediaRecorderOptions;
  disabled?: boolean;
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
    recorderControls ??
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAudioRecorder(
      audioTrackConstraints,
      onNotAllowedOrFound,
      mediaRecorderOptions
    );

  const [shouldSave, setShouldSave] = useState(false);

  const stopAudioRecorder: (save?: boolean) => void = (
    save: boolean = true
  ) => {
    setShouldSave(save);
    stopRecording();
  };

  useEffect(() => {
    if (
      (shouldSave || recorderControls) &&
      recordingBlob != null &&
      onRecordingComplete != null
    ) {
      onRecordingComplete(recordingBlob);
    }
  }, [recordingBlob]);

  useEffect(() => {
    if (isRecording && disabled) {
      stopAudioRecorder(false);
    }
  }, [isRecording, disabled]);

  return (
    <div
      className={`audio-recorder ${isRecording ? "recording" : ""}`}
      data-testid="audio_recorder"
    >
    {isRecording ?
      <Tooltip title="Send recording">
        <IconButton aria-label="send" onClick={() => stopAudioRecorder()} disabled={disabled}>
          <ArrowUpward />
        </IconButton>
      </Tooltip> :
      <Tooltip title="Start recording">
        <IconButton aria-label="record" onClick={() => startRecording()} disabled={disabled}>
          <Mic />
        </IconButton>
      </Tooltip>
    }
      <span
        className={`audio-recorder-timer ${
          !isRecording ? "display-none" : ""
        }`}
        data-testid="ar_timer"
      >
        {Math.floor(recordingTime / 60)}:
        {String(recordingTime % 60).padStart(2, "0")}
      </span>
      {showVisualizer ? (
        <span
          className={`audio-recorder-visualizer ${
            !isRecording ? "display-none" : ""
          }`}
        >
          {mediaRecorder && (
            <Suspense fallback={<></>}>
              <LiveAudioVisualizer
                mediaRecorder={mediaRecorder}
                barWidth={2}
                gap={2}
                width={140}
                height={30}
                fftSize={512}
                maxDecibels={-10}
                minDecibels={-80}
                smoothingTimeConstant={0.4}
              />
            </Suspense>
          )}
        </span>
      ) : (
        <span
          className={`audio-recorder-status ${
            !isRecording ? "display-none" : ""
          }`}
        >
          <span className="audio-recorder-status-dot"></span>
          Recording
        </span>
      )}
      {isRecording &&
        <Tooltip title="Discard recording">
          <IconButton aria-label="discard" onClick={() => stopAudioRecorder(false)} disabled={disabled}>
            <Delete />
          </IconButton>
        </Tooltip>
      }
    </div>
  );
};

export default AudioRecorder;