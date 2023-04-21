{
  "EnvHealth/Food Retail/*/Permit": {
    "WorkflowTaskUpdateAfter": [
      
	  {
        "metadata": {
          "description": "Update Expiration Status",
          "operators": {}
        },
        "criteria": {
		"customFields": {
           
          },
          "task": [
           "Permit Status"
          ],
          "status": [
           "Inactive"
          ]
        },
        "preScript": "",
       "action": {
              "updateExpirationStatus": "Inactive"
          },
        "postScript": ""
      }
	  
    ]
  }
}