{
"EnvHealth/Personal Services/*/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Updates parent EnvHealth Personal Services record",
          "operators": {}
        },
        "criteria": {
		"recordLevel": "parent",
          "recordType": [
            "EnvHealth/Personal Services/*/Permit"
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