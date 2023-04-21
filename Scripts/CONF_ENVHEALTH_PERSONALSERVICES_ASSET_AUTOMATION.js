{
  "EnvHealth/Personal Services/Artificial Tanning/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Artificial Tanning Asset",
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
            "Facility ALL"
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
  "EnvHealth/Personal Services/Body Art/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Body Art Asset",
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
            "Facility ALL",
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
  "EnvHealth/Personal Services/Body Piercing/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Body Piercing Asset",
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
            "Facility ALL",
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
  "EnvHealth/Personal Services/Massage Parlor/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Massage Parlor Asset",
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
            "Facility ALL",
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