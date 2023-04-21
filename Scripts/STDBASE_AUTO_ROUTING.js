/*==========================================================================================
Title : Auto Routing
Purpose : 
			- Create a parent record as it is configured in the JSON file.
			- Inspection and, possibly, follow-up inspection, are scheduled  as configured in the JSON file.
			- Newly created record should be routed to the department indicated in the JSON file. 
Author: Khalid Abdlqader
Functional Area : Record
Description : JSON must contain :
	"Licenses/Business/Retail/Application": {						//record type to run
		"ApplicationSubmitAfter":[{									//event to run (supports workflow task and status and inspection type and status); structured as an array, another set of rules can be added
			"preScript": "",										//custom script to run prior to scheduling script
			"criteria":{							
				"customFields": {										//custom fields to be used in script (more fields can be added, as needed)
					"Custom Field 1": "Value 1",
					"Custom Field 2": "Value 2"
				}
			},
			"action":{
				"relatedRecordRelation": "parent",								// To attach existing related record or the newly one with this relationship
				"fireASAEvent": true,									// Indicates if we should execute ASA event
				"routeToDept": "C&R Property Maintenance Enforcement",  // New record will be assigned to this department
				"newInspectionGroup": "ENF_PM",								// when there is now follow up inspection a new inspeaction will be created with this gorup				
				"newInspectionType": "New Complaint",						// inspection type for the new inspection created
				"newInspectionPending": false,								// is the new inspection pending or scheduled
				"inspectDaysAhead": 3,										// if inspection is scheduled will use this to obtain date
				"followUpRecordType": "Enforcement/Property Maintenance/Site Visit/NA", // record type to follow to check for follow up inspection
				"followUpRecordStatus": "Scheduled",									//  Record status to filter for follow up 
				"followUpInspectionType": "Follow-Up",									// follow up inspection type to use in follow up records
				"relatedRecords":{"Building/Permit/TRN6 AirCondition Horse Barn/ACHB": "In Progress"}		// record types to filter on
			}
			"postScript": ""							//custom script to run after the scheduling script
		}]
	}
- Available "relatedRecordRelation": parent, child	
- relatedRecords could have multiple keys and values		
================================================================================================================*/
try {

	//try to get CONFIGURABLE_SCRIPTS_COMMON from Non-Master, if not found, get from Master
	var configurableCommonContent = getScriptText("CONFIGURABLE_SCRIPTS_COMMON");
	if (configurableCommonContent && configurableCommonContent != null && configurableCommonContent != "") {
		eval(configurableCommonContent);
	} else {
		eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON", null, true));
	}

	var scriptSuffix = "AUTO_ROUTING";
	var settingsArray = [];
	if (isConfigurableScript(settingsArray, scriptSuffix)) {

		for (s in settingsArray) {
			var rules = settingsArray[s];

			var preScript = rules.preScript;
			if (!matches(preScript, null, "")) {
				eval(getScriptText(preScript));
			}
			if (cancelCfgExecution) {
				logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
				cancelCfgExecution = false;
				continue;
			}
			autoRouting(capId, rules);

			var postScript = rules.postScript;
			if (!matches(postScript, null, "")) {
				eval(getScriptText(postScript));
			}
		}
	}

} catch (ex) {
	logDebug("**ERROR: Exception with JSON rules for script " + scriptSuffix + ". Error: " + ex);
}
// functions

/**
 * function to search for address and auto route record.
 * @param capId
 * @param rules
 */
function autoRouting(capId,rules){
	for (var r in rules.action.relatedRecords) {
		var recordType = r;
		var recordStatus = rules.action.relatedRecords[r];
		var addrArray = aa.address.getAddressByCapId(capId).getOutput();
		var  validAddressFound = false;
		if (addrArray != null && addrArray.length > 0) {
			for (pa in addrArray) {
				if (addrArray[pa].getHouseNumberStart() == null || addrArray[pa]["streetName"] == "NA"){
					continue;
				}
	
				validAddressFound = true;
				var relatedAddressCapsArr = getRelatedCapsByAddressAttributes(addrArray[pa]["streetName"], addrArray[pa]["houseNumberStart"], addrArray[pa]["streetSuffix"], addrArray[pa]["streetDirection"]);
		
				checkAndCreateRecordExistsOnAddress(recordType,recordStatus,capId,rules, relatedAddressCapsArr);
			}
			if(!validAddressFound){
				logDebug("No valid address or valid asset found for this record.")
			}
		}else{
			return new Array();
		}
	}
	
}

