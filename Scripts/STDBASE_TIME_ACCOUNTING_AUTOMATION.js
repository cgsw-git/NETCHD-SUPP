/*
Title   : STDBASE_TIME_ACCOUNTING_AUTOMATION
Purpose : Handling Time Accounting Based Fees
Author  : Ali Hasan

Functional Area :

JSON Example : 
{
  "EnvHealth/*//*/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Assess Time Accounting Based Fees",
          "operators": {}
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Time Entry Review"
          ],
          "status": [
            "Approved"
          ]
        },
        "action": {          
        },
        "postScript": ""
      }
    ]
  }
}

- Workflow Task and Status must be set in JSON file to specify which task/status invoke this code
 */
showMessage = true;
showDebug = true;

var scriptSuffix = "TIME_ACCOUNTING_AUTOMATION";

try {	
	// This should be included in all Configurable Scripts
	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));

	var settingsArray = [];
	if (isConfigurableScript(settingsArray, scriptSuffix)) {

		for (s in settingsArray) {

			var rules = settingsArray[s];

			// Execute PreScript
			if (!isEmptyOrNull(rules.preScript)) {
				eval(getScriptText(rules.preScript));
			}

			if (cancelCfgExecution) {
				logDebug("**WARN STDBASE Script [" + scriptSuffix
						+ "] canceled by cancelCfgExecution");
				cancelCfgExecution = false;
				continue;
			}

			var timeEntryResult = false;
			if (controlString == "WorkflowTaskUpdateAfter") {
				if(wfHours > 0)
				{
					timeEntryResult = addTimeAccountingRecordToWorkflow(currUserId,
							rules.action.TimeGroup, rules.action.TimeType,
							'05/13/2020', wfHours, capId.getCustomID(), wfTask,
							wfProcess, true);
				}
				else
				{
					logDebug("**WARNING: The hours spent have no value, or the value is invalid");
					continue;
				}
			} else {
				timeEntryResult = true;
			}

			if (timeEntryResult)
				assessTimeAccountingFees(rules);

			// Execute Post Script
			if (!isEmptyOrNull(rules.postScript)) {
				eval(getScriptText(rules.postScript));
			}
		}
	}
} catch (ex) {
	logDebug("**ERROR: Exception while verification the rules for "
			+ scriptSuffix + ". Error: " + ex);
}

/*
 * ###### Begin Time Accounting Functions #####
 */
// This function takes all unlocked billable time accounting entires and
// attempts to assess/invoice associated fees
// if successful, the fee sequence will be noted on the time entry and the entry
// will be locked
// relies on the standard choice TIME_ACCOUNTING_FEE_CODE to map time types to
// fees
// capId - capId object to perform assessment on
function assessTimeAccountingFees(rules) {
	var baseFeeArr = new Array();
	var timeFeeArr = new Array();
	var baseFeeBalance = 0;
	var timeEntriesArr = new Array();
	var timeEnts = aa.timeAccounting.getTimeLogModelByEntity(capId, null, null,
			null, null).getOutput();
	var tlmlIterator = timeEnts.iterator();
	while (tlmlIterator.hasNext()) {
		var timeLogModel = tlmlIterator.next();
		var timeLogSeq = timeLogModel.getTimeLogSeq();
		// we have to get the model again using the seq because the other
		// function doesn't populate the object fully
		var tResult = aa.timeAccounting.getTimeLogModel(timeLogSeq);
		if (tResult.getSuccess()) {
			var timeLogModel = tResult.getOutput();
			if (timeLogModel != null) {
				// we branch here if this is a base fee model vs normal billable
				// time

				if (timeLogModel.getBillable() == "Y"
						&& timeLogModel.getTimeLogStatus() != "L") {
					var duration = parseInt(timeLogModel.getTotalMinutes());
					try {

						var feeSchedule = rules.action.FeeSchedule;
						var feeCode = rules.action.FeeCode;
						var feePeriod = rules.action.FeePeriod;
						var rateBased = rules.action.FeeRateBased;

						// determine fee input for rate based vs. basic
						var quantity = 0;
						if (rateBased == true) {
							var username = timeLogModel.getTimeLogModel().getUserName();
							var entryDate = timeLogModel.getTimeLogModel().getDateLogged();
							var rate = getRateByUser(username, entryDate);

							if (rate) {
								quantity = parseFloat(duration / 60) * rate;
							} else {
								logDebug("Error assessing fee; user "
										+ username
										+ " does not have a billing rate configured");
								continue;
							}

							logDebug("rate:" + rate + " quantity:" + quantity);
						} else {
							quantity = parseFloat(duration / 60);
						}
						// add the fee item, make notation of the fee ID, and
						// lock the time entry
						logDebug("Fee Schedule:" + feeSchedule + " Fee Code:"
								+ feeCode + " amount: " + quantity);
						var feeSeqNumber = addFee(feeCode, feeSchedule,
								feePeriod, quantity, "Y", capId);
						timeLogModel.setNotation(feeSeqNumber);
						timeLogModel.setTimeLogStatus("L");
						if (feeSeqNumber != null) {
							fsm = aa.finance
									.getFeeItemByPK(capId, feeSeqNumber)
									.getOutput().getF4FeeItem();
							var cost = fsm.getFee();
							timeLogModel.setEntryCost(cost);
							logDebug("Time Entry Cost:" + cost);
						}
						aa.timeAccounting.updateTimeLogModel(timeLogModel);
					} catch (timeErr) {
						logDebug("Error assessing fee for time type "
								+ timeType);
						logDebug("    " + timeErr);
					}
				}
			}
		}
	}
}

