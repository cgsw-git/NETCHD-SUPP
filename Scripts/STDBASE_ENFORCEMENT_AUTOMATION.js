/*
Title : Inspection Automation (After)  and Application Submit (After)
Purpose : To perform a set of action based on inspection result or application submit
Author: Rami Bader
 
 Functional Area : AV
 
  JSON Example : 
{
  "Enforcement/Incident/Zoning/Fence Dispute": {
    "InspectionResultSubmitAfter": [
      {
        "preScript": "",
        "metadata": {
          "description": "Create a new site visit record with failed checklist items carried over",
          "operator": ""
        },
        "criteria": {
          "inspectionResult": [
            "In Violation",
            "Compliant",
            "Citation"
          ],
          "inspectionType": [
            "Initial Investigation"
          ]
        },
        "action": {
          "createNewRecord": [
            {
              "newRecordType": "Enforcement/Incident/Zoning/Fence Dispute",
              "newRecordStatus": "Pending",
              "newInspectionType": "Follow-Up",
              "newInspectionStatus": "Scheduled",
			  "inspectionDisplayInACA": "N"    ,          //values: ("N" or "Y") , the default value equal 'Y'
              "newInspectionDaysOut": 0,
              "carryOverFailedItems": true,
              "failedChecklistType": "Current Violations",
              "violationReferralRules": {
                "01A - BOARDING": {
                  "createWorkOrderType": "AMS/Property Maintenance/Boarding/NA",
                  "referralDaysOut": 14,
                  "emailReferrals": []
                },
                "02A - CLEANING": {
                  "createWorkOrderType": "AMS/Property Maintenance/Cutting and Cleaning/NA",
                  "referralDaysOut": 14,
                  "emailReferrals": [
                    {
                      "referralType": "Police",
                      "email": "cli@accela.com"
                    }
                  ]
                }
              }
            }
          ]
        },
        "postScript": ""
      }
    ],
    "ApplicationSubmitAfter": [
      {
        "metadata": {
          "description": "Create the first site visit record with inspection scheduled",
          "operator": ""
        },
        "preScript": "",
        "criteria": {
        	"customFields": {},
        	"customLists": {}
        },
        "action": {
          "createNewRecord": [
            {
              "newRecordType": "Enforcement/Incident/Zoning/Fence Dispute",
              "newRecordStatus": "Pending",
              "newInspectionType": "New Complaint",
              "newInspectionStatus": "Scheduled",
              "newInspectionDaysOut": 0,
              "carryOverFailedItems": false,
              "failedChecklistType": "",
              "violationReferralRules": {}
            }
          ]
        },
        "postScript": ""
      }
    ]
  }
}
 */


var scriptSuffix = "ENFORCEMENT_AUTOMATION";
eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
var settingsArray = [];

if (isConfigurableScript(settingsArray, scriptSuffix)) {
	for (s in settingsArray) {

		var rules = settingsArray[s];

		//Execute PreScript
		var preScript = rules.preScript;
		if (!matches(preScript, null, "")) {
			eval(getScriptText(preScript));
		}
		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}

		if(controlString == "InspectionResultSubmitAfter"){
			inspectionAutomation(rules);			
		}
		if(controlString == "ApplicationSubmitAfter"){
			applicationSubmitAfter(rules);			
		}
		
		var postScript = rules.postScript;
		//Execute PostScript
		if (!matches(postScript, null, "")) {
			eval(getScriptText(postScript)); // , null, false ???
		}

	}// for all settings
}// isConfigurableScript()

function inspectionAutomation(rules){
	
	try {
		 logDebug("Starttt insp ");
	    for (r in rules) {
	        var thisResultRule = rules[r];
	        var resultStatusCriteria = thisResultRule.inspectionResult;
	        logDebug("ResultStatusCriteria: " + resultStatusCriteria);
	        var resultMatch=false;

	        for (cr in resultStatusCriteria) {
	            logDebug("Result status: " + resultStatusCriteria[cr]);
	            if(inspResult==resultStatusCriteria[cr]){

	                resultMatch=true;
	                logDebug("resultMatch2 : " + resultMatch);
	                break;
	            }
	        }

	        // if the current inspection result does not match the JSON result criteria, continue to next rule.
	        if(!resultMatch){
	            logDebug("Inspection result does not match criteria, continue to next rule.")
	            continue;
	        }
	 
	        // get reinspect current record rules
	        var reInspectCurrentRecord = rules.action.reInspectCurrentRecord;
	        if (reInspectCurrentRecord) {

	            for (rr in reInspectCurrentRecord) {
	                var newInspectionType = reInspectCurrentRecord[rr].newInspectionType;
	                var newInspectionStatus = reInspectCurrentRecord[rr].newInspectionStatus;
	                var inspectionDisplayInACA = reInspectCurrentRecord[rr].inspectionDisplayInACA;
	                var newInspectionDaysOut = reInspectCurrentRecord[rr].newInspectionDaysOut;
	                var failedChecklistType = reInspectCurrentRecord[rr].failedChecklistType;
	                var carryOverFailedItems = reInspectCurrentRecord[rr].carryOverFailedItems;
	                var violationReferralRules = reInspectCurrentRecord[rr].violationReferralRules;

	                copyFailChecklistItemsToCurrentRecord(capId, inspId, newInspectionType, newInspectionStatus, newInspectionDaysOut, currentUserID, carryOverFailedItems, failedChecklistType, violationReferralRules, inspectionDisplayInACA);

	            }
	        }
	        
	        // get create new record rules
	        var violationArray = new Array();
	        var createNewRecordRules = rules.action.createNewRecord;
	        logDebug("createNewRecordRules: "+createNewRecordRules)
	        
	        if (createNewRecordRules) {
	            for (nr in createNewRecordRules) {
	                var newRecordType = createNewRecordRules[nr].newRecordType;
	                var newRecordStatus = createNewRecordRules[nr].newRecordStatus;
	                var newInspectionType = createNewRecordRules[nr].newInspectionType;
	                var newInspectionStatus = createNewRecordRules[nr].newInspectionStatus;
	                var inspectionDisplayInACA = createNewRecordRules[nr].inspectionDisplayInACA;
	                var newInspectionDaysOut = createNewRecordRules[nr].newInspectionDaysOut;
	                var failedChecklistType = createNewRecordRules[nr].failedChecklistType;
	                var carryOverFailedItems = createNewRecordRules[nr].carryOverFailedItems;
	                var violationReferralRules = createNewRecordRules[nr].violationReferralRules;
	                var connectWithParent = createNewRecordRules[nr].connectWithParent;
	                
	                copyFailChecklistItemsToNewRecord(capId, inspId, newRecordType, newInspectionType, newInspectionStatus, newInspectionDaysOut, currentUserID, carryOverFailedItems, failedChecklistType, violationReferralRules, newRecordStatus, connectWithParent, inspectionDisplayInACA);
	 
	            }
	        }
	    }
	} catch (e) {
	   logDebug("ERROR: " + e);
	}
}

