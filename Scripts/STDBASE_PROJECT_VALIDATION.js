/*------------------------------------------------------------------------------------------------------/
| Program		: STDBASE_PROJECT_VALIDATION.js
| Event			: 
|
| Usage			: 
| Notes			: auto generated Record Script by Accela Eclipse Plugin 
| Created by	: AOTAIBI
| Created at	: 09/10/2019 08:48:30
|
/------------------------------------------------------------------------------------------------------*/
/*
Description : JSON Example :

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
          "recordCustomFields": 
					 {
        	     "Number of Employees": "12" ,
                 "Non Profit" : true   
					  }
                               ,
          "recordCustomLists": [
                          {
                            "tableName": "DAYS AND HOURS OF OPERATIONS",
                            "columnName": "Days",
                            "value": "day1"
                          },
                          {
                              "tableName": "DAYS AND HOURS OF OPERATIONS",
                              "columnName": "Hours",
                              "value": "8"
                            }
                          
                        ],
          "recordAddress": {
        	  "state" : "Jordan",
        	  "primaryFlag" : "Y"
        	  
            },
            "recordParcel":
            	{
            	"ParcelNumber": "number", 
            	"Block": "block1"
            	},
           "requiredContact" : [ "Individual"] ,
           "numberContacts": 4 ,
           "allowBalance": false,
           "relatedrecordStatus" : ["Denied" , "Additional Info Needed "] , 
           "inspectionRequired":["Follow-up Inspection"], 
           "requiredLP" : ["Business"] ,
           "validateLP": true ,
           "numberLP": "3" ,
           "taskRequired" : ["Permit Issuance"] ,
           "recordWorkflowStatus": [ 
                             {"task" :  "Permit Issuance"} , 
                             {"status" :  "Issued" }
                             ]
          
         
        },
        "action": {
         "recordCustomFieldsMessage": "Please check custom fields 'Number of Employees & Non Profit' for record IDs: ",
         "recordCustomListsMessage": "Please check custom lists 'Days & Hours' for record IDs: " ,
         "recordAddressMessage": "Please check 'Primary addres,State' for record IDs: ",
         "recordParcelMessage": "please check parcel fields 'Parcel #,Block' for record IDs : ",
         "requiredContactMessage": "These contacts types 'Individual' are required for record IDs: ",
         "numberContactsMessage": "Number of contacts must be 4 contacts for each record IDs: ",
         "allowBalanceMessage": "All invoiced fees must fully paid for record IDs:" ,
         "relatedRecordStatusMessage" : "The records status should be one of 'Denied, Additional Info Needed' for record IDs:"  ,
         "inspectionRequiredMessage" : "These inspections 'Follow-up Inspection' are required and should be completed for record IDs:", 
         "requiredLPMessage": "These LPs are requird 'Business' for each record IDs: ",
         "validateLPMessage": "These LPs are expired 'Business, Others' for record IDs: ",
         "numberLPMessage": "Number of LPs must be 3 for each of record IDs: ", 
         "taskRequiredMessage": "These tasks must be completed 'Permit Issuance' for record IDs: " ,
         "recordWorkflowStatusMessage": "The workflow Task 'Permit Issuance' and workflow status 'Issued' are required for record IDs: "
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
        	 "recordCustomFieldsMessage": "Please check custom fields 'Number of Employees & Non Profit' for record IDs: ",
             "recordCustomListsMessage": "Please check custom lists 'Days & Hours' for record IDs: " ,
             "recordAddressMessage": "Please check 'Primary addres,State' for record IDs: ",
             "recordParcelMessage": "please check parcel fields 'Parcel #,Block' for record IDs : ",
             "requiredContactMessage": "These contacts types 'Individual' are required for record IDs: ",
             "numberContactsMessage": "Number of contacts must be 4 contacts for each record IDs: ",
             "allowBalanceMessage": "All invoiced fees must fully paid for record IDs:" ,
             "relatedRecordStatusMessage" : "The records status should be one of 'Denied, Additional Info Needed' for record IDs:"  ,
             "inspectionRequiredMessage" : "These inspections 'Follow-up Inspection' are required and should be completed for record IDs:", 
             "requiredLPMessage": "These LPs are requird 'Business' for each record IDs: ",
             "validateLPMessage": "These LPs are expired 'Business, Others' for record IDs: ",
             "numberLPMessage": "Number of LPs must be 3 for each of record IDs: ", 
             "taskRequiredMessage": "these tasks must be completed 'Permit Issuance' for record IDs: " ,
             "recordWorkflowStatusMessage": "The workflow Task 'Permit Issuance' and workflow status 'Issued' are required for record IDs: "

        },
        "postScript": ""
      }
    ]
  }
}
*/
try {

	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
	var scriptSuffix = "PROJECT_VALIDATION";
	var settingsArray = [];
	logDebug("before call isConfigurableScript ") ;
	isConfigurableScript(settingsArray, scriptSuffix);
	logDebug("after call isConfigurableScript " + capId ) ;
	for (s in settingsArray) {
		
		var rules = settingsArray[s];
		var operators = rules.metadata.operators;
		// run preScript
		if (!isEmptyOrNull(rules.preScript)) {
			eval(getScriptText(rules.preScript, null, false));
		}
		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}
		validateProject(rules);
		if (!isEmptyOrNull(rules.postScript)) {
			eval(getScriptText(rules.postScript, null, false));
		}
	}


} catch (ex) {
	logDebug("**ERROR: Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex);
}

function validateProject(rules) {
	var recordType =   rules.criteria.recordType 
	var matchCapRecordList = [];
    var recordLevel = rules.criteria.recordLevel ;
    if (!isEmptyOrNull(recordLevel)) {
    	
    	if(recordLevel == "child") 
    		{
    		getMatchedChildrenCapList(matchCapRecordList , recordType) ;
    		}
    	else if(recordLevel == "parent") 
    		{
    		getMatchedParentCapID(matchCapRecordList , recordType) ;
    		}
    	else { //recordAddressMessage
    		logDebug("There is should set property 'recordLevel' with value child or parent ");
    		return; 
    	}
    	
    }
    else
	{
	logDebug("**ERROR:Please defined property 'recordLevel' on JSON file");
	}
    
	logDebug( "matchCapRecordList length:" + matchCapRecordList.length ); 
    if(matchCapRecordList.length >0) 
    	{
    	 currentCapId = capId ;
    	 validationMessageText = ""; 
  
    		if(rules.criteria.hasOwnProperty("recordCustomFields" )){
    			var recordCustomFields = rules.criteria.recordCustomFields ;
    	    	if (!isEmptyOrNull(recordCustomFields)) {
    	        var recordCustomFieldsMessage =rules.action.recordCustomFieldsMessage ;
    	    	var customFieldsJsonFormat =recordCustomFields ;
    	    	checkASI(matchCapRecordList , customFieldsJsonFormat  ,recordCustomFieldsMessage  ) ;
    	        }
    		}
    		if(rules.criteria.hasOwnProperty("recordCustomLists" )){
        		var recordCustomListsFormat = rules.criteria.recordCustomLists ; 
            	if (!isEmptyOrNull(recordCustomListsFormat)) {
            	var recordCustomListsMessage = rules.action.recordCustomListsMessage ; 
            	checkASIT(matchCapRecordList, recordCustomListsFormat, recordCustomListsMessage) ;
            	}
        	}
    	
    	if(rules.criteria.hasOwnProperty("recordAddress" )){
    		var addressJsonFormat = rules.criteria.recordAddress ; 
        	if (!isEmptyOrNull(addressJsonFormat)) {
        	var recordAddressMessage = rules.action.recordAddressMessage ; 
        		checkAddress(matchCapRecordList, addressJsonFormat, recordAddressMessage) ;
        	}
    	}
    	
    	if(rules.criteria.hasOwnProperty("recordParcel" )){
    		var recordParcelFormat = rules.criteria.recordParcel ; 
        	if (!isEmptyOrNull(recordParcelFormat)) {
        	var recordParcelMessage = rules.action.recordParcelMessage ; 
        	checkParcel(matchCapRecordList, recordParcelFormat, recordParcelMessage) ;
        	}
    	}
    	

    	if(rules.criteria.hasOwnProperty("numberContacts" ))
    		{
    		  var numberContacts = rules.criteria.numberContacts ;
    	       if (!isEmptyOrNull(numberContacts) && parseInt(numberContacts) > 0) {  
    	    	   var numberContactsMessage = rules.action.numberContactsMessage ;
    	    	   checknumberContacts(matchCapRecordList , numberContacts  , numberContactsMessage  )
    	       }
    		}
     
       if (rules.criteria.hasOwnProperty("allowBalance") && !rules.criteria.allowBalance)
    	   {
    	   var allowBalanceMessage = rules.action.allowBalanceMessage ;
    	   checkAllowBalance(matchCapRecordList , allowBalanceMessage) ;
    	   }
      
       if (rules.criteria.hasOwnProperty("relatedrecordStatus"))
    	   {
    	   var recordStatus = rules.criteria.relatedrecordStatus ;
    	   if (!isEmptyOrNull(recordStatus)) {
    		   var recordStatusMessage = rules.action.relatedRecordStatusMessage
    		   checkRecordStatus(matchCapRecordList , recordStatus  , recordStatusMessage  )
    	   }
    	   }
      
       
       if (rules.criteria.hasOwnProperty("requiredLP"))
	   {
    	   var requiredLP = rules.criteria.requiredLP ;
    	   if (!isEmptyOrNull(requiredLP)) {
    		 var requiredLPmessage =  rules.action.requiredLPMessage; 
    		 checkRequiredLP(matchCapRecordList , requiredLP  , requiredLPmessage  )
    	   }
    	  
	   }
       
       if (rules.criteria.hasOwnProperty("numberLP"))
	   {
    	   var numberLP = rules.criteria.numberLP ;
    	   if (!isEmptyOrNull(numberLP)) {
    		   var requiredLP = rules.criteria.requiredLP ;
    		 var numberLPMessage =  rules.action.numberLPMessage; 
    		 checknumberLP(matchCapRecordList , numberLP, requiredLP  , numberLPMessage  )
    	   }
    	  
	   }
       
      
       
       
       if (rules.criteria.hasOwnProperty("validateLP"))
	   {
    	   var  validateLP = rules.criteria.validateLP  
    	   if( !isEmptyOrNull(validateLP) && validateLP   ) 
    		   {
        	   
        		 var validateLPMessage =  rules.action.validateLPMessage; 
        		 checkvalidateLP(matchCapRecordList   , validateLPMessage  );
    	   } 
	   }
        
        
      
       if (rules.criteria.hasOwnProperty("inspectionRequired"))
	   {
    	   var  inspectionRequired = rules.criteria.inspectionRequired  
    	  
    	   if( !isEmptyOrNull(inspectionRequired)  ) 
    		   {
        	   
        		 var inspectionRequiredMessage =  rules.action.inspectionRequiredMessage; 
        		 checkInspectionRequired(matchCapRecordList , inspectionRequired  , inspectionRequiredMessage  ) ;
    	  
    	   }
    	  
	   }
       
       if (rules.criteria.hasOwnProperty("requiredContact"))
	   {
    	   var requiredContact = rules.criteria.requiredContact ;
    	   if (!isEmptyOrNull(requiredContact)) {
    		 var requiredContactMessage =  rules.action.requiredContactMessage; 
    		 checkRequiredContact(matchCapRecordList , requiredContact  , requiredContactMessage  )
    	   }
    	  
	   }
       if (rules.criteria.hasOwnProperty("taskRequired"))
	   {
    	   var taskRequired = rules.criteria.taskRequired ;
    	   if (!isEmptyOrNull(taskRequired)) {
    		 var taskRequiredMessage =  rules.action.taskRequiredMessage; 
    		 checktaskRequired(matchCapRecordList , taskRequired  , taskRequiredMessage  );
    	   }
    	  
	   }

       if (rules.criteria.hasOwnProperty("recordWorkflowStatus"))
	   {
    	   var recordWorkflowStatus = rules.criteria.recordWorkflowStatus ;
    	   if (!isEmptyOrNull(recordWorkflowStatus)) {
    		 var recordWorkflowStatusMessage =  rules.action.recordWorkflowStatusMessage; 
    		 checkrecordWorkflowStatus(matchCapRecordList , recordWorkflowStatus  , recordWorkflowStatusMessage  );
    	   }
    	  
	   }
    	// validationMessageText += "Stop" ;
    		if (!isEmptyOrNull(validationMessageText))
    		{
    			showMessage = true;
    			cancel = true;
    			if (isPublicUser) {
    				aa.env.setValue("ErrorCode", "1");
    				aa.env.setValue("ErrorMessage", validationMessageText);
    			} else {
    				comment(validationMessageText);
    			}
    			
    		} 
	}
    }



function getMatchedChildrenCapList(matchCapRecordList , capFilterType  )
{
	var childCapList = aa.cap.getChildByMasterID(capId).getOutput();
	if (childCapList != null) {	
				for (var i = 0; i < childCapList.length; i++) {
					var childCapID = childCapList[i].getCapID() ;
					var childType = childCapList[i].getCapType() + "";
					var childCap = aa.cap.getCap(childCapID).getOutput();
					var childCapStatus = childCap.getCapStatus();
					childTypeArr = childType.toString().split("/");
					var childGroup = childTypeArr[0] ;
					var childType=childTypeArr[1];
					var childSubtype = childTypeArr[2];
					var childCategory = childTypeArr[3];
					logDebug(":childGroup:" + childGroup+ ":childType:" +childType+ ":childSubtype:" + childSubtype + ":childCategory:" +childCategory);	
					if(capFilterType.length == 0)
						{
						matchCapRecordList.push(childCapID) ;
						}
					else 
						{
						for (var j = 0; j < capFilterType.length; j++) {
							var filterType =capFilterType[j];
							var arrRecordPath = filterType.split("/");
							var filterGroup= arrRecordPath[0] ;
							var filterType = arrRecordPath[1] ;
							var filterSubType = arrRecordPath[2] ;
							var filterCategory = arrRecordPath[3] ;
							var skipCheckgroup = ((filterGroup == "*") ? true : false);skip
							var skipCheckType = ((filterType == "*") ? true : false);
							var skipCheckSubType = ((filterSubType == "*") ? true : false);
							var skipCheckCategory = ((filterCategory == "*") ? true : false);
							logDebug("custom ID:" + childCapID.getCustomID());
							logDebug(":filterGroup:" + filterGroup + ":filterType:" +filterType + ":filterSubType:" +filterSubType +":filterCategory:" +filterCategory );
							logDebug("skipCheckgroup:" +skipCheckgroup + ":skipCheckType:" +skipCheckType + ":skipCheckSubType:" +skipCheckSubType + ":skipCheckSubType:" +skipCheckSubType);
							if( 
									(skipCheckgroup || (filterGroup == childGroup) ) && 
									(skipCheckType || (filterType== childType)) &&
									(skipCheckSubType || (filterSubType == childSubtype)) &&
									(skipCheckCategory || (filterCategory == childCategory))
							  )
								{
								matchCapRecordList.push(childCapID) ;	
								}
						}
						}
						}		
				}
	return matchCapRecordList ; 
}

function getMatchedParentCapID(matchCapRecordList , capFilterType)
{
		var parentCapID = getParentByCapId(capId); 
			if (parentCapID != false) {
				
				var parnetCap = aa.cap.getCap(parentCapID).getOutput();
			    var parentCustomID = parentCapID.getCustomID() ;
				var parentAppTypeResult = parnetCap.getCapType();
				var parentAppTypeString = parentAppTypeResult.toString();
				var parentCapStatus = parnetCap.getCapStatus();
				parentAppTypeArr = parentAppTypeString.toString().split("/");
				var parentGroup = parentAppTypeArr[0] ;
				var parentType=parentAppTypeArr[1];
				var parentSubtype = parentAppTypeArr[2];
				var parentCategory = parentAppTypeArr[3];
				
				if(capFilterType.length == 0)
					{
					matchCapRecordList.push(parentCapID) ;
					}
				else 
					{
					for (var j = 0; j < capFilterType.length; j++) {
						
						var filterType =capFilterType[j];
						var arrRecordPath = filterType.split("/");
						var filterGroup= arrRecordPath[0] ;
						var filterType = arrRecordPath[1] ;
						var filterSubType = arrRecordPath[2] ;
						var filterCategory = arrRecordPath[3] ;
						var skipCheckgroup = ((filterGroup == "*") ? true : false);
						var skipCheckType = ((filterType == "*") ? true : false);
						var skipCheckSubType = ((filterSubType == "*") ? true : false);
						var skipCheckCategory = ((filterCategory == "*") ? true : false);
						if( 
								(skipCheckgroup || (filterGroup == parentGroup) ) && 
								(skipCheckType || (filterType== parentType)) &&
								(skipCheckSubType || (filterSubType == parentSubtype)) &&
								(skipCheckCategory || (filterCategory == parentCategory))
						  )
							{
							matchCapRecordList.push(parentCapID) ;
							}
								
					}
					
					}
						
}
return matchCapRecordList ;			
}

function array_RemoveDuplicateItems(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
}
function getCastValue(val , type)
{
	
if(type == "bool" )
		{
		if( val == "1" ||   val == true  || val == "Y" || val == "y" )
		return true 
	else 
		 return false; 
}else if (val ==  undefined || val == 'undefined' || val == null || val == "null" )
		{
	return "" ;
		}
else return val.toString().trim();
}		


function checkASI(matchCapRecordList , customFieldsJsonFormat  , validMsg  )
{   
	validCustomIDs = [] ;
	ASInameArr= [];
	for( var index in matchCapRecordList)
	{
	capIdRecord = matchCapRecordList[index] ;
	var match = true ;
	for ( var cf in customFieldsJsonFormat) {
		ASIname = cf ; 
		ASInameArr.push(ASIname) ;
		ASIvalue=customFieldsJsonFormat[cf] ; 
		logDebug("ASIname: " +ASIname + " ASIvalue:" +ASIvalue) ;
			var ASIobj = aa.appSpecificInfo.getAppSpecificInfos(capIdRecord, ASIname ).getOutput()[0] ;
			if(ASIobj != undefined) // check custom field exist on record
				{
				value = ASIobj.getChecklistComment() ; 
				    // value equal null in case data field type check box and not checked
					if(value == null )
						{
						value = false ; // value equal null only on ASI field type check box
						}
					 if(value.toString() == "CHECKED" )
						{
						value = true; 
						}
					 
				if(ASIvalue != value)
					{
					match = false ;
					}
				}
			else { match = false ; 
			
			}
			}
	if(match == true)
		{
		validCustomIDs.push(capIdRecord.getCustomID()) ; 
		}

	}
	if( validCustomIDs.length > 0) 	
		{
		if ( !isEmptyOrNull(validMsg))
			{ 
				validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
			}
		
		else 
			{ 
			var ASIfields_WithoutDuplicate = array_RemoveDuplicateItems(ASInameArr).toString() ;
			 validationMessageText += "Please check custom fields '" + ASIfields_WithoutDuplicate.toString() + "' for record IDs: " +  validCustomIDs.toString() ; 	
			}
	    }
}

function checkASIT(matchCapRecordList , customFieldsJsonFormat  , validMsg  )
{   
	try{
		
	validCustomIDs = [] ;
	ASInameArr= [];
	for( var index in matchCapRecordList)
	{
	capId = matchCapRecordList[index] ;
	logDebug("checkASIT capId:" + capId + " :customId" + capId.getCustomID())
	var result = isCustomListsMatchRules(customFieldsJsonFormat) ;
	if(result == true) 
		{
		validCustomIDs.push(capId.getCustomID()) ;
		}

	}
	
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}

else 
	{ 
	fielArr = [] ;
    for (i in customFieldsJsonFormat) {
    	fielArr.push( customFieldsJsonFormat[i].columnName );
      }
	 validationMessageText += "Please check custom lists '" + fielArr.toString()+ "' for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	capId = currentCapId ;
	}
	catch (e) {
		capId = currentCapId ;
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkASIT(), capId : " + capId, e);
		throw e;
	}
	
}

function checkAddress(matchCapRecordList , addressJsonFormat  , validMsg  )
{   
	try{
	var validCustomIDs = [] ;
	
	for( var index in matchCapRecordList)
	{
	capId =matchCapRecordList[index] ;  
	logDebug("capId:" + matchCapRecordList[index] +" getCustomID:" + capId.getCustomID() + "check valid address condition") ;
	var match = isAddressMatchRules(addressJsonFormat) ;
	if(match == true)
		{
		validCustomIDs.push(capId.getCustomID()) ; 
		logDebug( "capId:" + capId +" getCustomID:" + capId.getCustomID() + " valid address condition") ;
		}
	}
	
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}

else 
	{ 
	addressFieldsArr= [];
	for ( var ap in addressJsonFormat) {
		addressFieldsArr.push(ap) ;
	}
	 validationMessageText += "Please check address '" + addressFieldsArr.toString() + "' for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	capId = currentCapId ; 
	logDebug( "End method checkaddress() capId:" + capId +" getCustomID:" + capId.getCustomID() + " valid address condition") ;

	}
	catch (e) {
		capId = currentCapId ;
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkaddress(), capId : " + capId, e);
		throw e;
	}
}

function checkParcel(matchCapRecordList , parcelJsonFormat  , validMsg  )
{   
	try{
		var validCustomIDs = [] ;
		
		for( var index in matchCapRecordList)
		{
		capId =matchCapRecordList[index] ;  
		logDebug("capId:" + matchCapRecordList[index] +" getCustomID:" + capId.getCustomID() + "check valid address condition") ;
		var match = isParcelMatchRules(parcelJsonFormat) ;
		if(match == true)
			{
			validCustomIDs.push(capId.getCustomID()) ; 
			logDebug( "capId:" + capId +" getCustomID:" + capId.getCustomID() + " valid address condition") ;
			}
		}
		
		if( validCustomIDs.length > 0) 	
		{
		if ( !isEmptyOrNull(validMsg))
		{ 
			validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
		}

	else 
		{ 
		addressFieldsArr= [];
		for ( var pp in parcelJsonFormat) {
			addressFieldsArr.push(pp) ;
		}
		 validationMessageText += "please check parcel fields '" + addressFieldsArr.toString() + "' for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
		}
		}
		capId = currentCapId ; 
		logDebug( "End method checkParcel() capId:" + capId +" getCustomID:" + capId.getCustomID() + " valid address condition") ;

		}
		catch (e) {
			capId = currentCapId ;
			aa.debug("Error at STDBASE_PROJECT_VALIDATION checkParcel(), capId : " + capId, e);
			throw e;
		}
}	





function checknumberContacts(matchCapRecordList , numbercontact  , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	for( var index in matchCapRecordList)
	{
	logDebug("checknumberContacts capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID() ) ; 
	var contacts = aa.people.getCapContactByCapID(matchCapRecordList[index]).getOutput();
	var countCountact =contacts.length ;
	logDebug("numbercontact:" + numbercontact + " countCountact:" +countCountact) ;
	if( parseInt(countCountact) < parseInt(numbercontact) ) 
		{
		validCustomIDs.push(matchCapRecordList[index].getCustomID()) ;
		}
	}
	
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}
	else 
	{ 
	    validationMessageText += "Number of contacts must be "+ numbercontact.toString() +" for each record IDs:" +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checknumberContacts(), capId : " + capId, e);
		throw e;
	}
	
}

function checkAllowBalance(matchCapRecordList   , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	for( var index in matchCapRecordList)
	{
	logDebug("check balance capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID() ) ; 
	var capDetails = aa.cap.getCapDetail(matchCapRecordList[index] ).getOutput();
	if( parseFloat(capDetails.getBalance()) > 0.00)
		{
		validCustomIDs.push(matchCapRecordList[index].getCustomID());
		}
	
	}
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}
	else 
	{ 
	    validationMessageText += "All invoiced fees must fully paid for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkAllowBalance(), capId : " + capId, e);
		throw e;
	}
	
}


