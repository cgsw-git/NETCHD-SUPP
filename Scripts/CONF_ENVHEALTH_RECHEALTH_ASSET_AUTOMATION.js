{
  "EnvHealth/Rec Health/Pool/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Pool Asset",
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
            "Site Plan",
            "Building Plan"
          ],
          "copyAppNameToAssetName": true
        },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/Rec Health/Spa/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Spa Asset",
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