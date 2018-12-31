FROM ubuntu:16.04

ENV RUST_VERSION nightly

RUN apt-get update -y &&\
	apt-get upgrade -y &&\
	apt-get install -y curl git gcc &&\
	curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain ${RUST_VERSION}

ENV PATH $PATH:/root/.cargo/bin

RUN git clone --depth 1 https://github.com/namachan10777/minchat /tmp/minchat &&\
	cd /tmp/minchat/server &&\
	/root/.cargo/bin/cargo build --release &&\
	cp ./target/release/server /usr/local/bin

ENTRYPOINT ["/usr/local/bin/server"]
