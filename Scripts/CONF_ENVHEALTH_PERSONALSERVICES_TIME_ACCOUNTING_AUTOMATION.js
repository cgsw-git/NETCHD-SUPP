{
	"EnvHealth/Personal Services/*/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Status"
          ],
          "status": [
            "Active"
          ]
        },
        "action": {
          "TimeGroup": "Time Accounting Based Fees",
          "TimeType": "Time Acc Based Fees",
          "FeeSchedule": "EH_FOOD",
          "FeeCode": "010",
          "FeePeriod": "FINAL",
          "FeeRateBased": false
        },
        "postScript": ""
      }
    ],
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Status"
          ],
          "status": [
            "Active"
          ]
        },
        "action": {
        	"DefaultHours": 1.5,
            "Required": "TRUE"
        },
        "postScript": ""
      }
    ],
    "InspectionResultModifyAfter": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "inspectionResult": [
         
          ]
        },
        "action": {
        	
            "FeeSchedule": "EH_FOOD",
            "FeeCode": "020",
            "FeePeriod": "FINAL",
            "FeeRateBased": false
        },
        "postScript": ""
      }
    ],
    "InspectionResultSubmitAfter": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "inspectionResult": [
           
          ]
        },
        "action": {
        	
            "FeeSchedule": "EH_FOOD",
            "FeeCode": "020",
            "FeePeriod": "FINAL",
            "FeeRateBased": false
        },
        "postScript": ""
      }
    ]
  }
}