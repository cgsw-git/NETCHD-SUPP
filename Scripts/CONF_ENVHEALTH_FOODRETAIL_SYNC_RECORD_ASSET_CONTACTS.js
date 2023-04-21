{
  "EnvHealth/Food Retail/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Copy contacts from Permit record to Asset",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Renewal"
          ],
          "status": [
            "Renewed"
          ],
          "recordType": "EnvHealth/*/*/Permit"
        },
        "action": {
          "usageType": "copyToAsset"
        },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/Food Retail/*/Permit": {
    "ContactLookUpAfter": [
      {
        "metadata": {
          "description": "Sync asset contacts with record",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "usageType": "copyToAsset"
        }
      }
    ],
    "ContactAddAfter": [
      {
        "metadata": {
          "description": "Sync asset contacts with record",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "usageType": "copyToAsset"
        }
      }
    ],
    "ContactRemoveBefore": [
      {
        "metadata": {
          "description": "Sync asset contacts with record",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "usageType": "copyToAsset"
        }
      }
    ],
    "ContactEditAfter": [
      {
        "metadata": {
          "description": "Sync asset contacts with record",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "usageType": "copyToAsset"
        }
      }
    ]
  }
}