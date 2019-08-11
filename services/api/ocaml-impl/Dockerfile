FROM ocaml/opam:alpine as base
WORKDIR api

ADD api.opam .

RUN opam pin add -yn api . && \
    opam depext api && \
    opam install --deps-only api

ADD . .

RUN sudo chown -R opam:nogroup . && \
    opam config exec make build && \
    opam depext -ln api | egrep -o "\-\s.*" | sed "s/- //" > depexts

FROM alpine
WORKDIR /app
COPY --from=base /home/opam/api/_build/default/src/main.exe api.exe

# Don't forget to install the dependencies, noted from
# the previous build.
COPY --from=0 /home/opam/api/depexts depexts
RUN cat depexts | xargs apk --update add && rm -rf /var/cache/apk/*

EXPOSE 8080

ENTRYPOINT ["/app/api.exe"]