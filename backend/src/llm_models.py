from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class LLMModelConfig:
    id: str
    label: str
    family: str
    system_prompt_path: str
    inter_prompt_path: str
    generation_config_path: str
    default: bool = False


LLM_MODEL_CONFIGS: tuple[LLMModelConfig, ...] = (
    LLMModelConfig(
        id="LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct",
        label="EXAONE 3.5 2.4B Instruct",
        family="exaone",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/EXAONE-3.5-2.4B-Instruct",
        default=True,
    ),
    LLMModelConfig(
        id="LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct",
        label="EXAONE 3.5 7.8B Instruct",
        family="exaone",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/EXAONE-3.5-7.8B-Instruct",
    ),
    LLMModelConfig(
        id="LGAI-EXAONE/EXAONE-4.0-1.2B",
        label="EXAONE 4.0 1.2B",
        family="exaone",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/EXAONE-4.0-1.2B",
    ),
    LLMModelConfig(
        id="LGAI-EXAONE/EXAONE-Deep-2.4B",
        label="EXAONE Deep 2.4B",
        family="exaone-deep",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/EXAONE-Deep-2.4B",
    ),
    LLMModelConfig(
        id="LGAI-EXAONE/EXAONE-Deep-7.8B",
        label="EXAONE Deep 7.8B",
        family="exaone-deep",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/EXAONE-Deep-7.8B",
    ),
    LLMModelConfig(
        id="naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B",
        label="HyperCLOVAX SEED Text Instruct 1.5B",
        family="hyperclovax",
        system_prompt_path="src/prompts/kr-system.txt",
        inter_prompt_path="src/prompts/kr-inter-prompt.txt",
        generation_config_path="src/generation_configs/HyperCLOVAX-SEED-Text-Instruct-1.5B",
    ),
    LLMModelConfig(
        id="meta-llama/Llama-3.2-1B-Instruct",
        label="Llama 3.2 1B Instruct",
        family="llama",
        system_prompt_path="src/prompts/en-system.txt",
        inter_prompt_path="src/prompts/en-inter-prompt.txt",
        generation_config_path="src/generation_configs/Llama-3.2-1B-Instruct",
    ),
    LLMModelConfig(
        id="meta-llama/Llama-3.2-3B-Instruct",
        label="Llama 3.2 3B Instruct",
        family="llama",
        system_prompt_path="src/prompts/en-system.txt",
        inter_prompt_path="src/prompts/en-inter-prompt.txt",
        generation_config_path="src/generation_configs/Llama-3.2-3B-Instruct",
    ),
    LLMModelConfig(
        id="meta-llama/Llama-3.1-8B-Instruct",
        label="Llama 3.1 8B Instruct",
        family="llama",
        system_prompt_path="src/prompts/en-system.txt",
        inter_prompt_path="src/prompts/en-inter-prompt.txt",
        generation_config_path="src/generation_configs/Llama-3.1-8B-Instruct",
    ),
    LLMModelConfig(
        id="Qwen/Qwen2.5-0.5B-Instruct",
        label="Qwen2.5 0.5B Instruct",
        family="qwen",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen2.5-0.5B-Instruct",
    ),
    LLMModelConfig(
        id="Qwen/Qwen2.5-1.5B-Instruct",
        label="Qwen2.5 1.5B Instruct",
        family="qwen",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen2.5-1.5B-Instruct",
    ),
    LLMModelConfig(
        id="Qwen/Qwen2.5-3B-Instruct",
        label="Qwen2.5 3B Instruct",
        family="qwen",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen2.5-3B-Instruct",
    ),
    LLMModelConfig(
        id="Qwen/Qwen2.5-7B-Instruct",
        label="Qwen2.5 7B Instruct",
        family="qwen",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen2.5-7B-Instruct",
    ),
    LLMModelConfig(
        id="Qwen/Qwen3-0.6B",
        label="Qwen3 0.6B",
        family="qwen3",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen3-0.6B",
    ),
    LLMModelConfig(
        id="Qwen/Qwen3-1.7B",
        label="Qwen3 1.7B",
        family="qwen3",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen3-1.7B",
    ),
    LLMModelConfig(
        id="Qwen/Qwen3-4B",
        label="Qwen3 4B",
        family="qwen3",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen3-4B",
    ),
    LLMModelConfig(
        id="Qwen/Qwen3-8B",
        label="Qwen3 8B",
        family="qwen3",
        system_prompt_path="src/prompts/ch-system.txt",
        inter_prompt_path="src/prompts/ch-inter-prompt.txt",
        generation_config_path="src/generation_configs/Qwen3-8B",
    ),
)


def get_available_llm_models() -> list[dict]:
    return [asdict(config) for config in LLM_MODEL_CONFIGS]


def get_default_llm_model_id() -> str:
    for config in LLM_MODEL_CONFIGS:
        if config.default:
            return config.id
    return LLM_MODEL_CONFIGS[0].id


def validate_llm_model_id(model_id: str) -> LLMModelConfig:
    for config in LLM_MODEL_CONFIGS:
        if config.id == model_id:
            return config
    raise ValueError(f"Unknown LLM model: {model_id}")