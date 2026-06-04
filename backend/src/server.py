import base64
import json
import logging
import re
import sys
import time
from threading import Lock
from typing import Optional, cast

from flask import Flask, request
from flask_socketio import SocketIO, emit

from BilingualMeloTTS import LangType
from pipeline_handler import PipelineHandler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

with open("src/model.json", "r") as f:
    model = json.load(f)

try:
    handler = PipelineHandler(
        model_id=model["model_id"],
        system_prompt_path=model["system_prompt_path"],
        inter_prompt_path=model["inter_prompt_path"],
        generation_config_path=model["generation_config_path"],
    )
except Exception as e:
    logging.error(f"Failed to initialize PipelineHandler: {e}")
    sys.exit(1)

tasks = []
task_lock = Lock()
stt_model_switch_lock = Lock()
llm_model_switch_lock = Lock()
is_stt_model_switching = False
is_llm_model_switching = False
is_task_running = False

current_session_id: Optional[str] = None
prompt_config_ready = False


def _normalize_binary_payload(blob) -> bytes:
    if isinstance(blob, bytes):
        return blob
    if isinstance(blob, bytearray):
        return bytes(blob)
    if isinstance(blob, memoryview):
        return blob.tobytes()
    if isinstance(blob, list):
        return bytes(blob)
    raise TypeError(f"Unsupported blob payload type: {type(blob)}")


def emit_prompt_config_state(is_ready: bool, message: str | None = None):
    global current_session_id

    if current_session_id is not None:
        socketio.emit("prompt_config_state", {
            "is_ready": is_ready,
            "message": message,
        }, to=current_session_id)


def emit_stt_model_state(is_switching: bool = False, message: str | None = None):
    global current_session_id, handler

    if current_session_id is not None:
        payload = handler.get_stt_model_state()
        payload["is_switching"] = is_switching
        if message is not None:
            payload["message"] = message
        socketio.emit("stt_models", payload, to=current_session_id)


def emit_llm_model_state(is_switching: bool = False, message: str | None = None):
    global current_session_id, handler

    if current_session_id is not None:
        payload = handler.get_llm_model_state()
        payload["is_switching"] = is_switching
        if message is not None:
            payload["message"] = message
        socketio.emit("llm_models", payload, to=current_session_id)


def switch_stt_model_background(model_id: str):
    global is_stt_model_switching

    message = None
    try:
        handler.switch_stt_model(model_id)
    except Exception as e:
        message = str(e) or "Failed to switch STT model."
        logging.error(f"[server] Failed to select STT model: {message}", exc_info=True)
        emit_stt_model_error(message)
    finally:
        with stt_model_switch_lock:
            is_stt_model_switching = False
        emit_stt_model_state(False, message)


def switch_llm_model_background(model_id: str):
    global is_llm_model_switching

    message = None
    try:
        handler.switch_llm_model(model_id)
    except Exception as e:
        message = str(e) or "Failed to switch LLM model."
        logging.error(f"[server] Failed to select LLM model: {message}", exc_info=True)
        emit_llm_model_error(message)
    finally:
        with llm_model_switch_lock:
            is_llm_model_switching = False
        emit_llm_model_state(False, message)
        if current_session_id is not None:
            socketio.emit("current_model", handler.model_id, to=current_session_id)


def emit_stt_model_error(message: str):
    global current_session_id

    if current_session_id is not None:
        socketio.emit("stt_model_error", {"message": message}, to=current_session_id)


def emit_llm_model_error(message: str):
    global current_session_id

    if current_session_id is not None:
        socketio.emit("llm_model_error", {"message": message}, to=current_session_id)


def task_worker():
    global tasks, task_lock, current_session_id, handler, is_task_running

    logging.info("Task worker thread started.")

    while True:
        task = None
        with task_lock:
            with stt_model_switch_lock:
                with llm_model_switch_lock:
                    can_run_task = not is_task_running and not is_stt_model_switching and not is_llm_model_switching and handler.is_available and tasks

            if can_run_task:
                task = tasks.pop(0)
                is_task_running = True

        if task:
            try:
                task_type = task["type"]
                task_value = task["value"]

                logging.info(f"Processing task type: {task_type}")

                if task_type == "STT":
                    run_stt(handler, **task_value)
                elif task_type == "LLM":
                    run_llm(handler, **task_value)
                elif task_type == "TTS":
                    run_tts(handler, **task_value)
            finally:
                with task_lock:
                    is_task_running = False
                    socketio.emit("tasks", len(tasks), to=current_session_id)
        else:
            time.sleep(0.1)


