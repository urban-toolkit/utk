FROM jupyter/minimal-notebook:python-3.10

USER root

# set working directory
WORKDIR /usr/src/utk-jupyterAPI

# to load data from PBF
RUN apt-get update \
  && apt-get -y install osmium-tool \
  && apt-get clean

# add and install requirements
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# add app
COPY . .

