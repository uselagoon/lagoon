FROM ocaml/opam:alpine as base
WORKDIR api-next

ADD api-next.opam .

RUN opam pin add -yn api-next . && \
    opam depext api-next && \
    opam install --deps-only api-next

ADD . .

RUN sudo chown -R opam:nogroup . && \
    opam config exec make build && \
    opam depext -ln api-next | egrep -o "\-\s.*" | sed "s/- //" > depexts

FROM alpine
WORKDIR /app
COPY --from=base /home/opam/api-next/_build/default/src/main.exe api-next.exe

# Don't forget to install the dependencies, noted from
# the previous build.
COPY --from=0 /home/opam/api-next/depexts depexts
RUN cat depexts | xargs apk --update add && rm -rf /var/cache/apk/*

EXPOSE 8080

ENTRYPOINT ["/app/api-next.exe"]