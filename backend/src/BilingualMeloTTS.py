from collections import Counter
from enum import Enum
import platform
from typing import Optional

import torch


class LangType(Enum):
    ENG = "en"
    KO = "ko"
    UNKNOWN = "unknown"


class BilingualMeloTTS(torch.nn.Module):
    def __init__(self, is_npu: bool, target_core: Optional[str] = None):
        super().__init__()

        self.is_npu = is_npu
        self._patch_korean_g2p_runtime()

        if is_npu:
            from mblt_model_zoo.MeloTTS.api import TTS

            self.ko_api = TTS("KR", target_core=target_core, trust_remote_code=True)
            self.en_api = TTS("EN_NEWEST", target_core=target_core, trust_remote_code=True)
            self.before_lang = LangType.ENG
        else:
            from melo.api import TTS

            self.ko_api = TTS("KR")
            self.en_api = TTS("EN_NEWEST")
            self.before_lang = LangType.ENG

    def _patch_korean_g2p_runtime(self) -> None:
        if platform.system() != "Windows":
            return

        try:
            import eunjeon
        except Exception:
            return

        modules_to_patch = []

        try:
            from mblt_model_zoo.MeloTTS.text import korean as mblt_korean

            modules_to_patch.append(mblt_korean)
        except Exception:
            pass

        try:
            from melo.text import korean as melo_korean

            modules_to_patch.append(melo_korean)
        except Exception:
            pass

        for korean_module in modules_to_patch:
            g2p_cls = getattr(korean_module, "G2p", None)
            if g2p_cls is None:
                continue

            def check_mecab(self):
                return None

            def get_mecab(self):
                return eunjeon.Mecab()

            g2p_cls.check_mecab = check_mecab
            g2p_cls.get_mecab = get_mecab

    def tts_to_file(self, text, output_path=None, speed=1.0, language: Optional[str] = None):
        dominant = self.from_language_code(language) if language else self.detect_lang_type(text, default=self.before_lang)

        if dominant == LangType.KO:
            speaker_ids = self.ko_api.hps.data.spk2id
            self.ko_api.tts_to_file(text, speaker_id=speaker_ids["KR"], output_path=output_path, speed=speed * 1.5, quiet=True)
        elif dominant == LangType.ENG:
            speaker_ids = self.en_api.hps.data.spk2id
            self.en_api.tts_to_file(text, speaker_id=speaker_ids["EN-Newest"], output_path=output_path, speed=speed, quiet=True)
        else:
            raise ValueError(f"Got unsupported lang type={dominant}.")

        self.before_lang = dominant

    @classmethod
    def from_language_code(cls, language: Optional[str], default: LangType = LangType.ENG) -> LangType:
        if language == "ko":
            return LangType.KO
        if language == "en":
            return LangType.ENG
        return default

    @classmethod
    def detect_lang_type(cls, text: str, default: LangType = LangType.ENG) -> LangType:
        count = Counter()
        for ch in text:
            if "a" <= ch.lower() <= "z":
                count[LangType.ENG] += 1
            elif "\uac00" <= ch <= "\ud7a3":
                count[LangType.KO] += 1

        if not count:
            return default

        return count.most_common(1)[0][0]
