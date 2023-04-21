{
  "EnvHealth/Personal Services/*/Application": {
    "InspectionResultSubmitAfter": [
      {
        "preScript": "",
        "metadata": {
          "description": "",
          "operators": ""
        },
        "criteria": {
          "inspectionTypePerformed": [
            "Pre-Operational",
            "Follow-up Inspection"
          ],
          "inspectionResult": [
            "Complete"
          ]
        },
        "action": {
          "newAppStatus": "Inspection Passed",
          "taskName": "Pre-Operational Inspection",
          "taskStatus": "Passed"
        },
        "postScript": ""
      },
      {
        "preScript": "",
        "metadata": {
          "description": "",
          "operators": ""
        },
        "criteria": {
          "inspectionTypePerformed": [],
          "inspectionResult": [
            "Requires Reinspection"
          ]
        },
        "action": {
        
          "newAppStatus": "Re-Inspection Required",
          "inspectionCopyComment": true,
          "inspectionType": "Follow-up Inspection",
          "rangeType": "Days",
          "range": "180",
          "sameInspector": true ,
          "taskName": "Pre-Operational Inspection",
          "taskStatus":"Re-Inspection Required" 
          
        },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/Personal Services/*/Permit": {
    "InspectionResultSubmitAfter": [
      {
        "preScript": "",
        "metadata": {
          "description": "",
          "operators": ""
        },
        "criteria": {
          "inspectionTypePerformed": [
           
          ],
          "inspectionResult": [
            "Complete"
          ]
        },
        "action": {
          "newAppStatus": "Inspection Passed"
        },
        "postScript": ""
      },
      {
        "preScript": "",
        "metadata": {
          "description": "",
          "operators": ""
        },
        "criteria": {
          "inspectionTypePerformed": [],
          "inspectionResult": [
            "Requires Reinspection"
          ]
        },
        "action": {
          "newAppStatus": "Re-Inspection Required",
          "inspectionCopyComment": true,
          "inspectionType": "Follow-up Inspection",
          "rangeType": "Days",
          "range": "180",
          "sameInspector": true
        },
        "postScript": ""
      }
    ],
    "WorkflowTaskUpdateAfter": [
      {
        "preScript": "",
        "metadata": {
          "description": "",
          "operators": ""
        },
        "criteria": {
          "taskName": [
            "Permit Status"
          ],
          "taskStatus": [
            "Inactive"
          ]
        },
        "action": {
          "cancelAllInspections": true
        },
        "postScript": ""
      }
    ]
  }
}