{
"EnvHealth/Institutions/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Updates parent EnvHealth Institutions record",
          "operators": {}
        },
        "criteria": {
		 "recordLevel": "parent",
          "recordType": [
            "EnvHealth/Institutions/*/Permit"
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