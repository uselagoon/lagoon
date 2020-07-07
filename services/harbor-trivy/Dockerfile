FROM aquasec/harbor-scanner-trivy:0.11.0
LABEL maintainer="amazee.io"

COPY install_cert.sh /home/scanner
COPY entrypoint.sh /home/scanner
USER root
RUN mkdir /home/scanner/.cache \
    && mkdir /home/scanner/.cache/trivy \
    && mkdir /home/scanner/.cache/reports \
    && chown scanner:root -R /home/scanner/.cache \
    && chown scanner:root -R /home/scanner/.cache \
    && chown -R scanner:root /home/scanner \
    && chmod g+rw /home/scanner
USER scanner