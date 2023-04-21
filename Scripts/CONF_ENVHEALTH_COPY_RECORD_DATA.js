
{
  "EnvHealth/Amendment/*/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Copy data from Amendment record to Permit",
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
          "usageType": "copyToParent",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
           
          ],
          "ADDRESS": [],
          "Renewal": false,
          "keepExistingAPO": false,
          "RECORDDETAILS": true,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ],    
    "Pageflow": [
      {
        "metadata": {
          "description": "Copy data from Permit to Amendment in Pageflow",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "recordType": "EnvHealth/*/*/Permit"
        },
        "action": {
          "usageType": "copyFromParent",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
           
          ],
          "ADDRESS": [],
          "Renewal": false,
          "keepExistingAPO": true,
          "RECORDDETAILS": true,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/*/*/Renewal": {
	    "ApplicationSubmitAfter": [
	      {
	        "metadata": {
	          "description": "Copy data from License to Renewal",
	          "operators": {}
	        },
	        "preScript": "PRE_SCRIPT_VALIDATE_ENVHEALTH_COPY_DATA",
	        "criteria": {
	          "recordType": "EnvHealth/*/*/Permit"
	        },
	        "action": {
	          "usageType": "copyFromParent",
	          "CONTACTS": [
	            "ALL"
	          ],
	          "ASI": [
	            "ALL"
	          ],
	          "ASIT": [
	            "ALL"
	          ],
	          "CONDITIONS": [
	            
	          ],
	          "ASSETS": [
	                     "ALL"
	                   ],
	          "ADDRESS": [],
	          "Renewal": true,
	          "keepExistingAPO": false,
	          "RECORDDETAILS": true,
	          "RECORDNAME": false,
	          "PARCEL": false,
	          "OWNER": false,
	          "ADDITIONALINFO": false,
	          "EDUCATION": false,
	          "CONTEDUCATION": false,
	          "EXAM": false,
	          "DOCUMENT": false
	        },
	        "postScript": ""
	      }
	    
	    ]
	  }
}