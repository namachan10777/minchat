FROM ubuntu:16.04

ENV RUST_VERSION nightly

RUN apt-get update -y &&\
	apt-get upgrade -y &&\
	apt-get install -y curl git gcc &&\
	curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain ${RUST_VERSION}

ENV PATH $PATH:/root/.cargo/bin

ENTRYPOINT ["/bin/bash"]