def _guess_audio_formats(user_agent: str, mime_type: str) -> list[str]:
    mime = (mime_type or "").lower()
    ua = (user_agent or "").lower()

    if "webm" in mime:
        return ["webm", "matroska"]
    if "ogg" in mime:
        return ["ogg", "opus"]
    if "wav" in mime:
        return ["wav"]
    if "mp4" in mime or "aac" in mime:
        return ["mp4", "adts", "aac"]

    if "iphone" in ua or "ipad" in ua or "ipod" in ua or ("safari" in ua and "chrome" not in ua):
        return ["mp4", "adts", "aac"]
    return ["webm", "matroska", "ogg", "opus"]


def run_stt(handler: PipelineHandler, blob: bytes, userAgent: str, mimeType: str = "", language: str = ""):
    global current_session_id

    logging.info(f"[server] STT executing with model={handler.stt_model_name}...")

    try:
        transcript = "[Incomprehensible]"
        formats = _guess_audio_formats(userAgent, mimeType)
        logging.info(f"[server] STT mimeType={mimeType or '(unknown)'} formats={formats} language={language}")
        transcript = handler.transcribe_audio(blob, audio_formats=formats, language=language)

    finally:
        socketio.emit("transcribe", transcript, to=current_session_id)
        logging.info("[server] STT executed")


def run_llm(handler: PipelineHandler, question: str):
    global current_session_id

    logging.info("[server] LLM executing...")

    try:
        is_aborted = True
        error_message = None

        socketio.emit("start", to=current_session_id)

        def for_each_generated_token(new_token: str):
            socketio.emit("token", new_token, to=current_session_id)
            socketio.sleep(0)

        is_aborted, _, error_message = handler.generate_response(question, for_each_generated_token)

    finally:
        socketio.sleep(0)
        socketio.emit("end", {
            "is_aborted": is_aborted,
            "has_error": error_message is not None,
            "message": error_message,
        }, to=current_session_id)
        logging.info("[server] LLM executed")


def run_tts(handler: PipelineHandler, text: str, language: str = "ko"):
    global current_session_id

    logging.info("[server] TTS executing...")

    try:
        socketio.emit("tts_start", to=current_session_id)
        handler.is_tts_ongoing = True

        text = re.sub(r"\s+", " ", text or "").strip()
        sentences = [s.strip() for s in re.split(r"[.!?:*()\n]", text) if s.strip()]

        for sentence in sentences:
            if not handler.is_tts_ongoing:
                logging.info("[server] TTS aborted by user.")
                break

            audio_path = handler.synthesize_speech(sentence, "./output.wav", language=language)
            if audio_path:
                try:
                    with open(audio_path, "rb") as audio_file:
                        audio_data = audio_file.read()

                    wav_b64 = base64.b64encode(audio_data).decode("utf-8")
                    socketio.emit("synthesize", {
                        "audio": wav_b64,
                        "is_end": False,
                    }, to=current_session_id)
                    socketio.sleep(0)

                except Exception as e:
                    logging.error(f"Failed to read audio file: {e}")

    finally:
        handler.is_tts_ongoing = False
        socketio.emit("synthesize", {
            "audio": None,
            "is_end": True,
        }, to=current_session_id)
        socketio.sleep(0)
        logging.info("[server] TTS executed")


def allow_current_sid_only(func):
    def decorated(*args, **kwargs):
        global current_session_id

        if current_session_id != request.sid:  # type: ignore
            logging.error(f"Event refused since its already using. Current: {current_session_id}, Incoming: {request.sid}")  # type: ignore
            return

        return func(*args, **kwargs)

    return decorated