/**
 * function to check if there is valid caps to be auto routed
 * @param recordType   	fetched from CONF actions relatedRecords object
 * @param recordStatus	fetched from CONF actions relatedRecords object
 * @param capId			Main record capId
 * @param rules			CONF actions
 * @param capIdsArray	Cap ids array fetched from related addresses
 */
function checkAndCreateRecordExistsOnAddress(recordType,recordStatus,capId, rules, capIdsArray) {

	var relationship = rules.action.relatedRecordRelation;
	var fireASAEvent = rules.action.fireASAEvent;
	var routeToDept = rules.action.routeToDept;
	var newInspectionGroup = rules.action.newInspectionGroup;
	var newInspectionType = rules.action.newInspectionType;
	var newInspectionPending = rules.action.newInspectionPending;
	var inspectDaysAhead = rules.action.inspectDaysAhead;
	var followUpRecordType = rules.action.followUpRecordType;
	var followUpRecordStatus = rules.action.followUpRecordStatus;
	var followUpInspectionType = rules.action.followUpInspectionType;
	

	var isRecordTypeExists = false;

	// if no records on address, no match found
	if (capIdsArray == null || capIdsArray.length <= 0) {
		// no records does exist at this address, create a new one
		isRecordTypeExists = false;
	} else {


		// records exist on this address, loop through and filter by type and status
		// do configuration for when we have existing records
		for (ca in capIdsArray) {
			
			var capIdValue = capIdsArray[ca].getCapID();

			var CurrentCap = aa.cap.getCap(capIdValue).getOutput();
			var CurrentCapType = CurrentCap.getCapType().toString();
			var CurrentCapStatus = CurrentCap.getCapStatus();

			if (String(recordType) == String(CurrentCapType) && String(recordStatus) == CurrentCapStatus) {
				isRecordTypeExists = true;

				if (!checkRelationRecordExists(recordType, relationship))
					break;
				

				if (relationship.toUpperCase() == "PARENT") {
					aa.cap.createAppHierarchy(capIdValue, capId);
				} else if (relationship.toUpperCase() == "CHILD") {
					var result = aa.cap.createAppHierarchy(capId, capIdValue);
				}


				if(followUpRecordType == null || followUpRecordType == undefined || followUpRecordType == '')
					continue;
				

				// get child follow up records
				var followUpRecordSearch = getChildren(followUpRecordType, capIdValue);

				for (f in followUpRecordSearch) {

					var followUpCapId = followUpRecordSearch[f];
					var followUpCap = aa.cap.getCap(followUpCapId).getOutput();
					var holdId = capId;
					capId = followUpCapId;
					
					// find the follow up record by followUpRecordStatus
					if (followUpCap.getCapStatus() == followUpRecordStatus) {
						// check if there is already a scheduled new inspection
						inspId = getScheduledInspId(newInspectionType);

						if (inspId) {
							break;
						}


						// look for a scheduled follow up inspection
						inspId = getScheduledInspId(followUpInspectionType);

						if (inspId) {

							// copy the follow up inspection to a new inspection and auto schedule
							var thisInspScript = aa.inspection.getInspection(followUpCapId, inspId).getOutput();
							var thisInspModel = thisInspScript.getInspection();
							thisInspModel.setInspectionType(newInspectionType);

							var copyResult = aa.inspection.copyInspectionWithGuideSheet(followUpCapId, followUpCapId, thisInspModel);
							if (!copyResult.getSuccess()) {
								logDebug("ERROR: Could not copy follow up inspection to new inspection: " + copyResult.getErrorMessage());
							} 


							// cancel the follow up inspection
							var cancelResult = aa.inspection.cancelInspection(followUpCapId, inspId);
							if (!cancelResult.getSuccess()) {
								logDebug("ERROR: Error canceling existing inspection: " + followUpInspectionType + ", " + inspId);
							} 
						} else {

							// catch all - schedule a new inspection if all else fails
							if (newInspectionPending && newInspectionType) {
								createPendingInspection(newInspectionGroup, newInspectionType, newId, "Auto Routed.");
								inspId = getPendingInspId(newInspectionType);
							} else {
								var schedDaysAhead = inspectDaysAhead || 0;
								scheduleInspection(newInspectionType, schedDaysAhead, currentUserID);
								inspId = getScheduledInspId(newInspectionType);
							}
						}

						if (inspId) {

							autoScheduleInspection(followUpCapId, inspId, new Date());
						}
					}
					capId = holdId;
				}
			}
		}
	}
	// no existing records
	// do configuration for when there are no existing records
	if (!isRecordTypeExists) {

		// check if we already have a relationship to eliminate duplicates when we don't have an address
		if (!checkRelationRecordExists(recordType, relationship))
			return;

		var recordArray = recordType.split("/");
		var appCreateResult = aa.cap.createApp(recordArray[0], recordArray[1], recordArray[2], recordArray[3], "");

		if (appCreateResult.getSuccess()) {
			var newId = appCreateResult.getOutput();
			if (relationship.toUpperCase() == "CHILD") {
				aa.cap.createAppHierarchy(capId, newId);
			} else if (relationship.toUpperCase() == "PARENT") {
				aa.cap.createAppHierarchy(newId, capId);
			}

			updateAppStatus(recordStatus, "By AUTO_ROUTE script", newId);


			copyAddresses(capId, newId);

			// Route to department
			if (routeToDept) {
				// assign initial workflow task to department
				assignCapToDept(routeToDept, newId);
			}


			// execute ASA for record
			if (fireASAEvent) {
				var newCap = aa.cap.getCap(newId).getOutput();
				aa.cap.runEMSEScriptAfterApplicationSubmit(newCap.getCapModel(), newId);
			}

		}
	}
}

