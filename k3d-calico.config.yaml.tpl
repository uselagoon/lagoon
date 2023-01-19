apiVersion: k3d.io/v1alpha4
kind: Simple
servers: 1
agents: 0
network: k3d
volumes:
  - volume: ${HOME}/.docker/config.json:/var/lib/kubelet/config.json
  - volume: services:/lagoon/services
  - volume: node_packages:/lagoon/node-packages
  - volume: ${PWD}/calico.yaml:/var/lib/rancher/k3s/server/manifests/calico.yaml
registries:
  config: |
    mirrors:
      docker.io:
        endpoint:
        - "https://imagecache.amazeeio.cloud"
      "registry.${K3D_NODE_IP}.nip.io:32080":
        endpoint:
          - http://registry.${K3D_NODE_IP}.nip.io:32080
    configs:
        "registry.${K3D_NODE_IP}.nip.io:32080":
            tls:
            insecure_skip_verify: true
options:
  k3s: # options passed on to K3s itself
    extraArgs: # additional arguments passed to the `k3s server|agent` command; same as `--k3s-arg`
      - arg: --disable=traefik
        nodeFilters:
          - server:*
      - arg: --flannel-backend=none
        nodeFilters:
          - server:*
      - arg: --disable-network-policy
        nodeFilters:
          - server:*
