# Bakes the repo's litellm.config.yaml into the official LiteLLM proxy image.
# The config only references env vars (os.environ/...), so no secrets live
# in the image or the repo — real keys are supplied as Render env vars.
FROM ghcr.io/berriai/litellm:main-stable

COPY litellm.config.yaml /app/config.yaml

CMD ["--config", "/app/config.yaml", "--port", "4000"]
