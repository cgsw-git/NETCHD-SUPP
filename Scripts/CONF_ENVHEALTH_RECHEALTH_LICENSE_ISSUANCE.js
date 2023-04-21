{
    "EnvHealth/Rec Health/*/Application": {
      "WorkflowTaskUpdateAfter": [
        {
          "metadata": {
            "description": "Issues a Rec Health License",
            "operators": {}
          },
          "preScript": "",
          "criteria": {
            "task": [
              "Permit Issuance",
              "Pre-Opening Inspection"
            ],
            "status": [
              "Issued"
            ]
          },
          "action": {
            "parentLicense": "EnvHealth/Rec Health/*/Permit",
            "issuedStatus": "Active",
            "copyCustomFields": [
              "ALL"
            ],
            "copyCustomTables": [
              "ALL"
            ],
            "expirationType": "Expiration Code",
            "expirationPeriod": "EH_GENERAL",
            "copyContacts": [
              "ALL"
            ],
            "createLP": false,
            "licenseTable": "",
            "refLPType": "Business",
            "contactType": "Applicant",
            "contactAddressType": "Mailing"
          },
          "postScript": ""
        }
      ]
    }
  }