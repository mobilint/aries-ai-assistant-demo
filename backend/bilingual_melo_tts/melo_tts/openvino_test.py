import soundfile
import time
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
if project_dir not in sys.path:
    sys.path.append(project_dir)

from melo_tts.processor import MeloTTSProcessor
from melo_tts.model_ov import MeloTTSOv

if __name__ == "__main__":
    language = "KR"
    procesor = MeloTTSProcessor(language)
    save_path = "./melo_tts_kr_openvino.xml"
    model_ov = MeloTTSOv(save_path)

    text = "안녕하세요! 만나서 반갑습니다."
    input_dict = procesor(text, return_dict=True)
    s = time.time()
    output = model_ov(input_dict)
    print(f"Executed time={time.time() - s} sec")

    output_path = "./kr_ov.wav"
    soundfile.write(output_path, output, procesor.hps.data.sampling_rate)
