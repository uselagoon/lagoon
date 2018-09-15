FROM arachnysdocker/athenapdf-service:2.13.0

ENV WEAVER_ATHENA_CMD="athenapdf --no-cache --ignore-certificate-errors -S"
ENV WEAVER_AUTH_KEY=lagoon-athenapdf

COPY entrypoint.sh /athenapdf-service/conf/entrypoint.sh