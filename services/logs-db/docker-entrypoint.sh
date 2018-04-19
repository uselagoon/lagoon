#!/usr/bin/env bash

set -eo pipefail

cat <<EOT >> /usr/share/elasticsearch/config/elasticsearch.yml
xpack.notification:
  slack:
    account:
      monitoring:
        url: "${LOGSDB_SLACK_WEBHOOK_URL:https://hooks.slack.com/services/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}"
        message_defaults:
          from: "${LOGSDB_SLACK_USERNAME:x-pack}"
          to: "${LOGSDB_SLACK_CHANNEL:#lagoon-dev-alerts}"
          attachment:
            fallback: "X-Pack Notification"
            color: "#a63636"
            title: "X-Pack Notification"
            title_link: "https://www.elastic.co/guide/en/x-pack/current/index.html"
            text: "One of your watches generated this notification."
            mrkdwn_in: "pretext, text"
  pagerduty:
    account:
      my_pagerduty_account:
        service_api_key: "${LOGSDB_PAGERDUTY_KEY:XXXXU4yGzC2QassuXXXX}"
        event_defaults:
          description: "Elasticsearch Watch notification"
          incident_key: "lagoon_logs_key"
          event_type: trigger
EOT
