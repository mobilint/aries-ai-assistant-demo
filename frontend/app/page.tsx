"use client";

/* eslint-disable react-hooks/exhaustive-deps --
 * This page intentionally coordinates long-lived socket, keyboard, audio, and
 * recorder callbacks with refs such as recentAnswerRef/isPromptConfigReadyRef.
 * Re-subscribing those effects on every state transition can duplicate socket
 * listeners or interrupt in-flight recording/playback state machines.
 */

import Grid2 from "@mui/material/Grid2";
import { Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Main from "./components/Main";
import { DialogType, LLMModelOption, LLMModelsState, State, STTModelOption, STTModelsState } from "./components/type";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Header from "./components/Header";
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, example_questions_by_language, getLanguageTexts, INACTIVITY_TIMEOUT_MS, loadPromptBundle } from "./settings";
import { useDebounce } from "react-simplikit";
import { sanitizeForTTS } from "./utils/sanitizeForTTS";
import CenterModal from "./components/CenterModal";

const theme = createTheme({
  typography: {
    fontFamily: "Pretendard",
  },
});

type RecorderStatus =
  | "idle"
  | "acquiring_media"
  | "recording"
  | "stopped"
  | "permission_denied"
  | "no_specified_media_found";

type LLMEndPayload = boolean | {
  is_aborted?: boolean;
  has_error?: boolean;
  message?: string | null;
};

function useSafeMediaRecorder({
  audio,
  shouldStop,
  askPermissionOnMount,
  onStart,
  onStop,
}: {
  audio: boolean;
  shouldStop?: () => boolean;
  askPermissionOnMount?: boolean;
  onStart?: () => void;
  onStop?: (blobUrl: string, blob: Blob) => void;
}) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopRequestedRef = useRef(false);
  const startInProgressRef = useRef(false);
  const statusRef = useRef<RecorderStatus>(status);

  statusRef.current = status;

  const ensureStream = async ({ markReady = true }: { markReady?: boolean } = {}) => {
    if (audio !== true) {
      setStatus("no_specified_media_found");
      return null;
    }
    if (
      mediaStreamRef.current &&
      mediaStreamRef.current.active &&
      mediaStreamRef.current.getAudioTracks().some((track) => track.readyState === "live")
    ) {
      return mediaStreamRef.current;
    }
    mediaStreamRef.current = null;
    try {
      setStatus("acquiring_media");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: { ideal: 16000 },
        },
      });
      console.log("audio track settings", stream.getAudioTracks()[0]?.getSettings());
      mediaStreamRef.current = stream;
      if (markReady && statusRef.current == "acquiring_media") {
        setStatus("idle");
      }
      return stream;
    } catch (_err) {
      setStatus("permission_denied");
      return null;
    }
  };

  const startRecording = async () => {
    if (startInProgressRef.current) {
      return;
    }

    const activeRecorder = mediaRecorderRef.current;
    if (activeRecorder && activeRecorder.state !== "inactive") {
      return;
    }

    startInProgressRef.current = true;
    try {
      const stream = await ensureStream({ markReady: false });
      if (!stream) {
        return;
      }

      if (stopRequestedRef.current || shouldStop?.()) {
        stopRequestedRef.current = false;
        setStatus("idle");
        return;
      }

      chunksRef.current = [];
      stopRequestedRef.current = false;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopRequestedRef.current = false;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const blobUrl = URL.createObjectURL(blob);
        setMediaBlobUrl(blobUrl);
        setStatus("stopped");
        mediaRecorderRef.current = null;
        onStop?.(blobUrl, blob);
      };

      recorder.start();
      setStatus("recording");
      onStart?.();

      if ((stopRequestedRef.current || shouldStop?.()) && recorder.state !== "inactive") {
        stopRequestedRef.current = false;
        recorder.stop();
      }
    } finally {
      startInProgressRef.current = false;
    }
  };

  const stopRecording = () => {
    stopRequestedRef.current = true;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else if (statusRef.current !== "acquiring_media") {
      stopRequestedRef.current = false;
    }
  };

  useEffect(() => {
    if (askPermissionOnMount !== true) {
      return;
    }
    void ensureStream();
  }, [askPermissionOnMount, audio]);

  useEffect(() => {
    if (!mediaBlobUrl) {
      return;
    }
    return () => {
      URL.revokeObjectURL(mediaBlobUrl);
    };
  }, [mediaBlobUrl]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { status, startRecording, stopRecording, mediaBlobUrl };
}

