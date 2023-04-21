{
  "EnvHealth/*/*/Permit": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Update custom field Valid To Date upon permit issuance",
          "operators": {}
        },
        "criteria": {
		"customFields": {
            "No Expiration": "UNCHECKED"
          },
          "task": [
            "Permit Status" 
          ],
          "status": [
            "Active"  
          ]
        },
        "preScript": "",
       "action": {
          "daysOut": "180",
         "customFieldToUpdate" : "Valid To"
          },
        "postScript": ""
      } ,
	   {
        "metadata": {
          "description": "Update custom field Valid Valid From upon permit issuance",
          "operators": {}
        },
        "criteria": {
          "task": [
            "Permit Status" 
          ],
          "status": [
            "Active"  
          ]
        },
        "preScript": "",
       "action": {
          "daysOut": "0",
         "customFieldToUpdate" : "Valid From"
          },
        "postScript": ""
      } ,
	  {
        "metadata": {
          "description": "Update custom field Valid To to be empty and not editable, if the custom field 'No Expiration' is checked.",
          "operators": {}
        },
        "criteria": {
		"customFields": {
            "No Expiration": "CHECKED"
          },
          "task": [
            "Permit Status" 
          ],
          "status": [
            "Active"  
          ]
        },
        "preScript": "",
       "action": {
          "daysOut": "",
         "customFieldToUpdate" : "Valid To",
		 "valueSource": " ",
          "sourceName": ""
          },
        "postScript": ""
      }
	  
    ]
  }
}