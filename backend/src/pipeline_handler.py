import logging
import torch
import re
import copy
import numpy as np
import tempfile
import os
import gc
import uuid
from pathlib import Path
from time import time
from typing import Callable, Optional
from threading import Thread, Event
from pydub import AudioSegment, effects
from qbruntime import Accelerator

from transformers.generation.streamers import TextIteratorStreamer
from transformers.generation.configuration_utils import GenerationConfig
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
from BilingualMeloTTS import BilingualMeloTTS
from mblt_model_zoo.hf_transformers.utils.cache_utils import MobilintCache
from llm_models import get_available_llm_models, validate_llm_model_id
from stt_models import get_available_stt_models, get_default_stt_model_id, validate_stt_model_id

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

SUPPORTED_PROMPT_LANGUAGES = {"en", "ko"}
ENGLISH_TOKEN_REGEX = re.compile(r"[A-Za-z][A-Za-z0-9&+\-'.]*")
KOREAN_TOKEN_REGEX = re.compile(r"[가-힣]+")
MOBILINT_REFERENCE_NOTE_FILENAMES = {
    "en": "mobilint-reference-en.txt",
    "ko": "mobilint-reference-ko.txt",
}

MOBILINT_KEYWORDS = re.compile(r"\b(mobilint|aries|regulus|qb\s*sdk)\b|모빌린트|아리스|애리스|레귤러스|레굴루스|큐비", re.IGNORECASE)


def should_include_mobilint_reference(text: str) -> bool:
    return bool(MOBILINT_KEYWORDS.search(text or ""))


def guess_prompt_language(system_prompt: str, fallback: str = "en") -> str:
    if re.search(r"[가-힣]", system_prompt or ""):
        return "ko"
    return fallback


def normalize_prompt_language(language: Optional[str]) -> Optional[str]:
    if language in SUPPORTED_PROMPT_LANGUAGES:
        return language
    return None


def detect_tts_segment_language(text: str, fallback: str) -> str:
    if KOREAN_TOKEN_REGEX.search(text or ""):
        return "ko"
    if ENGLISH_TOKEN_REGEX.search(text or ""):
        return "en"
    return fallback


