import os
import base64
import logging
import re
import sys
import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
from pipeline_handler import PipelineHandler
from threading import Lock, Thread
from bilingual_melo_tts.BilingualMeloTTS import LangType, BilingualMeloTTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

try:
    handler = PipelineHandler()
except Exception as e:
    logging.error(f"Failed to initialize PipelineHandler: {e}")
    sys.exit(1)

tasks = []
task_lock = Lock()

ENG_TO_KOR = {
    "Neural Processing Unit": "뉴럴 프로세싱 유닛",
    "ARIES": "애리스",
    "REGULUS": "레귤러스",
    "Mobilint, Inc.": "모빌린트",
    "Mobilint": "모빌린트",
    "qb": "큐비",
    "SDK": "에스디케이",
    "NPU": "엔피유",
    "CES": "씨이에스",
    "TOPS": "톱스",
    "AIoT": "에이아이오티",
    "TensorFlow": "텐서플로",
    "PyTorch": "파이토치",
    "ONNX": "오닉스",
    "SoC": "에스오씨",
    "System on Chip": "시스템 온 칩",
    "Internet of Things": "인터넷 오브 띵즈",
    "EXAONE": "엑사원",
    "LG": "엘지",
    "Research": "리서치",
}


def task_worker():
    logging.info("Task worker thread started.")
    while True:
        task = None
        with task_lock:
            if handler.is_available and tasks:
                task = tasks.pop(0)

        if task:
            sid = task["sid"]
            task_type = task["type"]
            task_value = task["value"]

            logging.info(f"Processing task for session: {sid}, type: {task_type}")

            if task_type == "STT":
                socketio.start_background_task(target=run_stt, sid=sid, **task_value)
            elif task_type == "LLM":
                socketio.start_background_task(target=run_llm, sid=sid, **task_value)
            elif task_type == "TTS":
                socketio.start_background_task(target=run_tts, sid=sid, **task_value)

            with task_lock:
                socketio.emit("tasks", len(tasks), room=sid)
        else:
            time.sleep(0.1)


def run_stt(sid, blob, userAgent):
    logging.info(f"Session: {sid}, STT task started.")
    codec = "opus"
    ua = userAgent.lower()
    if "iphone" in ua or "ipad" in ua or "ipod" in ua or ("safari" in ua and "chrome" not in ua):
        codec = "aac"

    transcript = handler.transcribe_audio(blob, codec=codec)
    socketio.emit("transcribe", transcript, room=sid)
    logging.info(f"Session: {sid}, STT task finished.")


def run_llm(sid, question):
    logging.info(f"Session: {sid}, LLM task started.")
    socketio.emit("start", room=sid)

    def forEachGeneratedToken(new_token: str):
        socketio.emit("token", new_token, room=sid)

    is_aborted, response = handler.generate_response(sid, question, forEachGeneratedToken)

    socketio.sleep(0)
    socketio.emit("end", (is_aborted, response), room=sid)
    logging.info(f"Session: {sid}, LLM task finished.")


def run_tts(sid, text):
    logging.info(f"Session: {sid}, TTS task started.")

    if BilingualMeloTTS.detect_lang_type(text) == LangType.KO:
        for k, v in ENG_TO_KOR.items():
            text = re.sub(r"\b" + re.escape(k) + r"\b", v, text, flags=re.IGNORECASE)

    sentences = [s.strip() for s in re.split(r"[.!?:\n]", text) if s.strip()]

    socketio.emit("tts_start", room=sid)
    handler.is_tts_ongoing = True

    for sentence in sentences:
        if not handler.is_tts_ongoing:
            logging.info(f"Session: {sid}, TTS aborted by user.")
            break
        audio_path = handler.synthesize_speech(sentence, f"./history/{sid}/output.wav")
        if audio_path:
            try:
                with open(audio_path, "rb") as audio_file:
                    audio_data = audio_file.read()

                wav_b64 = base64.b64encode(audio_data).decode("utf-8")
                socketio.emit("synthesize", wav_b64, room=sid)

            except Exception as e:
                logging.error(f"Failed to read audio file: {e}")

    handler.is_tts_ongoing = False
    socketio.emit("tts_end", room=sid)
    logging.info(f"Session: {sid}, TTS task finished.")


@socketio.on("connect")
def connect():
    logging.info(f"Session connected: {request.sid}")
    os.makedirs(f"./history/{request.sid}/", exist_ok=True)


@socketio.on("disconnect")
def disconnect():
    logging.info(f"Session disconnected: {request.sid}")


@socketio.on("voice")
def on_voice(blob, userAgent: str):
    sid = request.sid
    logging.info(f"Session: {sid}, STT task enqueued.")
    with task_lock:
        tasks.append({"sid": sid, "type": "STT", "value": {"blob": blob, "userAgent": userAgent}})
        socketio.emit("tasks", len(tasks), room=sid)


@socketio.on("ask")
def on_ask(question: str):
    sid = request.sid
    logging.info(f"Session: {sid}, LLM task enqueued.")
    with task_lock:
        tasks.append({"sid": sid, "type": "LLM", "value": {"question": question}})
        socketio.emit("tasks", len(tasks), room=sid)


@socketio.on("read")
def on_read(text: str):
    sid = request.sid
    logging.info(f"Session: {sid}, TTS task enqueued.")
    with task_lock:
        tasks.append({"sid": sid, "type": "TTS", "value": {"text": text}})
        socketio.emit("tasks", len(tasks), room=sid)


@socketio.on("abort")
def on_abort():
    logging.info(f"Session: {request.sid}, Abort signal received for LLM.")
    handler.abort_llm()


@socketio.on("tts_abort")
def on_tts_abort():
    logging.info(f"Session: {request.sid}, Abort signal received for TTS.")
    handler.is_tts_ongoing = False


@socketio.on("reset")
def on_reset():
    sid = request.sid
    with task_lock:
        if handler.is_available:
            handler.reset_cache(sid)
            socketio.emit("reset_done", room=sid)
        else:
            socketio.emit("error", {"message": "Handler is busy, cannot reset now."}, room=sid)


if __name__ == "__main__":
    worker_thread = Thread(target=task_worker, daemon=True)
    worker_thread.start()
    socketio.run(app, host="0.0.0.0", port=5000)