@socketio.event
def connect():
    global current_session_id, prompt_config_ready

    if current_session_id is not None:
        logging.warning(f"Session refused since its already using. Current: {current_session_id}, Incoming: {request.sid}")  # type: ignore
        return

    current_session_id = cast(str, request.sid)  # type: ignore
    prompt_config_ready = False
    logging.info(f"Session connected: {current_session_id}")
    emit_prompt_config_state(False, "Prompt bundle is not synced yet.")
    emit_stt_model_state(False)
    emit_llm_model_state(False)


@socketio.event
def disconnect():
    global tasks, task_lock, current_session_id, prompt_config_ready, is_task_running

    if current_session_id != request.sid:  # type: ignore
        logging.warning(f"Session disconnection doesn't affect since its not using. Current: {current_session_id}, Disconnected: {request.sid}")  # type: ignore
        return

    logging.info(f"Session disconnected: {current_session_id}")

    current_session_id = None
    prompt_config_ready = False

    with task_lock:
        tasks = []

        with stt_model_switch_lock:
            with llm_model_switch_lock:
                can_reset = handler.is_available and not is_task_running and not is_stt_model_switching and not is_llm_model_switching

        handler.abort_llm()
        handler.is_tts_ongoing = False

        if can_reset:
            handler.reset_cache()
        else:
            logging.info("[server] Skipping reset during disconnect because handler is busy.")


@allow_current_sid_only
@socketio.event
def request_model():
    global handler, current_session_id
    emit("current_model", handler.model_id, to=current_session_id)


@allow_current_sid_only
@socketio.event
def request_stt_models():
    emit_stt_model_state(False)


@allow_current_sid_only
@socketio.event
def request_llm_models():
    emit_llm_model_state(False)


@allow_current_sid_only
@socketio.event
def select_stt_model(model_id: str):
    global tasks, task_lock, handler, is_stt_model_switching, is_task_running

    if not isinstance(model_id, str) or not model_id:
        emit_stt_model_error("Invalid STT model selection.")
        emit_stt_model_state(False)
        return

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if is_stt_model_switching:
                    message = "STT model switch is already in progress."
                    logging.warning(f"[server] {message}")
                    emit_stt_model_error(message)
                    emit_stt_model_state(True, message)
                    return

                if is_llm_model_switching:
                    message = "LLM model switch is already in progress."
                    logging.warning(f"[server] {message}")
                    emit_stt_model_error(message)
                    emit_stt_model_state(False, message)
                    return

                if handler.is_available == False or is_task_running or tasks:
                    message = "Handler is busy, cannot switch STT model now."
                    logging.warning(f"[server] {message}")
                    emit_stt_model_error(message)
                    emit_stt_model_state(False, message)
                    return

                is_stt_model_switching = True

    emit_stt_model_state(True)
    socketio.start_background_task(switch_stt_model_background, model_id)


@allow_current_sid_only
@socketio.event
def select_llm_model(model_id: str):
    global tasks, task_lock, handler, is_llm_model_switching, is_task_running, prompt_config_ready

    if not isinstance(model_id, str) or not model_id:
        emit_llm_model_error("Invalid LLM model selection.")
        emit_llm_model_state(False)
        return

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if is_llm_model_switching:
                    message = "LLM model switch is already in progress."
                    logging.warning(f"[server] {message}")
                    emit_llm_model_error(message)
                    emit_llm_model_state(True, message)
                    return

                if is_stt_model_switching:
                    message = "STT model switch is already in progress."
                    logging.warning(f"[server] {message}")
                    emit_llm_model_error(message)
                    emit_llm_model_state(False, message)
                    return

                if handler.is_available == False or is_task_running or tasks:
                    message = "Handler is busy, cannot switch LLM model now."
                    logging.warning(f"[server] {message}")
                    emit_llm_model_error(message)
                    emit_llm_model_state(False, message)
                    return

                prompt_config_ready = False
                is_llm_model_switching = True

    emit_prompt_config_state(False, "Switching LLM model...")
    emit_llm_model_state(True)
    socketio.start_background_task(switch_llm_model_background, model_id)


