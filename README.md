# Aries AI Assistant Demo

## Getting started

### Prepare large files

You need to get appropriate `mxq` and `model.safetensors` files for each models in `backend/models` directory from [OneDrive](https://mobilintco-my.sharepoint.com/:f:/g/personal/beomsu_mobilint_com/EuerP4QVVGJIpYBKzdTABW8B5fqvDrscwTCZR7SBTKvxkw?e=Gvwan9).

Download them and put each file in appropriate directories.

### Install Docker

Follow the [official instruction](https://docs.docker.com/engine/install/ubuntu/)

### Create Docker Network & Build Image

```shell
mobilint@mobilint# sudo docker network create mblt_int
mobilint@mobilint# sudo docker compose build
```

### Run

```shell
mobilint@mobilint# sudo docker compose up
```

### Run on background

```shell
mobilint@mobilint# sudo docker compose up -d
```

### Shutdown background

```shell
mobilint@mobilint# sudo docker compose down
```

## Setup Shortcut

Path to this repository should be `/home/mobilint/aries-ai-assistant-demo`.

If needed, you can change the path in `ai-assistant-demo.desktop` and `run.sh` file before copying.

```shell
mobilint@mobilint# sudo cp ai-assistant-demo.desktop /usr/share/applications
```

Then, you can add `AI Assistant` icon in apps to the favorites (left sidebar).