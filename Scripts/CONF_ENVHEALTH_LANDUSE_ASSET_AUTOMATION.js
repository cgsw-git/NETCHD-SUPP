{
  "EnvHealth/Land Use/*/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create ENVHEALTH LANDUSE Asset",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Permit Issuance" , "Decision Notification"
          ],
          "status": [
            "Issued" , "Modification Request Approved" 
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