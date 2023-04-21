{
"EnvHealth/Professional/Backflow Device Tester/Renewal": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Updates parent Backflow Device Tester Certification record",
          "operators": {}
        },
        "criteria": {
		"recordLevel": "parent",
          "recordType": [
            "EnvHealth/Professional/Backflow Device Tester/Certification"
          ],
          "task": [
            "License Issuance" 
          ],
          "status": [
            "Issued"  
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