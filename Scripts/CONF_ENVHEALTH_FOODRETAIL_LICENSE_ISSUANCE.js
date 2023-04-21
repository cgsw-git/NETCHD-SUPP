{
    "EnvHealth/Food Retail/*/Application": {
      "WorkflowTaskUpdateAfter": [
        {
          "metadata": {
            "description": "Issues a Food Retail Permit.",
            "operators": {}
          },
          "preScript": "",
          "criteria": {
            "task": [
                "Permit Issuance" ,
                "Decision Notification",
                "Final Inspection",
                "Pre-Opening Inspection"
            ],
            "status": [
                "Issued" ,
                "Modification Request Approved",
                "Permit Issued"
            ]
          },
          "action": {
            "parentLicense": "EnvHealth/Food Retail/*/Permit",
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
            "refLPType": "Food Facility",
            "contactType": "Applicant",
            "contactAddressType": "Mailing",
            "copyRecordName": true ,
            "copyRecordDetails": true
          },
          "postScript": "PERMIT_ISSUANCE"
        }
      ]
    }
    
  }