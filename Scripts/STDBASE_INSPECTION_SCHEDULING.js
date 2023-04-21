/*==========================================================================================
Title : inspectionScheduling
Purpose : Schedules an inspection using the rules included in the JSON object. 
			Please see instructions in document InspectionScheduling Configurable Script Instructions.xlsx for important configuration information. 
Author: Nickie Albert
Functional Area : inspections
Description : JSON must contain :
	"Licenses/Business/Retail/Application": {						//record type to run
		"ApplicationSubmitAfter":[{									//event to run (supports workflow task and status and inspection type and status); structured as an array, another set of rules can be added
			"preScript": null,										//custom script to run prior to scheduling script
			"criteria":{
			    "isCreatedByACA": true,									//true or false
				"contactFields": {										//contact information (more fields can be added, as needed)
					"contactType": "Applicant",							//If other contact fields (ie. address, email, etc) are entered, they need to follow field name format for match to be made (see instructions) 
					"Custom Field": "Value"								// they need to follow field name format for match to be made (see instructions for available fields) 
				},													
				"customFields": {										//custom fields to be used in script (more fields can be added, as needed)
					"Custom Field 1": "Value 1",
					"Custom Field 2": "Value 2"
				},
				"customLists": [                                      //custom list fields (objects) to validate: tableName,columnName,value
			        {
			          "tableName": "tableName1",
			          "columnName": "columnName1",
			          "value": "val1"
			        },
			        {
			          "tableName": "tableName2",
			          "columnName": "columnName2",
			          "value": "value2"
			        }
			     ],
				"addressFields": {										//If other address fields (ie. house number, street name, etc) are entered
					"zip": "12345",										// they need to follow field name format for match to be made (see instructions for available fields) 
					"Custom Field": "Value"
				},
				"lpFields": {											//If other LP fields (ie. address1, lastRenewalDate, etc) are entered
					"licType": "Engineer",								// they need to follow field name format for match to be made (see instructions for available fields)
					"Custom Field": "Value"
				}
			},
			"action":{
				"inspectionType": "Initial Inspection",					//Inspection type to create,
				"feeItems": [
	            {                                                       //array of Fees to add
	              "schedule": "LIC_INSP",
	              "period": "FINAL",
	              "code": "INSP_001",
	              "qty": 1,
	              "invoice": "Y"
	            },
	            {
	              "schedule": "LIC_INSP",
	              "period": "FINAL",
	              "code": "INSP_002",
	              "qty": 3,
	              "invoice": "Y"
	            }
	          ],
			"rangeType":"Days",										//valid values are "Days" or "Months"
			"range": 14,											//number in rangeType (i.e., 30 Days, 2 Months, etc)
			"assignment":"Auto",									//how to assign an inspector, if "Auto", will use function autoAssign, if "Record", assign to person assigned to the record, if blank, will look for value in inspector field. If no value, will schedule w/o assignment.
			"inspector":"",											//specific inspector userid to assign inspection to, assignment field should be left blank
			"department":"",										//seven level structure of department (i.e., Agency/Licenses/Inspections/NA/NA/NA/NA)
			"updateXYCoordinatesFromAddress":true					//Updates X and Y Coordinates from the Address to the Inspection
			"scheduleDesiredDate":true								//Use the Desired Date when resulting an inspection as the date to schedule the next inspection
			"scheduleChecklistCustomFieldDate":"Correction Date"    //Use a Custom Date Field on the checklist item
			"copyGuideSheetItemsByStatus": ["Failed"]				//Copy Guide Sheet Items according to the array of statues over to the new inspection
			"comments": "Inspection Scheduled via EMSE",			//any comments to include on the inspection
		    "inspectionDisplayInACA": "N" ,                         //values: ("N" or "Y") , the default value equal 'Y'
		}
			"postScript": "CUSTOM_SCRIPT"							//custom script to run after the scheduling script
		},
	}],
Reviewed By: 
Script Type : (EMSE, EB, Pageflow, Batch): EMSE
General Purpose/Client Specific : General
Client developed for : Aurora
Parameters: capId, rules				
================================================================================================================*/
try {

	//try to get CONFIGURABLE_SCRIPTS_COMMON from Non-Master, if not found, get from Master
	var configurableCommonContent = getScriptText("CONFIGURABLE_SCRIPTS_COMMON");
	if (configurableCommonContent && configurableCommonContent != null && configurableCommonContent != "") {
		eval(configurableCommonContent);
	} else {
		eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON", null, true));
	}

	var scriptSuffix = "INSPECTION_SCHEDULING";
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
			inspectionScheduling(capId, rules);

			var postScript = rules.postScript;
			if (!matches(postScript, null, "")) {
				eval(getScriptText(postScript));
			}
		}
	}

} catch (ex) {
	logDebug("**ERROR: STDBASE_INSPECTION_SCHEDULING Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex +" line " + ex.lineNumber);
}
// functions

function inspectionScheduling(capId, rules) {

	var inspecType = rules.action.inspectionType;
	var feeItems = rules.action.feeItems;
	var createdByACA = rules.criteria.isCreatedByACA;
	

	var rangeType = rules.action.rangeType;
	var range = rules.action.range;
	var assignment = rules.action.assignment;
	var inspector = rules.action.inspector;
	var dept = rules.action.department;
	var comments = rules.action.comments;

	var copyGuideSheetItems = rules.action.copyGuideSheetItems;
	var updateXYCoordinatesFromAddress = rules.action.updateXYCoordinatesFromAddress;
	var scheduleDesiredDate = rules.action.scheduleDesiredDate;
	var scheduleChecklistCustomFieldDate = rules.action.scheduleChecklistCustomFieldDate;
	var scheduleChecklistItemStatus = rules.action.scheduleChecklistItemStatus;
	var inspectionDisplayInACA = rules.action.inspectionDisplayInACA;
	logDebug("updateXYCoordinatesFromAddress: " + updateXYCoordinatesFromAddress);
	logDebug("scheduleDesiredDate: " + scheduleDesiredDate);
	logDebug("scheduleChecklistCustomFieldDate: " + scheduleChecklistCustomFieldDate);
	// rules loop 
	logDebug("createdByACA: " + createdByACA);
	logDebug("isCreatedByACA: " + cap.isCreatedByACA());

	var schedule = true;
	if (!isEmptyOrNull(createdByACA)) {
		if (createdByACA && cap.isCreatedByACA()) {
			schedule = true;
		}
		if (createdByACA && !cap.isCreatedByACA()) {
			schedule = false;
		}
		if (!createdByACA && !cap.isCreatedByACA()) {
			schedule = true;
		}
		if (!createdByACA && cap.isCreatedByACA()) {
			schedule = false;
		}

	} else { // field not exist, so not a factor
		schedule = true;
	}

	logDebug("schedule: " + schedule);

	/*==========================================================================================
	|  all tests complete - schedule and assign inspection
	======================================================================================= */

	if (schedule) {
		//recId = getApplication(capId);

		//logDebug("should be in here: " + schedule);
		// get # of days out to schedule
		var daysToSched = 0
		var checkListScheduleDatesArray = new Array();
		var today = new Date(aa.util.now());

		// Use the Desired Date from the resulting of and inspection on the InspectionResultSubmitAfter event
		if(scheduleDesiredDate && controlString.indexOf("InspectionResultSubmitAfter") > -1){			
			var activity = inspObj.getInspection().getActivity();
			var desiredDateObj = activity.getDesiredDate();

			if(!matches(desiredDateObj,null,"")){
				var pDesiredDate = new Date(desiredDateObj.getTime());
				daysToSched = dateDiff(today, pDesiredDate).toFixed();
				logDebug("(Inspection Scheduling) Desired Date : " + pDesiredDate + " : Days Out to Schedule  = " + daysToSched);
			}
			else{
				logDebug("(Inspection Scheduling) Desired Date not found on Inspection");
			}
		}

		if(scheduleChecklistCustomFieldDate && controlString.indexOf("InspectionResultSubmitAfter") > -1){
			var nearestChecklistDate

			var gsoArry = getGuideSheetObjects(inspId);
			for (x in gsoArry){
				gsi = gsoArry[x];
				gsi.loadInfo(); 

			//exploreObject(gsi);


			var rowVals = new Array();
			
			if(exists(gsi.status,scheduleChecklistItemStatus) && gsi.validInfo) {
				logDebug("Guidesheet Item Text = " + gsi.text);
				logDebug("Guidesheet Item Status = " + gsi.status);
				logDebug("Custom Filed Correction Date = " + gsi.info[scheduleChecklistCustomFieldDate]);
				var checkListCustomFieldDate = gsi.info[scheduleChecklistCustomFieldDate];
				if(typeof(checkListCustomFieldDate) != "undefined" ){
					logDebug("checkListScheduleDatesArray.push(" + checkListCustomFieldDate +")")
					checkListScheduleDatesArray.push(checkListCustomFieldDate);
				}

			}
		}

		// sort the list and get the next date
        if (checkListScheduleDatesArray.length > 0) {
            // Sort by schedule date DESC
            checkListScheduleDatesArray.sort(function (a, b) {
                return new Date(a) - new Date(b);
            });

            nearestChecklistDate = checkListScheduleDatesArray[0];
			logDebug("nearestChecklistDate = " + nearestChecklistDate);
            daysToSched = dateDiffLocal(today, nearestChecklistDate).toFixed();
			logDebug("DaysToSched = " + daysToSched);
            
        }
        
			
		}

		if (!matches(range, null, "", 0) && daysToSched == 0) {
			if (rangeType != "Days") {
				if (rangeType = "Months") {
					var outDate = addMonths(today, range);
					daysToSched = dateDiff(today, outDate).toFixed();
				} 
				else {
					logDebug("(Inspection Scheduling) Unsupported rangeType");
				}
			} else {
				daysToSched = range;
			}
		}

		var newInspID

		switch (assignment) {
		case "Auto":
			newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, "", "", comments);
			autoAssignInspection(newInspID);
			break;
		case "":
			// if assignment is blank, look for a value in the inspector field and assign to them 
			// if no value, schedule w/o assignment
			if (!matches(inspector, null, "")) {
				//scheduleInspection(inspecType, daysToSched, inspector, "", comments);
				newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, inspector, "", comments);
				//logDebug("inspector: " + inspector);
			} else {
				// logDebug("inspector: " + inspector);
				// logDebug("inspecType: " + inspecType);
				newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, "", "", comments);
			}
			break;
		case "Record":
			// if assignment = Record, schedule and assign to the record holder
			capDetail = aa.cap.getCapDetail(capId).getOutput();
			userObj = aa.person.getUser(capDetail.getAsgnStaff());
			if (userObj.getSuccess()) {
				staff = userObj.getOutput();
				userID = staff.getUserID();
				logDebug("(Inspection Scheduling) Recocord UserID: " + userID);
				newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, userID, "", comments);
			} else {
				newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, "", "", comments);
			}
			break;
		case "LastInspector":
			if(controlString.indexOf("InspectionResultSubmitAfter") > -1 && !matches(inspObj, null, "")){
				
					var vInspInspectorObj = inspObj.getInspector();
					if (vInspInspectorObj) {
						var vInspInspector = vInspInspectorObj.getUserID();
						newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, vInspInspector, "", comments);
					}
				
			}
			else{
				var lastInspId = getLastInspectorLocal(inspecType,capId);
				if(lastInspId){
					newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, lastInspId, "", comments);
				}
				else{
					newInspID = scheduleInspectionLocal(capId, inspecType, daysToSched, "", "", comments);
				}
			}
			

		default:
			break;
		} // switch

		if(updateXYCoordinatesFromAddress){
			var fcapAddressObj = null;
			var capAddressResult = aa.address.getAddressWithAttributeByCapId(capId);
			var address
			var addressesArr = new Array();
			logDebug("updateXYCoordinatesFromAddress: capAddressResult = " + capAddressResult.getSuccess());

			if (capAddressResult.getSuccess()) {
				fcapAddressObj = capAddressResult.getOutput();
				var primaryAddress;
				if (fcapAddressObj && fcapAddressObj.length > 0) {
					
					var index = 0;
					for (i in fcapAddressObj) {
						address = fcapAddressObj[i];
						if(address.getPrimaryFlag() == "Y" || index == 0){
							primaryAddress = address;
							if(index != 0){
								break;
							}
						}
					}
					if(inspId && controlString.indexOf("InspectionScheduleAfter") > -1){
						newInspID = inspId;
					}

					if (primaryAddress && newInspID) {
						var lat = parseFloat(primaryAddress.getYCoordinator());
						var long = parseFloat(primaryAddress.getXCoordinator());

						logDebug("lat: " + lat);
						logDebug("long: " + long);

						var insp = aa.inspection.getInspection(capId, newInspID).getOutput();
						var activity = insp.getInspection().getActivity();

						var inspLat = parseFloat(activity.getLatitude());
						var inspLong = parseFloat(activity.getLongitude());

						logDebug("inspLat: " + inspLat);
						logDebug("inspLong: " + inspLong);

						//_exploreObject(activity);

						if (lat && lat != "" && !(inspLat && inspLat != "")) {
							activity.setLatitude(lat);
						}
						if (long && long != "" && !(inspLong && inspLong != "")) {
							activity.setLongitude(long);
						}
						result = aa.inspection.editInspection(insp);

						if (result.getSuccess()) {
							logDebug("(Inspection Scheduling) Successfully updated inspection Lat/Long: " + inspType)
						} else {
							logDebug("**WARNING could not edite inspection : " + inspType + ", " + resultResult.getErrorMessage());
						}
					}
				}
			} else {
				logDebug("**ERROR: Failed to get Address object: " + capAddressResult.getErrorType() + ":" + capAddressResult.getErrorMessage());
			}
		}

		if(copyGuideSheetItems){
			try {
				
				var gsStatusArr = copyGuideSheetItems.guideSheetItemStatus; // Failed statues to check i.e. ['Fail']
				var gsStatusTypesArr = copyGuideSheetItems.guideSheetItemTypeStatus
				var svArr = new Array();
				var inspResultObj = aa.inspection.getInspections(capId);
				var copyResult
				if (inspResultObj.getSuccess()) {
					inspList = inspResultObj.getOutput();
					for (inspIdx in inspList) {
						if (inspList[inspIdx].getInspectionType() == inspType && inspList[inspIdx].getInspectionStatus().toUpperCase() != "PENDING" && 
						inspList[inspIdx].getInspectionStatus().toUpperCase() != "SCHEDULED" && inspList[inspIdx].getInspectionStatus().toUpperCase() != "CANCELLED") {
							svArr.push(inspList[inspIdx]);
						}
					}
				} else {
					logDebug("Error: get cap inspections: " + inspResultObj.getErrorMessage());
				}
				if (svArr.length > 0) {
					// Sort by schedule date DESC
					svArr.sort(function (a, b) {
						return (b.getIdNumber() - a.getIdNumber());
					});
					
					copyResult = copyGuideSheetItemsByStatus(svArr[0].getIdNumber(), newInspID, gsStatusArr, gsStatusTypesArr, capId);
				}

				if(copyResult){
					logDebug("(Inspection Scheduling) Successfully copied guideSheet items");
				}else{
					logDebug("(Inspection Scheduling) Copy guideSheet items failed");
				}
				
			} catch (e) {
				logDebug("(Inspection Scheduling) copyGuideSheetItems exception");
				showDebug = true;
				showMessage = true;
				logDebug(e);
			}

		}
		}

		//add Fees
		if (!isEmptyOrNull(feeItems)) {
			for (f in feeItems) {
				var feeItm = feeItems[f];
				updateFee(feeItm.code, feeItm.schedule, feeItm.period, feeItm.qty, feeItm.invoice);
			}
		}
		
	if(!isEmptyOrNull(inspectionDisplayInACA) )
	{
		setInspectionDisplayInACA(capId, inspId, inspectionDisplayInACA, null) ;
	}
		
	}//okToSched	

