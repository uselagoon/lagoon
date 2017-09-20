FROM ocaml/opam:alpine as base
WORKDIR api-next

ADD api-next.opam .

RUN opam pin add -yn api-next . && \
    opam depext api-next && \
    opam install --deps-only api-next

ADD . .

RUN sudo chown -R opam:nogroup . && \
    opam config exec make build

FROM alpine
WORKDIR /app
COPY --from=base /home/opam/api-next/_build/default/src/main.exe api-next.exe

EXPOSE 8080

ENTRYPOINT ["/app/api-next.exe"]