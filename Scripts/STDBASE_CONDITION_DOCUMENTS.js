/*
Title : STDBASE_CONDITION_DOCUMENTS
Purpose : To apply condition documents to a record  
Author: Yazan Barghouth 
 
 Functional Area : PageFlow Description : 
 
 JSON Example : 
 {
  "RentalHousing/Licenses/Short Term/Application": {
    "Pageflow": [
      {
        "preScript": "",
        "metadata": {
          "description": "Required Documents - Short Team Rental Application - Proof of Ownership",
          "operators": {}
        },
        "criteria": {
          "customFields": {
            "Are you the owner of the property?": "Yes"
          }
        },
        "action": {
          "requiredDocuments": [
            "Proof of Ownership"
          ],
          "conditionType": "Rental Housing Required Documents"
        },
        "postScript ": ""
      },
      {
        "preScript": "",
        "metadata": {
          "description": "General Required Documents - Short Team Rental Application",
          "operators": {}
        },
        "criteria": {},
        "action": {
          "requiredDocuments": [
            "Floor Plan",
            "Proof Of Insurance",
            "Notice to Neighbors"
          ],
          "conditionType": "Rental Housing Required Documents"
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
    ]
  }
}
 
 * updateDocumentCategories only works on DocumentUploadAfter Event
 * Available Types: contactFields, customFields, customLists, parcelFields,
 * addressFields, lpFields
 * 
 * Available Attributes for each type: - Custom Fields and Custom Lists: ALL -
 * Address: All Custom Attributes,
 * (primaryFlag,houseNumberStart,streetDirection,streetName,streetSuffix,city,state,zip,addressStatus,county,country,addressDescription,xCoordinate,yCoordinate) -
 * Parcel: All Custom Attributes,
 * (ParcelNumber,Section,Block,LegalDesc,GisSeqNo,SourceSeqNumber,Page,I18NSubdivision,CouncilDistrict,RefAddressTypes,ParcelStatus,ExemptValue,PublicSourceSeqNBR,CensusTract,InspectionDistrict,NoticeConditions,ImprovedValue,PlanArea,Lot,ParcelArea,Township,LandValue) -
 * Licensed Professional: All Custom Attributes,
 * (licType,lastName,firstName,businessName,address1,city,state,zip,country,email,phone1,phone2,lastRenewalDate,licExpirationDate,FEIN,gender,birthDate) -
 * Contact: All Custom Attributes,
 * (firstName,lastName,middleName,businessName,contactSeqNumber,contactType,relation,phone1,phone2,email,addressLine1,addressLine2,city,state,zip,fax,notes,country,fullName,peopleModel)
 */

/*
 * current page index and current step index are expected to be passed from the
 * global Page Flow Event
 */