/*==========================================================================================
| HELPER FUNCTIONS
========================================================================================== */

function addMonths(date, count) {
	if (date && count) {
		var m, d = (date = new Date(+date)).getDate()

		date.setMonth(date.getMonth() + count, 1)
		m = date.getMonth()
		date.setDate(d)
		if (date.getMonth() !== m)
			date.setDate(0)
	}
	return date
}

function dateDiffLocal(date1, date2) {
	if(typeof(date1)!="undefined" && typeof(date2)!="undefined"){
		return (convertDate(date2).getTime() - convertDate(date1).getTime()) / (1000 * 60 * 60 * 24);
	}
	else{
		logDebug("dateDiff Warning undefined: date1 = " + date1 + " date2 = " + date2);
	}
    
}

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

function scheduleInspectionLocal(itemCap, iType, DaysAhead) // optional inspector ID.  This function requires dateAdd function
{
	// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110) 
	// DQ - Added Optional 5th parameter inspComm ex. to call without specifying other options params scheduleInspection("Type",5,null,null,"Schedule Comment");
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "Scheduled via Script";
	if (arguments.length >= 3)
		if (arguments[3] != null) {
			var inspRes = aa.person.getUser(arguments[3])
			if (inspRes.getSuccess())
				var inspectorObj = inspRes.getOutput();
		}

	if (arguments.length >= 4)
		if (arguments[4] != null)
			inspTime = arguments[4];

	if (arguments.length == 5)
		if (arguments[5] != null)
			inspComm = arguments[5];

	var schedRes = aa.inspection.scheduleInspection(itemCap, inspectorObj, aa.date.parseDate(dateAdd(null, DaysAhead)), inspTime, iType, inspComm)
	var inspScheduledId

	if (schedRes.getSuccess()){
		inspScheduledId = schedRes.getOutput()
		logDebug("Successfully scheduled inspection: ID " +inspScheduledId + " Type " + iType + " for " + dateAdd(null, DaysAhead));
	}
	else{
		logDebug("**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}
	return inspScheduledId;
		
}

function getApplication(appNum)
//
// returns the capId object of an application
//
{
	var getCapResult = aa.cap.getCapID(appNum);
	if (getCapResult.getSuccess())
		return getCapResult.getOutput();
	else {
		logDebug("**ERROR: getting cap id (" + appNum + "): " + getCapResult.getErrorMessage())
	}
}

function getLastInspectorLocal(insp2Check,pCapId)
	// function getLastInspector: returns the inspector ID (string) of the last inspector to result the inspection.
	//
	{
	var inspResultObj = aa.inspection.getInspections(pCapId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		
		inspList.sort(compareInspDateDesc)
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && !inspList[xx].getInspectionStatus().equals("Scheduled"))
				{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
				return inspUserObj.getUserID();
				}
		}
	return null;
	}

function compareInspDateDesc(a, b) {
	if (a.getScheduledDate() == null && b.getScheduledDate() == null) {
		return false;
	}
	if (a.getScheduledDate() == null && b.getScheduledDate() != null) {
		return true;
	}
	if (a.getScheduledDate() != null && b.getScheduledDate() == null) {
		return false;
	}
	return (a.getScheduledDate().getEpochMilliseconds() < b.getScheduledDate().getEpochMilliseconds());
} 

function copyGuideSheetItemsByStatus(fromInspId, toInspId, statusArray, statusTypesArray) {
	try {
		//use capId by default
		var itemCap = capId;
		//previous inspection and current inspection
		var pInsp, cInsp;

		var allStatuses = false;
		var allStatusesTypes = false;

		if (!allStatuses || statusArray.length == 0 || exists("ALL", statusArray)) {
			allStatuses = true;
		}
		if (!allStatusesTypes || statusTypesArray.length == 0 || exists("ALL", statusTypesArray)) {
			allStatusesTypes = true;
		}

		//optional capId
		if (arguments.length > 4) itemCap = arguments[4];

		//Get inspections
		var insps = aa.inspection.getInspections(itemCap).getOutput();
		if (!insps || insps.length == 0) return false;

		for (var i in insps) {
			if (insps[i].getIdNumber() == fromInspId) {
				pInsp = insps[i].getInspection();
			}
			else if (insps[i].getIdNumber() == toInspId) {
				cInsp = insps[i].getInspection();
			}
		}

		//If cannot find inspections then return false
		if (!pInsp || !cInsp) return false;

		//Clear the guidesheet items on current inspection before copying
		var gGuideSheetBusiness = aa.proxyInvoker.newInstance("com.accela.aa.inspection.guidesheet.GGuideSheetBusiness").getOutput();
		if (!gGuideSheetBusiness) {
			throw "Could not invoke GGuideSheetBusiness";
		}
		gGuideSheetBusiness.removeGGuideSheetByCap(itemCap, toInspId, aa.getAuditID());

		//exploreObject(gGuideSheetBusiness);
		//exploreObject(aa.guidesheet);

		//if previous inspection has no guidesheet then theres nothing to copy
		if (!pInsp.getGuideSheets() || pInsp.getGuideSheets().size() == 0) return false;

		// Copy prev guidesheets
		var gsArr = pInsp.getGuideSheets().toArray();
		var guideSheetList = aa.util.newArrayList();
		for (gsIdx in gsArr) {
			var gGuideSheetModel = gsArr[gsIdx];
			var guideSheetItemList = aa.util.newArrayList();
			var gGuideSheetItemModels = gGuideSheetModel.getItems();
			if (gGuideSheetItemModels) {
				for (var j = 0; j < gGuideSheetItemModels.size(); j++) {
                    var gGuideSheetItemModel = gGuideSheetItemModels.get(j);
                    var gGuideItemStatus = gGuideSheetItemModel.getGuideItemStatus();
                    var gGuideSheetStatusGroupName = gGuideSheetItemModel.getGuideItemStatusGroupName();
					var guideSheetResultTypeObj;
					var guideSheetResultType;
                    if(gGuideSheetStatusGroupName){
						logDebug("gGuideSheetStatusGroupName = " + gGuideSheetStatusGroupName);
						logDebug("gGuideItemStatus = " + gGuideItemStatus);
						guideSheetResultTypeObj  = aa.guidesheet.getStatusResultType(aa.getServiceProviderCode(), gGuideSheetStatusGroupName, gGuideItemStatus);
						guideSheetResultType = guideSheetResultTypeObj.getOutput();
						logDebug("guideSheetResultType = " + guideSheetResultType);
                    }
					if ((exists(gGuideItemStatus, statusArray) || allStatuses) && (exists(guideSheetResultType, statusTypesArray) || allStatusesTypes)){
						guideSheetItemList.add(gGuideSheetItemModel);
                    }
				}
			}

			if (guideSheetItemList.size() > 0) {
				var gGuideSheet = gGuideSheetModel.clone();
				gGuideSheet.setItems(guideSheetItemList);
				guideSheetList.add(gGuideSheet);
			}
		}
		if (guideSheetList.size() > 0) {

			var copyResult = aa.guidesheet.copyGGuideSheetItems(guideSheetList, itemCap, parseInt(toInspId), aa.getAuditID());
			if (copyResult.getSuccess()) {
				logDebug("Successfully copy guideSheet items");
				return true;
			} else {
				logDebug("Failed copy guideSheet items. Error: " + copyResult.getErrorMessage());
				return false;
			}
		}
	}
	catch (e) {
		showDebug = true;
		showMessage = true;
		logDebug(e);
	}
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