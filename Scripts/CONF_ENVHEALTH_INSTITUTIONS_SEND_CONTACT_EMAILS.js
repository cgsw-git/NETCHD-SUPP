{
  "EnvHealth/Institutions/*/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Send notification when additional info is required",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [],
          "status": [
            "Additional Info Required"
          ]
        },
        "action": {
          "notificationTemplate": "SS_ADDITIONAL_INFO_REQD",
          "notificationReport": [],
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": false,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      },
      {
        "metadata": {
          "description": "Send notification when permit is issued, with permit form attached",
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
          "notificationTemplate": "SS_PERMIT_ISSUED_REPORT",
          "notificationReport": [
            "EnvHealth Agency License Report"
          ],
          "reportParamContactType": "Applicant",
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": true,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      },
      {
        "metadata": {
          "description": "Send notification when application is denied ",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [],
          "status": [
            "Denied"
          ]
        },
        "action": {
          "notificationTemplate": "SS_APP_DENIED",
          "notificationReport": [],
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": false,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      },
      {
        "metadata": {
          "description": "Send notification when application is withdrawn",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [],
          "status": [
            "Withdrawn"
          ]
        },
        "action": {
          "notificationTemplate": "SS_APP_WITHDRAWAL",
          "notificationReport": [],
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": false,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      },
      {
        "metadata": {
          "description": "Send notification when license is renewed, with license form attached",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Renewal"
          ],
          "status": [
            "Renewed"
          ]
        },
        "action": {
          "notificationTemplate": "SS_PERMIT_ISSUED_REPORT",
          "notificationReport": [
            "EnvHealth Agency License Report"
          ],
          "reportParamContactType": "Applicant",
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": true,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      }
    ],
    "ConvertToRealCAPAfter": [
      {
        "metadata": {
          "description": "Send notification when application has been received",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [],
          "status": []
        },
        "action": {
          "notificationTemplate": "SS_APP_SUBMITTAL",
          "notificationReport": [],
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": false,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      }
    ],
    "InvoiceFeeAfter": [
      {
        "metadata": {
          "description": "Send notification when Fees are invoiced",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [],
          "status": []
        },
        "action": {
            "notificationTemplate": "SS_PAYMENT_DUE",
            "notificationReport": [
              "EnvHealth Invoice Report"
            ],
            "reportParamContactType": "Applicant",
            "notifyContactTypes": [
              "Applicant"
            ],          
            "additionalEmailsTo": "",
            "url4ACA": "",
            "createFromParent": false,
            "reportingInfoStandards": ""
          },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/Institutions/*/Permit": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Send notification for license status changes",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Status"
          ],
          "status": []
        },
        "action": {
          "notificationTemplate": "SS_PERMIT_STATUS",
          "notificationReport": [],
          "notifyContactTypes": [
            "Applicant"
          ],
          "additionalEmailsTo": "",
          "url4ACA": "",
          "createFromParent": false,
          "reportingInfoStandards": ""
        },
        "postScript": ""
      }
    ]
  }
}