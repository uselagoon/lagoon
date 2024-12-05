apiVersion: k3d.io/v1alpha5
kind: Simple
servers: 1
agents: 0
network: k3d
volumes:
  - volume: ${HOME}/.docker/config.json:/var/lib/kubelet/config.json
  - volume: services:/lagoon/services
  - volume: node_packages:/lagoon/node-packages
registries:
  create: # pass through for k3d node to share images with the host
    image: ligfx/k3d-registry-dockerd:v0.5
    proxy:
      remoteURL: "*"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
  config: |
    mirrors:
      "registry.${LAGOON_K3D_NETWORK}.nip.io":
        endpoint:
          - https://registry.${LAGOON_K3D_NETWORK}.nip.io
    configs:
        "registry.${LAGOON_K3D_NETWORK}.nip.io":
            tls:
              insecure_skip_verify: true
options:
  k3s: # options passed on to K3s itself
    extraArgs: # additional arguments passed to the `k3s server|agent` command; same as `--k3s-arg`
      - arg: --disable=traefik
        nodeFilters:
          - server:*
      - arg: --disable=servicelb
        nodeFilters:
          - server:*
      - arg: --disable-network-policy
        nodeFilters:
          - server:*
