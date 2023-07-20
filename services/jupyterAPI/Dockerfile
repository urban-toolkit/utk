FROM --platform=linux/amd64 jupyter/minimal-notebook:python-3.10

USER root

# set working directory
WORKDIR /usr/src/utk-jupyterAPI

# installing osmium and plotoptix dependencies
RUN apt-get update \
  && apt-get -y install osmium-tool ca-certificates gnupg ffmpeg libsm6 libxext6 libgl1-mesa-dev libglib2.0-0 \
  && gpg --homedir /tmp --no-default-keyring --keyring /usr/share/keyrings/mono-official-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF \
  && echo "deb [signed-by=/usr/share/keyrings/mono-official-archive-keyring.gpg] https://download.mono-project.com/repo/ubuntu stable-focal main" | tee /etc/apt/sources.list.d/mono-official-stable.list \
  && apt-get update \
  && apt -y install mono-devel \
  && apt-get clean

# add and install requirements
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# add app
COPY . .
