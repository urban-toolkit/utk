FROM python:3.10.6-buster

# set working directory
WORKDIR /usr/src/utk-backend

# add and install requirements
COPY ./requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# add app
COPY . .