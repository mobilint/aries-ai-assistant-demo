import soundfile
import time
import torch
import openvino as ov
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
melo_dir = os.path.join(project_dir, "MeloTTS")

if project_dir not in sys.path:
    sys.path.append(project_dir)
if melo_dir not in sys.path:
    sys.path.append(melo_dir)

from melo_tts.processor import MeloTTSProcessor
from melo_tts.model_ov import MeloTTSOv
from MeloTTS.melo.api import TTS


class MeloTTSWrapper(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model.eval()

    def forward(
        self,
        x,
        x_lengths,
        sid,
        tone,
        language,
        bert,
        ja_bert,
        sdp_ratio=0,
        noise_scale=0.667,
        noise_scale_w=0.8,
        length_scale=1,
    ):
        return self.model.infer(
            x,
            x_lengths,
            sid,
            tone,
            language,
            bert,
            ja_bert,
            sdp_ratio=sdp_ratio,
            noise_scale=noise_scale,
            noise_scale_w=noise_scale_w,
            length_scale=length_scale,
        )


def convert_model_into_ov(
    model: torch.nn.Module,
    procesor: MeloTTSProcessor,
    save_path: str,
    example_text: str,
):
    wrapper = MeloTTSWrapper(model)
    example_inputs = procesor(example_text)
    ov_model = ov.convert_model(wrapper, example_input=example_inputs)

    # Name input/output tensors
    input_names = [
        "x",
        "x_lengths",
        "sid",
        "tone",
        "language",
        "bert",
        "ja_bert",
        "sdp_ratio",
        "noise_scale",
        "noise_scale_w",
        "length_scale",
    ]
    for input_tensor, name in zip(ov_model.inputs, input_names):
        input_tensor.get_tensor().set_names({name})
    ov_model.outputs[0].get_tensor().set_names({"audio"})

    # Reshape inputs to batch size 1
    shapes = {}
    for inp in ov_model.inputs:
        shape = inp.partial_shape
        shape[0] = 1  # Set batch dimension to 1
        shapes[inp] = shape
    ov_model.reshape(shapes)
    ov.save_model(ov_model, save_path)


if __name__ == "__main__":
    language = "EN"
    procesor = MeloTTSProcessor(language)
    model = TTS(language=language, device="cpu").model
    save_path = f"./melo_tts_{language}_openvino.xml"
    example_text = "Hello, nice to meet you"
    convert_model_into_ov(
        model=model, procesor=procesor, save_path=save_path, example_text=example_text
    )
    model_ov = MeloTTSOv(save_path)

    input_dict = procesor(example_text, return_dict=True)
    s = time.time()
    output = model_ov(input_dict)
    print(f"Executed time={time.time() - s} sec")

    output_path = f"./{language}_ov.wav"
    soundfile.write(output_path, output, procesor.hps.data.sampling_rate)