export default function Home() {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [sttModels, setSTTModels] = useState<STTModelOption[]>([]);
  const [currentSTTModel, setCurrentSTTModel] = useState<string>("");
  const [isSTTModelSwitching, setIsSTTModelSwitching] = useState(false);
  const [llmModels, setLLMModels] = useState<LLMModelOption[]>([]);
  const [isLLMModelSwitching, setIsLLMModelSwitching] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [noMic, setNoMic] = useState(false);
  const [isPromptConfigReady, setIsPromptConfigReady] = useState(false);

  const [state, setState] = useState<State>(State.RECORD_READY);
  const [isTooShort, setIsTooShort] = useState(true);
  const [recentAnswer, setRecentAnswer] = useState<string | null>(null);
  const [isAskingRestart, setIsAskingRestart] = useState(false);
  const [isExampleMode, setIsExampleMode] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [dialog, setDialog] = useState<DialogType>([]);
  const [lastSanitizedTTSInput, setLastSanitizedTTSInput] = useState("");
  const [isSanitizedTTSPreviewOpen, setIsSanitizedTTSPreviewOpen] = useState(false);

  const recentAnswerRef = useRef<string | null>(recentAnswer);
  const isAskingRestartRef = useRef<boolean>(isAskingRestart);
  const isTooShortRef = useRef<boolean>(isTooShort);
  const isPromptConfigReadyRef = useRef<boolean>(isPromptConfigReady);
  const languageRef = useRef<string>(language);
  const isInteractionLockedRef = useRef<boolean>(false);
  const ttsCompletedRef = useRef<boolean>(false);
  const isAudioPlayingRef = useRef<boolean>(false);
  const ttsFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);

  recentAnswerRef.current = recentAnswer;
  isAskingRestartRef.current = isAskingRestart;
  isTooShortRef.current = isTooShort;
  isPromptConfigReadyRef.current = isPromptConfigReady;
  languageRef.current = language;
  isInteractionLockedRef.current = isSTTModelSwitching || isLLMModelSwitching;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wavsRef = useRef<string[]>([]);
  const texts = getLanguageTexts(language);

  function resetState() {
    setState(State.RECORD_READY);
    setIsTooShort(true);
    isTooShortRef.current = true;
    setRecentAnswer(null);
    setLastSanitizedTTSInput("");
    setIsSanitizedTTSPreviewOpen(false);
    setIsAskingRestart(false);
    setIsExampleMode(false);

    if (audioRef.current) {
      audioRef.current.src = "";
      audioRef.current.pause();
    }
    wavsRef.current = [];
    ttsCompletedRef.current = false;
    isAudioPlayingRef.current = false;
    if (ttsFinishTimerRef.current != null) {
      clearTimeout(ttsFinishTimerRef.current);
      ttsFinishTimerRef.current = null;
    }
  }

  function startExampleMode() {
    const examplesForLanguage = example_questions_by_language[language] ?? example_questions_by_language[DEFAULT_LANGUAGE] ?? {};
    const examplesForModel = examplesForLanguage[currentModel] ?? [];

    if (examplesForModel.length == 0)
      return;

    if (isInteractionLockedRef.current)
      return;

    resetContext();
    resetState();
    setIsExampleMode(true);
    onTranscribe(examplesForModel[exampleIndex % examplesForModel.length]);
    const newIndex = (exampleIndex + 1) % examplesForModel.length;
    setExampleIndex(newIndex);
  }

  const debouncedStartExampleMode = useDebounce(() => startExampleMode(), INACTIVITY_TIMEOUT_MS);
  
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [isEscDown, setIsEscDown] = useState(false);
  const [isEnterDown, setIsEnterDown] = useState(false);
  const isSpacebarDownRef = useRef(false);

  function pressSpacebar() {
    if (isInteractionLockedRef.current)
      return;

    isSpacebarDownRef.current = true;
    setIsSpacebarDown(true);
  }

  function releaseSpacebar() {
    isSpacebarDownRef.current = false;
    setIsSpacebarDown(false);
  }

  function tapSpacebar() {
    if (isInteractionLockedRef.current)
      return;

    isSpacebarDownRef.current = true;
    setIsSpacebarDown(true);
    window.setTimeout(() => {
      isSpacebarDownRef.current = false;
      setIsSpacebarDown(false);
    }, 0);
  }

  function tapEsc() {
    if (isInteractionLockedRef.current)
      return;

    setIsEscDown(true);
    window.setTimeout(() => setIsEscDown(false), 0);
  }

  function tapEnter() {
    if (isInteractionLockedRef.current)
      return;

    setIsEnterDown(true);
    window.setTimeout(() => setIsEnterDown(false), 0);
  }

  function onRecordingStart() {
    recordingStartedAtRef.current = Date.now();
    setIsTooShort(true);
    isTooShortRef.current = true;
    setState(State.RECORDING);
  }

  function onRecordingStop(_blobUrl: string, blob: Blob) {
    recordedBlobRef.current = blob;
    const recordingDurationMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : 0;
    const tooShort = recordingDurationMs < 1000 || blob.size < 1024;
    setIsTooShort(tooShort);
    isTooShortRef.current = tooShort;
    recordingStartedAtRef.current = null;
  }

  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useSafeMediaRecorder({
      audio: true,
      shouldStop: () => isSpacebarDownRef.current == false,
      askPermissionOnMount: true,
      onStart: onRecordingStart,
      onStop: onRecordingStop,
    });
  const isRecording = status == "recording";

  const isReasoningModel = [
    "LGAI-EXAONE/EXAONE-Deep-2.4B",
    "LGAI-EXAONE/EXAONE-Deep-7.8B",
    "Qwen/Qwen3-0.6B",
    "Qwen/Qwen3-1.7B",
    "Qwen/Qwen3-4B",
    "Qwen/Qwen3-8B",
  ].includes(currentModel);

  useEffect(() => {
    const examplesForLanguage = example_questions_by_language[language] ?? example_questions_by_language[DEFAULT_LANGUAGE] ?? {};
    const examplesForModel = examplesForLanguage[currentModel] ?? [];

    if (state == State.FINISHED && isExampleMode == true && examplesForModel.length > 0) {
      resetContext();
      onTranscribe(examplesForModel[exampleIndex % examplesForModel.length]);
      const newIndex = (exampleIndex + 1) % examplesForModel.length;
      setExampleIndex(newIndex);
    }

    if (isExampleMode == false && isPromptConfigReady)
      debouncedStartExampleMode();
  }, [state, isExampleMode, currentModel, exampleIndex, language, isPromptConfigReady]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isInteractionLockedRef.current) {
        if (e.code == "Space" || e.key == " " || e.code == "Enter" || e.key == "Enter") {
          e.preventDefault();
          return;
        }
      }

      if (!e.repeat) {
        if (e.code == "Space" || e.key == " ") {
          isSpacebarDownRef.current = true;
          setIsSpacebarDown(true);
          e.preventDefault();
          return;
        }
        if (e.code == "Esc" || e.code == "Escape" || e.key == "Esc" || e.key == "Escape") {
          setIsEscDown(true);
          e.preventDefault();
          return;
        }
        if (e.code == "Enter" || e.key == "Enter") {
          setIsEnterDown(true);
          e.preventDefault();
          return;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isInteractionLockedRef.current) {
        if (e.code == "Space" || e.key == " " || e.code == "Enter" || e.key == "Enter") {
          isSpacebarDownRef.current = false;
          setIsSpacebarDown(false);
          e.preventDefault();
          return;
        }
      }

      if (!e.repeat) {
        if (e.code == "Space" || e.key == " ") {
          isSpacebarDownRef.current = false;
          setIsSpacebarDown(false);
          e.preventDefault();
          return;
        }
        if (e.code == "Esc" || e.code == "Escape" || e.key == "Esc" || e.key == "Escape") {
          setIsEscDown(false);
          e.preventDefault();
          return;
        }
        if (e.code == "Enter" || e.key == "Enter") {
          setIsEnterDown(false);
          e.preventDefault();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isExampleMode == true)
      return;

    if (isSpacebarDown == false && isRecording == true) {
      console.log("stopRecording")
      stopRecording();
      return;
    }

    if (state == State.RECORD_READY) {
      if (isSpacebarDown == true && isRecording == false) {
        console.log("startRecording")
        startRecording();
      }
    }
  }, [state, isSpacebarDown, isRecording]);

  useEffect(() => {
    if (isSpacebarDown == true)
      return;
    
    if (isExampleMode == true)
      return;

    if (state == State.MESSAGE_IS_TOO_SHORT) {
      resetState();
    } else if (state == State.FINISHED) {
      resetState();
    }

    if (isAskingRestart) {
      switch (state) {
        case State.ANSWERING:
          abort();
          break;
        case State.SYNTHESIZING:
        case State.PLAYING_WITH_SYNTHESIZING:
          abortTTS();
          break;
      }

      resetState();
    }
  }, [isSpacebarDown]);

  useEffect(() => {
    if (isEscDown == true)
      return;

    if (isExampleMode == true) {
      switch (state) {
        case State.ANSWERING:
          abort();
          break;
        case State.SYNTHESIZING:
        case State.PLAYING_WITH_SYNTHESIZING:
          abortTTS();
          break;
      }
      
      resetContext();
      resetState();
      return;
    }

    switch (state) {
      case State.ANSWERING:
        setIsAskingRestart(isAskingRestart => !isAskingRestart);
        break;
      case State.ANSWERED:
        if (isAskingRestart == true)
          read(dialog[dialog.length - 1].answer || "");
        setIsAskingRestart(isAskingRestart => !isAskingRestart);
        break;
      case State.SYNTHESIZING:
      case State.PLAYING_WITH_SYNTHESIZING:
      case State.PLAYING_WITHOUT_SYNTHESIZING:
        if (audioRef.current) {
          if (audioRef.current.paused)
            audioRef.current.play();
          else
            audioRef.current.pause();
        }
        setIsAskingRestart(isAskingRestart => !isAskingRestart);
        break;
      case State.FINISHED:
        resetContext();
        resetState();
        break;
    }
  }, [isEscDown]);

  useEffect(() => {
    if (isEnterDown == false)
      return;

    if (isExampleMode == true)
      return;

    switch (state) {
      case State.RECORD_READY:
        startExampleMode();
    }
  }, [isEnterDown])

  useEffect(() => {
    if (isExampleMode == true)
      return;

    console.log(state, status, mediaBlobUrl, isTooShort);
    if (state == State.RECORDING && status == "stopped" && recordedBlobRef.current != null) {
      if (isTooShortRef.current) {
        setState(State.MESSAGE_IS_TOO_SHORT);
      } else {
        void sendVoice(recordedBlobRef.current);
        setState(State.TRANSCRIBING);
      }
      recordedBlobRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    const noMicStatuses: RecorderStatus[] = ["permission_denied", "no_specified_media_found"];
    setNoMic(noMicStatuses.includes(status));
  }, [status]);

  function onConnect() {
    setIsConnected(true);
    setIsPromptConfigReady(false);
    resetContext();
    resetState();
    setDialog([]);
    setCurrentModel("");
    setSTTModels([]);
    setCurrentSTTModel("");
    setIsSTTModelSwitching(false);
    setLLMModels([]);
    setIsLLMModelSwitching(false);
    socket.current?.emit("request_model");
    socket.current?.emit("request_stt_models");
    socket.current?.emit("request_llm_models");
  }

  function onCurrentModel(model: string) {
    console.log("current_model");
    setCurrentModel(model);
  }

  function onSTTModelsState(payload: STTModelsState) {
    console.log("stt_models", payload);
    setSTTModels(payload.models ?? []);
    setCurrentSTTModel(payload.current_model ?? "");
    setIsSTTModelSwitching(payload.is_switching == true);
  }

  function onSTTModelError(payload: { message?: string }) {
    console.error("stt_model_error", payload?.message ?? "Unknown STT model error");
    setIsSTTModelSwitching(false);
  }

  function onLLMModelsState(payload: LLMModelsState) {
    console.log("llm_models", payload);
    setLLMModels(payload.models ?? []);
    setCurrentModel(payload.current_model ?? "");
    setIsLLMModelSwitching(payload.is_switching == true);
  }

  function onLLMModelError(payload: { message?: string }) {
    console.error("llm_model_error", payload?.message ?? "Unknown LLM model error");
    setIsLLMModelSwitching(false);
  }

  function onDisconnect() {
    setIsConnected(false);
    setIsPromptConfigReady(false);
  }

  function onPromptConfigSaved() {
    console.log("prompt_config_saved");
    setIsPromptConfigReady(true);
  }

  function onPromptConfigState(promptState: { is_ready: boolean, message?: string | null }) {
    console.log("prompt_config_state", promptState);
    setIsPromptConfigReady(promptState.is_ready);
  }

  function onTranscribe(transcription: string) {
    console.log("transcribe", {
      transcription,
      promptReady: isPromptConfigReadyRef.current,
      language: languageRef.current,
    });
    if (transcription) {
      setState(State.ANSWERING);
      ask(transcription);
    } else {
      setState(State.MESSAGE_IS_TOO_SHORT);
    }
  }

  function onStart() {
    console.log("start");
    setState(State.ANSWERING);
  }

  function onToken(token: string) {
    setRecentAnswer((old) => (old == null ? token : old + token));
  }

  function onEnd(payload: LLMEndPayload) {
    const isAborted = typeof payload == "boolean" ? payload : payload.is_aborted == true;
    const hasError = typeof payload == "boolean" ? false : payload.has_error == true;
    const message = typeof payload == "boolean" ? null : payload.message ?? null;
    console.log("end", payload, recentAnswerRef.current);

    if (isAborted == true || hasError == true) {
      if (hasError == true) {
        console.error("LLM generation failed", message ?? "Unknown LLM generation error");
        setState(State.RECORD_READY);
      }
      setDialog(dialog => dialog.length > 0 ? dialog.slice(0, -1) : dialog);
    } else {
      setDialog(dialog => dialog.map((qna, i) => i == dialog.length - 1 ? {question: qna.question, answer: recentAnswerRef.current} : qna));
      setState(State.ANSWERED);
    }

    setRecentAnswer(null);

    if (isAborted == false && hasError == false && isAskingRestartRef.current == false)
      read(recentAnswerRef.current || "");
  }

  function onTTSStart() {
    console.log("TTS Start");
    ttsCompletedRef.current = false;
    setState(State.SYNTHESIZING);
  }

  function onSynthesize(payload: string | { audio?: string | null, is_end?: boolean }) {
    console.log("synthesize", payload);

    if (ttsFinishTimerRef.current != null) {
      clearTimeout(ttsFinishTimerRef.current);
      ttsFinishTimerRef.current = null;
    }

    if (typeof payload == "string") {
      const sound = "data:audio/wav;base64," + payload;
      wavsRef.current = [...wavsRef.current, sound];
    } else {
      if (payload.audio) {
        const sound = "data:audio/wav;base64," + payload.audio;
        wavsRef.current = [...wavsRef.current, sound];
      }

      if (payload.is_end) {
        ttsCompletedRef.current = true;
      }
    }

    if (audioRef.current != null && (audioRef.current.paused == true || audioRef.current.duration <= 0))
      playFirstWav();

    if (typeof payload != "string" && payload.is_end && wavsRef.current.length == 0 && isAudioPlayingRef.current == false) {
      setState(State.FINISHED);
    }
  }

  function playFirstWav() {
    if (wavsRef.current.length > 0) {
      setState(() => (
        ttsCompletedRef.current
          ? State.PLAYING_WITHOUT_SYNTHESIZING
          : State.PLAYING_WITH_SYNTHESIZING
      ));

      const wav = wavsRef.current[0];
      wavsRef.current = wavsRef.current.slice(1);

      if (audioRef.current !== null) {
        audioRef.current.src = wav;
        isAudioPlayingRef.current = true;
        audioRef.current.play().catch((error) => {
          isAudioPlayingRef.current = false;
          console.error("audio.play failed", error);
          playFirstWav();
        });
      } else {
        console.log("audio is null!!!", audioRef.current);
      }
    } else {
      setState((state) => {
        if (ttsCompletedRef.current)
          return State.FINISHED;
        return state;
      });
    }
  }

  useEffect(() => {
    if (audioRef.current == null) {
      var aud = new Audio();
      aud.onplay = function() {
        isAudioPlayingRef.current = true;
      }
      aud.onpause = function() {
        if (aud.ended == false)
          isAudioPlayingRef.current = false;
      }
      aud.onended = function(_e: any) {
        isAudioPlayingRef.current = false;
        playFirstWav();
      }
      audioRef.current = aud;
    }
  }, []);

  function onTTSEnd() {
    console.log("TTS End (ignored)");
  }

  useEffect(() => {
    socket.current = io(`${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:5000`);
    socket.current.on('connect', onConnect);
    socket.current.on('disconnect', onDisconnect);
    socket.current.on('start', onStart);
    socket.current.on('token', onToken);
    socket.current.on('end', onEnd);
    socket.current.on('current_model', onCurrentModel);
    socket.current.on('prompt_config_saved', onPromptConfigSaved);
    socket.current.on('prompt_config_state', onPromptConfigState);
    socket.current.on('stt_models', onSTTModelsState);
    socket.current.on('stt_model_error', onSTTModelError);
    socket.current.on('llm_models', onLLMModelsState);
    socket.current.on('llm_model_error', onLLMModelError);
    socket.current.on('transcribe', onTranscribe);
    socket.current.on('tts_start', onTTSStart);
    socket.current.on('synthesize', onSynthesize);
    socket.current.on('tts_end', onTTSEnd);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.off('connect', onConnect);
        socket.current.off('disconnect', onDisconnect);
        socket.current.off('start', onStart);
        socket.current.off('token', onToken);
        socket.current.off('end', onEnd);
        socket.current.off('current_model', onCurrentModel);
        socket.current.off('prompt_config_saved', onPromptConfigSaved);
        socket.current.off('prompt_config_state', onPromptConfigState);
        socket.current.off('stt_models', onSTTModelsState);
        socket.current.off('stt_model_error', onSTTModelError);
        socket.current.off('llm_models', onLLMModelsState);
        socket.current.off('llm_model_error', onLLMModelError);
        socket.current.off('transcribe', onTranscribe);
        socket.current.off('tts_start', onTTSStart);
        socket.current.off('synthesize', onSynthesize);
        socket.current.off('tts_end', onTTSEnd);
      }
    };
  }, []);

  useEffect(() => {
    async function syncPromptBundle() {
      if (socket.current == null || isConnected == false)
        return;

      setIsPromptConfigReady(false);
      try {
        const promptBundle = await loadPromptBundle(language);
        socket.current.emit("prompt_config", promptBundle);
      } catch (error) {
        console.error("Failed to sync prompt bundle", error);
      }
    }

    void syncPromptBundle();
  }, [isConnected, language, currentModel]);

  function ask(new_question: string) {
    console.log("ask", {
      hasSocket: socket.current != null,
      promptReady: isPromptConfigReadyRef.current,
      questionLength: new_question.length,
    });

    if (socket.current && isPromptConfigReadyRef.current && new_question != "") {
      setDialog((dialog) =>  [...dialog, { question: new_question, answer: null }]);
      socket.current.emit("ask", new_question);
    }
  }

  function abort() {
    socket.current?.emit("abort");
  }

  function abortTTS() {
    socket.current?.emit("tts_abort");
  }

  async function sendVoice(blob: Blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    console.log("voice blob", { size: blob.size, mime: blob.type, bytes: bytes.byteLength });
    if (isPromptConfigReadyRef.current)
      socket.current?.emit("voice", bytes, navigator.userAgent, blob.type ?? "", languageRef.current);
  }

  function read(text: string) {
    if (!isPromptConfigReadyRef.current)
      return;

    const sanitized = sanitizeForTTS(text, languageRef.current);
    setLastSanitizedTTSInput(sanitized);

    if (sanitized)
      socket.current?.emit("read", sanitized, languageRef.current);
  }

  function resetContext() {
    socket.current?.emit("reset");
    setDialog([]);
  }

  function changeLanguage(nextLanguage: string) {
    if (state != State.RECORD_READY || isSTTModelSwitching || isLLMModelSwitching || nextLanguage == language)
      return;

    resetContext();
    resetState();
    setExampleIndex(0);
    setLanguage(nextLanguage);
  }

  function changeSTTModel(nextModelId: string) {
    if (
      socket.current == null ||
      isConnected == false ||
      isPromptConfigReady == false ||
      state != State.RECORD_READY ||
      isSTTModelSwitching == true ||
      isLLMModelSwitching == true ||
      nextModelId == currentSTTModel
    )
      return;

    setIsSTTModelSwitching(true);
    socket.current.emit("select_stt_model", nextModelId);
  }

  function changeLLMModel(nextModelId: string) {
    if (
      socket.current == null ||
      isConnected == false ||
      isPromptConfigReady == false ||
      state != State.RECORD_READY ||
      isSTTModelSwitching == true ||
      isLLMModelSwitching == true ||
      nextModelId == currentModel
    )
      return;

    resetContext();
    resetState();
    setExampleIndex(0);
    setIsPromptConfigReady(false);
    setIsLLMModelSwitching(true);
    socket.current.emit("select_llm_model", nextModelId);
  }

  const isSTTModelSelectorDisabled =
    !isConnected ||
    !isPromptConfigReady ||
    state != State.RECORD_READY ||
    isSTTModelSwitching ||
    isLLMModelSwitching ||
    isExampleMode;

  const isLLMModelSelectorDisabled =
    !isConnected ||
    !isPromptConfigReady ||
    state != State.RECORD_READY ||
    isSTTModelSwitching ||
    isLLMModelSwitching ||
    isExampleMode;

  if (isConnected == false)
    return undefined;

  if (noMic == true)
    return texts.noMicrophone;

  return (
    <ThemeProvider theme={theme}>
      <Grid2
        container
        direction="column"
        wrap="nowrap"
        justifyContent="center"
        alignItems="stretch"
        sx={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#000000",
        }}
      >
        <Header
          language={language}
          languages={[...AVAILABLE_LANGUAGES]}
          disabled={isPromptConfigReady == false || state != State.RECORD_READY || isSTTModelSwitching || isLLMModelSwitching}
          changeLanguage={changeLanguage}
        />
        <Main
          language={language}
          state={state}
          isReasoningModel={isReasoningModel}
          dialog={dialog}
          recentAnswer={recentAnswer}
          hasSanitizedTTSInput={lastSanitizedTTSInput.trim().length > 0}
          onOpenSanitizedPreview={() => setIsSanitizedTTSPreviewOpen(true)}
          isAskingRestart={isAskingRestart}
          isExampleMode={isExampleMode}
          recordedAudioUrl={mediaBlobUrl}
          sttModels={sttModels}
          currentSTTModel={currentSTTModel}
          isSTTModelSwitching={isSTTModelSwitching}
          isSTTModelSelectorDisabled={isSTTModelSelectorDisabled}
          llmModels={llmModels}
          currentLLMModel={currentModel}
          isLLMModelSwitching={isLLMModelSwitching}
          isLLMModelSelectorDisabled={isLLMModelSelectorDisabled}
          changeSTTModel={changeSTTModel}
          changeLLMModel={changeLLMModel}
          onSpacebarDown={pressSpacebar}
          onSpacebarUp={releaseSpacebar}
          onSpacebarTap={tapSpacebar}
          onEscTap={tapEsc}
          onEnterTap={tapEnter}
        />
        {isSanitizedTTSPreviewOpen && (
          <CenterModal>
            <Grid2
              container
              direction="column"
              wrap="nowrap"
              sx={{
                width: "min(720px, 75vw)",
                maxHeight: "70vh",
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: "28px", fontWeight: 700, color: "#202020" }}>
                {texts.ttsSanitizedPreviewTitle}
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#5F6368" }}>
                {texts.ttsSanitizedPreviewHint}
              </Typography>
              <Grid2
                sx={{
                  backgroundColor: "#F5F7FB",
                  borderRadius: "16px",
                  padding: "20px",
                  overflowY: "auto",
                  maxHeight: "42vh",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "#202020",
                  fontSize: "16px",
                  lineHeight: 1.6,
                }}
              >
                {lastSanitizedTTSInput.trim() || texts.ttsSanitizedPreviewEmpty}
              </Grid2>
              <Grid2 container justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={() => setIsSanitizedTTSPreviewOpen(false)}
                  sx={{
                    borderRadius: "999px",
                    textTransform: "none",
                    boxShadow: "none",
                    px: 3,
                  }}
                >
                  {texts.ttsSanitizedPreviewClose}
                </Button>
              </Grid2>
            </Grid2>
          </CenterModal>
        )}
      </Grid2>
    </ThemeProvider>
  );
}
