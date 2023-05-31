# FROM jupyter/datascience-notebook:python-3.10
FROM jupyter/minimal-notebook:python-3.10

# set working directory
WORKDIR /usr/src/utk-jupyterAPI

# add and install requirements
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# add app
COPY . .