// Get the hourly rate from the User time accounting profile
// username - Accela username to lookup the rate
// entryDate - date of the time entry (SQL formatted string)
function getRateByUser(username, entryDate) {
	try {
		var hourlyRate = 0;
        var conn = aa.db.getConnection();
		var servProvCode = aa.getServiceProviderCode();
		// build query
		var selectString = "Select R1_RATE_SEQ, R1_UNIT_COST From RCOST_RATE Where R1_COST_ITEM = ? And SERV_PROV_CODE = ? And Rec_Status = 'A' And (R1_ACTIVE_DATE <= ? Or R1_ACTIVE_DATE Is Null) And (R1_EXPIRED_DATE > ? Or R1_EXPIRED_DATE Is Null)";
		var SQLStatement = conn.prepareStatement(selectString);
		SQLStatement.setString(1, username.toUpperCase());
		SQLStatement.setString(2, servProvCode);
		SQLStatement.setTimestamp(3, entryDate);
		SQLStatement.setTimestamp(4, entryDate);
		// get results
		var rSet = SQLStatement.executeQuery();
		while (rSet.next()) {
			var profileId = rSet.getString("R1_RATE_SEQ");
			var unitCostStr = rSet.getString("R1_UNIT_COST");
			var unitCost = parseFloat(unitCostStr);
			if (unitCost == 'NaN') {
				continue;
			}
			hourlyRate = unitCost;
			break;
		}
        logDebug("(getRateByUser) - username: " + username + " entryDate: " + entryDate + " hourlyRate = " + hourlyRate);
		return (hourlyRate);
	} catch (e) {
		logDebug("Exception getting time accounting profile: " + e.message);
	} finally {
		if (initialContext) {
			initialContext.close();
		}
		if (SQLStatement) {
			SQLStatement.close();

			if (rSet) {
				rSet.close();
			}
		}
		if (conn) {
			conn.close();
		}
	}
}

