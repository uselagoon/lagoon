#!/bin/bash


kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: broker-amqp-ext
  namespace: lagoon-core
spec:
  type: LoadBalancer
  ports:
    - port: 5672
      targetPort: amqp
      name: amqp
  selector:
    app.kubernetes.io/component: lagoon-core-broker
    app.kubernetes.io/instance: lagoon-core
    app.kubernetes.io/name: lagoon-core
EOF

go run cmd/main.go --lagoon-api-host=https://lagoon-api.$(kubectl -n ingress-nginx get services ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}').nip.io/graphql \
    --jwt-token-signing-key=$(kubectl -n lagoon-core get secret lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode) \
    --rabbitmq-username=lagoon \
    --rabbitmq-password=$(kubectl -n lagoon-core get secret lagoon-core-broker -o jsonpath="{.data.RABBITMQ_PASSWORD}" | base64 --decode) \
    --rabbitmq-hostname=$(kubectl -n lagoon-core get service broker-amqp-ext -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):5672
