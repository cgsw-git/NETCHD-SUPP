{
  "EnvHealth/Personal Services/*/*": {
    "ApplicationSubmitAfter": [
      {
        "metadata": {
          "description": "Add the Parcel and Owner from the Address",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "copyGISData": [],
          "getGISInspectionDistricts": [],
          "recordTypeCreate": [],
          "updateReferenceAddress": false,
          "addParcelAndOwnerFromAddress": true,
          "copyConditions": false,
          "updateContactData": false,
          "contactType": ""
        },
        "postScript": ""
      }
    ]
  }
}