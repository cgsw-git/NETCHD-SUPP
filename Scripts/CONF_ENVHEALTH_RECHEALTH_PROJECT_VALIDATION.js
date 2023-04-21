{
  "EnvHealth/Rec Health/Pool/Permit": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Validation data on child record."
        },
        "preScript": "",
        "criteria": {
          "recordLevel": "child",
          "recordType": [
            "EnvHealth/Rec Health/Pool/Application",
            "EnvHealth/Rec Health/Spa/Application"
          ],
          "wfTask": [
            "Permit Status"
          ],
          "wfStatus": [
            "Active"
          ],
          "recordCustomFields": {
            "Number of Employees": "12" ,
            "Non Profit" : true 
          } ,
          "recordAddress": {
        	  "Street #" : 456 , 
        	  "Dir": "W",
        	  "Street Name" : "Street Name  1"  ,
        	  "Street Type" : "Ave" ,
        	  "Suffix" : "W",
        	  "Unit Type": "Unit",
        	  "Unit #" : "123u" ,
        	  "Primary" : true ,  
              "Zip": "12345",
              "State" : "Jordan" ,
              "City" : "Amman" 
            },
            "recordParcel":
            	{
            	"Parcel #": "number", 
            	"Block": "block1", 
            	"Lot": "lot1", 
            	"Primary": true, 
            	"Township": "Township1", 
            	"Section": 22, 
            	"Range": "Range1", 
            	"Subdivision": "Subdivision1", 
            	"Legal Description": "Legal Description1"
            	},
            "recordLPfields": {
                "License Type": "Architect" ,
                "License #" : "12" ,
                "Primary" : true ,
                "First Name" : "fn" ,
                "Middle Name" : "mn" ,
                "Last Name" : "ln" ,
                "Phone 1" : "123" ,
                "Phone 2" : "456" ,
                "Business Name" : "Business Name 1" ,
                "Fax" : "789" ,
                "Address Line 1" : "address line 1.1" ,
                "Address Line 2" : "address line 2.1" ,
                "City" : "city" ,
                "State" : "AR" ,
                "ZIP Code" : "00962" ,
                "Country/Region" : "Jordan" ,
                "E-mail" : "a@y.com" ,
                "Business License #" : "license num" 
              }
        },
        "action": {
          "recordCustomFieldsMessage": "Change value fields 'Number of Employees & Non Profit' for record IDs :",
          "CLMessage": "please check these fields: ",
          "recordAddressMessage": "please check address fields Primary, Zip, State, City, Street for Record IDs :  ",
          "recordParcelMessage": "please check parcel fields Parcel #,Block ,Lot,Primary,Township,Section,Range,Subdivision Legal Description for Record IDs : ",
          "recordLPfieldsMessage": "Please change LP fields values License Type , License # , ...  for Record IDs: ",
          "LPMessage": "please check these fields: ",
          "NumOfLPMessage": "please check these fields: ",
          "ContactMessage": "please check these fields: ",
          "NumOfContactMessage": "please check these fields: ",
          "balanceMessage": "please check these fields: ",
          "InspectionMessage": "please check these fields: ",
          "wfMessage": "please check these fields: "
        },
        "postScript": ""
      }
    ]
  },
  "EnvHealth/Rec Health/Spa/Application": {
    "WorkflowTaskUpdateBefore": [
      {
        "metadata": {
          "description": "Validation data on parent record ."
        },
        "preScript": "",
        "criteria": {
          "recordLevel": "parent",
          "recordType": [
            "EnvHealth/Rec Health/Pool/Permit"
          ],
          "wfTask": [
            "Application Intake"
          ],
          "wfStatus": [
            "Accepted"
          ],
          "recordCustomFields": {
              "Number of Employees": "12" ,
              "Non Profit" : true 
            }
        },
        "action": {
          "recordCustomFieldsMessage": "Change value fields 'Number of Employees & Non Profit' for record IDs :",
          "CLMessage": "please check these fields: ",
          "recordAddressMessage": "please check these fields: ",
          "recordParcelMessage": "please check parcel fields Parcel #,Block ,Lot,Primary,Township,Section,Range,Subdivision Legal Description for Record IDs : ",
          "recordLPfieldsMessage": "Please change LP fields values License Type , License # , ...  for Record IDs: ",
          "NumOfLPMessage": "please check these fields: ",
          "ContactMessage": "please check these fields: ",
          "NumOfContactMessage": "please check these fields: ",
          "balanceMessage": "please check these fields: ",
          "InspectionMessage": "please check these fields: ",
          "wfMessage": "please check these fields: "
        },
        "postScript": ""
      }
    ]
  }
}