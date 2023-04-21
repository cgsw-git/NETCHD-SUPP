{
  "EnvHealth/Rec Health/*/Application": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Rule for all EnvHealth issuance",
          "operator": ""
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Issuance"
          ],
          "status": [
            "Issued"
          ],
          "allowBalance": false
        },
        "action": {
          "validationMessage": "This action cannot be taken until all outstanding fees are paid in full."
        },
        "postScript": ""
      },
      {
          "metadata": {
            "description": "Rule for all EnvHealth issuance",
            "operator": ""
          },
          "preScript": "",
          "criteria": {
            "task": [
              "Permit Issuance"
            ],
            "status": [
              "Issued"
            ],
            "requiredContact": [
              "Facility Owner"
            ]
          },
          "action": {
            "validationMessage": "This action cannot be taken until adding contact Facility Owner."
          },
          "postScript": ""
        } ,
		{
          "metadata": {
            "description": "Rule for all EnvHealth issuance",
            "operator": ""
          },
          "preScript": "",
          "criteria": {
            "task": [
              "Permit Issuance"
            ],
            "status": [
              "Issued"
            ],
            "requiredContact": [
              "Accounts Receivable"
            ]
          },
          "action": {
            "validationMessage": "This action cannot be taken until adding contact Accounts Receivable."
          },
          "postScript": ""
        }
    ]
  },
  "EnvHealth/Rec Health/*/Renewal": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Rule for all EnvHealth renewal",
          "operator": ""
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Renewal"
          ],
          "status": [
            "Renewed"
          ],
          "allowBalance": false
        },
        "action": {
          "validationMessage": "This action cannot be taken until all outstanding fees are paid in full."
        },
        "postScript": ""
      } 
    ]
  }
}