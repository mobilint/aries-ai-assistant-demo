"use client";

import Grid2 from "@mui/material/Grid2";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import { DialogType, parseHistory, QNA, RawHistory } from "./components/type";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Pretendard",
  },
});

export default function Home() {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tasksNum, setTasksNum] = useState(0);
  const [question, setQuestion] = useState<string>("");
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [dialog, setDialog] = useState<DialogType>([]);
  const [history, setHistory] = useState<DialogType[]>([]);
  const [recentAnswer, setRecentAnswer] = useState<string | null>(null);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentAnswerRef = useRef<string | null>(recentAnswer);
  const dialogRef = useRef<QNA[]>(dialog);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(audio);
  const [wavSources, setWavSources] = useState<string[]>([]);
  const wavsRef = useRef<string[]>(wavSources);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlayStarted, setIsPlayStarted] = useState<boolean>(false);
  const [isSynthesizeEnded, setIsSynthesizeEnded] = useState<boolean>(true);
  const [isPlayEnded, setIsPlayEnded] = useState<boolean>(true);

  // console.log(playingIndex, isPlayStarted, isSynthesizeEnded, isPlayEnded);
  
  function playFirstWav() {
    if (wavsRef.current.length > 0) {
      setIsPlayStarted(true);
      setIsPlayEnded(false);
      const wav = wavsRef.current[0];
      setWavSources((oldWavs) => oldWavs.slice(1));

      if (audioRef.current !== null) {
        audioRef.current.src = wav;
        audioRef.current.play();
      } else {
        console.log("audio is null!!!", audioRef.current);
      }
    } else {
      setIsPlayEnded(true);
    }
  }

  useEffect(() => {
    if (isPlayStarted == true && isSynthesizeEnded == true && playingIndex != null && wavSources.length <= 0 && isPlayEnded == true) {
      setPlayingIndex(null);
      setIsPlayStarted(false);
    }
  }, [isPlayStarted, isSynthesizeEnded, playingIndex, wavSources, isPlayEnded]);

  useEffect(() => {
    if (audio == null) {
      var aud = new Audio();
      aud.onended = function(e: any) {
        playFirstWav();
      }
      setAudio(aud);
    }
  }, []);

  recentAnswerRef.current = recentAnswer;
  dialogRef.current = dialog;
  audioRef.current = audio;
  wavsRef.current = wavSources;

  function onConnect() {
    setIsConnected(true);
    socket.current?.emit("request_history");
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onTasks(tasks: number) {
    setTasksNum(tasks);
  }

  function onStart() {
    console.log("start");
    setIsAnswering(true);
  }

  function onToken(token: string) {
    setRecentAnswer((oldAnswer) => {
      if (oldAnswer == null)
        oldAnswer = token;
      else
        oldAnswer += token;

      return oldAnswer;
    });
  }

  function onEnd(isAborted: boolean) {
    console.log("end", isAborted);

    let newDialog = [...dialogRef.current];
    newDialog[newDialog.length - 1].answer = recentAnswerRef.current;

    setDialog(newDialog);
    setIsAnswering(false);
    setRecentAnswer(null);
  }

  function onTranscribe(transcription: string) {
    console.log("transcribe", transcription);
    setIsTranscribing(false);
    ask(transcription);
  }

  function onTTSStart() {
    console.log("TTS Start");
    setIsSynthesizeEnded(false);
    setWavSources([]);
  }

  function onSynthesize(base64buffer: string) {
    console.log("synthesize");

    const sound = "data:audio/wav;base64," + base64buffer;
    setWavSources((oldWavs) => [...oldWavs, sound]);

    if (audioRef.current != null && (audioRef.current.paused == true || audioRef.current.duration <= 0))
      playFirstWav();
  }

  function onTTSEnd() {
    console.log("TTS End");
    setIsSynthesizeEnded(true);
  }

  useEffect(() => {
    if (isAnswering == false)
      inputRef.current?.focus();
  }, [isAnswering, inputRef.current])

  function onHistory(raw_histories: RawHistory[]) {
    console.log("history", raw_histories);
    setHistory(raw_histories.map((history) => parseHistory(history)));
  }

  useEffect(() => {
    socket.current = io(`${window.location.protocol == 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:5000`);
    socket.current.on('connect', onConnect);
    socket.current.on('disconnect', onDisconnect);
    socket.current.on('tasks', onTasks);
    socket.current.on('start', onStart);
    socket.current.on('token', onToken);
    socket.current.on('end', onEnd);
    socket.current.on('transcribe', onTranscribe);
    socket.current.on('history', onHistory);
    socket.current.on('tts_start', onTTSStart);
    socket.current.on('synthesize', onSynthesize);
    socket.current.on('tts_end', onTTSEnd);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.off('connect', onConnect);
        socket.current.off('disconnect', onDisconnect);
        socket.current.off('tasks', onTasks);
        socket.current.off('start', onStart);
        socket.current.off('token', onToken);
        socket.current.off('end', onEnd);
        socket.current.off('transcribe', onTranscribe);
        socket.current.off('history', onHistory);
        socket.current.off('tts_start', onTTSStart);
        socket.current.off('synthesize', onSynthesize);
        socket.current.off('tts_end', onTTSEnd);
      }
    };
  }, []);

  function ask(new_question: string) {
    if (socket.current && new_question != "") {
      setDialog((prevDialog) => {
        let newDialog = [...prevDialog];
        newDialog.push({ question: new_question, answer: null });
        return newDialog;
      });
      setQuestion("");
      socket.current.emit("ask", new_question);
    }
  }

  function abort() {
    if (socket.current)
      socket.current.emit("abort");
  }

  function abortTTS() {
    if (socket.current) {
      socket.current.emit("tts_abort");
      setIsPlayStarted(false);
      setWavSources([]);
      setPlayingIndex(null);
      if (audioRef.current !== null) {
        audioRef.current.src = "";
        audioRef.current.pause();
      }
    }
  }

  function reset() {
    if (socket.current) {
      console.log("reset");
      setDialog([]);
      setRecentAnswer(null);
      audio?.pause();
      socket.current.emit("reset");
      abortTTS();
    }
  }

  function sendVoice(blob: Blob) {
    if (socket.current) {
      setIsTranscribing(true);
      socket.current.emit("voice", blob, navigator.userAgent);
    }
  }

  function read(index: number, text: string) {
    if (socket.current && playingIndex == null) {
      audioRef.current?.pause();
      setPlayingIndex(index);
      socket.current.emit("read", text);
    }
  }

  if (isConnected == false)
    return undefined;

  return (
    <ThemeProvider theme={theme}>
      <Grid2
        container
        justifyContent="center"
        alignItems="stretch"
        sx={{
          width: "100vw",
          height: "100vh",
          padding: "0",
          backgroundColor: "#000000",
        }}
      >
        <Grid2
          container
          alignItems="stretch"
          sx={{ width: "355px" }}
        >
          <Sidebar
            dialog={dialog}
            disabled={isAnswering}
            reset={reset}
            history={history}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
          />
        </Grid2>
        <Grid2
          container
          size="grow"
          alignItems="stretch"
        >
          <Main
            isAnswering={isAnswering}
            isTranscribing={isTranscribing}
            isPlayStarted={isPlayStarted}
            isPlayEnded={isPlayEnded}
            playingIndex={playingIndex}
            question={question}
            setQuestion={setQuestion}
            dialog={dialog}
            tasksNum={tasksNum}
            recentAnswer={recentAnswer}
            ask={ask}
            abort={abort}
            inputRef={inputRef}
            sendVoice={sendVoice}
            read={read}
            abortTTS={abortTTS}
            historyIndex={historyIndex}
            history={history}
          />
        </Grid2>
      </Grid2>
    </ThemeProvider>
  );
}
