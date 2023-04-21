{
  "EnvHealth/Institutions/*/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "permit record update",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Issuance"
          ],
          "status": [
            "Issued"
          ]
        },
        "action": {
          "parentLicense": "EnvHealth/Institutions/*/Permit",
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