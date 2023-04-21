{  
  "EnvHealth/Amendment/*/*": {
	    "WorkflowTaskUpdateAfter": [
	      {
	        "metadata": {
	          "description": "Copy contacts from Permit record to Asset",
	          "operators": {}
	        },
	        "preScript": "",
	        "criteria": {
	          "task": [
	             "Modification Review"
	          ],
	          "status": [ 
	             "Modification Request Approved"
	          ],
	          "recordType": "EnvHealth/*/*/Permit"
	        },
	        "action": {
	          "usageType": "copyToAsset"	          	          
	        },
	        "postScript": ""
	      }
	    ]	    
	  }
}