function applicationSubmitAfter(rules) {

	var inspId;
	try {
		
		for (r in rules) {
			
			var thisResultRule = rules[r];

			// get create new record rules
			var violationArray = new Array();
			var createNewRecordRules = thisResultRule.createNewRecord;
			if (createNewRecordRules) {
				for (nr in createNewRecordRules) {
					var newRecordType = createNewRecordRules[nr].newRecordType;
					var newRecordStatus = createNewRecordRules[nr].newRecordStatus;
					var newInspectionType = createNewRecordRules[nr].newInspectionType;
					var newInspectionStatus = createNewRecordRules[nr].newInspectionStatus;
					var inspectionDisplayInACA = createNewRecordRules[nr].inspectionDisplayInACA;
					var newInspectionDaysOut = createNewRecordRules[nr].newInspectionDaysOut;
					var failedChecklistType = createNewRecordRules[nr].failedChecklistType;
					var carryOverFailedItems = createNewRecordRules[nr].carryOverFailedItems;
					var violationReferralRules = createNewRecordRules[nr].violationReferralRules;
					
					copyFailChecklistItemsToNewRecordASA(capId, inspId, newRecordType, newInspectionType, newInspectionStatus, newInspectionDaysOut, currentUserID, carryOverFailedItems, failedChecklistType, violationReferralRules, newRecordStatus, inspectionDisplayInACA);
					
				}
			}
		}
	} catch (e) {
	   logDebug("ERROR: " + e);
	}
}

/*
function workflowUpdate(rules){
	
	try {
		
	    for (r in rules) {
	        var thisResultRule = rules[r];
	        var resultStatusCriteria = thisResultRule.inspectionResult;
	        logDebug("ResultStatusCriteria: " + resultStatusCriteria);
	        var resultMatch=false;
	        for (cr in resultStatusCriteria) {
	            logDebug("Result status: " + resultStatusCriteria[cr]);
	            if(inspResult==resultStatusCriteria[cr]){
	                resultMatch=true;
	                break;
	            }
	        }

	        // if the current inspection result does not match the JSON result criteria, continue to next rule.
	        if(!resultMatch){
	            logDebug("Inspection result does not match criteria, continue to next rule.")
	            continue;
	        }
	 
	        // get update workflow rules
	        var updateWorkflowRules = thisResultRule.updateWorkflow;
	        if (updateWorkflowRules) {
	        	
	            for (wf in updateWorkflowRules) {
	                var updWfTask = updateWorkflowRules[wf].wfTask;
	                var updWfStatus = updateWorkflowRules[wf].wfStatus;
	                var updWfComment = "";
	                var updWfNote = updateWorkflowRules[wf].wfNote;
	                var copyInspectionComment = updateWorkflowRules[wf].copyInspectionComment;
	                if (copyInspectionComment) {
	                    updWfComment = inspComment;
	                }
	                closeTask(updWfTask, updWfStatus, updWfComment, updWfNote);
	                deactivateTask("Closure");
	                activateTask("Issue Citation");
	            }
	        }
	 
	    }
	} catch (e) {
	   logDebug("ERROR: " + e);
	}
}
*/

