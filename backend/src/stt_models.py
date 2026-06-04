from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class STTModelConfig:
    id: str
    label: str
    family: str
    supports_language_hint: bool
    default: bool = False


STT_MODEL_CONFIGS: tuple[STTModelConfig, ...] = (
    STTModelConfig(
        id="mobilint/whisper-small",
        label="Whisper Small",
        family="whisper",
        supports_language_hint=True,
    ),
    STTModelConfig(
        id="mobilint/whisper-medium",
        label="Whisper Medium",
        family="whisper",
        supports_language_hint=True,
        default=True,
    ),
    STTModelConfig(
        id="mobilint/whisper-large-v3-turbo",
        label="Whisper Large v3 Turbo",
        family="whisper",
        supports_language_hint=True,
    ),
)


def get_available_stt_models() -> list[dict]:
    return [asdict(config) for config in STT_MODEL_CONFIGS]


def get_default_stt_model_id() -> str:
    for config in STT_MODEL_CONFIGS:
        if config.default:
            return config.id
    return STT_MODEL_CONFIGS[0].id


def validate_stt_model_id(model_id: str) -> STTModelConfig:
    for config in STT_MODEL_CONFIGS:
        if config.id == model_id:
            return config
    raise ValueError(f"Unknown STT model: {model_id}")