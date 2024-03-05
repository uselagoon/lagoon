

# harbor remote event payloads

When a harbor policy is enforced, a message will be sent to the remote clusters, the payload sent will be one of the following depending on if the policy is being added, updated, or removed.

## add or update policy

Policy addition or updating will contain the policy information and the project information. The remote-controller uses this and the `eventType` to add or update the policy in the harbor that is associated to the project in each remote.

```
{
  "key":"deploytarget:harborpolicy:update",
  "misc":{
    "miscResource":"eyJ0eXBlIjoiaGFyYm9yUmV0ZW50aW9uUG9saWN5IiwiZXZlbnRUeXBlIjoidXBkYXRlUG9saWN5IiwiZGF0YSI6eyJwcm9qZWN0Ijp7ImlkIjoxODAsIm5hbWUiOiJsYWdvb24tZGVtby1vcmcifSwicG9saWN5Ijp7ImVuYWJsZWQiOnRydWUsInJ1bGVzIjpbeyJuYW1lIjoiYWxsIGJyYW5jaGVzLCBleGNsdWRpbmcgcHVsbHJlcXVlc3RzIiwicGF0dGVybiI6IltecHJcXC1dKi8qIiwibGF0ZXN0UHVsbGVkIjozfSx7Im5hbWUiOiJwdWxscmVxdWVzdHMiLCJwYXR0ZXJuIjoicHItKiIsImxhdGVzdFB1bGxlZCI6MX1dLCJzY2hlZHVsZSI6IjMgMyAqICogMyJ9fX0"
  }
}
```
And the decoded `miscResource` payload is structured like this, based on the type `HarborRetentionMessage`:
```
{
    "type": "harborRetentionPolicy",
    "eventType": "updatePolicy",
    "data": {
        "project": {
            "id": 180,
            "name": "lagoon-demo-org"
        },
        "policy": {
            "enabled": true,
            "rules": [
                {
                    "name": "all branches, excluding pullrequests",
                    "pattern": "[^pr\\-]*/*",
                    "latestPulled": 3
                },
                {
                    "name": "pullrequests",
                    "pattern": "pr-*",
                    "latestPulled": 1
                }
            ],
            "schedule": "3 3 * * 3"
        }
    }
}
```

## remove policy

Policy removal contains just the project information, the remote-controller uses this and the `eventType` to remove the policy from the associated project in harbor.

```
{
  "key":"deploytarget:harborpolicy:update",
  "misc":{
    "miscResource":"eyJ0eXBlIjoiaGFyYm9yUmV0ZW50aW9uUG9saWN5IiwiZXZlbnRUeXBlIjoicmVtb3ZlUG9saWN5IiwiZGF0YSI6eyJwcm9qZWN0Ijp7ImlkIjoxODAsIm5hbWUiOiJsYWdvb24tZGVtby1vcmcifX19"
  }
}
```
And the decoded `miscResource` payload is structured like this, based on the type `HarborRetentionMessage`:
```
{
    "type": "harborRetentionPolicy",
    "eventType": "removePolicy",
    "data": {
        "project": {
            "id": 180,
            "name": "lagoon-demo-org"
        }
    }
}
```