function copyFailChecklistItemsToNewRecord(srcCapId, srcInspId, targetRecordType, targetInspType, targetInspStatus, targetInspDaysOut, inspectorId, carryOverFailedItems, failedChecklistType, violationReferralRules, newRecordStatus, connectWithParent, inspectionDisplayInACA) {

	logDebug("targetRecordType: "+targetRecordType)
    //keep in array to support multiple in the future
    var recordTypeList = aa.util.newArrayList();
    logDebug("type of: " + typeof (targetRecordType))
    if (typeof (targetRecordType) == 'string') {
        recordTypeList.add(targetRecordType);
    } else {
        recordTypeList = targetRecordType;
    }
 
    // loop through array of record types to create child records
    if (recordTypeList != null && recordTypeList.size() > 0) {
        for (var i = 0; i < recordTypeList.size(); i++) {
            var recordType = recordTypeList.get(i);
 
            //Create a new cap.
            
            var parentCapId;
            logDebug("connectWithParent: "+connectWithParent)
            if(connectWithParent){
            	parentCapId = getParent();            	
            }else{
            	parentCapId = srcCapId;            	
            }
            
            var recTypeArray = recordType.split("/");
            var recordTypeArray = recordType.split("/");
            if (recordTypeArray.length == 4) {
            	logDebug("current "+recordType)
            	logDebug("parentCapId "+parentCapId)

            	var newCapID = createChild(recordTypeArray[0], recordTypeArray[1], recordTypeArray[2], recordTypeArray[3], capName, parentCapId);

            	updateAppStatus(newRecordStatus, "by script", newCapID);
                
            	copyOwnerFix(parentCapId, newCapID);
 
                var vContactResult = {}; 
                var vContactAry = new Array();
   
                vContactResult = aa.people.getCapContactByCapID(newCapID);
                vContactAry = vContactResult.getOutput();
 
                for (yy in vContactAry) {
                    var vCapContactModel = new Array();
                    var vContactSeqNumber = 0;
                    var vPeopleModel = new Array();
 
                    vCapContactModel = vContactAry[yy].getCapContactModel();
                    vPeopleModel = vContactAry[yy].getPeople();
                    logDebug("vPeopleModel: " + vPeopleModel);
       
                    vContactSeqNumber = parseInt( vPeopleModel.getContactSeqNumber());
                    logDebug("vContactSeqNumber: " + vContactSeqNumber);
       
                    aa.people.removeCapContact(newCapID, vContactSeqNumber);
                }
    
                copyContacts(capId, newCapID);
 
                var holdId = capId;
                capId=newCapID;
                copyParcelGisObjects();
                //setGISDistricts(capId,false);
                capId=holdId;
               
            } else {
                logDebug("ERROR: Record type not valid: " + recordType);
                continue;
            }
 
            logDebug("New Site Visit Record ID: " + newCapID.getCustomID());
 
            //update child record alt id to align with the parent case record ID
            var newAltId = updateNewEnfIDAndNameForChild(parentCapId, newCapID, recordType);
 
            //Get the InspSequenceNumber
            var inspSequenceNumber = getInspSequenceNumber(srcCapId, srcInspId);
            var newInspectionID;
 
            // first create the follow up as pending - we'll schedule it below after getting due dates
            //var newInspectionID = copyInspAsPendingToNewRecord(newCapID, inspSequenceNumber);
 
            // schedule inspection days out by targetInspDaysOut value.
            var schDate = dateAdd(null, targetInspDaysOut);
            scheduleInspectDate(targetInspType, schDate, currentUserID);
			 var newInspectionID = getInspID(capId, targetInspType);
			    if(!isEmptyOrNull(inspectionDisplayInACA))
				{
				   if(parseInt(newInspectionID) > 0)
				   {
					   setInspectionDisplayInACA(capId, newInspectionID, inspectionDisplayInACA, null ) ;
				   }
				}
				
            // Delete non-major checklist...
            updateGuideSheetItemListForMajorViolation(newCapID, newInspectionID);
            
        	// Get the failed guideSheetItem list from the inspection and cap.
        	var isCheckGuideItemCarryOverFlag = false;
        	var failGuidesheetModel = getFailGuideSheetItemList(srcCapId, srcInspId, isCheckGuideItemCarryOverFlag);
            	
        	if(failGuidesheetModel){
            	// copy the failed items to ASIT
            	copyFailedGSItemsToASIT(srcCapId, failGuidesheetModel.getItems(), "VIOLATIONS", violationReferralRules);
            	
            	var cleanFailGuidesheet = cleanFailedGuidesheet(failGuidesheetModel,"Current Violations");
            	var guideSheetModels = aa.util.newArrayList();
            	guideSheetModels.add(cleanFailGuidesheet);
            	
            	var copyResult = aa.guidesheet.copyGGuideSheetItems(guideSheetModels, newCapID, newInspectionID, "ADMIN");
            	if (copyResult.getSuccess()) {
            		logDebug("Successfully copy guideSheet items to cap : " + newCapID);
            	} else {
            		logDebug("Failed copy guideSheet items to cap: " + copyResult.getErrorMessage());
            	}
            	logDebug("*********************************************************************************");
            	
            	// auto schedule and assign the inspection based on next due date
            	if (targetInspStatus.toUpperCase() == "PENDING") {
            		//Create a pending Inspection on the new cap.
            		
            	} else {
            		var nextDueDate = getNextVioDueDate(srcCapId, failGuidesheetModel.getItems());
            		if (nextDueDate == null) {
            			nextDueDate = dateAdd(nextDueDate, targetInspDaysOut);
            			logDebug("No Violation Due Date. Using value of targetInspDaysOut: " + nextDueDate);
            		}
            		autoScheduleInspection(newCapID, newInspectionID, new Date(nextDueDate));
            	}
            	
            }
           
 
            return failGuidesheetModel;
        }
    }
}

