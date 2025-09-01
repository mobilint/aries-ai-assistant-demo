import openvino as ov


class MeloTTSOv:
    def __init__(self, save_path: str):
        core = ov.Core()
        self.compiled_model = core.compile_model(save_path, device_name="CPU")
        self.infer_request = self.compiled_model.create_infer_request()

    def __call__(self, input_dict):
        output = self.infer_request.infer(input_dict)
        audio = output["audio"].reshape(-1)
        return audio
