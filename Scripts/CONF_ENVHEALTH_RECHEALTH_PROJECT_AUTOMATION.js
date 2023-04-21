{
"EnvHealth/Rec Health/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Updates parent EnvHealth Rec Health record",
          "operators": {}
        },
        "criteria": {
		"recordLevel": "parent",
          "recordType": [
            "EnvHealth/Rec Health/*/Permit"
          ],
          "task": [
            "Permit Renewal" 
          ],
          "status": [
            "Renewed"  
          ]
        },
        "preScript": "",
        "action": {
          "customFieldToUpdate": [
				{
				"customFieldName": "Next Notification",  
				"newValue":""
				},
				{
				"customFieldName": "Next Notification Date",  
				"newValue":""
				} 
				]
        },
        "postScript": ""
      }
    ]
  }
}