function updateGuideSheetItemListForMajorViolation(vCapID, inspectionID) {

	logDebug("Inside deleting non-major checklist...")
	var itemsResult = aa.inspection.getInspections(vCapID);
	
	if (itemsResult.getSuccess()) {
		
		var inspectionScriptModels = itemsResult.getOutput();
		for ( var k in inspectionScriptModels) {
			if (inspectionScriptModels[k].getIdNumber() == inspectionID) {
				
				var inspectionModel = inspectionScriptModels[k].getInspection();
				var gGuideSheetModels = inspectionModel.getGuideSheets();
				
				if (gGuideSheetModels.size() > 0) {
					
					for (var i = 0; i < gGuideSheetModels.size(); i++) {
						
						var gGuideSheetModel = gGuideSheetModels.get(i);
						var guideSheetNumber = gGuideSheetModel.getGuidesheetSeqNbr();
						var gGuideSheetItemModels = gGuideSheetModel.getItems();
						
						if (gGuideSheetItemModels) {
							
							for (var j = 0; j < gGuideSheetItemModels.size(); j++) {
								
//								logDebug("Guide sheet list: " + gGuideSheetItemModels.size())
								var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
								var guideSheetItemNumber = gGuideSheetItemModel.getGuideItemSeqNbr();
								
								if (gGuideSheetItemModel.getMajorViolation() != "Y") {
									
									var gGuideSheetBusiness = aa.proxyInvoker.newInstance("com.accela.aa.inspection.guidesheet.GGuideSheetBusiness").getOutput();
									if (guideSheetItemNumber != undefined && gGuideSheetModel != undefined) {
										var deleteItem = gGuideSheetBusiness.removeGGuideSheetItem(aa.getServiceProviderCode(), guideSheetNumber, guideSheetItemNumber, gGuideSheetModel.getAuditID());
//										logDebug("Delete item result: " + deleteItem)
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function copyFailChecklistItemsToNewRecordASA(srcCapId, srcInspId, targetRecordType, targetInspType, targetInspStatus, targetInspDaysOut, inspectorId, carryOverFailedItems, failedChecklistType, violationReferralRules, newRecordStatus, inspectionDisplayInACA ) {

	logDebug("targetRecordType: "+targetRecordType)
    //keep in array to support multiple in the future
    var recordTypeList = aa.util.newArrayList();
    logDebug("type of: " + typeof (targetRecordType))
    if (typeof (targetRecordType) == 'string') {
        recordTypeList.add(targetRecordType);
    } else {
        recordTypeList = targetRecordType;
    }
 
    // loop through array of record types to create child records
    if (recordTypeList != null && recordTypeList.size() > 0) {
        for (var i = 0; i < recordTypeList.size(); i++) {
            var recordType = recordTypeList.get(i);
 
            //Create a new cap.
            var parentCapId;
            parentCapId = srcCapId;
            
            var recTypeArray = recordType.split("/");
            var recordTypeArray = recordType.split("/");
            if (recordTypeArray.length == 4) {
            	logDebug("current "+recordType)
            	logDebug("parentCapId "+parentCapId)
                var newCapID = createChild(recordTypeArray[0], recordTypeArray[1], recordTypeArray[2], recordTypeArray[3], capName, parentCapId);
            	updateAppStatus(newRecordStatus, "by script", newCapID);
                
            	copyOwnerFix(parentCapId, newCapID);
 
                var vContactResult = {}; 
                var vContactAry = new Array();
   
                vContactResult = aa.people.getCapContactByCapID(newCapID);
                vContactAry = vContactResult.getOutput();
 
                for (yy in vContactAry) {
                    var vCapContactModel = new Array();
                    var vContactSeqNumber = 0;
                    var vPeopleModel = new Array();
 
                    vCapContactModel = vContactAry[yy].getCapContactModel();
                    vPeopleModel = vContactAry[yy].getPeople();
                    logDebug("vPeopleModel: " + vPeopleModel);
       
                    vContactSeqNumber = parseInt( vPeopleModel.getContactSeqNumber());
                    logDebug("vContactSeqNumber: " + vContactSeqNumber);
       
                    aa.people.removeCapContact(newCapID, vContactSeqNumber);
                }
    
                copyContacts(capId, newCapID);
 
                var holdId = capId;
                capId=newCapID;
                copyParcelGisObjects();
                //setGISDistricts(capId,false);
                capId=holdId;
               
            } else {
                logDebug("ERROR: Record type not valid: " + recordType);
                continue;
            }
 
            logDebug("New Site Visit Record ID: " + newCapID.getCustomID());
 
            //update child record alt id to align with the parent case record ID
            var newAltId = updateNewEnfIDAndNameForChild(parentCapId, newCapID, recordType);
 
       
 
            // first create the follow up as pending - we'll schedule it below after getting due dates
            //var newInspectionID = copyInspAsPendingToNewRecord(newCapID, inspSequenceNumber);
 
            // schedule inspection days out by targetInspDaysOut value.
            var schDate = dateAdd(null, targetInspDaysOut);
			scheduleInspectDate(targetInspType, schDate, currentUserID);
			var newInspectionID = getInspID(capId, targetInspType);
			 if(!isEmptyOrNull(inspectionDisplayInACA))
			{
				if(parseInt(newInspectionID) >0 )
				{
				setInspectionDisplayInACA(capId, newInspectionID, inspectionDisplayInACA, null ) ;
				}
			}
        	// Get the failed guideSheetItem list from the inspection and cap.
        	
 
            return;
        }
    }
}

function copyOwnerFix(sCapID, tCapID) {
	var ownrReq = aa.owner.getOwnerByCapId(sCapID).getOutput();
	if (true) {
		var ownrObj = ownrReq;
		for (xx in ownrObj) {
			ownrObj[xx].setCapID(tCapID);
			aa.owner.createCapOwnerWithAPOAttribute(ownrObj[xx]);
			logDebug("Copied Owner: " + ownrObj[xx].getOwnerFullName())
		}
	} else
		logDebug("Error Copying Owner : " + ownrObj.getErrorType() + " : " + ownrObj.getErrorMessage());
}

function updateNewEnfIDAndNameForChild(parentCapId, childCapId, childType) {
    
	var capAldId = childCapId.getCustomID();
    var parentAltId = parentCapId.getCustomID();
    var childList = getChildren(childType, parentCapId);
 
    var year = new Date().getFullYear().toString();
    var count = 1;
    if (childList) {
        count = childList.length;
    }
 
    // update the alt id to align with the parent
    var newAltId = parentAltId + "-" + count;
    updateCapAltID(childCapId, newAltId);
 
    // update the record name to note the visit number
    var newAppName = "Visit #" + count;
    editAppName(newAppName, childCapId);
 
    return newAltId;
}

function updateCapAltID(vCapId, newAltId) {
    if (newAltId) {
        var result = aa.cap.updateCapAltID(vCapId, newAltId).getOutput();
        if (result) {
            logDebug("Update Alt ID Succesfully to: " + newAltId);
        } else {
            logDebug("Update Alt ID Failed.");
        }
    } else {
        logDebug("newAltId is null, cannot update record id.");
    }
}

function getInspSequenceNumber(vCapID, inspectionID) {
    var inspSequenceNumber = null;
    var inspectionResult = aa.inspection.getInspection(vCapID, inspectionID);
    if (inspectionResult.getSuccess()) {
        var inspectionModel = inspectionResult.getOutput().getInspection();
        var inspectionGroup = inspectionModel.getActivity().getInspectionGroup();
        var inspectionType = inspectionModel.getInspectionType();
        var inspectionTypesResult = aa.inspection.getInspectionType(inspectionGroup, inspectionType);
        if (inspectionTypesResult.getSuccess()) {
            var inspectionTypes = inspectionTypesResult.getOutput();
            if (inspectionTypes) {
                for (var i in inspectionTypes) {
                   var inspectionTypeModel = inspectionTypes[i];
                    if (inspectionTypeModel.getGroupCode().toUpperCase().equals(inspectionGroup.toUpperCase()) &&
                        inspectionTypeModel.getType().toUpperCase().equals(inspectionType.toUpperCase())) {
                        inspSequenceNumber = inspectionTypeModel.getSequenceNumber();
                    }
                }
            }
        } else {
            logDebug("Failed retrieving inspection Type: " + inspectionTypesResult.getErrorMessage());
        }
    }
    return inspSequenceNumber;
}

function getInspID(vCapId, insp2Check) {
    // warning, returns only the first scheduled occurrence
    var inspResultObj = aa.inspection.getInspections(vCapId);
    if (inspResultObj.getSuccess()) {
        var inspList = inspResultObj.getOutput();
        for (xx in inspList)
            if (String(insp2Check).equals(inspList[xx].getInspectionType()))
                return inspList[xx].getIdNumber();
    }
    return -1;
}

//Get failed guideSheet item list from the inspection.
function getFailGuideSheetItemList(vCapID, inspectionID, isCheckGuideItemCarryOverFlag) {
 
    var guideSheetList = aa.util.newArrayList();
    var guideSheetItemList = aa.util.newArrayList();
    var gGuideSheet;
    var itemsResult = aa.inspection.getInspections(vCapID);
    if (itemsResult.getSuccess()) {
        var inspectionScriptModels = itemsResult.getOutput();
        for (var k in inspectionScriptModels) {
            if (inspectionScriptModels[k].getIdNumber() == inspectionID) {
                var inspectionModel = inspectionScriptModels[k].getInspection();
                var gGuideSheetModels = inspectionModel.getGuideSheets();
                if (gGuideSheetModels.size() > 0) {
                    for (var i = 0; i < gGuideSheetModels.size(); i++) {
                        var gGuideSheetModel = gGuideSheetModels.get(i);
                        var guideSheetNumber = gGuideSheetModel.getGuidesheetSeqNbr();
                        var gGuideSheetItemModels = gGuideSheetModel.getItems();
                        if (gGuideSheetItemModels) {
                            for (var j = 0; j < gGuideSheetItemModels.size(); j++) {
                                var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
                                var guideSheetItemNumber = gGuideSheetItemModel.getGuideItemSeqNbr();
 
                                var spc = gGuideSheetItemModel.getServiceProviderCode();
                                var gsStatus = gGuideSheetItemModel.getGuideItemStatus();
                                var gsStatusGroup = gGuideSheetItemModel.getGuideItemStatusGroupName();
                                //Get the result type for the status.
                                var result = aa.guidesheet.getStatusResultType(spc, gsStatusGroup, gsStatus);
                                if (result.getSuccess()) {
                                    var gsStatusType = result.getOutput();
                                    if (gsStatusType == "DENIED") {
                                        guideSheetItemList.add(gGuideSheetItemModel);
                                    }
 
                                }
                            }
                        }
                    }
 
                    // add all failed items from all checklists to one new carry over checklist
                    if (guideSheetItemList.size() > 0) {

                        gGuideSheet = gGuideSheetModels.get(0).clone();
                        gGuideSheet.setItems(guideSheetItemList);
                        guideSheetList.add(gGuideSheet);
                    }
                } else {
                	logDebug("There is no guideSheets from this inspection: " + inspectionID);
                }
            }
        }
    }
 
    if (guideSheetItemList == null || guideSheetItemList.size() == 0) {
		    	logDebug("There is no failed guideSheetItems from the cap(" + vCapID + ") inspection(" + inspectionID + ").");
    }
    return gGuideSheet;
}

function copyFailedGSItemsToASIT(vCapId, guideSheetModelArr, asiTableName, violationReferralRules) {
	 
    var gsItems = guideSheetModelArr.toArray();
    var tableRowArray = new Array();
    var nxtRefDateASI = null;
 
    for (var loopi in gsItems) {
        var itemgroup = gsItems[loopi].getGuideType();
        var itemStatus = gsItems[loopi].getGuideItemStatus();
        var itemText = new String(gsItems[loopi].getGuideItemText());
        var itemComment =  gsItems[loopi].getGuideItemComment() || "";
        var itemTextClean = itemText.replace("(", "[");
        var itemTextParsed = String(itemTextClean.substr(0, itemTextClean.indexOf('[')));
        if (itemTextClean.indexOf('[') < 0) {
            // try with a dash
            itemTextParsed = itemText;
        }
 
        var vioDue = "";
        var row = new Array();
        logDebug("Checklist Item: " + itemText);
        logDebug("Checklist Item Status: " + itemStatus);
 
        /* Process the checklist ASI,
            - populate VIOLATIONS ASI table
            - create referral work orders
            - send referral emails
        */
        var gsASIArray = new Array();
        gsASIArray = loadGuideSheetItemsWASI(vCapId, inspId, itemgroup, itemText, row);
 
        row["Violation"] = new asiTableValObj("Violation", String(itemTextParsed), "Y");
        row["Status"] = new asiTableValObj("Status", String(itemStatus), "Y");
        row["Code"] = new asiTableValObj("Code", String(itemText), "Y");
        row["Inspector Comment"] = new asiTableValObj("Inspector Comment", String(itemComment), "Y");
 
        vioDue = gsASIArray["Violation Due Date"];
        if (vioDue != null) {
            row["Due Date"] = new asiTableValObj("Due Date", String(gsASIArray["Violation Due Date"]), "Y");
        }
        var origVioDate = gsASIArray["Original Violation Date"];
        logDebug("Original Violation Date: " + origVioDate);
 
        // execute referral
        if (itemStatus.indexOf("Referral")>-1) {
 
            var referralDate;
            logDebug("Searching for Violation Referral Rule for: " + itemTextParsed);
            // initialize violation rules
            var thisVioRule = violationReferralRules[itemTextParsed.trim()];
            if (thisVioRule != undefined) {
                var createWorkOrderType = thisVioRule.createWorkOrderType;
                var referralDaysOut = thisVioRule.referralDaysOut;
                if(itemStatus.indexOf("Emergency")>-1){
                    referralDaysOut=1;
                    logDebug("Emergency Referral - Overriding referral rules to schedule referral for 1 day out.")
                }
                var emailReferrals = thisVioRule.emailReferrals;
 
                if (createWorkOrderType && createWorkOrderType != undefined && createWorkOrderType != null) {
 
                    // set work order schedule date = today + referralDaysOut
                    var thisRefDate = dateAdd(null, referralDaysOut);
                    logDebug("Referral Days Out: " + referralDaysOut);
                    logDebug("Referral Date: " + thisRefDate);
 
                    logDebug("Work order type: " + createWorkOrderType);
 
                    // if emergency referral, create work order now
                    // TO DO: Work order will be created by batch for now
                    /*if(thisReferralType=="Work Order" && itemStatus =="Emergency Referral"){
 
                        // TO DO: Create Work Order
 
                        // Copy Custom Fields and APO
                        logDebug("Created work order: " + createWorkOrderType + ". Scheduled on: " + thisRefDate);
                    }*/
                   
                    
                    //var dateFormat = "MM/dd/yyyy";
                    //var thisRefDateString = aa.util.formatDate(thisRefDate, dateFormat);
                    row["Work Order Type"] = new asiTableValObj("Work Order Type", String(createWorkOrderType), "Y");
                    row["Referral Date"] = new asiTableValObj("Referral Date", String(thisRefDate), "N");
 
                }
 
                // referral type
                var thisReferralType="Work Order";
                if (emailReferrals && emailReferrals != undefined && emailReferrals != null) {
                    var thisToEmail;
                    for (er in emailReferrals) {
                        thisReferralType = emailReferrals[er].referralType;
                        thisToEmail = emailReferrals[er].email;
                        logDebug("Sending referral email to: " + thisReferralType + " - " + thisToEmail);
                    }
                }
                row["Referral Type"] = new asiTableValObj("Referral Type", String(thisReferralType), "Y");
 
            }
 
            if (vioDue != null && vioDue != undefined) {
                if (nxtRefDateASI == null || (new Date(nxtRefDateASI) > new Date(vioDue)))
                    nxtRefDateASI = vioDue;
            }
 
        }
 
        logDebug("-------------------------------------------------");
 
        // add the row to the VIOLATIONS table array
        tableRowArray.push(row);
    }
    logDebug("Number of Violations: " + tableRowArray.length);
    if (tableRowArray.length > 0) {
        removeASITable(asiTableName, vCapId);
        var asitModel;
        var new_asit;
        new_asit = addASITable(asiTableName, tableRowArray, vCapId);
    }
 
    // update the next refferal date custom field for batch script to pick up later
    if (nxtRefDateASI != null)
        editAppSpecific("Next Referral Date", nxtRefDateASI, vCapId);
 
}

function loadGuideSheetItemsWASI(vCapId, inspId, gsGroup, gsItem, row) {
	//
	// Returns an associative array of Guide Sheet Items
	// Optional second parameter, cap ID to load from
	//

	var retArray = new Array();

	var r = aa.inspection.getInspections(vCapId);

	if (r.getSuccess()) {

		var inspArray = r.getOutput();

		for (i in inspArray) {
			if (inspArray[i].getIdNumber() == inspId) {
				var inspModel = inspArray[i].getInspection();

				var gs = inspModel.getGuideSheets()

				if (gs) {
					var gsArray = gs.toArray();

					for ( var loopk in gsArray) {

						var gItems = gsArray[loopk].getItems().toArray();
						for (gI in gItems) {

							gsi = gItems[gI];

							var gsItemGroup = gsi.getGuideType();
							var gsItemStatus = gsi.getGuideItemStatus();
							var gsItemText = new String(gsi.getGuideItemText());
							var gsItemTextClean = gsItemText.replace("(", "[");
							var gsItemTextParsed = gsItemTextClean.substr(0,
									gsItemTextClean.indexOf('['));

							if (gsItemGroup.equals(gsGroup)
									&& gsItemText.equals(gsItem)) {
								//logDebug("Group: " + gsItemGroup + "  Guidesheet Item: " + gsItemText + "with status of " + gsItemStatus );

								var itemASISubGroupList = gsi
										.getItemASISubgroupList();

								//If there is no ASI subgroup, it will throw warning message.
								if (itemASISubGroupList != null) {
									//logDebug(" has ASIGROUP: ");

									var asiSubGroupIt = itemASISubGroupList
											.iterator();
									while (asiSubGroupIt.hasNext()) {
										var asiSubGroup = asiSubGroupIt.next();
										var asiItemList = asiSubGroup
												.getAsiList();
										if (asiItemList != null) {
											var asiItemListIt = asiItemList
													.iterator();
											while (asiItemListIt.hasNext()) {
												var asiItemModel = asiItemListIt
														.next();
												//logDebug("        " + asiItemModel.getAsiName() + " = " + asiItemModel.getAttributeValue());
												retArray[asiItemModel
														.getAsiName()] = asiItemModel
														.getAttributeValue();
											}
										}
									}

								} else {
									logDebug(" has NO ASIGROUP: ");
								}
							}
						}
					}
				}
				// if there are guidesheets
				else
					logDebug("No guidesheets for this inspection");

			} // if this is the right inspection
		} // for each inspection
	} // if there are inspections
	logDebug("loaded " + retArray.length + " guidesheet items");
	return retArray;
}

function cleanFailedGuidesheet(gsModel,gsTypeName) {
	 
    var cleanGuideSheetItemList = aa.util.newArrayList();
    var gGuideSheetModel = gsModel;
    var guideSheetNumber = gGuideSheetModel.getGuidesheetSeqNbr();
    var gGuideSheetItemModels = gGuideSheetModel.getItems();
    if (gGuideSheetItemModels) {
        for (var j = 0; j < gGuideSheetItemModels.size(); j++) {
            var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
            var guideSheetItemNumber = gGuideSheetItemModel.getGuideItemSeqNbr();
            var spc = gGuideSheetItemModel.getServiceProviderCode();
            var gsStatus = gGuideSheetItemModel.getGuideItemStatus();
            var gsStatusGroup = gGuideSheetItemModel.getGuideItemStatusGroupName();
 
            // clean up fields for copy guidesheet to follow up inspection
 
            // removing clear guidesheet item status at request of Ben Anderson
            //   so officers can easily see the previous status
            //gGuideSheetItemModel.setGuideItemStatus("");
 
            //fieldsToClear = "Violation Due Date";
            //var cleanGSItemModel = clearGuideSheetASIFields(gGuideSheetItemModel, fieldsToClear);
            //cleanGuideSheetItemList.add(cleanGSItemModel);
            cleanGuideSheetItemList.add(gGuideSheetItemModel);
 
        }
        if (gsTypeName) {
            gGuideSheetModel.setGuideType(gsTypeName);
        }
        gGuideSheetModel.setItems(cleanGuideSheetItemList);
        return gGuideSheetModel;
    }
   
 
}

function getNextVioDueDate(vCapId, guideSheetModelArr) {
    var gsItems = guideSheetModelArr.toArray();
    var tableRowArray = new Array();
    var nxtVioDueDate = null;
    var nxtVioDueDateStr = null;
 
    for (var loopi in gsItems) {
        var itemgroup = gsItems[loopi].getGuideType();
        var itemStatus = gsItems[loopi].getGuideItemStatus();
        var itemText = new String(gsItems[loopi].getGuideItemText());
        var itemTextClean = itemText.replace("(", "[");
        var itemTextParsed = itemTextClean.substr(0, itemTextClean.indexOf('['));
 
        if (itemTextClean.indexOf('[') < 0) {
            //use the full text
            itemTextParsed = itemText;
        }
        var vioDue = "";
        var row = new Array();
        var gsASIArray = new Array();
 
        //load guidesheet asi               
        gsASIArray = loadGuideSheetItemsWASI(vCapId, inspId, itemgroup, itemText, row);
        thisDueDate = gsASIArray["Violation Due Date"];
 
        // get the nearest due date to schedule the next inspection
        var thisDueDate;
        if (thisDueDate != null) {
            dtThisDueDate = new Date(thisDueDate);
            if (nxtVioDueDate == null) {
                nxtVioDueDate = dtThisDueDate;
                nxtVioDueDateStr = thisDueDate;
                logDebug("First due date found. Next Due Date: " + nxtVioDueDateStr);
            }
            if (dtThisDueDate < nxtVioDueDate) {
                nxtVioDueDate = dtThisDueDate;
                nxtVioDueDateStr = thisDueDate;
                logDebug("Existing due date < current due eate: " + dtThisDueDate + ">" + nxtVioDueDateStr);
            }
        }
    }
    return nxtVioDueDateStr;
}
 
function copyFailChecklistItemsToCurrentRecord(srcCapId, srcInspId, targetInspType, targetInspStatus, targetInspDaysOut, inspectorId, carryOverFailedItems, failedChecklistType, violationReferralRules, inspectionDisplayInACA) {



    //Get the InspSequenceNumber
    var inspSequenceNumber = getInspSequenceNumber(srcCapId, srcInspId);
    var newInspectionID;

         // determine days out
         var daysOut = 30;
         if(targetInspDaysOut!=undefined && targetInspDaysOut != null && targetInspDaysOut > -1){
             daysOut = targetInspDaysOut;
         }

               // schedule inspection 30 days out by default, will auto schedule later based on due date
               logDebug("Schedule and assign to same inspector: " + targetInspType + ", " + inspectorId);
               var schDate = dateAdd(null, daysOut);
               scheduleInspectDate(targetInspType, schDate);
               var newInspectionID = getInspID(capId, targetInspType);
               assignInspection(newInspectionID,inspectorId);
			    if(!isEmptyOrNull(inspectionDisplayInACA))
				{
				   if(parseInt(newInspectionID) > 0)
				   {
					   setInspectionDisplayInACA(capId, newInspectionID, inspectionDisplayInACA, null ) ;
				   }
				}

    // Get the failed guideSheetItem list from the inspection and cap.
    var isCheckGuideItemCarryOverFlag = false;
    var failGuidesheetModel = getFailGuideSheetItemList(srcCapId, srcInspId, isCheckGuideItemCarryOverFlag);

    if(failGuidesheetModel){
        // copy the failed items to ASIT
        copyFailedGSItemsToASIT(srcCapId, failGuidesheetModel.getItems(), "VIOLATIONS", violationReferralRules);

        var cleanFailGuidesheet = cleanFailedGuidesheet(failGuidesheetModel, "Current Violations");
        var guideSheetModels = aa.util.newArrayList();
        if(cleanFailGuidesheet) {
            logDebug("Failed guidesheet list is null.")
            guideSheetModels.add(cleanFailGuidesheet);

        }
        var copyResult = aa.guidesheet.copyGGuideSheetItems(guideSheetModels, srcCapId, newInspectionID, "ADMIN");
        if (copyResult.getSuccess()) {
            logDebug("Successfully copy guideSheet items to cap : " + srcCapId);
        } else {
            logDebug("Failed copy guideSheet items to cap: " + copyResult.getErrorMessage());
        }
        logDebug("*********************************************************************************");

        // auto schedule and assign the inspection based on next due date
        if (targetInspStatus.toUpperCase() == "PENDING") {
            //Create a pending Inspection on the new cap.

        } else {
            var nextDueDate = getNextVioDueDate(srcCapId, failGuidesheetModel.getItems());
            if (nextDueDate == null) {
                nextDueDate = dateAdd(nextDueDate, 30);
                logDebug("No Violation Due Date. Using default of 30+ days: " + nextDueDate);
            }
            //autoScheduleInspection(srcCapId, newInspectionID, new Date(nextDueDate));
        }
    }


    return failGuidesheetModel;
}

/**
 * Updates the setDisplayInACA and setIsRestrictView4ACA flags on an inspection
 *
 * @param {object} vCapId
 * @param {int} inspSeqNbr
 * @param {string} setDisplayInACA       , inspection default value equal 'Y'
 * @param {string} setIsRestrictView4ACA , inspection default value equal 'N'
 * @returns {boolean}
 */
 function setInspectionDisplayInACA(vCapId, inspSeqNbr, setDisplayInACA, setIsRestrictView4ACA){
    try {
  
        var funcName = "setInspectionDisplayInACA"
        var inspScriptModelResult = aa.inspection.getInspection(vCapId, inspSeqNbr);
        if (inspScriptModelResult.getSuccess()) {
            inspScriptModel = inspScriptModelResult.getOutput();
            inspModel = inspScriptModel.getInspection();
			var actModel = inspModel.getActivity();
			if(!isEmptyOrNull(setDisplayInACA))
				{
				actModel.setDisplayInACA(setDisplayInACA);
				logDebug( "Updated setDisplayInACA = " + actModel.getDisplayInACA());
				}
			if(!isEmptyOrNull(setIsRestrictView4ACA))
				{
				actModel.setIsRestrictView4ACA(setIsRestrictView4ACA);
				logDebug( "Updated setIsRestrictView4ACA = " + actModel.getIsRestrictView4ACA());
				}
			inspModel.setActivity(actModel);	
			var editInspResult = aa.inspection.editInspection(inspScriptModel)
			if (!editInspResult.getSuccess()) {
				logDebug(funcName + " WARNING: updating inspection '" + editInspResult.getErrorMessage() + "'");
				return false;
			} else {
				logDebug(funcName + " Successfully updated inspection '" + inspScriptModel.getInspectionType() + "'");
				return true;
			}
		
        } else {
            logDebug(funcName + " **ERROR: Could not get inspection from record. InspSeqNbr: " + inspSeqNbr + ". " + inspScriptModelResult.getErrorMessage());
        }
        
    } catch (e) {
            logDebug("ERROR: " + e);
    }
 }