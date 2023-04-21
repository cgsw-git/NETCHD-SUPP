{
  "EnvHealth/Land Use/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Copy data from Renewal record to Permit",
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
          "recordType": "EnvHealth/Land Use/*/Permit"
        },
        "action": {
          "usageType": "copyToParent",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
          
          ],
          "ASSETS": [
            "ALL"
           ],
          "ADDRESS": [  "ALL"],
          "Renewal": false,
          "keepExistingAPO": false,
          "RECORDDETAILS": true,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ],
    "ApplicationSubmitAfter": [
      {
        "metadata": {
          "description": "Copy data from License to Renewal",
          "operators": {}
        },
        "preScript": "PRE_SCRIPT_VALIDATE_ENVHEALTH_COPY_DATA",
        "criteria": {
          "recordType": "EnvHealth/Land Use/*/Permit"
        },
        "action": {
          "usageType": "copyFromParent",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
            
          ],
          "ASSETS": [
            "ALL"
          ],
          "ADDRESS": ["ALL"],
          "Renewal": true,
          "keepExistingAPO": false,
          "RECORDDETAILS": true,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ],
    "Pageflow": [
      {
        "metadata": {
          "description": "Copy data from License to Renewal in Pageflow",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "recordType": "EnvHealth/Land Use/*/Permit"
        },
        "action": {
          "usageType": "copyFromParent",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
            
          ],
          "ASSETS": [
            "ALL"
          ],
          "ADDRESS": ["ALL"],
          "Renewal": true,
          "keepExistingAPO": true,
          "RECORDDETAILS": true,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ]
  }
}