#!/usr/bin/env bash
set -o pipefail

b64enc() { openssl enc -base64 -A | tr '+/' '-_' | tr -d '='; }
json() { jq -c . | LC_CTYPE=C tr -d '\n'; }
hs_sign() { openssl dgst -binary -sha"${1}" -hmac "$2"; }
rs_sign() { openssl dgst -binary -sha"${1}" -sign <(printf '%s\n' "$2"); }

sign() {
        local algo payload header sig secret=$3
        algo=${1:-RS256}; algo=${algo^^}

        header='{
          "typ": "JWT",
          "alg": "'$algo'"
        }'

        payload=$(jq -c \
          --arg iat_str "$(date +%s)" \
        "
        (\$iat_str | tonumber) as \$iat
        | .iat = \$iat
        | .exp = (\$iat + ${4:-60})
        " <<< ${2} | tr -d '\n')

        signed_content="$(json <<<"$header" | b64enc).$(json <<<"$payload" | b64enc)"
        case $algo in
                HS*) sig=$(printf %s "$signed_content" | hs_sign "${algo#HS}" "$secret" | b64enc) ;;
                RS*) sig=$(printf %s "$signed_content" | rs_sign "${algo#RS}" "$secret" | b64enc) ;;
                *) echo "Unknown algorithm" >&2; return 1 ;;
        esac
        printf '%s.%s\n' "${signed_content}" "${sig}"
}

set -euo pipefail

PAYLOAD='{
  "iss": "ssh Bash JWT Generator",
  "sub": "ssh",
  "role": "admin",
  "aud": "'$JWTAUDIENCE'"
}'

sign hs256 "${PAYLOAD}" "${JWTSECRET}" 60