function getScriptText(vScriptName, servProvCode, useProductScripts) {
	if (!servProvCode)
		servProvCode = aa.getServiceProviderCode();
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		if (useProductScripts) {
			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		} else {
			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
		}
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

// This should be included in all Configurable Scripts
eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
var scriptSuffix = "CONDITION_DOCUMENTS";
cancelCfgExecution = false;

try {
	
   //showDebug = true;
    //showMessage=true;
    
	var settingsArray = [];
	if (isConfigurableScript(settingsArray, scriptSuffix)) {
		for (s in settingsArray) {
			var rules = settingsArray[s];

			var preScript = rules.preScript;
			var postScript = rules.postScript;

			if (!matches(preScript, null, "")) {
				eval(getScriptText(preScript));
			}
			/* var  capConditionResult = aa.capCondition.getCapConditions(capId);
            if (capConditionResult.getSuccess()) {                               
                var capConditionArray = capConditionResult.getOutput();
                if(capConditionArray != null && capConditionArray.length > 0)
                {
                	cancelCfgExecution = true;
                }
            } */
			

            var criteria = rules.criteria;
            var action = rules.action;
            
            // requirementType validationMessage are not currently used
            // var requirementType = action.requirementType;
            // var validationMessage = action.validationMessage;
            var requiredDocuments
            var requiredDocConditionType 
            
            if(rules.action.hasOwnProperty("requiredDocuments")){
                requiredDocuments = action.requiredDocuments;
            }

            if(rules.action.hasOwnProperty("conditionType")){
                requiredDocConditionType = action.conditionType;
            }
            
            if(isEmptyOrNull(requiredDocConditionType)){
                requiredDocConditionType = "Required Documents";
            }

            if (cancelCfgExecution) {
				logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
				cancelCfgExecution = false;
				continue;
			}
            
            if(requiredDocuments != null && requiredDocuments.length > 0){
                logDebug("requiredDocuments: " + requiredDocuments)
                applyConditionDocuments(requiredDocConditionType, requiredDocuments); 
            }      

            if(action.updateDocumentCategories && action.updateDocumentCategories == true){
                updateDocumentCategories();
            }

			if (!matches(postScript, null, "")) {
				eval(getScriptText(postScript));
			}

		}// for all settings
	}// isConfigurableScript()
} catch (ex) {
	logDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + ex);
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
/// this function will validate documents based on the rules in the JSON.
function applyConditionDocuments(conditionType, reqDocs) {

    // loop through required docs array
    for (var d in reqDocs) {

        var requiredDocType = reqDocs[d];
        var condExists = hasConditionDocument(capId, conditionType, requiredDocType);
        logDebug("condExists: " + condExists);
        // if cond does not already exist, create one
        if (!condExists) {

            // getStandardConditions 
            var refCond = getRefConditionByTypeName(conditionType,requiredDocType); 
            logDebug("refCond: " + refCond);
            if(refCond){
                var stdConditionNum = refCond.getStandardConditionNumber();
                aa.capCondition.createCapConditionFromStdCondition(capId, stdConditionNum);
                logDebug("Added required condition document: " + requiredDocType);

            }
        }
    }
}

function hasConditionDocument(vCapId, pType, pDesc) {
    // Checks to see if conditions have been added to CAP
    // 06SSP-00223
    //

    var condResult;
    var capConds = new Array();

    if (pType == null)
        condResult= aa.capCondition.getCapConditions(vCapId);
    else
        condResult = aa.capCondition.getCapConditions(vCapId, pType);

    if (condResult && condResult.getSuccess())
        capConds = condResult.getOutput();
    else {
        logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        return false;
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        var cType = thisCond.getConditionType();
        if (cStatus == null)
            cStatus = " ";
        if (cDesc == null)
            cDesc = " ";
        if (cImpact == null)
            cImpact = " ";
        //Look for matching condition
        if (pDesc.toUpperCase().equals(cDesc.toUpperCase()) && cType.toUpperCase().equals(pType.toUpperCase()))
            return true; //matching condition found
    }
    return false; //no matching condition found
} //function

function getRefConditionByTypeName(pCondType, pCondDesc, pCondStatus){
    var returnCond = null;
    if(matches(pCondStatus,"I",false,"Inactive","Disabled")){
        pCondStatus = "I";
    }
    else{
        // Defualt Active Status of "A"
        pCondStatus = "A";
    }
    
    
   
    var refStdConditionBusinessResult = aa.proxyInvoker.newInstance("com.accela.aa.condition.condition.RefStdConditionBusiness");
    logDebug("create obj refStdConditionBusinessResult ");
    if(refStdConditionBusinessResult.getSuccess()){
    	logDebug(" obj refStdConditionBusinessResult sucssess");
        var refStdConditionBusiness = refStdConditionBusinessResult.getOutput();
        logDebug("  refStdConditionBusinessResult get output");
        var lang = "en_US";
        logDebug("servProvCode: " + servProvCode);
        logDebug("pCondType: " + pCondType);
        logDebug("pCondDesc: " + pCondDesc);
        logDebug("pCondStatus: " + pCondStatus);
        
        var refCondList =  refStdConditionBusiness.getRefConditiontByTypeName(servProvCode, pCondType, pCondDesc, lang);
        logDebug("refCondList: " + refCondList);
       
       if(refCondList){
    	   logDebug(" insert if(refCondList): " );
        var refCondItr = refCondList.iterator();
        while(refCondItr.hasNext()){
            var thisCond = refCondItr.next();

            var cDesc = thisCond.getConditionDesc();
            var cType = thisCond.getConditionType();
            var cAuditStatus = thisCond.getAuditStatus();
        
            if (cDesc == null)
                cDesc = " ";
            if (cAuditStatus == null)
                cAuditStatus = "A";
            //Look for matching condition
            //logDebug("(getRefConditiontByTypeName) Lookup Condition Description: " + pCondDesc + " ==> Found Type: " + cType + " -- Description: " + cDesc + " -- Status: " + cAuditStatus);
                    
            if (pCondDesc.toUpperCase().equals(cDesc.toUpperCase())){
                if(pCondStatus.equals(cAuditStatus)){
                    returnCond = thisCond;
                }
                
            }
                
            }
        }
           
    }
    return returnCond;
}

function updateDocumentCategories(){
    var documentModels;
    var partialCap = !cap.isCompleteCap();
    logDebug("partialCap = " + partialCap);

    if (controlString && controlString == "DocumentUploadAfter") {
        if (partialCap && documentModelArray != null) {
            documentModels = documentModelArray.toArray();
        }
        else{
            documentModels = getDocumentList();
        }
    }
    else if(!documentModels){
        documentModels = getDocumentList();
    }
        
        
        
    var documentModel = null;
    var conditionNumber = 0;
 
   // logDebug("documentModels.length = " + documentModels.length);
 
    for (var i in documentModels) {
        documentModel = documentModels[i];
        //logDebug(" i = " + i);
        conditionNumber = documentModel.getConditionNumber();
        var documentCategory = documentModel.getDocCategory();

        if(matches(documentCategory,null,undefined,"")){

            if (conditionNumber != null && conditionNumber != 0) {
                var capConditionResult 
                //capConditionResult = aa.capCondition.getCapCondition(capId, conditionNumber);
                capConditionResult = aa.capCondition.getCapConditions(capId);
                if (capConditionResult.getSuccess()) {
                    
                    var capCondition // = capConditionResult.getOutput();
                    var capConditionArray = capConditionResult.getOutput();

                    var capTypeModelObj = aa.cap.getCapTypeModelByCapID(capId).getOutput();
                    var capTypeRefDocGroup = capTypeModelObj.getDocCode();

                    for(iC in capConditionArray){
                        capCondition = capConditionArray[iC];
                                                
                        if(conditionNumber == capCondition.getReferenceConditionNumber()){
                            //logDebug("Found Doc Condition Number : " + conditionNumber + " = Cond Number : "+ capCondition.getReferenceConditionNumber())

                            var conditionGroup = capTypeRefDocGroup; //capCondition.getConditionGroup();
                            var conditionName = capCondition.getConditionDescription();
                            //logDebug("Condition Name - " + conditionName);
                            //logDebug("Condition Group - " + conditionGroup);
                            documentModel.setDocCategory(conditionName);
                            documentModel.setDocGroup(conditionGroup);
                            if(documentModel.getDocDescription() == null){
                                documentModel.setDocDescription(conditionName);
                            }
                            
                            var updateDocumentResult = aa.document.updateDocument(documentModel);
                            if (updateDocumentResult.getSuccess()) {
                                logDebug("Update document model successfully - " + documentModel.getDocName());
                            } else {
                                logDebug("Update document model failed - " + documentModel.getDocName());
                            }
                        }  
                    
                    }
                
                } else {
                    logDebug("No condition number - " + documentModel.getDocName());
                }
            }
        }
    }
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
} else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-1");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    } else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}