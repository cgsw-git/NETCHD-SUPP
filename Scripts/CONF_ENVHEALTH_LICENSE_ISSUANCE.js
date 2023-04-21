{
"EnvHealth/*/*/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Issues a ENVHELATH application permit",
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
          "parentLicense": "EnvHealth/*/*/Permit",
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
  
  },
  "EnvHealth/Food/Cottage/Registration": {
	    "WorkflowTaskUpdateAfter": [
	                                {
	                                  "metadata": {
	                                    "description": "Issues a Cottage Food registration.",
	                                    "operators": {}
	                                  },
	                                  "preScript": "",
	                                  "criteria": {
	                                    "task": [
	                                      "Registration Issuance"
	                                    ],
	                                    "status": [
	                                      "Issued"
	                                    ]
	                                  },
	                                  "action": {
	                                    "parentLicense": "EnvHealth/Food/Cottage/Registered",
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