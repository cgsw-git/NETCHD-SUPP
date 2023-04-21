{
  "EnvHealth/Land Use/*/Application": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Rule for all EnvHealth Land Use issuance",
          "operator": ""
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Issuance" ,
            "Decision Notification"
          ],
          "status": [
            "Issued" ,
            "Modification Request Approved"
          ],
          "allowBalance": false
        },
        "action": {
          "validationMessage": "This action cannot be taken until all outstanding fees are paid in full."
        },
        "postScript": ""
      }
      ,
      {
          "metadata": {
            "description": "Rule for all EnvHealth issuance",
            "operator": ""
          },
          "preScript": "",
          "criteria": {
            "task": [
				"Permit Issuance" ,
				"Decision Notification"
            ],
            "status": [
               "Issued" ,
               "Modification Request Approved"
            ],
            "requiredContact": [
              "Facility Owner"
            ]
          },
          "action": {
            "validationMessage": "This action cannot be taken until adding contact Facility Owner."
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
					"Permit Issuance" ,
					"Decision Notification"
              ],
              "status": [
                         "Issued" ,
                         "Modification Request Approved"
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
  }
}