function addTimeAccountingRecordToWorkflow(taskUser, taGroup, taType,
		dateLogged, hoursSpent, capIdStr, taskName, processName, billableBool) {

	if (!aa.timeAccounting.getTimeTypeByTimeTypeName) {
		logDebug("addTimeAccountingRecordToWorkflow function required AA 7.1SP3 or higher.");
		return false
	}

	userRight = aa.userright.getUserRight(appTypeArray[0], taskUser)
			.getOutput();

	TimeAccountingResult = aa.timeAccounting.getTimeLogModel();

	if (TimeAccountingResult.getSuccess())
		;
	TimeAccounting = TimeAccountingResult.getOutput();

	var billable = "N";
	if (billableBool)
		billable = "Y";

	TimeAccounting.setAccessModel("N");
	TimeAccounting.setBillable(billable);
	TimeAccounting.setCreatedBy(taskUser);
	TimeAccounting.setCreatedDate(aa.date.getCurrentDate());
	TimeAccounting.setDateLogged(aa.date.parseDate(dateLogged));
	TimeAccounting.setEndTime(null);
	TimeAccounting.setEntryCost(0.0);
	TimeAccounting.setEntryPct(0.0);
	TimeAccounting.setEntryRate(0.0);
	TimeAccounting.setLastChangeDate(aa.date.getCurrentDate());
	TimeAccounting.setLastChangeUser(taskUser);
	TimeAccounting.setMaterials(null);
	TimeAccounting.setMaterialsCost(0.0);
	TimeAccounting.setMilageTotal(0.0);
	TimeAccounting.setMileageEnd(0.0);
	TimeAccounting.setMileageStart(0.0);
	TimeAccounting.setNotation(null);
	TimeAccounting.setReference(capId);
	TimeAccounting.setStartTime(null);
	TimeAccounting.setTotalMinutes(60 * hoursSpent);

	var timeElapsedString = "";
	if (hoursSpent.indexOf(".") != -1) {
		var vMinutes = "";
		vMinutes = hoursSpent.substr(hoursSpent.indexOf(".")) * 60;
		vMinutes = Math.round(vMinutes); // Added by OMATKARI to avoid date
											// parse error
		vMinutes = vMinutes.toString();
		if (vMinutes.length == 1)
			vMinutes = "0" + vMinutes;

		timeElapsedString = dateLogged + " "
				+ hoursSpent.substr(0, hoursSpent.indexOf(".")) + ":"
				+ vMinutes + ":00";
	} else {
		timeElapsedString = dateLogged + " " + hoursSpent + ":00:00";
	}

	var taTypeResult = aa.timeAccounting.getTimeTypeByTimeTypeName(taType);
	if (!taTypeResult.getSuccess() || !taTypeResult.getOutput()) {
		logDebug("**WARNING: error retrieving Timeaccounting type : " + taType
				+ " : " + taTypeResult.getErrorMessage());
		return false;
	}

	var taGroupResult = aa.timeAccounting.getTimeGroupByTimeGroupName(taGroup);
	if (!taGroupResult.getSuccess() || !taGroupResult.getOutput()) {
		logDebug("**WARNING: error retrieving Timeaccounting group : "
				+ taGroup + " : " + taGroupResult.getErrorMessage());
		return false;
	}
	logDebug(timeElapsedString);
	TimeAccounting.setTimeElapsed(aa.date.parseDate(timeElapsedString));
	TimeAccounting.setTimeGroupSeq(taGroupResult.getOutput().getTimeGroupSeq());
	TimeAccounting.setTimeTypeSeq(taTypeResult.getOutput().getTimeTypeSeq());

	TimeAccounting.setUserGroupSeqNbr(userRight.getGroupSeqNumber()); // Required
	// --
	// User
	// Group
	// Number
	// from
	// user
	// rights
	TimeAccounting.setVehicleId(null);

	// find the task

	var capTasks = loadTasks(capIdStr);
	var TimeLogModel = null;

	for ( var thisTaskName in capTasks)
		if (thisTaskName.equals(taskName)
				&& (!processName || capTasks[thisTaskName].process
						.equals(processName))) {
			TimeLogModel = TimeAccounting.getTimeLogModel();
			TimeLogModel.setEntityId(capTasks[thisTaskName].step + ":"
					+ capTasks[thisTaskName].processID);
			TimeLogModel.setEntityType("WORKFLOW");
			TimeLogModel.setCapIDModel(capId);// itemCap -- undone;
		}

	if (TimeLogModel) {
		addResult = aa.timeAccounting.addTimeLogModel(TimeAccounting);
		if (addResult.getSuccess()) {
			logDebug("Successfully added Time Accounting Record to task: "
					+ taskName);
			return true;
		} else {
			logDebug("**WARNING: error adding Time Accounting Record to task: "
					+ addResult.getErrorMessage());
		}
	} else {
		logDebug("**WARNING: error adding Time Accounting Record: task "
				+ taskName + ", process " + processName + " not found.");
	}
	return false;
}

function loadTasks(ltcapidstr) {

	var taskArr = new Array();

	var workflowResult = aa.workflow.getTasks(capId);// undone
	if (workflowResult.getSuccess())
		wfObj = workflowResult.getOutput();
	else {
		logDebug("**ERROR: Failed to get workflow object: "
				+ workflowResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		fTask = wfObj[i];
		var myTask = new Task();
		myTask.status = fTask.getDisposition();
		myTask.comment = fTask.getDispositionComment();
		myTask.process = fTask.getProcessCode();
		if (fTask.getStatusDate())
			myTask.statusdate = "" + (fTask.getStatusDate().getMonth() + 1)
					+ "/" + fTask.getStatusDate().getDate() + "/"
					+ (fTask.getStatusDate().getYear() + 1900);
		myTask.processID = fTask.getProcessID();
		myTask.note = fTask.getDispositionNote();
		myTask.step = fTask.getStepNumber();
		myTask.active = fTask.getActiveFlag();
		taskArr[fTask.getTaskDescription()] = myTask;
	}
	return taskArr;
}

function Task() // Task Object
{
	this.status = null
	this.comment = null;
	this.note = null;
	this.statusdate = null;
	this.process = null;
	this.processID = null;
	this.step = null;
	this.active = null;
}
//End Script Code