{
  "EnvHealth/*/*/Application": {
    "Pageflow": [
      {
        "preScript": "",
        "metadata": {
          "description": "Required Documents - EnvHealth Applications - Site Plan, Compliance Forms",
          "operators": {}
        },
        "criteria": {
          "customFields": {}
        },
        "action": {
         "conditionType" : "EnvHealth Required Documents" , 
          "requiredDocuments": [
            "Site Plans",
            "Compliance Forms"
          ],
          "requirementType": "CONDITION",
          "validationMessage": "Documents are Required"
        },
        "postScript ": ""
      }
    ],
    "ApplicationSubmitAfter": [
      {
        "preScript": " ",
        "metadata": {
          "description": "Update Document Categories",
          "operators": {}
        },
        "criteria": {},
        "action": {
          "requiredDocuments": [],
          "updateDocumentCategories": true
        },
        "postScript ": " "
      }
    ],
    "ConvertToRealCAPAfter": [
      {
        "preScript": " ",
        "metadata": {
          "description": "Update Document Categories",
          "operators": {}
        },
        "criteria": {},
        "action": {
          "requiredDocuments": [],
          "updateDocumentCategories": true
        },
        "postScript ": " "
      }
    ]
  } ,
  "EnvHealth/*/*/Renewal": {
	    "Pageflow": [
	      {
	        "preScript": "",
	        "metadata": {
	          "description": "Required Documents - EnvHealth Applications - Site Plan, Compliance Forms",
	          "operators": {}
	        },
	        "criteria": {
	          "customFields": {}
	        },
	        "action": {
	          "conditionType" : "EnvHealth Required Documents" , 
	          "requiredDocuments": [
	            "Site Plans",
	            "Compliance Forms"
	          ],
	          "requirementType": "CONDITION",
	          "validationMessage": "Documents are Required"
	        },
	        "postScript ": ""
	      }
	    ],
	    "ApplicationSubmitAfter": [
	      {
	        "preScript": " ",
	        "metadata": {
	          "description": "Update Document Categories",
	          "operators": {}
	        },
	        "criteria": {},
	        "action": {
	          "requiredDocuments": [],
	          "updateDocumentCategories": true
	        },
	        "postScript ": " "
	      }
	    ],
	    "ConvertToRealCAPAfter": [
	      {
	        "preScript": " ",
	        "metadata": {
	          "description": "Update Document Categories",
	          "operators": {}
	        },
	        "criteria": {},
	        "action": {
	          "requiredDocuments": [],
	          "updateDocumentCategories": true
	        },
	        "postScript ": " "
	      }
	    ]
	  }
}