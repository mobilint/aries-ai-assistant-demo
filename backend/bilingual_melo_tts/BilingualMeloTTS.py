from enum import Enum
import torch
from collections import Counter

from .melo_tts.processor import MeloTTSProcessor
from .melo_tts.model_ov import MeloTTSOv

import nltk
nltk.download('averaged_perceptron_tagger_eng')

class LangType(Enum):
    ENG = 1
    KO = 2
    UNKNOWN = 3

class BilingualMeloTTS(torch.nn.Module):
    def __init__(self, melo_tts_ov_path: str = None):
        super().__init__()
        self.melo_tts_ov_path = melo_tts_ov_path

        self.ko_procesor = MeloTTSProcessor("KR")
        self.ko_model = MeloTTSOv("./bilingual_melo_tts/melo_tts_kr_openvino.xml")

        self.en_procesor = MeloTTSProcessor("EN")
        self.en_model = MeloTTSOv("./bilingual_melo_tts/melo_tts_EN_openvino.xml")

        self.sampling_rate = None

    @torch.inference_mode()
    def forward(self, text: str) -> torch.Tensor:
        lang = self.detect_lang_type(text)
        if lang == LangType.KO:
            return self._ko_forward(text)
        elif lang == LangType.ENG:
            return self._en_forward(text)
        else:
            raise ValueError(f"Got unsupported lang type={lang}.")

    @torch.inference_mode()
    def _ko_forward(self, text: str) -> torch.Tensor:
        input_dict = self.ko_procesor(text, return_dict=True)
        self.sampling_rate = self.ko_procesor.hps.data.sampling_rate
        return self.ko_model(input_dict)

    @torch.inference_mode()
    def _en_forward(self, text: str) -> torch.Tensor:
        input_dict = self.en_procesor(text, return_dict=True)
        self.sampling_rate = self.en_procesor.hps.data.sampling_rate
        return self.en_model(input_dict)

    @classmethod
    def detect_lang_type(cls, text: str, default: LangType = LangType.ENG) -> LangType:
        count = Counter()
        for ch in text:
            if "a" <= ch.lower() <= "z":
                count[LangType.ENG] += 1
            elif "가" <= ch <= "힣":
                count[LangType.KO] += 1
            else:
                pass

        if not count:
            return LangType.ENG

        dominant = count.most_common(1)[0][0]
        return dominant