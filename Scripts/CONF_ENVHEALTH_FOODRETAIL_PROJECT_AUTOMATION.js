{
  "EnvHealth/Food Retail/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Updates parent EnvHealth Food Retail record",
          "operators": {}
        },
        "criteria": {
		  "recordLevel": "parent",
          "recordType": [
            "EnvHealth/Food Retail/*/Permit"
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