@allow_current_sid_only
@socketio.event
def prompt_config(prompt_config: dict[str, str]):
    global prompt_config_ready, is_task_running

    if not isinstance(prompt_config, dict):
        logging.error("[server] prompt_config payload is invalid.")
        return

    system_prompt = prompt_config.get("system_prompt", "")
    inter_prompt = prompt_config.get("inter_prompt", "")
    language = prompt_config.get("language", "")

    emit_prompt_config_state(False, "Applying prompt bundle...")
    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if handler.is_available == False or is_task_running or is_stt_model_switching or is_llm_model_switching or tasks:
                    message = "Handler is busy, cannot apply prompt bundle now."
                    logging.warning(f"[server] {message}")
                    emit_prompt_config_state(prompt_config_ready, message)
                    return

        prompt_config_ready = False
        handler.abort_llm()
        handler.set_prompt_texts(system_prompt, inter_prompt, language)
        handler.reset_cache()
        prompt_config_ready = True

    emit_prompt_config_state(True)
    emit("prompt_config_saved", to=current_session_id)


@allow_current_sid_only
@socketio.event
def voice(blob, userAgent: str, mimeType: str = "", language: str = ""):
    global tasks, task_lock, current_session_id

    if not prompt_config_ready:
        logging.warning("[server] STT request ignored because prompt bundle is not ready.")
        return

    try:
        blob_bytes = _normalize_binary_payload(blob)
    except Exception as e:
        logging.error(f"[server] Invalid STT payload: {e}")
        return

    logging.info(f"[server] STT task enqueued. mimeType={mimeType or '(unknown)'}, bytes={len(blob_bytes)}, language={language}")

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if is_stt_model_switching or is_llm_model_switching:
                    logging.warning("[server] STT request ignored because model switch is in progress.")
                    return

        tasks.append({"type": "STT", "value": {"blob": blob_bytes, "userAgent": userAgent, "mimeType": mimeType, "language": language}})
        socketio.emit("tasks", len(tasks), to=current_session_id)


@allow_current_sid_only
@socketio.event
def ask(question: str):
    global tasks, task_lock, current_session_id

    if not prompt_config_ready:
        logging.warning("[server] LLM request ignored because prompt bundle is not ready.")
        return

    if not question:
        logging.error(f"[server] question is empty! question: '{question}'")
        return

    logging.info("[server] LLM task enqueued.")

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if is_stt_model_switching or is_llm_model_switching:
                    logging.warning("[server] LLM request ignored because model switch is in progress.")
                    return

        tasks.append({"type": "LLM", "value": {"question": question}})
        socketio.emit("tasks", len(tasks), to=current_session_id)


@allow_current_sid_only
@socketio.event
def read(text: str, language: str = "ko"):
    global tasks, task_lock, current_session_id

    if not prompt_config_ready:
        logging.warning("[server] TTS request ignored because prompt bundle is not ready.")
        return

    logging.info(f"[server] TTS task enqueued. language={language}")

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                if is_stt_model_switching or is_llm_model_switching:
                    logging.warning("[server] TTS request ignored because model switch is in progress.")
                    return

        tasks.append({"type": "TTS", "value": {"text": text, "language": language}})
        socketio.emit("tasks", len(tasks), to=current_session_id)


@allow_current_sid_only
@socketio.event
def abort():
    global tasks, task_lock

    logging.info("[server] LLM Abort signal received.")

    handler.abort_llm()
    with task_lock:
        tasks = []


@allow_current_sid_only
@socketio.event
def tts_abort():
    global tasks, task_lock

    logging.info("[server] TTS Abort signal received.")

    handler.is_tts_ongoing = False
    with task_lock:
        tasks = []


@allow_current_sid_only
@socketio.event
def reset():
    global tasks, task_lock, current_session_id, is_task_running

    with task_lock:
        with stt_model_switch_lock:
            with llm_model_switch_lock:
                can_reset = handler.is_available and not is_task_running and not is_stt_model_switching and not is_llm_model_switching and not tasks

        if not can_reset:
            socketio.emit("error", {"message": "Handler is busy, cannot reset now."}, to=current_session_id)
            return

        handler.reset_cache()
        socketio.emit("reset_done", to=current_session_id)


socketio.start_background_task(target=task_worker)
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
