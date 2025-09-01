import os
import json
import logging
import torch
import soundfile
from typing import Callable, Optional, Dict, Any
from threading import Thread, Event
from io import BytesIO
from pydub import AudioSegment

from transformers import TextIteratorStreamer
from mblt_model_zoo.transformers.utils import MobilintCache, pipeline, AutoTokenizer, AutoModelForCausalLM
from bilingual_melo_tts.BilingualMeloTTS import BilingualMeloTTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class StopOnSignalTextIteratorStreamer(TextIteratorStreamer):
    def __init__(self, tokenizer, stop_event: Event, **kwargs):
        super().__init__(tokenizer, **kwargs)
        self.stop_event = stop_event

    def put(self, value):
        if self.stop_event.is_set():
            self.end_of_stream = True
            raise StopIteration()
        super().put(value)


class PipelineHandler:
    def __init__(self, device: Optional[str] = None):
        self.is_available = True
        self.device = device or ("cuda:0" if torch.cuda.is_available() else "cpu")
        logging.info(f"[Handler] Initializing on device: {self.device}")

        self._load_stt_model()
        self._load_llm_model()
        self._load_tts_model()

        self.sessions: Dict[str, Dict[str, Any]] = {}

        self.stop_event = Event()
        self.abort_flag = Event()

        logging.info("[Handler] >>> Initialized <<<")

    def _load_stt_model(self):
        try:
            logging.info("[Handler] Loading STT pipeline (whisper-small)...")
            self.stt_pipeline = pipeline(
                "automatic-speech-recognition",
                model="mobilint/whisper-small",
            )

        except Exception as e:
            logging.error(f"[Handler] Failed to load STT pipeline: {e}")
            raise

    def _load_llm_model(self):
        try:
            logging.info("[Handler] Loading LLM pipeline...")

            self.llm_model_id = "mobilint/EXAONE-3.5-2.4B-Instruct"
            self.llm_tokenizer = AutoTokenizer.from_pretrained(self.llm_model_id)
            self.llm_model = AutoModelForCausalLM.from_pretrained(self.llm_model_id)

            system_text = open("system.txt", "r").read() if os.path.exists("system.txt") else ""
            self.inter_prompt_text = open("inter-prompt.txt").read() if os.path.exists("inter-prompt.txt") else ""
            self.base_conversation = [{"role": "system", "content": system_text}]

        except Exception as e:
            logging.error(f"[Handler] Failed to load LLM pipeline: {e}")
            raise

    def _load_tts_model(self):
        try:
            logging.info("[Handler] Loading TTS pipeline (MeloTTS)...")
            self.tts = BilingualMeloTTS()
            self.is_tts_ongoing = False

        except Exception as e:
            logging.error(f"[Handler] Failed to load TTS pipeline: {e}")
            raise

    def _get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            logging.info(f"[Handler] Creating new session context for: {session_id}")
            self.sessions[session_id] = {
                "conversation": self.base_conversation.copy(),
                "past_key_values": MobilintCache(self.llm_model.mxq_model),
            }

        return self.sessions[session_id]

    def reset_cache(self, session_id: str):
        logging.info(f"[Handler] Resetting cache for session: {session_id}")
        session = self._get_or_create_session(session_id)
        session["conversation"] = self.base_conversation.copy()
        session["past_key_values"] = MobilintCache(self.llm_model.mxq_model)

    def abort_llm(self):
        self.abort_flag.set()

    def transcribe_audio(self, audio_data: bytes, codec: str) -> str:
        self.is_available = False
        try:
            logging.info(f"[Handler] Transcribing audio...")
            sound = AudioSegment.from_file(BytesIO(audio_data), codec=codec)
            sound = sound.set_frame_rate(16000).set_channels(1)
            audio_bytes = sound.raw_data

            result = self.stt_pipeline(audio_bytes)
            transcription = result.get("text", "") if result else ""

            if not transcription:
                logging.warning("No transcription returned from STT pipeline.")
            return transcription
        except Exception as e:
            logging.error(f"Error transcribing audio: {e}")
            return ""
        finally:
            self.is_available = True

    def generate_response(
        self, session_id: str, prompt: str, forEachGeneratedToken: Optional[Callable[[str], None]] = None
    ) -> tuple[bool, str]:
        self.is_available = False
        session = self._get_or_create_session(session_id)
        past_key_values = session["past_key_values"]

        try:
            self.abort_flag.clear()
            self.stop_event.clear()

            max_new_tokens = min(600, 4000 - past_key_values.get_seq_length() - 250)
            if max_new_tokens < 0:
                self.reset_cache(session_id)
                max_new_tokens = min(600, 4000 - past_key_values.get_seq_length() - 250)
                if max_new_tokens < 0:
                    return True, "Input is too long."

            user_prompt = session["conversation"] + [{"role": "user", "content": prompt}]
            if self.llm_model_id != "mobilint/c4ai-command-r7b-12-2048":
                user_prompt += [{"role": "system", "content": self.inter_prompt_text}]

            prompt_text = self.llm_tokenizer.apply_chat_template(
                user_prompt, tokenize=False, add_generation_prompt=True
            )
            inputs = self.llm_tokenizer(prompt_text, return_tensors="pt").to(self.device)
            streamer = StopOnSignalTextIteratorStreamer(
                self.llm_tokenizer, self.stop_event, skip_prompt=True, skip_special_tokens=True
            )

            generation_kwargs = dict(
                **inputs,
                streamer=streamer,
                max_new_tokens=max_new_tokens,
                past_key_values=past_key_values,
                use_cache=True,
                pad_token_id=self.llm_tokenizer.eos_token_id,
            )

            thread = Thread(target=self.llm_model.generate, kwargs=generation_kwargs)
            thread.start()

            answer = ""
            for new_token in streamer:
                if self.abort_flag.is_set():
                    self.stop_event.set()
                    break
                answer += new_token
                if forEachGeneratedToken:
                    forEachGeneratedToken(new_token)

            thread.join()
            session["conversation"] = user_prompt + [{"role": "assistant", "content": answer}]
            return self.abort_flag.is_set(), answer
        except Exception as e:
            logging.error(f"Error generating response: {e}")
            return True, ""
        finally:
            self.is_available = True

    def synthesize_speech(self, text: str, output_filename: str = "output.wav") -> Optional[str]:
        self.is_available = False
        try:
            logging.info(f"[Handler] Synthesizing speech for: '{text[:30]}...'")
            tts_output = self.tts(text)

            if isinstance(tts_output, torch.Tensor):
                tts_output = tts_output.t().numpy()

            with soundfile.SoundFile(
                output_filename,
                mode="w",
                samplerate=self.tts.sampling_rate,
                channels=1,
                format="WAV",
            ) as f:
                f.write(tts_output)

            return output_filename

        except Exception as e:
            logging.error(f"Error synthesizing speech: {e}")
            return None

        finally:
            self.is_available = True