function checkRecordStatus(matchCapRecordList , statusArray  , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	for( var index in matchCapRecordList)
	{
		
	var match =false; 
	
	var capModel = aa.cap.getCap(matchCapRecordList[index] ).getOutput()  ; 
	var  recordStatus= capModel.getCapStatus()
	logDebug("checkRecordStatus capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID()  + "recordStatus:" +recordStatus + " list status:" +statusArray.toString()) ; 
	for(i in statusArray )
		{
		if(statusArray[i]  == recordStatus) {
			match = true ;
			break;
		}
		}
	  logDebug("checkRecordStatus capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID()  + "recordStatus:" +recordStatus + " list status:" +statusArray.toString() + " match result:" +match) ; 

	if( !match  ) 
		{
		validCustomIDs.push(matchCapRecordList[index].getCustomID()) ;
		}
	}
	
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}
	else 
	{ 
	    validationMessageText += "The records status should be one of '"+statusArray.toString() +"' for Record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkRecordStatus(), capId : " + capId, e);
		throw e;
	}
	
}

function checkRequiredLP(matchCapRecordList , requiredLParray  , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	recordLParr =[] ;
	for( var index in matchCapRecordList)
	{	
	var Exist =true; 
	var licProf = aa.licenseProfessional.getLicensedProfessionalsByCapID(matchCapRecordList[index]).getOutput();
	if (licProf != null)
		{
		logDebug("checkRequiredLP capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID()  + "requiredLParray:" +requiredLParray.toString() ) ; 
			for(obj in licProf)
			{
			var licType = licProf[obj].getLicenseType() ;
			recordLParr.push(licType.toString())  ;
			}
			if(recordLParr.length >0) 
				{
				exist = true ;
				for( j in requiredLParray )
					{
					if(recordLParr.toString().indexOf(requiredLParray[j].toString()) ==-1)
						{
						exist = false ; 
						}
					}
				
				}
			else
				{
				exist = false ; 
				}
			
		}
	else 
		{exist = false ; }
	
	if(!exist) 
	{
	validCustomIDs.push(matchCapRecordList[index].getCustomID())
	}
	}
	if(validCustomIDs.length> 0)
		{
		if ( !isEmptyOrNull(validMsg))
		{ 
			validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
		}
		else 
		{ 
		    validationMessageText += "These LPs are required'"+requiredLParray.toString()+"' for each record IDs:" +  validCustomIDs.toString() + "<br>" ; 	
		}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkRequiredLP(), capId : " + capId, e);
		throw e;
	}
	
}

function checknumberLP(matchCapRecordList , numberLP , requiredLParray  , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	var licProfCount =0 ;
	for( var index in matchCapRecordList)
	{
		
	var Exist =true; 
	var licProf = aa.licenseProfessional.getLicensedProfessionalsByCapID(matchCapRecordList[index]).getOutput();
	if (licProf == null)
		{ 
		licProfCount = 0 ;
		}
	else 
		{
		licProfCount = licProf.length ;
		}
		logDebug("checknumberLP capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID()  + "requiredLParray:" +requiredLParray.toString() ) ; 
		
		if(parseInt(numberLP) > parseInt(licProfCount) )
			{
			validCustomIDs.push(matchCapRecordList[index].getCustomID() );
			}
	}
	if(validCustomIDs.length> 0)
		{
		if ( !isEmptyOrNull(validMsg))
		{ 
			validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
		}
		else 
		{   
			if(!isEmptyOrNull(requiredLParray) && requiredLParray.length >0)
				{validationMessageText += "Number of LPs must be " + numberLP +" from these Licenses '"+ requiredLParray.toString() +"' for each record IDs:" +  validCustomIDs.toString() + "<br>" ; 	
				}
			else {
				  validationMessageText += "Number of LPs must be" + numberLP +" for each of record IDs:" +  validCustomIDs.toString() + "<br>" ; 	
			} 
		}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkRequiredLP(), capId : " + capId, e);
		throw e;
	}
	
}

function checkvalidateLP(matchCapRecordList   , validMsg  )
{   
	try
	{
	validCustomIDs = [] ;
	licTypeExpArr = [] ;
	for( var index in matchCapRecordList)
	{
		var isExpired = false;
		 var lp = aa.licenseProfessional.getLicenseProf(matchCapRecordList[index]).getOutput() ;
		 if(lp != null )
			 {
			 for (i in lp)
			 {
			 var licType = lp[i].getLicenseType() ;
			 var result =capHasExpiredLicProf("EXPIRE", licType , matchCapRecordList[index]) ;
			 logDebug("checkvalidateLP: record id = "+matchCapRecordList[index].getCustomID() +" licType:" + licType +" result:" +result) ;
			 if (result) {
					isExpired = true;
					if(licTypeExpArr.toString().indexOf(licType) == -1)
						{
						licTypeExpArr.push(licType) ;
						}
					
					break;
				}
			 
			 }
		 if(isExpired ==true)
			 {
			 validCustomIDs.push(matchCapRecordList[index].getCustomID()) ;
			 }
			 }
		 else {
			 logDebug("checkvalidateLP: record id = "+matchCapRecordList[index].getCustomID() +" not have lps") ;
				
		 }

		}
		
	if(validCustomIDs.length> 0)
		{
		if ( !isEmptyOrNull(validMsg))
		{ 
			validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
		}
		else 
		{   
			validationMessageText	="These LPs are expired '"+licTypeExpArr.toString()+"' for record IDs:" +validCustomIDs.toString();
			 
		}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkvalidateLP(), capId : " + capId, e);
		throw e;
	}
	
}

function checkInspectionRequired(matchCapRecordList , inspectionRequired  , validMsg  )
{   
	try{
	validCustomIDs = [] ;
	for( var index in matchCapRecordList)
	{    
		var valid = true ;
		 var inspections = aa.inspection.getInspections(matchCapRecordList[index]).getOutput();
		 if (inspections == null || inspections.length == 0) {
        
			valid =false;
		}
		 else
			 {
			 for(index in inspections) 
				 {
				 inspectionType = inspections[index].getInspectionType() ; 
				 inspectionStatus= inspections[index].getInspectionStatus() ; 
				 logDebug("checkInspectionRequired capId:" + matchCapRecordList[index]  + " customID" + matchCapRecordList[index].getCustomID()  + "inspectionType:" +inspectionType + " inspectionStatus:" +inspectionStatus ) ; 
				 if(inspectionStatus != "Complete" && inspectionRequired.toString().indexOf(inspectionType) >-1 )
					 {
					 valid =false; 
					 break ;
					 }				 
				 }
			 }
		if(valid == false )
			{
			validCustomIDs.push(matchCapRecordList[index].getCustomID() );
			}
	}
	if(validCustomIDs.length> 0)
		{
		if ( !isEmptyOrNull(validMsg))
		{ 
			validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
		}
		else 
		{   
			validationMessageText ="These inspections '"+inspectionRequired.toString()+"' are required and should  be completed for record IDs:" +validCustomIDs.toString();
			 
		}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkInspectionRequired(), capId : " + capId, e);
		throw e;
	}
	
}

function checkRequiredContact(matchCapRecordList , requiredContact  , validMsg  )
{   
	try{
	var validCustomIDs = [] ;
	
	for( var index in matchCapRecordList)
	{
	var valid =true;
	capId =matchCapRecordList[index] ;  
    var arrContactarr = getContactsList(); 
    var arrContactStr = ""; 
    for(con in arrContactarr)
    	{
    	arrContactStr += arrContactarr[con]["contactType"] ;
    	}
    logDebug("capId:" + matchCapRecordList[index] +" getCustomID:" + capId.getCustomID() + "contact count:" + arrContactarr.length + "contact Type:" + arrContactStr.toString() + ":requiredContact=" +requiredContact.toString()) ;
    if(arrContactarr.length == 0) 
    	{
    	valid =false; 
    	}
    else 
    	{
    	 for ( rc in requiredContact ) 
     	{
     	 var requiredContactItem = requiredContact[rc].toString() ;
     	 if(arrContactStr.toString().indexOf(requiredContactItem) == -1) 
     		 {
     		 valid =false ;
     		 break;
     		 }
     	}
    	}
    
   if(!valid)
	   {
	   validCustomIDs.push(capId.getCustomID()) ;
	   }
   
	}
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}

else 
	{ 
	 validationMessageText += "These contacts types '" + requiredContact.toString() + "' are required for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	capId = currentCapId ; 
	
	}
	catch (e) {
		capId = currentCapId ;
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkRequiredContact(), capId : " + capId, e);
		throw e;
	}
}


function  checktaskRequired(matchCapRecordList , taskRequired  , validMsg  ) 
{   
	try{
	var validCustomIDs = [] ;
	
	for( var index in matchCapRecordList)
	{
	var isCompete =true;
	capId =matchCapRecordList[index] ;  
    	 for ( tr in taskRequired ) 
     	{
    		 if (!isTaskComplete(taskRequired[tr])) {
    			 isCompete =false ;
 			  break;
 			}
     	}
    	 if( !isCompete )
    		 {
    		 validCustomIDs.push(capId.getCustomID()) ;
    		 
    		 }
	}
	capId = currentCapId ;
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}
else 
	{ 
	 validationMessageText += "These tasks '" + taskRequired.toString() + "' must be completed for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	capId = currentCapId ; 
	
	}
	catch (e) {
		capId = currentCapId ;
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checktaskRequired(), capId : " + capId, e);
		throw e;
	}
}


function  checkrecordWorkflowStatus(matchCapRecordList , recordWorkflowStatusArr  , validMsg  ) 
{   
	try{
	var validCustomIDs = [] ;
	var task = recordWorkflowStatusArr[0].task;
	var status = recordWorkflowStatusArr[1].status;
	for( var index in matchCapRecordList)
	{
	var isValid =false;
	capId =matchCapRecordList[index] ;  
	isValid = isTaskStatus(task ,status) ;
    	 if( !isValid  )
    		 {
    		 validCustomIDs.push(capId.getCustomID()) ;
    		 
    		 }
	}
	capId = currentCapId ;
	if( validCustomIDs.length > 0) 	
	{
	if ( !isEmptyOrNull(validMsg))
	{ 
		validationMessageText +=validMsg + validCustomIDs.toString() +  "<br>" ;
	}
else 
	{ 
	 validationMessageText += "The workflow Task '"+task+"' and workflow status '"+status+"' are required for record IDs: " +  validCustomIDs.toString() + "<br>" ; 	
	}
	}
	capId = currentCapId ; 
	
	}
	catch (e) {
		capId = currentCapId ;
		aa.debug("Error at STDBASE_PROJECT_VALIDATION checkrecordWorkflowStatus(), capId : " + capId, e);
		throw e;
	}
}