def split_mixed_language_segments(text: str, fallback_language: str) -> list[tuple[str, str]]:
    token_pattern = re.compile(r"[A-Za-z][A-Za-z0-9&+\-'.]*|[가-힣]+|[^A-Za-z가-힣]+")
    raw_tokens = token_pattern.findall(text)
    segments: list[tuple[str, str]] = []

    for token in raw_tokens:
        language = detect_tts_segment_language(token, fallback_language)
        if not token.strip():
            if segments:
                prev_text, prev_lang = segments[-1]
                segments[-1] = (prev_text + token, prev_lang)
            continue

        if segments and segments[-1][1] == language:
            prev_text, prev_lang = segments[-1]
            segments[-1] = (prev_text + token, prev_lang)
        else:
            segments.append((token, language))

    merged_segments: list[tuple[str, str]] = []
    for text_part, language in segments:
        cleaned = text_part.strip()
        if not cleaned:
            continue
        if merged_segments and not re.search(r"[A-Za-z가-힣]", cleaned):
            prev_text, prev_lang = merged_segments[-1]
            merged_segments[-1] = (f"{prev_text}{cleaned}", prev_lang)
            continue
        merged_segments.append((cleaned, language))

    if not merged_segments and text.strip():
        return [(text.strip(), fallback_language)]

    return merged_segments


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
    def __init__(
        self,
        model_id: str = "meta-llama/Llama-3.2-3B-Instruct",
        system_prompt_path: str = "src/prompts/en-system.txt",
        inter_prompt_path: str = "src/prompts/en-inter-prompt.txt",
        generation_config_path: str = "src/generation_configs/Llama-3.2-3B-Instruct/",
        stt_model_id: Optional[str] = None,
    ):
        self.model_id = model_id
        self.system_prompt_path = system_prompt_path
        self.inter_prompt_path = inter_prompt_path
        self.generation_config_path = generation_config_path
        self.stt_model_name = stt_model_id or get_default_stt_model_id()
        self.stt_model_config = validate_stt_model_id(self.stt_model_name)
        
        self.is_available = True
        logging.info(f"[Handler] Initializing...")
        
        self.conversation = []
        self.abort_flag = Event()
        self.stop_event = Event()

        self.system_text: Optional[str] = None
        self.inter_prompt_text = ""
        self.override_system_text: Optional[str] = None
        self.override_inter_prompt_text: Optional[str] = None
        self.override_prompt_language: Optional[str] = None
        self.prompt_language = "en"
        self.mobilint_reference_notes_by_language = self._load_mobilint_reference_notes()
        self.initial_cached_input_ids: Optional[torch.Tensor] = None
        self.cached_input_ids: Optional[torch.Tensor] = None
        self._mobilint_cache_memory_dirty = False
        self.use_llm_kv_cache = os.getenv("USE_LLM_KV_CACHE", "1") != "0"
        if not self.use_llm_kv_cache:
            logging.info("[Handler] LLM KV cache is disabled. Set USE_LLM_KV_CACHE=1 or unset it to enable cache.")
        self._select_device()
        self._load_llm_model()
        self._load_stt_model()
        self._load_tts_model()
        self._load_txt_files()

        self.stop_event = Event()
        self.abort_flag = Event()

        logging.info("[Handler] >>> Initialized <<<")
    
    def _select_device(self) -> None:
        gpu_available = torch.cuda.is_available()
        npu_available = False
        try:
            acc = Accelerator()
            del acc
            npu_available = True
        except:
            pass

        logging.info(f'[DEVICE] GPU: {"O" if gpu_available else "X"}, NPU: {"O" if npu_available else "X"}')
        
        if gpu_available == False and npu_available == False:
            raise SystemError("No AI Accelerator Found!")
        
        self.is_npu = npu_available
        self.device = "cpu" if self.is_npu else "cuda"

    def _get_model_id(self, model_id: str):
        if model_id.startswith("mobilint/"):
            return model_id
        if self.is_npu:
            return re.sub(r"^[^/]+", "mobilint", model_id)
        else:
            return model_id
    
    def _load_txt_files(self):
        before = self.system_text
        self.system_text = self.override_system_text
        if self.system_text is None:
            self.system_text = open(self.system_prompt_path, "r", encoding="UTF-8").read()

        self.inter_prompt_text = self.override_inter_prompt_text
        if self.inter_prompt_text is None:
            self.inter_prompt_text = open(self.inter_prompt_path, encoding="UTF-8").read()

        self.base_conversation = [{"role": "system", "content": self.system_text}] if self.system_text != "" else []
        explicit_language = normalize_prompt_language(self.override_prompt_language)
        self.prompt_language = explicit_language or guess_prompt_language(self.system_text, "en")
        
        if before != self.system_text:
            self._prefill_cache()

    def _load_mobilint_reference_notes(self) -> dict[str, str]:
        prompts_dir = Path(__file__).resolve().parent / "prompts"
        reference_notes: dict[str, str] = {}

        for language, filename in MOBILINT_REFERENCE_NOTE_FILENAMES.items():
            path = prompts_dir / filename
            try:
                reference_notes[language] = path.read_text(encoding="UTF-8").strip()
            except FileNotFoundError:
                logging.warning("[Handler] Mobilint reference note file is missing: %s", path)
            except OSError as error:
                logging.warning("[Handler] Failed to load Mobilint reference note file %s: %s", path, error)

        return reference_notes

    def _get_mobilint_reference_notes(self) -> str:
        reference_notes = self.mobilint_reference_notes_by_language.get(self.prompt_language)
        if reference_notes:
            return reference_notes

        fallback_notes = self.mobilint_reference_notes_by_language.get("en", "")
        if not fallback_notes:
            logging.warning("[Handler] Mobilint reference notes are unavailable; skipping reference injection.")
        return fallback_notes
    
    def _load_stt_model(self):
        try:
            self.stt_model_config = validate_stt_model_id(self.stt_model_name)
            logging.info(f"[Handler] Loading STT pipeline ({self.stt_model_name})...")
            
            converted_model_id = self._get_model_id(self.stt_model_name)
            model_kwargs = {}
            if self.is_npu:
                model_kwargs = {
                    "encoder_core_mode": "single",
                    "decoder_core_mode": "single",
                    "encoder_target_cores": ["1:0"],
                    "decoder_target_cores": ["1:0"],
                }

            self.stt_pipeline = pipeline(
                "automatic-speech-recognition",
                model=converted_model_id,
                device=self.device,
                trust_remote_code=True,
                **({"model_kwargs": model_kwargs} if model_kwargs else {})
            )

        except Exception as e:
            logging.error(f"[Handler] Failed to load STT pipeline: {e}")
            raise

    def switch_stt_model(self, model_id: str) -> None:
        next_config = validate_stt_model_id(model_id)
        if self.stt_model_name == next_config.id:
            logging.info(f"[Handler] STT model already active ({model_id}); skipping reload.")
            return

        if self.is_available == False:
            raise RuntimeError("Handler is busy, cannot switch STT model now.")

        previous_model = self.stt_model_name
        previous_config = self.stt_model_config
        previous_pipeline = self.stt_pipeline
        start = time()
        logging.info(f"[Handler] Switching STT model: {previous_model} -> {next_config.id}")

        self.is_available = False
        self.stt_model_name = next_config.id
        self.stt_model_config = next_config
        try:
            self.stt_pipeline = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            self._load_stt_model()
            logging.info(f"[Handler] STT model switched in {time() - start:.2f} sec")
        except Exception:
            self.stt_model_name = previous_model
            self.stt_model_config = previous_config
            self.stt_pipeline = previous_pipeline
            logging.error(f"[Handler] Failed to switch STT model; restored {previous_model}", exc_info=True)
            raise
        finally:
            self.is_available = True

    def get_stt_model_state(self) -> dict:
        return {
            "models": get_available_stt_models(),
            "current_model": self.stt_model_name,
        }

    def switch_llm_model(self, model_id: str) -> None:
        next_config = validate_llm_model_id(model_id)
        if self.model_id == next_config.id:
            logging.info(f"[Handler] LLM model already active ({model_id}); skipping reload.")
            return

        if self.is_available == False:
            raise RuntimeError("Handler is busy, cannot switch LLM model now.")

        previous_model_id = self.model_id
        previous_system_prompt_path = self.system_prompt_path
        previous_inter_prompt_path = self.inter_prompt_path
        previous_generation_config_path = self.generation_config_path
        previous_tokenizer = self.llm_tokenizer
        previous_model = self.llm_model
        start = time()
        logging.info(f"[Handler] Switching LLM model: {previous_model_id} -> {next_config.id}")

        self.is_available = False
        self.abort_llm()
        self.model_id = next_config.id
        self.system_prompt_path = next_config.system_prompt_path
        self.inter_prompt_path = next_config.inter_prompt_path
        self.generation_config_path = next_config.generation_config_path
        try:
            self.llm_tokenizer = None
            self.llm_model = None
            self.conversation = []
            self.past_key_values = None
            self.initial_cache = None
            self.initial_cached_input_ids = None
            self.cached_input_ids = None
            self._mobilint_cache_memory_dirty = False
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            self._load_llm_model()
            self.system_text = None
            self._load_txt_files()
            self.reset_cache()
            logging.info(f"[Handler] LLM model switched in {time() - start:.2f} sec")
        except Exception:
            self.model_id = previous_model_id
            self.system_prompt_path = previous_system_prompt_path
            self.inter_prompt_path = previous_inter_prompt_path
            self.generation_config_path = previous_generation_config_path
            self.llm_tokenizer = previous_tokenizer
            self.llm_model = previous_model
            self.system_text = None
            self._load_txt_files()
            self.reset_cache()
            logging.error(f"[Handler] Failed to switch LLM model; restored {previous_model_id}", exc_info=True)
            raise
        finally:
            self.abort_flag.clear()
            self.stop_event.clear()
            self.is_available = True

    def get_llm_model_state(self) -> dict:
        return {
            "models": get_available_llm_models(),
            "current_model": self.model_id,
        }

    def _load_llm_model(self):
        try:
            logging.info(f"[Handler] Loading LLM pipeline ({self.model_id})...")
            
            converted_model_id = self._get_model_id(self.model_id)
            model_kwargs = {}
            if self.is_npu:
                model_kwargs = {
                    "target_cores": ["0:0"],
                }

            self.llm_tokenizer = AutoTokenizer.from_pretrained(converted_model_id, trust_remote_code=True)
            self.llm_model = AutoModelForCausalLM.from_pretrained(
                converted_model_id,
                trust_remote_code=True,
                **model_kwargs
            ).to(self.device)
            self.llm_model.eval()

        except Exception as e:
            logging.error(f"[Handler] Failed to load LLM pipeline: {e}")
            raise

    def _load_tts_model(self):
        try:
            logging.info("[Handler] Loading TTS pipeline (MeloTTS)...")
            self.tts = BilingualMeloTTS(self.is_npu, target_core="0:3")
            self.is_tts_ongoing = False

        except Exception as e:
            logging.error(f"[Handler] Failed to load TTS pipeline: {e}")
            raise

    @staticmethod
    def _clone_input_ids(input_ids: Optional[torch.Tensor]) -> Optional[torch.Tensor]:
        if input_ids is None:
            return None
        return input_ids.detach().cpu().clone()

    def _copy_cache(self, cache):
        if isinstance(cache, MobilintCache):
            return cache.copy()
        return copy.deepcopy(cache)

    def _get_cache_seq_length(self, cache=None) -> int:
        target_cache = self.past_key_values if cache is None else cache
        if target_cache is None or not hasattr(target_cache, "get_seq_length"):
            return 0
        return int(target_cache.get_seq_length())

    def _cache_prefix_matches(self, full_input_ids: torch.Tensor) -> bool:
        if not self.use_llm_kv_cache or self.past_key_values is None or self.cached_input_ids is None:
            return False

        cached_seq_len = self._get_cache_seq_length()
        cached_ids = self.cached_input_ids
        if cached_seq_len <= 0 or cached_ids.numel() != cached_seq_len:
            return False
        if full_input_ids.shape[-1] < cached_seq_len:
            return False

        return torch.equal(full_input_ids.detach().cpu()[0, :cached_seq_len], cached_ids)

    def _disable_kv_cache_state(self, reason: str) -> None:
        logging.warning("[Handler] Disabling current KV cache state: %s", reason)
        self.past_key_values = None
        self.cached_input_ids = None
        self._mobilint_cache_memory_dirty = False

    def _align_cached_input_ids_to_cache_length(self, candidate_input_ids: torch.Tensor) -> Optional[torch.Tensor]:
        cache_seq_len = self._get_cache_seq_length()
        candidate = self._clone_input_ids(candidate_input_ids)
        if candidate is None or cache_seq_len <= 0:
            self._disable_kv_cache_state(f"invalid cache alignment inputs. cache_seq_len={cache_seq_len}")
            return None

        candidate_len = candidate.numel()
        if candidate_len == cache_seq_len:
            return candidate

        if candidate_len > cache_seq_len:
            logging.info(
                "[Handler] Trimming cached_input_ids to match KV cache length. candidate_len=%d, cache_seq_len=%d",
                candidate_len,
                cache_seq_len,
            )
            return candidate[:cache_seq_len]

        self._disable_kv_cache_state(
            f"cached_input_ids shorter than KV cache. candidate_len={candidate_len}, cache_seq_len={cache_seq_len}"
        )
        return None

    def _mark_mobilint_cache_memory_dirty(self) -> None:
        if self.use_llm_kv_cache and isinstance(getattr(self, "past_key_values", None), MobilintCache):
            self._mobilint_cache_memory_dirty = True

    def _load_mobilint_cache_memory_if_needed(self) -> None:
        if not self.use_llm_kv_cache or not isinstance(self.past_key_values, MobilintCache):
            return
        if not self._mobilint_cache_memory_dirty:
            logging.info("[Handler] Mobilint cache memory load skipped; runtime cache is already in sync")
            return

        start = time()
        self.past_key_values.load_cache_memory()
        self._mobilint_cache_memory_dirty = False
        logging.info(f"[Handler] Mobilint cache memory loaded in {time() - start:.2f} sec")

    def _restore_initial_cache_if_prefix_matches(self, full_input_ids: torch.Tensor) -> bool:
        if not self.use_llm_kv_cache or self.initial_cache is None or self.initial_cached_input_ids is None:
            return False

        initial_seq_len = self._get_cache_seq_length(self.initial_cache)
        if initial_seq_len <= 0 or self.initial_cached_input_ids.numel() != initial_seq_len:
            return False
        if full_input_ids.shape[-1] < initial_seq_len:
            return False
        if not torch.equal(full_input_ids.detach().cpu()[0, :initial_seq_len], self.initial_cached_input_ids):
            return False

        self.past_key_values = self._copy_cache(self.initial_cache)
        self.cached_input_ids = self._clone_input_ids(self.initial_cached_input_ids)
        self._mark_mobilint_cache_memory_dirty()
        logging.info(f"[Handler] Restored initial KV cache prefix. seq_len={initial_seq_len}")
        return True

    def _prepare_generation_inputs(self, inputs: dict) -> tuple[dict, int, bool]:
        full_input_ids = inputs["input_ids"]
        if not self.use_llm_kv_cache:
            return inputs, 0, False

        if not self._cache_prefix_matches(full_input_ids):
            logging.info(
                "[Handler] KV cache prefix miss. cached_seq_len=%d, full_input_len=%d",
                self._get_cache_seq_length(),
                full_input_ids.shape[-1],
            )
            if not self._restore_initial_cache_if_prefix_matches(full_input_ids):
                self._disable_kv_cache_state("prefix miss")
                return inputs, 0, False

        cached_seq_len = self._get_cache_seq_length()
        suffix_len = full_input_ids.shape[-1] - cached_seq_len
        if suffix_len <= 0:
            logging.warning(
                "[Handler] KV cache prefix consumes the whole prompt; falling back to full prompt. cached_seq_len=%d",
                cached_seq_len,
            )
            self._disable_kv_cache_state("cache prefix consumes the whole prompt")
            return inputs, 0, False

        generation_inputs = dict(inputs)
        generation_inputs["input_ids"] = generation_inputs["input_ids"][:, cached_seq_len:]

        self._load_mobilint_cache_memory_if_needed()
        logging.info(
            "[Handler] KV cache prefix hit. cached_seq_len=%d, full_input_len=%d, suffix_len=%d",
            cached_seq_len,
            full_input_ids.shape[-1],
            suffix_len,
        )
        return generation_inputs, cached_seq_len, True

    def _prefill_cache(self):
        start = time()
        logging.info(f"[Handler] Prefill")
        
        self.initial_cache = None
        self.initial_cached_input_ids = None
        self.cached_input_ids = None
        self._mobilint_cache_memory_dirty = False

        if not self.use_llm_kv_cache:
            self.past_key_values = None
            logging.info(f"[Handler] Prefill skipped because LLM KV cache is disabled")
            return
        
        if len(self.base_conversation) > 0:
            prompt = self.llm_tokenizer.apply_chat_template(self.base_conversation, tokenize=False, add_generation_prompt=False)
            inputs = self.llm_tokenizer(prompt, return_tensors="pt").to(self.device)
            
            with torch.inference_mode():
                output = self.llm_model(
                    **inputs,
                    use_cache=True,
                    past_key_values=None,
                    logits_to_keep=1,
                )
            if hasattr(output, "past_key_values"):
                self.initial_cache = output.past_key_values
            
            if isinstance(self.initial_cache, MobilintCache):
                self.initial_cache.dump_cache_memory()
                self.past_key_values = self.initial_cache.copy()
                self._mobilint_cache_memory_dirty = False
            else:
                self.past_key_values = copy.deepcopy(self.initial_cache)

            self.initial_cached_input_ids = self._clone_input_ids(inputs["input_ids"][0])
            self.cached_input_ids = self._clone_input_ids(self.initial_cached_input_ids)
        else:
            self.past_key_values = None
        
        logging.info(f"[Handler] Prefill completed in {time() - start:.2f} sec")
    
    def reset_cache(self):
        logging.info(f"[Handler] Reset cache")
        self._load_txt_files()
        
        self.conversation = self.base_conversation.copy()
        del self.past_key_values
                
        if isinstance(self.initial_cache, MobilintCache):
            self.past_key_values = self.initial_cache.copy()
            self.cached_input_ids = self._clone_input_ids(self.initial_cached_input_ids)
            self._mark_mobilint_cache_memory_dirty()
        else:
            self.past_key_values = copy.deepcopy(self.initial_cache)
            self.cached_input_ids = self._clone_input_ids(self.initial_cached_input_ids)

    def abort_llm(self):
        logging.info(f"[Handler] Abort signal set")
        self.abort_flag.set()

    def set_prompt_texts(self, system_prompt: str, inter_prompt: str, language: Optional[str] = None) -> None:
        self.override_system_text = system_prompt
        self.override_inter_prompt_text = inter_prompt
        self.override_prompt_language = normalize_prompt_language(language)

    def _prepare_stt_audio(self, sound: AudioSegment) -> AudioSegment:
        """Prepare decoded user audio for STT with lightweight noise-oriented preprocessing."""
        sound = sound.set_frame_rate(16000).set_channels(1)

        # Reduce low-frequency rumble and high-frequency hiss outside Whisper's useful speech band.
        sound = sound.high_pass_filter(80)
        sound = sound.low_pass_filter(7600)

        # Avoid boosting nearly silent recordings where normalization would amplify background noise.
        if sound.dBFS != float("-inf") and sound.dBFS > -45:
            sound = effects.normalize(sound, headroom=1.0)

        logging.info(f"[Handler] Prepared STT audio: duration={len(sound)}ms, dBFS={sound.dBFS:.2f}")
        return sound

    def transcribe_audio(self, audio_data: bytes, audio_formats: Optional[list[str]] = None, language: Optional[str] = None) -> str:
        self.is_available = False
            
        try:
            formats = audio_formats or []
            logging.info(f"[Handler] Transcribing audio with model={self.stt_model_name} formats={formats}...")
            logging.info(f"[Handler] Incoming STT bytes={len(audio_data)}")

            sound = None
            decode_errors = []
            candidates = formats + [None]

            # Some ffmpeg builds fail probing WebM from stdin/pipe; decode from a temp file instead.
            for audio_format in candidates:
                suffix = f".{audio_format}" if audio_format else ".audio"
                temp_path = None
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                        temp_file.write(audio_data)
                        temp_path = temp_file.name

                    sound = AudioSegment.from_file(temp_path, format=audio_format)
                    if audio_format:
                        logging.info(f"[Handler] Audio decoded with format={audio_format}")
                    else:
                        logging.info("[Handler] Audio decoded with ffmpeg auto-detection")
                    break
                except Exception as decode_error:
                    decode_errors.append((audio_format, str(decode_error)))
                finally:
                    if temp_path and os.path.exists(temp_path):
                        os.remove(temp_path)

            if sound is None:
                raise RuntimeError(f"Unable to decode input audio. attempts={decode_errors}")

            sound = self._prepare_stt_audio(sound)
            # Feed PCM samples directly so transformers does not invoke torchcodec file decoding.
            audio_array = np.array(sound.get_array_of_samples(), dtype=np.float32)
            scale = float(1 << (8 * sound.sample_width - 1))
            if scale > 0:
                audio_array = audio_array / scale

            generate_kwargs = {
                "num_beams": 1,
                **({"task": "transcribe"} if self.stt_model_config.family == "whisper" else {}),
                **({"language": language} if self.stt_model_config.supports_language_hint and language in {"en", "ko"} else {}),
            }

            result = self.stt_pipeline(
                {"array": audio_array, "sampling_rate": 16000},
                generate_kwargs=generate_kwargs,
            )
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
        self, prompt: str, forEachGeneratedToken: Optional[Callable[[str], None]] = None
    ) -> tuple[bool, str, Optional[str]]:
        if self.is_available == False:
            logging.error(f"[Handler] generate_response is called when model is busy!")
            return False, "", "Model is busy."
        
        self.is_available = False
        
        answer = ""
        is_aborted = False

        try:
            self.abort_flag.clear()
            self.stop_event.clear()

            current_prompt = prompt
            if should_include_mobilint_reference(prompt):
                reference_notes = self._get_mobilint_reference_notes()
                if reference_notes:
                    current_prompt = f"{current_prompt}\n\n{reference_notes}"

            inter_prompt_disabled = [
                "LGAI-EXAONE/EXAONE-Deep-2.4B",
                "LGAI-EXAONE/EXAONE-Deep-7.8B",
            ]
            if self.inter_prompt_text != "" and self.model_id not in inter_prompt_disabled:
                current_prompt = f"{current_prompt}\n\n[Answer style instructions]\n{self.inter_prompt_text}"

            previous_conversation = copy.deepcopy(self.conversation)
            previous_past_key_values = self._copy_cache(self.past_key_values)
            previous_cached_input_ids = self._clone_input_ids(self.cached_input_ids)
            previous_cache_memory_dirty = self._mobilint_cache_memory_dirty

            user_prompt = self.conversation + [{"role": "user", "content": current_prompt}]

            prompt_text = self.llm_tokenizer.apply_chat_template(user_prompt, tokenize=False, add_generation_prompt=True)
            inputs = self.llm_tokenizer(prompt_text, return_tensors="pt").to(self.device)
            full_input_ids = self._clone_input_ids(inputs["input_ids"][0])
            generation_inputs, cached_seq_len, using_cache_prefix = self._prepare_generation_inputs(inputs)
            active_cached_input_ids = self._clone_input_ids(self.cached_input_ids)
            streamer = StopOnSignalTextIteratorStreamer(
                self.llm_tokenizer,
                self.stop_event,
                skip_prompt=True,
                skip_special_tokens=True,
            )
            generation_result = {}
            
            def generation_wrapper(**kwargs):
                try:
                    with torch.inference_mode():
                        output = self.llm_model.generate(**kwargs, pad_token_id=self.llm_tokenizer.eos_token_id)
                    generation_result["output"] = output
                    if self.use_llm_kv_cache and hasattr(output, "past_key_values"):
                        self.past_key_values = output.past_key_values
                except StopIteration:
                    pass
                except Exception as e:
                    generation_result["exception"] = e
                    logging.error(f"[Handler] Exception in generation thread: {e}", exc_info=True)
                    streamer.end()
                
            generation_config = GenerationConfig.from_pretrained(self.generation_config_path)
            
            generation_kwargs = dict(
                generation_config=generation_config,
                **generation_inputs,
                streamer=streamer,
                max_length=4096,
                use_cache=True,
                past_key_values=self.past_key_values if self.use_llm_kv_cache and using_cache_prefix else None,
                return_dict_in_generate=True,
            )
            thread = Thread(target=generation_wrapper, kwargs=generation_kwargs)
            thread.start()

            for new_token in streamer:
                if self.abort_flag.is_set():
                    self.stop_event.set()
                    break
                answer += new_token
                if forEachGeneratedToken:
                    forEachGeneratedToken(new_token)

            thread.join()
            is_aborted = self.abort_flag.is_set()

            if is_aborted or "exception" in generation_result:
                self.conversation = previous_conversation
                self.past_key_values = previous_past_key_values
                self.cached_input_ids = previous_cached_input_ids
                self._mobilint_cache_memory_dirty = previous_cache_memory_dirty
                if isinstance(self.past_key_values, MobilintCache):
                    self._mobilint_cache_memory_dirty = True
                logging.info(
                    "[Handler] Generation rolled back. aborted=%s, has_exception=%s",
                    is_aborted,
                    "exception" in generation_result,
                )
                error_message = str(generation_result["exception"]) if "exception" in generation_result else None
                return is_aborted, answer, error_message
            
            self.conversation = self.conversation + [
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": answer},
            ]
            if self.use_llm_kv_cache and isinstance(self.past_key_values, MobilintCache):
                self.past_key_values.dump_cache_memory()
                self._mobilint_cache_memory_dirty = False

            output = generation_result.get("output")
            if self.use_llm_kv_cache and output is not None and hasattr(output, "sequences"):
                output_sequences = self._clone_input_ids(output.sequences[0])
                if output_sequences is not None:
                    if using_cache_prefix and active_cached_input_ids is not None:
                        if output_sequences.numel() >= generation_inputs["input_ids"].shape[-1] and torch.equal(
                            output_sequences[: generation_inputs["input_ids"].shape[-1]],
                            generation_inputs["input_ids"][0].detach().cpu(),
                        ):
                            candidate_cached_input_ids = torch.cat([active_cached_input_ids, output_sequences], dim=0)
                        elif output_sequences.numel() >= full_input_ids.numel() and torch.equal(
                            output_sequences[: full_input_ids.numel()],
                            full_input_ids,
                        ):
                            candidate_cached_input_ids = output_sequences
                        else:
                            generated_len = max(0, output_sequences.numel() - generation_inputs["input_ids"].shape[-1])
                            generated_ids = output_sequences[-generated_len:] if generated_len > 0 else output_sequences[:0]
                            candidate_cached_input_ids = torch.cat([full_input_ids, generated_ids], dim=0)
                    else:
                        if output_sequences.numel() >= full_input_ids.numel() and torch.equal(
                            output_sequences[: full_input_ids.numel()],
                            full_input_ids,
                        ):
                            candidate_cached_input_ids = output_sequences
                        else:
                            candidate_cached_input_ids = torch.cat([full_input_ids, output_sequences], dim=0)

                    self.cached_input_ids = self._align_cached_input_ids_to_cache_length(candidate_cached_input_ids)
            elif self.use_llm_kv_cache:
                self.cached_input_ids = self._align_cached_input_ids_to_cache_length(full_input_ids)

            logging.info(
                "[Handler] Generation committed. used_cache=%s, previous_cached_seq_len=%d, cached_seq_len=%d",
                using_cache_prefix,
                cached_seq_len,
                self._get_cache_seq_length(),
            )

            return is_aborted, answer, None

        except Exception as e:
            logging.error(f"[Handler] Error while generating response: {e}", exc_info=True)
            return False, answer, str(e)

        finally:
            self.is_available = True

    def synthesize_speech(self, text: str, output_filename: str = "output.wav", language: Optional[str] = None) -> Optional[str]:
        self.is_available = False
        try:
            logging.info(f"[Handler] Synthesizing speech for: ")
            logging.info(f"\t\t{text}")

            normalized_language = language if language in {"ko", "en"} else "en"
            if normalized_language != "ko":
                self.tts.tts_to_file(text, output_path=output_filename, speed=1.0, language=normalized_language)
                return output_filename

            segments = split_mixed_language_segments(text, normalized_language)
            logging.info(f"[Handler] TTS segments={segments}")

            if len(segments) <= 1:
                segment_text, segment_language = segments[0] if segments else (text, normalized_language)
                self.tts.tts_to_file(segment_text, output_path=output_filename, speed=1.0, language=segment_language)
                return output_filename

            combined_audio = AudioSegment.silent(duration=0)
            for segment_text, segment_language in segments:
                temp_output = os.path.join(tempfile.gettempdir(), f"tts-segment-{uuid.uuid4().hex}.wav")
                try:
                    self.tts.tts_to_file(segment_text, output_path=temp_output, speed=1.0, language=segment_language)
                    combined_audio += AudioSegment.from_file(temp_output, format="wav")
                finally:
                    if os.path.exists(temp_output):
                        os.remove(temp_output)

            combined_audio.export(output_filename, format="wav")
            return output_filename

        except Exception as e:
            logging.error(f"Error synthesizing speech: {e}", exc_info=True)
            return None

        finally:
            self.is_available = True
