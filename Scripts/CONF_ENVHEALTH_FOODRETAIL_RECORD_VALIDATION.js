{
  "EnvHealth/Food Retail/*/Application": {
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
      
    ]
  },
  "EnvHealth/Food Retail/*/Renewal": {
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