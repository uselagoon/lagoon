FROM goharbor/trivy-adapter-photon:v2.0.0
LABEL maintainer="amazee.io"

COPY install_cert.sh /home/scanner
COPY entrypoint.sh /home/scanner
USER root
RUN mkdir /home/scanner/.cache \
    && mkdir /home/scanner/.cache/trivy \
    && mkdir /home/scanner/.cache/reports \
    && chown scanner:root -R /home/scanner/.cache
USER scanner