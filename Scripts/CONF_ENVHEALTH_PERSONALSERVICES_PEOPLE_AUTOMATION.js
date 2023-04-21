{
  "EnvHealth/Personal Services/*/*": {
    "ApplicationSubmitAfter": [
      {
        "metadata": {
          "description": "To automate creation and updating of reference contacts for Individuals on ASA for back office users",
          "operators": {}
        },
        "criteria": {
        	"publicUser": false
        },
        "preScript": "",
        "action": {
          "contactTypes": [
           "Accounts Receivable",
		   "Affiliate Individual",
		   "Applicant",
		   "Authorized Agent",
		   "Business Owner",
		   "Complainant",
		   "Developer",
		   "Employee",
		   "Facility Owner",
		   "Independent Contractor",
		   "Letter Recipient",
		   "Manager",
		   "Property Owner",
		   "Qualifying Individual",
		   "Requester",
		   "Respondent",
		   "Surveyor",
		   "Volunteer"
          ],
          "createReferenceContacts": true,
          "updateReferenceContacts": true,
          "compareFunction": "comparePeopleMatchCriteria",
          "referenceContactType" : "Individual"
        },
        "postScript": ""
      },
      {
          "metadata": {
            "description": "To automate creation and updating of reference contacts for Organizations on ASA for back office users",
            "operators": {}
          },
          "criteria": {
        	  "publicUser": false
          },
          "preScript": "",
          "action": {
            "contactTypes": [
              "Business Entity",
              "Affiliate Business"
            ],
            "createReferenceContacts": true,
            "updateReferenceContacts": true,
            "compareFunction": "comparePeopleMatchCriteria",
            "referenceContactType" : "Organization"
          },
          "postScript": ""
        }
    ],
    "ConvertToRealCAPAfter": [
      {
        "metadata": {
          "description": "To automate creation and updating of Individual reference contacts on CTRCA for Public Users",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "contactTypes": [
            "Accounts Receivable",
		   "Affiliate Individual",
		   "Applicant",
		   "Authorized Agent",
		   "Business Owner",
		   "Complainant",
		   "Developer",
		   "Employee",
		   "Facility Owner",
		   "Independent Contractor",
		   "Letter Recipient",
		   "Manager",
		   "Property Owner",
		   "Qualifying Individual",
		   "Requester",
		   "Respondent",
		   "Surveyor",
		   "Volunteer"
          ],
          "createReferenceContacts": true,
          "updateReferenceContacts": true,
          "compareFunction": "comparePeopleMatchCriteria",
          "referenceContactType": "Individual",
          "createPublicUser": true
          },
        "postScript": ""
      },
      {
        "metadata": {
          "description": "To automate creation and updating of reference contacts for Organizations on CTRCA for Public Users",
          "operators": {}
        },
        "criteria": {},
        "preScript": "",
        "action": {
          "contactTypes": [
            "Business Entity",
            "Affiliate Business"
          ],
          "createReferenceContacts": true,
          "updateReferenceContacts": true,
          "compareFunction": "comparePeopleMatchCriteria",
          "referenceContactType": "Organization",
          "createPublicUser": true
        },
        "postScript": ""
      }
    ]
  }
}