/*==========================================================================================
| HELPER FUNCTIONS
========================================================================================== */


/**
 * function to assign department for cap
 * @param deptName   department name to be assigned for the cap
 */
function assignCapToDept(deptName) // option CapId
{
	var itemCap = capId
		if (arguments.length > 1)
			itemCap = arguments[1]; // use cap ID specified in args
		var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess()) {
		logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage());
		return false;
	}
	var cdScriptObj = cdScriptObjResult.getOutput();
	if (!cdScriptObj) {
		logDebug("**ERROR: No cap detail script object");
		return false;
	}
	cd = cdScriptObj.getCapDetailModel();
	var deptKey;
	var dpt = aa.people.getDepartmentList(null).getOutput();
	for (var thisdpt in dpt) {
		var m = dpt[thisdpt]
			//exploreObject(m);
			if (deptName.equals(m.getDeptName())) {
				deptKey = m.departmentModel;
				cd.setAsgnDept(deptKey);
				cdWrite = aa.cap.editCapDetail(cd)
					if (!cdWrite.getSuccess()) {
						logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage());
						return false;
					}
			}
	}
}


/**
 * function to check if there is any cap with a specific cap type already have a relation with current cap
 * @param CapType   cap type to be filtered on
 * @param relation 	to check if caps have this relation, values either "parent" or "CHILD"
 */
function checkRelationRecordExists(CapType, relation) {
	var valid = true;
	if (relation.toUpperCase() == "PARENT") {

		var currentParentsRecords = getParents(CapType);
		if (currentParentsRecords != null && currentParentsRecords.length > 0)
			valid = false;

	} else if (relation.toUpperCase() == "CHILD") {
		var currentChildsRecords = getChildren(CapType, capId);
		if (currentChildsRecords != null && currentChildsRecords.length > 0)
			valid = false;

	}
	return valid;
}

/**
 * function to auto schedule an inspection
 * @param vCapId   cap id to schedule inspection on it
 * @param inspSeqNbr 	inspection sequence number
 * @param date 	schedule date
 */
