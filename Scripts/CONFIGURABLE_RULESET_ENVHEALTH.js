{
 "WorkflowTaskUpdateAfter": { 
    "StandardScripts": [
      "STDBASE_LICENSE_ISSUANCE",         
      "STDBASE_SEND_CONTACT_EMAILS"  ,
      "STDBASE_UPDATE_FIELDS" ,      
      "STDBASE_COPY_RECORD_DATA",
      "STDBASE_SYNC_RECORD_ASSET_CONTACTS",
      "STDBASE_ASSET_AUTOMATION",
      "STDBASE_TIME_ACCOUNTING_AUTOMATION",
      "STDBASE_INSPECTION_AUTOMATION"      
   
    ]
  },
 "ConvertToRealCAPAfter": { 
    "StandardScripts": [
     "STDBASE_PROGRAM_ELEMENT_AUTOMATION",
      "STDBASE_SEND_CONTACT_EMAILS",
      "STDBASE_PEOPLE_AUTOMATION"
    
    ]
  },
  "InvoiceFeeAfter": {  
    "StandardScripts": [ 
      "STDBASE_SEND_CONTACT_EMAILS"  
    ]
  },
  "WorkflowTaskUpdateBefore": {  
    "StandardScripts": [
      "STDBASE_RECORD_VALIDATION" 
    ]
  },
  "ApplicationSubmitAfter": {  
    "StandardScripts": [
      "STDBASE_PROGRAM_ELEMENT_AUTOMATION",
	  "STDBASE_PEOPLE_AUTOMATION",
      "STDBASE_RECORD_ADDRESS_AUTOMATION",
	  "STDBASE_COPY_RECORD_DATA",
	  "STDBASE_CONDITION_DOCUMENTS",
	  
	  
    ]
  },
  "InspectionResultModifyAfter": {
	  "StandardScripts": [
	     "STDBASE_TIME_ACCOUNTING_AUTOMATION",
	     "STDBASE_INSPECTION_AUTOMATION",
	     "STDBASE_SEND_CONTACT_EMAILS"
	]
  }
  ,
  "InspectionResultSubmitAfter": {
	  "StandardScripts": [
	     "STDBASE_TIME_ACCOUNTING_AUTOMATION" ,
	     "STDBASE_INSPECTION_AUTOMATION",
	     "STDBASE_SEND_CONTACT_EMAILS"
	]
  }  
  ,
  "ContactLookUpAfter": {
	  "StandardScripts": [
	     "STDBASE_SYNC_RECORD_ASSET_CONTACTS"	  
	]
  }
  ,
  "ContactAddAfter": {
	  "StandardScripts": [
	     "STDBASE_SYNC_RECORD_ASSET_CONTACTS"	  
	]
  }
  ,
  "ContactRemoveBefore": {
	  "StandardScripts": [
	     "STDBASE_SYNC_RECORD_ASSET_CONTACTS"	  
	]
  }
  ,
  "ContactEditAfter": {
	  "StandardScripts": [
	     "STDBASE_SYNC_RECORD_ASSET_CONTACTS"	  
	]
  }  
}