/*------------------------------------------------------------------------------------------------------/
| Program		: STDBASE_PROJECT_AUTOMATION .js
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
  "EnvHealth/Temporary Event/Base/Permit": {
	"WorkflowTaskUpdateAfter": [
	  {
		"metadata": {
		  "description": "update workflow task, task status and application status on child record."
		},
		"preScript": "",
		"criteria": {
		  "recordLevel": "child", // Related record type level 'child' or 'parent' 
		  "recordType": [
			"EnvHealth/Temporary Event/Booth/NA"   //check type of related record for property 'recordLevel',if empty [], the automation will ignore this condition. 
		  ], 
		  "wfTask": [
			"Inspection" 
		  ],
		  "wfStatus": [
			"Permit Closed"
		  ]    
		 "Renewal": true,  		  
		},
		"action": {	
			"updateTask": 
			 {
			   "task": "Status",
			   "status": "Closed"
			 }
		   ,
			"updateAppStatus": "Closed",
			"cancelAllInspections" : true,
			"customFieldToUpdate": [
				{
				"customFieldName": "name of ASI field that has to updated",  
				"newValue":"static value", 
				"fromCustomFieldName": "dynamic value, read the value from the current record ASI field and set the value to related record"
				},
				]
		},
		"postScript": ""
	  }
	]
  }
}
*/
try {

	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
	var scriptSuffix = "PROJECT_AUTOMATION";
	var settingsArray = [];
	logDebug("before call isConfigurableScript ");
	isConfigurableScript(settingsArray, scriptSuffix);
	logDebug("after call isConfigurableScript " + capId);
	
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
		projectAutomation(rules);
		if (!isEmptyOrNull(rules.postScript)) {
			eval(getScriptText(rules.postScript, null, false));
		}
	}


} catch (ex) {
	logDebug("**ERROR: Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex);
}

function projectAutomation(rules) {
	var recordType = rules.criteria.recordType
	var matchCapArr = [];
	var recordLevel = rules.criteria.recordLevel;
	var isRenewal = false;

	if (rules.criteria.hasOwnProperty("Renewal")) {
		var renewal = rules.criteria.Renewal;
		if (renewal) {
			isRenewal = true;
		}
	}


	if (!isEmptyOrNull(recordLevel)) {
		if (recordLevel == "child") {
			getMatchChildCapArr(capId, recordType, isRenewal, matchCapArr);
		}
		else if (recordLevel == "parent") {
			getMatchParentCapArr(capId, recordType, isRenewal, matchCapArr);
		}
		else {
			logDebug("**WARNING:The value of the JSON property 'recordLevel' must be either 'child' or 'parent'.");
			return;
		}
	}
	else {
		logDebug("**ERROR:Please define the JSON property 'recordLevel' to the config file.");
	}

	if (matchCapArr.length > 0) {
		var currentCapId = capId;
		if (rules.action.hasOwnProperty("updateTask")) {
			var updateTask = rules.action.updateTask;
			if (!isEmptyOrNull(updateTask)) {
				if (!isEmptyOrNull(updateTask.task) && !isEmptyOrNull(updateTask.status)) {
					updateWorkflowTaskAndStatus(matchCapArr, updateTask.task, updateTask.status);
				}
			}
		}
		if (rules.action.hasOwnProperty("updateAppStatus")) {
			var newAppStatus = rules.action.updateAppStatus;
			if (!isEmptyOrNull(newAppStatus)) {
				updateApplicationStatus(matchCapArr, newAppStatus)
			}
		}
		if (rules.action.hasOwnProperty("cancelAllInspections")) {
			var cancelAllInspections = rules.action.cancelAllInspections;
			if (!isEmptyOrNull(cancelAllInspections) && cancelAllInspections) {
				_cancelAllInspections(matchCapArr);
			}
		}
		if (rules.action.hasOwnProperty("customFieldToUpdate")) {
			var customFieldToUpdate = rules.action.customFieldToUpdate;
			_customFieldToUpdate(matchCapArr, customFieldToUpdate)
		}
	}
}

/**
 * Returns an array of match child cap IDs by capId and child cap type  
 * @param {object} _capId
 * @param  {array} capTypeArr
 * @param  {Boolean} _isRenewal
 * @return {array} match child cap IDs
 */
function getMatchChildCapArr(_capId, capTypeArr, _isRenewal, _matchCapArr) {
	var childCapList = null;
	if (!_isRenewal) {
		if (aa.cap.getChildByMasterID(_capId).getSuccess()) {
			childCapList = aa.cap.getChildByMasterID(_capId).getOutput();
		}
	}
	else {
		if (aa.cap.getProjectByMasterID(capId, "Renewal", null).getSuccess()) {
			childCapList = aa.cap.getProjectByMasterID(capId, "Renewal", null).getOutput();
		}
	}

	
	if (childCapList != null) {

		for (var i = 0; i < childCapList.length; i++) {
			var childCapID = childCapList[i].getCapID();
			var childCapType  = aa.cap.getCap(childCapID).getOutput().getCapType().toString();
			//var childCapType = childCapList[i].getCapType() + "";
			var childCapTypeArr = childCapType.toString().split("/");
			var childGroup = childCapTypeArr[0];
			var childType = childCapTypeArr[1];
			var childSubtype = childCapTypeArr[2];
			var childCategory = childCapTypeArr[3];
			if (capTypeArr.length == 0) {
				_matchCapArr.push(childCapID);
				logDebug("The child record Id [" + childCapID + "] custom ID [" + childCapID.getCustomID() + "] is added to matchCapArr");
			}
			else {
				for (var j = 0; j < capTypeArr.length; j++) {
					var filterType = capTypeArr[j];
					var arrRecordPath = filterType.split("/");
					var filterGroup = arrRecordPath[0];
					var filterType = arrRecordPath[1];
					var filterSubType = arrRecordPath[2];
					var filterCategory = arrRecordPath[3];
					var skipCheckgroup = ((filterGroup == "*") ? true : false);
					var skipCheckType = ((filterType == "*") ? true : false);
					var skipCheckSubType = ((filterSubType == "*") ? true : false);
					var skipCheckCategory = ((filterCategory == "*") ? true : false);
					if (
						(skipCheckgroup || (filterGroup == childGroup)) &&
						(skipCheckType || (filterType == childType)) &&
						(skipCheckSubType || (filterSubType == childSubtype)) &&
						(skipCheckCategory || (filterCategory == childCategory))
					) {
						_matchCapArr.push(childCapID);
						logDebug("The child record Id [" + childCapID + "] custom ID [" + childCapID.getCustomID() + "] is added to matchCapArr");
					}
				}
			}
		}
	}
	return _matchCapArr;
}

/**
 * Returns an array of match parent cap IDs by capId and parent cap type  
 * @param {object} _capId
 * @param  {array} capTypeArr
 * @param  {Boolean} _isRenewal 
 * @return {array} match parent cap ID
 */
function getMatchParentCapArr(_capId, capTypeArr, _isRenewal, _matchCapArr) {
	var parentCapID = null;
	if (!_isRenewal) {
		parentCapID = getParentByCapId(_capId);
	}
	else {
		if (!isPublicUser) {
			parentCapID = getParentCapID4Renewal();
		}
		else {
			parentCapID = getParentCapId4ACA(_capId);
		}
	}

	if (parentCapID != null && parentCapID != false) {
		logDebug("parentCapID != null ")
		var parentCustomID = parentCapID.getCustomID();
		logDebug("parentCustomID=" + parentCustomID);
		logDebug("parentCapID class:" + parentCapID.getClass());
		var parnetCap = aa.cap.getCap(parentCapID).getOutput();
		logDebug("parnetCap class:" + parnetCap.getClass());
		var ParentCapType = parnetCap.getCapType();
		var parentAppTypeString = ParentCapType.toString();
		var parentCapTypeArr = parentAppTypeString.toString().split("/");
		var parentGroup = parentCapTypeArr[0];
		var parentType = parentCapTypeArr[1];
		var parentSubtype = parentCapTypeArr[2];
		var parentCategory = parentCapTypeArr[3];

		if (capTypeArr.length == 0) {
			_matchCapArr.push(parentCapID);
			logDebug("The parent record Id:" + parentCapID.getCustomID() + " is added to matchCapArr");
		}
		else {
			for (var j = 0; j < capTypeArr.length; j++) {

				var filterType = capTypeArr[j];
				var arrRecordPath = filterType.split("/");
				var filterGroup = arrRecordPath[0];
				var filterType = arrRecordPath[1];
				var filterSubType = arrRecordPath[2];
				var filterCategory = arrRecordPath[3];
				var skipCheckgroup = ((filterGroup == "*") ? true : false);
				var skipCheckType = ((filterType == "*") ? true : false);
				var skipCheckSubType = ((filterSubType == "*") ? true : false);
				var skipCheckCategory = ((filterCategory == "*") ? true : false);
				if (
					(skipCheckgroup || (filterGroup == parentGroup)) &&
					(skipCheckType || (filterType == parentType)) &&
					(skipCheckSubType || (filterSubType == parentSubtype)) &&
					(skipCheckCategory || (filterCategory == parentCategory))
				) {
					_matchCapArr.push(parentCapID);
					logDebug("The parent record Id:" + parentCapID.getCustomID() + " is added to matchCapArr");
				}
			}

		}

	}
	return _matchCapArr;
}

/**
 * update Workflow status value by Workflow task name and cap array 
 * @param {array} matchCapArr
 * @param  {string} WFtask
 * @return {string} WFtaskStatus 
 */
function updateWorkflowTaskAndStatus(matchCapArr, WFtask, WFtaskStatus) {
	var currentCapId = capId;
	try {
		for (var index in matchCapArr) {
			capId = matchCapArr[index];
			// this to check the new WF task exists and active before update the WF status 
			var _isTaskActive = isTaskActive(WFtask);
			//this to reset the capId value to the current cap Id value after call 'isTaskActive' function.
			capId = currentCapId;
			if (_isTaskActive) {
				var taskResult = aa.workflow.getTask(matchCapArr[index], WFtask);
				var currentTask = taskResult.getOutput();
				currentTask.setSysUser(aa.person.getCurrentUser().getOutput());
				currentTask.setDisposition(WFtaskStatus);
				var updateResult = aa.workflow.handleDisposition(currentTask.getTaskItem(), matchCapArr[index]);
				if (updateResult.getSuccess()) {
					logDebug("Successfully updated the workflow task '" + WFtask + "' to workflow status '" + WFtaskStatus + "' for the record Id: " + matchCapArr[index].getCustomID());
				}
				else {
					logDebug("**WARNING: The workflow task '" + WFtask + "' is not matched with workflow status '" + WFtaskStatus + " for the record Id: " + matchCapArr[index].getCustomID());
				}
			}
			else {
				logDebug("**WARNING: The Workflow task '" + WFtask + "' dosn't exist or is not active for the record Id [" + matchCapArr[index] + "] custom ID [" + matchCapArr[index].getCustomID() + "]");
			}

		}
	}
	catch (e) {
		capId = currentCapId;
		aa.debug("Error at STDBASE_PROJECT_AUTOMATION updateWorkflowTaskAndStatus()", e);
		throw e;
	}
}

/**
 * update the application status by cap array and new status value
 * @param {array} matchCapArr
 * @param  {string} newAppStatus
 */
function updateApplicationStatus(matchCapArr, newAppStatus) {
	try {
		for (var index in matchCapArr) {
			updateAppStatus(newAppStatus, "by script", matchCapArr[index]);
			logDebug("Successfully updated the application status to '" + newAppStatus + "'  for the record Id [" + matchCapArr[index] + "] custom ID [" + matchCapArr[index].getCustomID() + "]");
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_AUTOMATION updateApplicationStatus()", e);
		throw e;
	}
}

/**
 * Cancel all inspections by cap array 
 * @param {array} matchCapArr
 */
function _cancelAllInspections(matchCapArr) {
	try {
		for (var index in matchCapArr) {
			var inspecs = aa.inspection.getInspections(matchCapArr[index]).getOutput();
			for (i in inspecs) {
				var cancelResult = aa.inspection.cancelInspection(matchCapArr[index], inspecs[i].getIdNumber())
				if (cancelResult.getSuccess()) {
					logDebug("Cancelling inspection: " + inspecs[i].getInspectionType() + ", for record ID:" + matchCapArr[index].getCustomID());
				}
				else
					logDebug("**ERROR", "**ERROR: Cannot cancel inspection: " + inspecs[i].getInspectionType() + ", " + cancelResult.getErrorMessage() + ", for record ID:" + matchCapArr[index].getCustomID());
			}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_AUTOMATION cancelAllInspections()", e);
		throw e;
	}
}

/**
 * custom field to update by cap array 
 * @param {array} matchCapArr
 * @param {array} customFieldToUpdateArr 
 */
function _customFieldToUpdate(matchCapArr, customFieldToUpdateArr) {
	try {
		for (var index in matchCapArr) {
			for (i in customFieldToUpdateArr) {
				customFieldToUpdateObj = customFieldToUpdateArr[i];
				var newValue = "";
				if (customFieldToUpdateObj.hasOwnProperty("newValue")) {
					newValue = customFieldToUpdateObj.newValue;
				}
				else if (customFieldToUpdateObj.hasOwnProperty("fromCustomFieldName")) {
					var fromCustomFieldName = customFieldToUpdateObj.fromCustomFieldName;
					if (fromCustomFieldName.indexOf(".") > -1) {
						useAppSpecificGroupName = true;
					}
					else {
						useAppSpecificGroupName = false;
					}

					newValue = getAppSpecific(fromCustomFieldName);
				}
				var customFieldName = customFieldToUpdateObj.customFieldName;
				if (!isEmptyOrNull(customFieldName)) {
					editAppSpecific(customFieldName, newValue, matchCapArr[index]);
					logDebug("record Id:" + matchCapArr[index].getCustomID() + ", update ASI field '" + customFieldName + "' value to " + newValue);
				}
			}
		}
	}
	catch (e) {
		aa.debug("Error at STDBASE_PROJECT_AUTOMATION _customFieldToUpdate()", e);
		throw e;
	}
}

