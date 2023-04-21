{
    "EnvHealth/Institutions/Adult Day Care/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Adult Day Care Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    },
    "EnvHealth/Institutions/Child Day Care/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Child Day Care Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL",
            "Property Manager"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    },
    "EnvHealth/Institutions/Correctional Facility/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Correctional Facility Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL",
            "Property Manager"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan",
            "Building Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    },
    "EnvHealth/Institutions/Educational Building/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Educational Building Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL",
            "Property Manager"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan",
            "Building Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    },
    "EnvHealth/Institutions/Nursing Home/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Nursing Home Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL",
            "Property Manager"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan",
            "Building Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    },
    "EnvHealth/Institutions/Residential Care/Application": {
        "WorkflowTaskUpdateAfter": [
            {
                "metadata": {
                    "description": "Create Residential Care Asset",
                    "operators": {}
                },
                "preScript": "",
                "criteria": {
                    "task": [
            "Permit Issuance"
          ],
                    "status": [
            "Issued"
          ]
                },
                "action": {
                    "copyContacts": [
            "ALL",
            "Property Manager"
          ],
                    "updateExistingRefAsset": true,
                    "assetType": "Building",
                    "assetGroup": "Facilities",
                    "checkExistingAsset": true,
                    "dateOfService": "",
                    "status": "Pending",
                    "copyAddress": [
            "ALL"
          ],
                    "customFieldsDefaultMapping": {},
                    "linkParent": true,
                    "copyDocumentTypes": [
            "Site Plan",
            "Building Plan"
          ],
                    "copyAppNameToAssetName": true
                },
                "postScript": ""
      }
    ]
    }

}
