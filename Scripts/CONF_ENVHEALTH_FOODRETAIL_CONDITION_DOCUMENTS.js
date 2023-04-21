{
    "EnvHealth/Food Retail/*/Application": {
        "Pageflow": [
            {
                "preScript": "",
                "metadata": {
                    "description": "Required Documents - EnvHealth Retail Food Applications - Floor Plans,Food Handlers Certification,Food Safety Plan",
                    "operators": {}
                },
                "criteria": {
                    "customFields": {}
                },
                "action": {
                	"conditionType" : "EnvHealth Required Documents" , 
                    "requiredDocuments": [
                                "Floor Plans",
                                "Food Handlers Certification",
                                "Food Safety Plan",
                                 "Equipment Schematic Diagrams"
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
    },
    "EnvHealth/Food Retail/*/Renewal": {
        "Pageflow": [
            {
                "preScript": "",
                "metadata": {
                    "description": "Required Documents - EnvHealth Retail Food Applications - Floor Plans,Food Handlers Certification,Food Safety Plan",
                    "operators": {}
                },
                "criteria": {
                    "customFields": {}
                },
                "action": {
		          "conditionType" : "EnvHealth Required Documents" , 
		          "requiredDocuments": [
				            "Floor Plans",
				            "Food Handlers Certification",
				            "Food Safety Plan"
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