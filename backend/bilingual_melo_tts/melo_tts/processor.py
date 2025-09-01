from typing import List
import re
import torch
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
melo_dir = os.path.join(project_dir, "MeloTTS")

if project_dir not in sys.path:
    sys.path.append(project_dir)
if melo_dir not in sys.path:
    sys.path.append(melo_dir)

from MeloTTS.melo.split_utils import split_sentence
from MeloTTS.melo.utils import get_text_for_tts_infer
from MeloTTS.melo.download_utils import load_or_download_config


class MeloTTSProcessor:
    def __init__(
        self,
        language,
        sdp_ratio=0.2,
        noise_scale=0.6,
        noise_scale_w=0.8,
        speed=1.3,
        use_hf=True,
        config_path=None,
    ):
        self.device = "cpu"
        self.language = language
        self.hps = load_or_download_config(
            language, use_hf=use_hf, config_path=config_path
        )
        self.symbol_to_id = {s: i for i, s in enumerate(self.hps.symbols)}
        self.sdp_ratio = sdp_ratio
        self.noise_scale = noise_scale
        self.noise_scale_w = noise_scale_w
        self.speed = speed

    @staticmethod
    def split_sentences_into_pieces(text, language, quiet=False) -> List[str]:
        texts = split_sentence(text, language_str=language)
        if not quiet:
            print(" > Text split to sentences.")
            print("\n".join(texts))
            print(" > ===========================")
        return texts

    def __call__(
        self,
        t: str,
        speaker_id: int = 0,
        return_dict: bool = False,
    ):
        if self.language in ["EN", "ZH_MIX_EN"]:
            t = re.sub(r"([a-z])([A-Z])", r"\1 \2", t)
        bert, ja_bert, phones, tones, lang_ids = get_text_for_tts_infer(
            t, self.language, self.hps, self.device, self.symbol_to_id
        )
        x_tst = phones.to(self.device).unsqueeze(0)
        tones = tones.to(self.device).unsqueeze(0)
        lang_ids = lang_ids.to(self.device).unsqueeze(0)
        bert = bert.to(self.device).unsqueeze(0)
        ja_bert = ja_bert.to(self.device).unsqueeze(0)
        x_tst_lengths = torch.LongTensor([phones.size(0)]).to(self.device)
        del phones
        speakers = torch.LongTensor([speaker_id]).to(self.device)

        sdp_ratio = torch.tensor([self.sdp_ratio])
        noise_scale = torch.tensor([self.noise_scale])
        noise_scale_w = torch.tensor([self.noise_scale_w])
        length_scale = torch.tensor([1.0 / self.speed])

        if return_dict:
            return {
                "x": x_tst,
                "x_lengths": x_tst_lengths,
                "sid": speakers,
                "tone": tones,
                "language": lang_ids,
                "bert": bert,
                "ja_bert": ja_bert,
                "sdp_ratio": sdp_ratio,
                "noise_scale": noise_scale,
                "noise_scale_w": noise_scale_w,
                "length_scale": length_scale,
            }
        else:
            return (
                x_tst,
                x_tst_lengths,
                speakers,
                tones,
                lang_ids,
                bert,
                ja_bert,
                sdp_ratio,
                noise_scale,
                noise_scale_w,
                length_scale,
            )