function autoScheduleInspection(vCapId, inspSeqNbr, date) {

    var inspModel;
    var inspScriptModel;
    var inspScriptModelResult = aa.inspection.getInspection(vCapId, inspSeqNbr);
    if (inspScriptModelResult.getSuccess()) {
        inspScriptModel = inspScriptModelResult.getOutput();
        inspModel = inspScriptModel.getInspection();
    } else {
        logDebug("**ERROR: Could not get inspection from record. InspSeqNbr: " + inspSeqNbr + ". " + inspScriptModelResult.getErrorMessage());
    }

    // work around required to set autoAssign = Y on new inspection (defaults to "N" when scheduled via script)
    var actModel = inspModel.getActivity();
    actModel.setAutoAssign("Y");
    inspModel.setActivity(actModel);

    inspModel.getActivity().setActivityDate(date);
    inspSchedDate = aa.util.formatDate(date, "MM/dd/yyyy");

    var assignSwitch = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.model.AssignSwitch").getOutput();

    assignSwitch.setGetNextAvailableTime(true);
    assignSwitch.setOnlyAssignOnGivenDate(false);
    assignSwitch.setValidateCutOffTime(false);
    assignSwitch.setValidateScheduleNumOfDays(false);
    assignSwitch.setAutoAssignOnGivenDeptAndUser(false);
    assignSwitch.setCheckingCalendar(true);
    var assignService = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.AssignInspectionBusiness").getOutput();

    var inspectionList = aa.util.newArrayList();
    inspectionList.add(inspModel);

    var specifiedDate = aa.proxyInvoker.newInstance("com.accela.aa.inspection.assign.model.SpecifiedDateTime").getOutput();
    specifiedDate.setDate(date)
    var result = assignService.autoAssign4AddOns(aa.getServiceProviderCode(), inspectionList, specifiedDate, assignSwitch);
    var assinfo = null;

    // last change made
    if (result.size() <= 0) {
        return false;
    }


    var atm = result.get(0);
    assinfo = atm;

    var errMsg = "";
    if (assinfo.flag == "S") {

        var inspector = assinfo.getInspector();
        var schedDate = assinfo.getScheduleDate();
        var schedDateScript = aa.date.getScriptDateTime(schedDate);
        inspScriptModel.setInspector(inspector);
       inspScriptModel.setScheduledDate(schedDateScript);

        var editInspResult = aa.inspection.editInspection(inspScriptModel)

        if (!editInspResult.getSuccess()) {
            logDebug("**ERROR re-assigning inspection " + editInspResult.getErrorMessage());
            return false;
        }
        return true;
    }

    if (assinfo.flag == "C") {
        logDebug("WARNING: Cut off will not allow to schedule.");

    }

    if (assinfo.flag == "U") {
        logDebug("WARNING: Unable to auto schedule and assign inspection.");
        switch (assinfo.resultType) {
            case 24:
                errMsg = "Auto assign is disabled for inspection.";
                break;
            case 25:
                errMsg = "Calendar not found.";
                break;
            case 23:
                errMsg = "Inspector not found.";
                break;
            case 22:
                errMsg = "End time is less than start time.";
                break;
            case 21:
                errMsg = "End time not available.";
                break;
            case 9:
                errMsg = "Inspection unit exceeded inspector max unit.";
            case 2:
                errMsg = "Next available time not found.";
                break;
            default:
                errMsg = "Cannot schedule.";
                break;
        }
        logDebug(errMsg);
    }

    if (assinfo.flag == "F") {
        logDebug("WARNING: Can not auto schedule and assign inspection. Calendar is full.");
        switch (assinfo.resultType) {
            case 4:
                errMsg = "Calendar Units full.";
                break;
            case 6:
                errMsg = "Calendar Inspection overlap.";
                break;
            case 10:
                errMsg = "Inspection Units Full";
                break;
            case 11:
                errMsg = "Inspection Inspection Overlap";
                break;
            case 5:
                errMsg = "Next inspection not found.";
                break;
            case 12:
                errMsg = "Issue with number of schedule days.";
            case 13:
                errMsg = "Not a working day";
            case 14:
                errMsg = "Scheduled time is not avaialble";
                break;
            case 15:
                errMsg = "Calendar daily units are full";
                break;
            case 16:
                errMsg = "Calendar event units are full.";
                break;
            default:
                errMsg = "";
                break;
        }
        logDebug(errMsg);
    }


    return assinfo;

}