"""
RIG Modal Endpoint — GLM-5.2-FP8 on 8xB200 with SGLang
Deploy: modal deploy modal/glm_endpoint.py
"""
import modal

MINUTES = 60
DEFAULT_PORT = 8000
HF_IMAGE_ENV = {"HF_XET_HIGH_PERFORMANCE": "1"}

MODEL_PATH = "/flash-endpoint-model/huggingface/hub/models--zai-org--GLM-5.2-FP8/snapshots/a0b55e88465d1a06afece97bc8d6b366aff39089"
SERVED_MODEL_NAME = "zai-org/GLM-5.2-FP8"
ROUTING_REGION = "us-west"
REQUIRE_AUTHENTICATION = True
SGLANG_IMAGE_TAG = "lmsysorg/sglang:v0.5.13.post1-cu130"
AUTOINFERENCE_UTILS_VERSION = "0.2.2"

GPU_TYPE = "B200"
N_GPUS = 8
GPU = f"{GPU_TYPE}:{N_GPUS}"

SCALEDOWN_WINDOW = 5 * MINUTES
TARGET_INPUTS = 16
STARTUP_TIMEOUT = 60 * MINUTES

EXTRA_IMAGE_ENV = {
    "SGLANG_DSA_ENABLE_MTP_PRECOMPUTE_METADATA": "1",
    "SGLANG_DSA_FUSE_TOPK": "1",
    "SGLANG_ENABLE_SPEC_V2": "1",
    "SGLANG_NSA_FORCE_MLA": "1",
    "SGLANG_TIMEOUT_KEEP_ALIVE": "300",
    "TORCHINDUCTOR_COMPILE_THREADS": "1",
}

serving_image = (
    modal.Image.from_registry(SGLANG_IMAGE_TAG)
    .uv_pip_install(f"autoinference-utils=={AUTOINFERENCE_UTILS_VERSION}")
    .env(HF_IMAGE_ENV | EXTRA_IMAGE_ENV)
)

EXTRA_SERVER_ARGS = {
    "--chunked-prefill-size": "32768",
    "--cuda-graph-max-bs": "32",
    "--disable-cuda-graph-padding": "",
    "--disable-piecewise-cuda-graph": "",
    "--dist-timeout": "3600",
    "--dsa-decode-backend": "trtllm",
    "--dsa-prefill-backend": "trtllm",
    "--dsa-topk-backend": "sgl-kernel",
    "--fp8-gemm-backend": "deep_gemm",
    "--kv-cache-dtype": "fp8_e4m3",
    "--mem-fraction-static": "0.85",
    "--reasoning-parser": "glm45",
    "--speculative-algorithm": "EAGLE",
    "--speculative-eagle-topk": "1",
    "--speculative-num-draft-tokens": "7",
    "--speculative-num-steps": "6",
    "--tool-call-parser": "glm47",
    "--trust-remote-code": "",
}

SERVER_ARGS = {"--served-model-name": SERVED_MODEL_NAME} | EXTRA_SERVER_ARGS

WARMUP_PAYLOAD = {
    "model": SERVED_MODEL_NAME,
    "messages": [{"role": "user", "content": "Reply with exactly OK."}],
    "max_tokens": 8,
    "temperature": 0,
}

app = modal.App(name="ep-RIG")


@app.server(
    image=serving_image,
    gpu=GPU,
    cpu=4,
    memory=16384,
    min_containers=0,
    scaledown_window=SCALEDOWN_WINDOW,
    port=DEFAULT_PORT,
    routing_region=ROUTING_REGION,
    unauthenticated=not REQUIRE_AUTHENTICATION,
    exit_grace_period=25,
    startup_timeout=STARTUP_TIMEOUT,
    target_concurrency=TARGET_INPUTS,
    volumes={"/flash-endpoint-model": modal.Volume.from_name("endpoint-ep-c1lhgOxhbaRprGJlXuPubX")},
)
class Server:
    @modal.enter()
    def startup(self):
        from autoinference_utils.endpoint import SGLangEndpoint, warmup_chat_completions

        self.endpoint = SGLangEndpoint(
            model_path=MODEL_PATH,
            worker_port=DEFAULT_PORT,
            tp=N_GPUS,
            extra_server_args=SERVER_ARGS,
            health_timeout=STARTUP_TIMEOUT,
            health_poll_interval=5.0,
        )
        self.endpoint.start()
        warmup_chat_completions(
            port=DEFAULT_PORT,
            payload=WARMUP_PAYLOAD,
            successful_requests=2,
            request_timeout=60.0,
        )
        print(f"{SERVED_MODEL_NAME} ({GPU}) sglang deployment is ready.")

    @modal.exit()
    def stop(self):
        if hasattr(self, "endpoint"):
            self.endpoint.stop()