FROM golang:alpine as golang

RUN apk add --no-cache git
RUN go get github.com/a8m/envsubst/cmd/envsubst

FROM docker:stable

COPY --from=golang /go/bin/envsubst /bin/envsubst

ENV OC_VERSION=v3.6.0 \
    OC_HASH=c4dd4cf \
		OC_SHA256=ecb0f52560ac766331052a0052b1de646011247f637c15063f4d74432e1ce389 \
		GLIBC_VERSION=2.25-r0

# To run the openshift client library `oc` we need glibc, install that first. Copied from https://github.com/jeanblanchard/docker-alpine-glibc/blob/master/Dockerfile
RUN apk add -U --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing aufs-util && \
		apk add --update curl && \
		curl -Lo /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub && \
		curl -Lo glibc.apk "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-${GLIBC_VERSION}.apk" && \
		curl -Lo glibc-bin.apk "https://github.com/sgerrand/alpine-pkg-glibc/releases/download/${GLIBC_VERSION}/glibc-bin-${GLIBC_VERSION}.apk" && \
		apk add glibc-bin.apk glibc.apk && \
		/usr/glibc-compat/sbin/ldconfig /lib /usr/glibc-compat/lib && \
		echo 'hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4' >> /etc/nsswitch.conf && \
		rm -rf glibc.apk glibc-bin.apk /var/cache/apk/*  && \
		apk add --no-cache bash git openssh py-pip && \
		git config --global user.email "lagoon@lagoon.io" && git config --global user.name lagoon && \
    pip install shyaml && \
		mkdir -p /openshift-origin-client-tools && \
    curl -Lo /tmp/openshift-origin-client-tools.tar https://github.com/openshift/origin/releases/download/${OC_VERSION}/openshift-origin-client-tools-${OC_VERSION}-${OC_HASH}-linux-64bit.tar.gz && \
		echo "$OC_SHA256  /tmp/openshift-origin-client-tools.tar" | sha256sum -c -  && \
		mkdir /tmp/openshift-origin-client-tools && \
    tar -xzf /tmp/openshift-origin-client-tools.tar -C /tmp/openshift-origin-client-tools --strip-components=1 && \
    install /tmp/openshift-origin-client-tools/oc /usr/bin/oc && rm -rf /tmp/openshift-origin-client-tools  && rm -rf /tmp/openshift-origin-client-tools.tar && \
		mkdir -p /git

WORKDIR /git

COPY docker-entrypoint.sh /usr/sbin/docker-entrypoint
COPY build-deploy.sh /usr/sbin/build-deploy
COPY build-deploy-docker-compose.sh /build-deploy-docker-compose.sh

COPY scripts /scripts

COPY openshift-templates /openshift-templates

ENTRYPOINT ["docker-entrypoint"]

CMD ["build-deploy"]
