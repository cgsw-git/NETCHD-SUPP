/*Title : Record Automation
Purpose : TO apply these actions on record type based on the provided JSON (activateTask,daysOut,deactivateTask,deleteTask,updateTask,updateStatus,invoiceFees,createChild,createParent,addCondition,removeCondition,addComment,newStatus)
Author: Haetham Eleisah
Functional Area : ACA,AV Events
Description : JSON Example :
{
  "Marijuana/Combo/Testing Facility/License": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "test records",
          "operators": {
            
          }
        },
        "preScript": "",
        "criteria": {
          "customFields": {
            "Gross Annual Sales": "12"
          },
          "task": ["License Status"],
          "status": ["Active"],
          "workFlow": {
           
          },
          "isCreatedByACA": false,
          "isACAEvent": false,
          "recordStatus": "",
          "balanceAllowed": true,
          
        },
        "action": {
          "updateOpenDate": true,
          "saveCreationDate": true,
          "activateTask": [
            
          ],
          "daysOut": "10",
          "useCalendarDays": false,
          "deactivateTask": [
            
          ],
          "deleteTask": [
            
          ],
          "updateTask": [
	         {
	           "task": "Permit Issuance",
	           "status": "Issued"
	         }
	       ],
          "invoiceFees": "",
          "createChild": "Marijuana/Combo/Testing Facility/Application",
          "createParent": "",
          "addCondition": "",
          "addConditionSeverity": " ",
          "addConditionType": "",
          "removeConditionType": "",
          "removeCondition": "",
		  "removeConditionAppliedOnly":true, to remove only the condition status type 'Applied'
          "addComment": "test Status",
          "newStatus": "",
          "assignToUserID": "",
          "assessFees": [
            {
              "feeSchedule": "",
              "feeCode": "",
              "feeQuantity": 1,
              "feeInvoice": "",
              "feePeriod": ""
            }
          ],
          "updateExpDate": {
            "expirationType": "Days",
            "expirationPeriod": "10",
            "destination": "ExpDate", 
            "asiName": "RENEWAL INFO.Next Notification Date",
            "customExpirationFunction": "testFunction"
          },
          "primaryContactType": "Applicant" ,
          "createChildren": {
            "fromCustomListOfParent": "BOOTH INFORMATION",
            "typeOfChild": "EnvHealth/Temporary Event/Booth/NA",
            "statusOfChild": "Active",
            "customFieldOfParentToApplicationOfChild": "Booth Name",
			"customFieldOfParentToShortNotesOfChild": "Program Element",
            "copyFromCustomListOfParentToCustomFieldOfChild": {
              "Booth Number": "Booth Number",
              "Program Element": "Program Element"
            },
            "copyFromCustomFieldOfParentToCustomFieldOfChild": {
              "Event Name": "Event Name",
              "Event Start Date": "Event Start Date"
            },
            "scheduleInspection": [
              {
                "inspectionType": "Initial Inspection",
				"ASITfieldNameToInspectionScheduledDate" : "Inspection Ready Date" ,
                "rangeType": "Days",
                "range": "10"
              }
            ]
          }
        },
        "postScript": ""
      }
    ]
  }
}
Available Types: contactFields, customFields, customLists, parcelFields, addressFields, lpFields,Appstatus
Available Attributes for each type:
- Custom Fields and Custom Lists: ALL
- Address: All Custom Attributes, (primaryFlag,houseNumberStart,streetDirection,streetName,streetSuffix,city,state,zip,addressStatus,county,country,addressDescription,xCoordinate,yCoordinate)
- Parcel: All Custom Attributes, (ParcelNumber,Section,Block,LegalDesc,GisSeqNo,SourceSeqNumber,Page,I18NSubdivision,CouncilDistrict,RefAddressTypes,ParcelStatus,ExemptValue,PublicSourceSeqNBR,CensusTract,InspectionDistrict,NoticeConditions,ImprovedValue,PlanArea,Lot,ParcelArea,Township,LandValue)
- Licensed Professional: All Custom Attributes, (licType,lastName,firstName,businessName,address1,city,state,zip,country,email,phone1,phone2,lastRenewalDate,licExpirationDate,FEIN,gender,birthDate)
- Contact: All Custom Attributes, (firstName,lastName,middleName,businessName,contactSeqNumber,contactType,relation,phone1,phone2,email,addressLine1,addressLine2,city,state,zip,fax,notes,country,fullName,peopleModel)

- assignToUserID: can be a userID, ex AMMAN04, 
or a constant with format $....$ that will be resolved during script execution, available types:
	- $CurrentUser$ : current back-office user
	
isCreatedByACA optional, considered MATCHED if not provided in JSON
 */
try {
	// This should be included in all Configurable Scripts
	//try to get CONFIGURABLE_SCRIPTS_COMMON from Non-Master, if not found, get from Master
	var configurableCommonContent = getScriptText("CONFIGURABLE_SCRIPTS_COMMON");
	if (configurableCommonContent && configurableCommonContent != null && configurableCommonContent != "") {
		eval(configurableCommonContent);
	} else {
		eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON", null, true));
	}

	var scriptSuffix = "RECORD_AUTOMATION";
	var settingsArray = [];
	isConfigurableScript(settingsArray, scriptSuffix);

	for (s in settingsArray) {
		var rules = settingsArray[s];
		var operators = rules.metadata.operators;
		var criteria = rules.criteria;
		var recordStatus = criteria.recordStatus;
		var isACAEvent = criteria.isACAEvent;

		/*
		isCreatedByACA is made optional, to avoid make below existing logic complex, 
		isCreatedByACA is filled from cap if it was not provided in JSON
		existing validation below is still working.
		*/
		var isCreatedByACA = cap.isCreatedByACA();//init value considered matched to record
		if (criteria.hasOwnProperty("isCreatedByACA")) {
			isCreatedByACA = criteria.isCreatedByACA;//altered if provided in JSON
		}

		var balanceAllowed = criteria.balanceAllowed;
		var wfRules = criteria.workFlow;

		var preScript = rules.preScript;
		var postScript = rules.postScript;
		var daysOut = rules.action.daysOut;
		var activateTasks = rules.action.activateTask;
		var deactivateTasks = rules.action.deactivateTask;
		var deleteTasks = rules.action.deleteTask;
		var updateTasks = rules.action.updateTask;
		var invoiceFees = rules.action.invoiceFees;
		var createChildOfType = rules.action.createChild;
		var createParentOfType = rules.action.createParent;
		var addConditions = rules.action.addCondition;
		var removeCondition = rules.action.removeCondition;
		var removeConditionAppliedOnly = rules.action.removeConditionAppliedOnly
		var addComment = rules.action.addComment;
		var newStatus = rules.action.newStatus;
		var conditionType = rules.action.addConditionType;
		var removeConditionType = rules.action.removeConditionType;
		var addConditionSeverity = rules.action.addConditionSeverity;
		var assignToUserID = rules.action.assignToUserID;
		var assessFeesArray = rules.action.assessFees;
		var useCalendarDays = rules.action.useCalendarDays;
		var updateExpDate = rules.action.updateExpDate;
		var primaryContactType = rules.action.primaryContactType;
		var updateOpenDate = rules.action.updateOpenDate;
		var saveCreationDate = rules.action.saveCreationDate;
		useAppSpecificGroupNametmp = useAppSpecificGroupName;
		var createChildren = rules.action.createChildren; 
		// run preScript
		if (!isEmptyOrNull(preScript)) {
			eval(getScriptText(preScript, null, false));
		}
		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}

		var workflowResult = wfTaskCheck(wfRules);
		workflowResult = evaluateBoolean(workflowResult, operators["workFlow"]);
		// / this to check if all Rules if is matched.
		if (cap.isCreatedByACA() == isCreatedByACA && workflowResult && balanceCheck(balanceAllowed) && checkIsAcaEvent(isACAEvent)) {
			RecordAutomation();
		}

	}

} catch (ex) {

	logDebug("**ERROR:Exception while verificaiton the rules" + ex);
}

function checkIsAcaEvent(isACAEvent) {
	if (isACAEvent == true || isACAEvent == 'true') {
		return isPublicUser;
	} else if ((isACAEvent == false || isACAEvent == 'false') && isPublicUser) {
		return false;
	} else
		return true;
}

function balanceCheck(balanceAllowed) {
	var capDetails = aa.cap.getCapDetail(capId).getOutput();

	if (balanceAllowed == false) {
		if (capDetails.getBalance() == 0) {
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}

}

function wfTaskCheck(wfRules) {
	var status = true;
	var results = [];
	if (wfRules == null || wfRules == "")
		return status;
	for (i in wfRules) {
		var currentTask = i;
		var taskStatuses = {};
		taskStatuses = wfRules[i];
		for (x in taskStatuses) {
			if (!isTaskStatus(currentTask, taskStatuses[x])) {
				results[currentTask] = false;
			} else {
				results[currentTask] = true;
				break;
			}
		}
	}

	for (y in results) {
		if (results[y] == false) {
			status = false;
		}
	}
	return status;

}

// / this function to change the record based on the actions on the JSON.
function RecordAutomation() {
	// this when rules is matched;
	if (!isEmptyOrNull(activateTasks)) {
		var TasksToActivateArray = activateTasks;
		for ( var t in TasksToActivateArray) {
			// this to check if task is exists.
			var taskResult = aa.workflow.getTask(capId, TasksToActivateArray[t]);
			var currentTask = taskResult.getOutput();
			if (currentTask != null && currentTask != "") {
				activateTask(TasksToActivateArray[t]);
				// this to check if daysOut is exists or not.
				if (daysOut != null && daysOut != "" && parseInt(daysOut) > 0) {
					editTaskDueDate(TasksToActivateArray[t], getDueDate());
				}
			}
		}
	}

	if (!isEmptyOrNull(deactivateTasks)) {
		// this section has been added to add the ability to the script to accept the ALL value in order to deactivate all active tasks
		if (deactivateTasks[0] == "ALL") {
			var workflowResult = aa.workflow.getTasks(capId);
			if (workflowResult.getSuccess()) {
				wfObjs = workflowResult.getOutput();
				for ( var inx in wfObjs) {
					var currentTask = wfObjs[inx];
					if (currentTask.getActiveFlag().equals("Y")) {
						deactivateTask(currentTask.getTaskDescription());
					}
				}
			} else {
				logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
				return false;
			}
		} else {

			var TasksToDeActivateArray = deactivateTasks;
			for ( var t in TasksToDeActivateArray) {
				//this to check if task is exists.
				var taskResult = aa.workflow.getTask(capId, String(TasksToDeActivateArray[t]));
				if (taskResult.getSuccess()) {
					var currentTask = taskResult.getOutput();
					if (currentTask != null && currentTask != "") {
						if (isTaskActive(TasksToDeActivateArray[t]))
							deactivateTask(TasksToDeActivateArray[t]);
					}
				}

			}
		}
	}

	if (!isEmptyOrNull(deleteTasks)) {
		var TasksToDeleteArray = deleteTasks;
		for ( var t in TasksToDeleteArray) {
			// this to check if task is exists.
			var taskResult = aa.workflow.getTask(capId, TasksToDeleteArray[t]);
			var currentTask = taskResult.getOutput();
			if (currentTask != null && currentTask != "")
				deleteTask(capId, TasksToDeleteArray[t]);
		}
	}
	if (!isEmptyOrNull(updateTasks)) {
		for ( var t in updateTasks) {
			var taskItem = updateTasks[t];
			if (isTaskActive(taskItem.task)) {
				// this to check if task is exists.
				var taskResult = aa.workflow.getTask(capId, taskItem.task);
				var currentTask = taskResult.getOutput();
				if (currentTask != null && currentTask != "") {
					currentTask.setSysUser(aa.person.getCurrentUser().getOutput());
					currentTask.setDisposition(taskItem.status);
					var updateResult = aa.workflow.handleDisposition(currentTask.getTaskItem(), capId);
				}
			}
		}
	}
	// this to check if there is new app status or not.
	if (!isEmptyOrNull(newStatus))
		updateAppStatus(newStatus, 'by script');
	// this to check if there is new condition to be added or not.
	if (!isEmptyOrNull(addConditions) && cap.isCompleteCap()) {
		addAppCondition(conditionType, "Applied", addConditions, addConditions, addConditionSeverity);
	}
	// this to check if there is condition to be removed or not.
	if (!isEmptyOrNull(removeConditionType) && !isEmptyOrNull(removeCondition) && cap.isCompleteCap()) {
		if(typeof removeConditionAppliedOnly == 'boolean')
		{   logDebug("removeConditionAppliedOnly:" + removeConditionAppliedOnly);
			removeCapCondition(removeConditionType, removeCondition, capId, removeConditionAppliedOnly);
		}
		else
		{
			removeCapCondition(removeConditionType, removeCondition);
		}
		
	}
	// this to check if there is comment to be added or not.
	if (!isEmptyOrNull(addComment) && cap.isCompleteCap())
		createCapComment(addComment);

	// this to check if there is parent record to be added or not.
	if (!isEmptyOrNull(createParentOfType) && cap.isCompleteCap()) {
		var parentRecordStucture = createParentOfType.split("/");
		if (parentRecordStucture.length == 4) {
			var appCreateResult = aa.cap.createApp(parentRecordStucture[0], parentRecordStucture[1], parentRecordStucture[2], parentRecordStucture[3], "");
			if (appCreateResult.getSuccess()) {
				var newId = appCreateResult.getOutput();
				var newCap = aa.cap.getCap(newId).getOutput();
				aa.cap.createAppHierarchy(newId, capId);
				aa.cap.runEMSEScriptAfterApplicationSubmit(newCap.getCapModel(), newId)

			}
		}
	}
	// this to check if there is child record to be added or not.
	if (!isEmptyOrNull(createChildOfType)) {
		var childRecordStucture = createChildOfType.split("/");
		if (childRecordStucture.length == 4) {
			var appCreateResult = aa.cap.createApp(childRecordStucture[0], childRecordStucture[1], childRecordStucture[2], childRecordStucture[3], "");
			if (appCreateResult.getSuccess()) {
				var newId = appCreateResult.getOutput();
				var newCap = aa.cap.getCap(newId).getOutput();
				aa.cap.createAppHierarchy(capId, newId);
				var result = aa.cap.runEMSEScriptAfterApplicationSubmit(newCap.getCapModel(), newId);

			}
		}
	}
	// this to check if there is fees to be invoiced or not.
	if (invoiceFees) {
		var feesArray = loadFees();
		for ( var i in feesArray) {
			invoiceFeeCustom(feesArray[i].code, feesArray[i].period);
		}
	}

	// // this to assign the provided user to the record
	if (!isEmptyOrNull(assignToUserID)) {

		//check if ($___$ Constant user)
		var idx1 = assignToUserID.indexOf("$");//startsWith
		var idx2 = assignToUserID.indexOf("$", idx1 + 1);//endsWith
		if (idx1 == 0 && idx2 == assignToUserID.length - 1) {

			//Add more 'else if(assignToUserID.equalsIgnoreCase...)' for other constants $$ (if needed) 
			if (assignToUserID.equalsIgnoreCase("$CurrentUser$")) {
				assignToUserID = aa.getAuditID();
			}
		}//startsWith$ && endsWith$

		var capDetails = aa.cap.getCapDetail(capId).getOutput();
		if (capDetails != null) {
			capDetails = capDetails.getCapDetailModel();
			var assignedUser = aa.person.getUser(assignToUserID).getOutput();
			capDetails.setAsgnDept(assignedUser.getDeptOfUser());
			capDetails.setAsgnStaff(assignToUserID);
			var updateCapDetailsResult = aa.cap.editCapDetail(capDetails);
		}
	}

	if (!isEmptyOrNull(assessFeesArray)) {
		for ( var i in assessFeesArray) {
			var feeCode = assessFeesArray[i]["feeCode"];
			var feeSchedule = assessFeesArray[i]["feeSchedule"];
			var feeQuantity = parseInt(assessFeesArray[i]["feeQuantity"]);
			var feeInvoice = assessFeesArray[i]["feeInvoice"];
			var feePeriod = assessFeesArray[i]["feePeriod"];
			var feeSchduleList = aa.finance.getFeeScheduleList("").getOutput();
			for ( var i in feeSchduleList) {
				if (feeSchduleList[i].getFeeSchedule() == feeSchedule) {
					addFee(feeCode, feeSchedule, feePeriod, feeQuantity, feeInvoice, capId);
				}
			}

		}
	}

	if (!isEmptyOrNull(updateExpDate)) {

		rB1ExpResult = aa.expiration.getLicensesByCapID(capId).getOutput();
		var expDate;
		if (updateExpDate.expirationType == "Days") {
			expDate = aa.date.parseDate(dateAdd(aa.util.now(), updateExpDate.expirationPeriod));

		} else if (updateExpDate.expirationType == "Expiration Code") {
			var rExpBiz = aa.proxyInvoker.newInstance("com.accela.aa.license.expiration.ExpirationBusiness").getOutput();
			rB1Model = rB1ExpResult.getB1Expiration();
			rNextDate = rExpBiz.getNextExpDate(rB1Model);
			expDate = aa.date.parseDate(dateAdd(rNextDate, 0));

		} else if (updateExpDate.expirationType == "Function" && !isEmptyOrNull(updateExpDate.customExpirationFunction)) {
			var dateCalculationFuntion = updateExpDate.customExpirationFunction + "( rB1ExpResult )";
			var dateResult = eval("(" + dateCalculationFuntion + ")");
			if (dateResult instanceof Date || dateResult.getClass() == com.accela.aa.emse.util.ScriptDateTime) {
				expDate = aa.date.parseDate(dateAdd(dateResult, 0));
			}
		}
		if (updateExpDate.destination == "ExpDate" && !isEmptyOrNull(rB1ExpResult.getB1Expiration())) {
			rB1ExpResult.setExpDate(expDate);
			aa.expiration.editB1Expiration(rB1ExpResult.getB1Expiration());
		} else if (updateExpDate.destination == "ASI" && !isEmptyOrNull(expDate)) {
			useAppSpecificGroupName = true;
			editAppSpecific(updateExpDate.asiName, formatDate(expDate));
			useAppSpecificGroupName = useAppSpecificGroupNametmp;
		}

	}

	if (!isEmptyOrNull(primaryContactType)) {
		var contactTypePeopleModel = getContactByType(primaryContactType, capId);
		// check if contact type exists on record and it is not primary
		if (contactTypePeopleModel && contactTypePeopleModel.getFlag() != "Y") {
			var primaryConTypNBR = contactTypePeopleModel.getContactSeqNumber();
			var capContactResult = aa.people.getCapContactByCapID(capId);
			if (capContactResult.getSuccess()) {
				var capContactArray = capContactResult.getOutput();
			}
			if (capContactArray) {
				for ( var yy in capContactArray) {
					var pContactNbr = capContactArray[yy].getPeople().getContactSeqNumber();
					var peopleObj = capContactArray[yy].getCapContactModel().getPeople();
					if (pContactNbr != primaryConTypNBR && capContactArray[yy].getPeople().getFlag() == "Y") {
						// remove primary flag from other contact types
						peopleObj.setFlag("N");
					} else if (pContactNbr == primaryConTypNBR) {
						// set the PrimaryContactType flage to Y
						peopleObj.setFlag("Y");
					}

					capContactArray[yy].getCapContactModel().setPeople(peopleObj);
					var editResult = aa.people.editCapContact(capContactArray[yy].getCapContactModel());
					if (!editResult.getSuccess()) {
						logDebug("**WARN: Could not update contact Primary Flag : " + editResult.getErrorMessage());
					}
				}// end of contact array
			}
		}
	}

	//prepare CapModel
	var myTmpCap = null;
	if (!isEmptyOrNull(saveCreationDate) || !isEmptyOrNull(updateOpenDate)) {
		myTmpCap = aa.cap.getCap(capId).getOutput().getCapModel();

	}
	if (!isEmptyOrNull(saveCreationDate)) {
		var oldUseAppSpecificGroupName = useAppSpecificGroupName;
		useAppSpecificGroupName = false;

		var formatted = myTmpCap.getFileDate();
		formatted = new Date(formatted.getTime());
		formatted = aa.util.formatDate(formatted, "MM/dd/YYYY");
		editAppSpecific("Original Creation Date", formatted);
		useAppSpecificGroupName = oldUseAppSpecificGroupName;
	}//saveCreationDate
	if (!isEmptyOrNull(updateOpenDate)) {
		myTmpCap.setFileDate(new Date(aa.util.now()));
		aa.cap.editCapByPK(myTmpCap);
	}//updateOpenDate
	
	if (!isEmptyOrNull(createChildren)) {
		var fromCustomListOfParent =createChildren.fromCustomListOfParent; 
		if (!isEmptyOrNull(fromCustomListOfParent)) {
		var ASITfieldsNamesArr = [] ;
		getASITfieldsNames(capId ,fromCustomListOfParent , ASITfieldsNamesArr ) ;
		var customListArr = new Array();
		 custListNumberOfRows = 0 ;
		 
		 getAppSpecificTableData(fromCustomListOfParent ,ASITfieldsNamesArr ,customListArr , custListNumberOfRows  ) ;

		 if( custListNumberOfRows >0)
			 {
			 for( row= 0 ; row<custListNumberOfRows ; row++ )
				{
				 var typeOfChild = createChildren.typeOfChild; 
				 if (!isEmptyOrNull(typeOfChild))
					 {
				
					 var newChildCapId = createChildRecord(capId , typeOfChild );
					 
					 if(!isEmptyOrNull(newChildCapId))
						 {
						 //update custom ID to cap id object of child record.
						 var newCustomId = capId.getCustomID() + '-' + (row+1).toString() 
						 aa.cap.updateCapAltID(newChildCapId, newCustomId) ;
						 
						 var customFieldOfParentToApplicationOfChild = createChildren.customFieldOfParentToApplicationOfChild;
						 
						 if(!isEmptyOrNull(customFieldOfParentToApplicationOfChild))
							 {
							 var key = "rowIndex:"+ row.toString() + ",ASITfieldName:" + customFieldOfParentToApplicationOfChild.toString() ;
							 var newApplicationName = customListArr[key] ;
								editApplicationName(newChildCapId , newApplicationName) ;
							 }
						
                         var customFieldOfParentToShortNotesOfChild = createChildren.customFieldOfParentToShortNotesOfChild;						
						if(!isEmptyOrNull(customFieldOfParentToShortNotesOfChild))
							 {
							 var key = "rowIndex:"+ row.toString() + ",ASITfieldName:" + customFieldOfParentToShortNotesOfChild.toString() ;
							 var newShortNotes = customListArr[key] ;
							 updateShortNotes(newShortNotes , newChildCapId) ;
							 }
							 
						 var copyFromASITtoASIfield = createChildren.copyFromCustomListOfParentToCustomFieldOfChild;
						 
						 if(!isEmptyOrNull(copyFromASITtoASIfield))
							 { 
							 var ASITOfParentArr = [] ;
							 var ASIfieldOfChildArr = [] ;
							 
							 var keys = Object.keys(copyFromASITtoASIfield);
								for(k in keys) 
								{
									ASITOfParentArr.push(keys[k]) ;
								}
								
								for(i in copyFromASITtoASIfield)
									{
									ASIfieldOfChildArr.push(copyFromASITtoASIfield[i]) ;
									}
							 
								for(i =0 ; i< ASITOfParentArr.length ; i++ )
								{
								var ASITfieldNameOfParent = ASITOfParentArr[i] ;
								var ASIfieldNameOfChild = ASIfieldOfChildArr[i] ;
								var key = "rowIndex:"+ row.toString() + ",ASITfieldName:" + ASITfieldNameOfParent.toString() ;
								var  ASITfieldValueOfParent= customListArr[key]
								editAppSpecific(ASIfieldNameOfChild , ASITfieldValueOfParent ,newChildCapId ) ; 
								}
							 }
						 
						 var copyFromASIfieldtoASIfield = createChildren.copyFromCustomFieldOfParentToCustomFieldOfChild
						 
						 if(!isEmptyOrNull(copyFromASIfieldtoASIfield))
							 {
							 
							  var ASIfieldOfParentArr = [] ;
							  var ASIfieldofChildArr = [] ;
								
							  var keys = Object.keys(copyFromASIfieldtoASIfield);
							  for(k in keys) 
								{
								  ASIfieldOfParentArr.push(keys[k]) ;
								}
							  
								for(i in copyFromASIfieldtoASIfield)
									{
									ASIfieldofChildArr.push(copyFromASIfieldtoASIfield[i]) ;
									}
								
								for(i =0 ; i< ASIfieldOfParentArr.length ; i++ )
								{
								var ASIfieldNameOfParent = ASIfieldOfParentArr[i] ;
								var ASIfieldNameOfChild = ASIfieldofChildArr[i] ;
								useAppSpecificGroupName =false;
								var ASIfieldValueOfParent =  getAppSpecific(ASIfieldNameOfParent ,capId ) ;
								editAppSpecific(ASIfieldNameOfChild , ASIfieldValueOfParent ,newChildCapId ) ; 
								}
							 }
						 
						 var scheduleInspectionArr = createChildren.scheduleInspection ;
						 
						 if(!isEmptyOrNull(scheduleInspectionArr) && scheduleInspectionArr.length >0)
							 { 
							 
							 for( index in scheduleInspectionArr)
								 {
								    var inspectionType = scheduleInspectionArr[index].inspectionType ;
									var rangeType = scheduleInspectionArr[index].rangeType ;
									var range = scheduleInspectionArr[index].range ;
									var ASITfieldValueToInspectionScheduledDate = "";
									var ASITfieldNameToInspectionScheduledDate = scheduleInspectionArr[index].ASITfieldNameToInspectionScheduledDate ;
				
									if( !isEmptyOrNull(ASITfieldNameToInspectionScheduledDate))
											{
									var key = "rowIndex:"+ row.toString() + ",ASITfieldName:" + ASITfieldNameToInspectionScheduledDate.toString() ;
									ASITfieldValueToInspectionScheduledDate = customListArr[key] ; 
								
											}
									
									if( !isEmptyOrNull(inspectionType) && (!isEmptyOrNull(ASITfieldValueToInspectionScheduledDate) ||  ( !isEmptyOrNull(rangeType) && !isEmptyOrNull(range)))  )
										{
										schedInspection(inspectionType ,ASITfieldValueToInspectionScheduledDate , rangeType, range , newChildCapId)
										}
								 }
							 }
						
						 }
					 }
				}
			 }
		
		}
	}

	// / run post script
	if (!isEmptyOrNull(postScript)) {
		eval(getScriptText(postScript, null, false));
	}
}

// / this function to take the current date and add the days out days and format
// the result as MM/dd/yyyy
function getDueDate() {
	var formatedDate = "";
	if (useCalendarDays == true && useCalendarDays != null && useCalendarDays != "") {
		var today = new Date(aa.util.now());
		today.setDate(today.getDate() + parseInt(daysOut));
		var dd = today.getDate();
		var mm = today.getMonth() + 1;
		var yy = today.getFullYear();
		formatedDate = mm + '/' + dd + '/' + yy;

	} else {
		formatedDate = aa.date.parseDate(dateAdd(aa.util.now(), daysOut, true));
		formatedDate = formatedDate.getMonth() + '/' + formatedDate.getDayOfMonth() + '/' + formatedDate.getYear();
	}
	return formatedDate;
}

function formatDate(dateObj) {
	formatedDate = dateObj.getMonth() + '/' + dateObj.getDayOfMonth() + '/' + dateObj.getYear();
	return formatedDate;
}

function testFunction() {
	var formatedDate = aa.date.parseDate(dateAdd(aa.util.now(), 50, true));
	return formatedDate;

}

/**
 * return ASIT fields names by cap object and custom List subgroup name
 * @param {object} itemCap
 * @param {string} tableName
 * @param {array}  colArray
 * @return {array} colArray. 
*/
function getASITfieldsNames( itemCap , tableName , colArray)
{
	var appSpecificTableModel = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName);
	if(appSpecificTableModel.getSuccess()) 
		{
		var columnsArr = [] ;
		columnsArr = appSpecificTableModel.getOutput().getAppSpecificTableModel().getColumns().toArray();
		
		for ( i in columnsArr) 
			 {
			colArray.push( columnsArr[i].getColumnName());
			 } 
		}
	else
		{
		logDebug("Error with aa.appSpecificTableScript.getAppSpecificTableModel API. Message = " + appSpecificTableModel.getErrorMsg());
		}	
}

/**
 * return ASIT data by custom List subgroup name and subgroup columns names 
 * @param {string} tableName
 * @param {array}  fieldsArr 
 * @param {array}  asiTableArray 
 * @return {array} return asiTableArray 
*/
function getAppSpecificTableData( tableName , fieldsArr , asiTableArray   )
{
	 var  asiTable= loadASITable (tableName) ;
	 for(row in asiTable) 
		{
		 custListNumberOfRows +=1 ;
		 for(col in fieldsArr)
			 {			 
			 var ASITfieldName = fieldsArr[col] ; 
			 var ASITfieldValue = asiTable[row][ASITfieldName];
			 asiTableArray["rowIndex:"+ row.toString() + ",ASITfieldName:" + ASITfieldName.toString() ] = ASITfieldValue ;
			 }
		} 
	
}

/**
 * create new child record by cap Id object of parent record and cap type of child record
 * @param {object} parentCapId
 * @param {string}  typeOfChild 
 * @return {array} returns cap Id object of the child record.
*/
function createChildRecord(parentCapId , typeOfChild )
{
	var newCapId = null ;
	if (!isEmptyOrNull(typeOfChild)) {
		var childRecordStucture = typeOfChild.split("/");
		if (childRecordStucture.length == 4) {
			var appCreateResult = aa.cap.createApp(childRecordStucture[0], childRecordStucture[1], childRecordStucture[2], childRecordStucture[3], "");
			if (appCreateResult.getSuccess()) {
				newCapId = appCreateResult.getOutput();
				var newCap = aa.cap.getCap(newCapId).getOutput();
				aa.cap.createAppHierarchy(parentCapId, newCapId);
				var result = aa.cap.runEMSEScriptAfterApplicationSubmit(newCap.getCapModel(), newCapId);
			}
		}
	}
	
	return newCapId ; 
}

/**
 * edit Application name by cap Id object. 
 * @param {object} capObject
 * @param {string}  newApplicationName 
*/
function editApplicationName(capObject , newApplicationName)
{

	var capScriptResult = aa.cap.getCapByPK(capObject, true);
	if (capScriptResult.getSuccess()) {
		var capModel = capScriptResult.getOutput();
		capModel.setSpecialText(newApplicationName);
		var editCapModel= aa.cap.editCapByPK(capModel)
		if(editCapModel.getSuccess())
			{
			logDebug("Edit application name to'" +newApplicationName + "' for record ID:" +capObject.getCustomID() );
			}
		else
			{
			logDebug("Error in aa.cap.editCapByPK API. Message = " + editCapModel.getErrorMsg());
			}
		
	}
	else
		{
		  logDebug("Error in aa.cap.getCapByPK API. Message = " + capScriptResult.getErrorMsg());
		}

}

/**
 * schedule inspection by cap id object, cap type, range type (days, months) and range value. 
  * @param {string}  inspecType 
  * @param {date}    ASITfieldValue 
  * @param {string}  rangeType 
  * @param {string}  range 
  * @param {object} capObject
*/
function schedInspection(inspecType , ASITfieldValue , rangeType, range , capObject ) {
	
	 if(!isEmptyOrNull(ASITfieldValue)) 
		{
		 schedDate	=  ASITfieldValue
		}
		else if(!isEmptyOrNull(rangeType) && !isEmptyOrNull(range))
		{
			var inspRangeDays = calculateUnifiedRange(rangeType, range); 
			schedDate = dateAdd(null,parseInt(inspRangeDays));
		}
	 if(schedDate != null)
		 {
			
			var schedRes = aa.inspection.scheduleInspection(capObject, null, aa.date.parseDate(schedDate), null, inspecType, null) ;

			if (schedRes.getSuccess())
				logDebug("Successfully scheduled inspection : " + inspecType );
			else
				logDebug( "**ERROR: adding scheduling inspection (" + inspecType + "): " + schedRes.getErrorMessage());
		 }
		}

/**
 * calculate inspection range value.
  * @param {string}  costRangeType (days, months,years) 
  * @param {number}  costRange.
  * @return {number} costRange per days.  
*/
function calculateUnifiedRange(costRangeType, costRange) {
	 var currentDate =  new Date(aa.util.now());
	 if (costRangeType.equalsIgnoreCase("years")) {
		    var newDate= dateAddMonths(currentDate, parseInt(costRange)*12) ;
			logDebug("costRangeType:" + costRangeType +" ,costRange:" + costRange + " ,newDate:" + newDate); 
			return getDateDiff(newDate,currentDate)*-1 ;
			
		}	else if (costRangeType.equalsIgnoreCase("months")) {
			 var newDate= dateAddMonths(currentDate, parseInt(costRange)) ;
			 logDebug("costRangeType:" + costRangeType +" ,costRange:" + costRange + " ,newDate:" + newDate); 
			return getDateDiff(newDate,currentDate)*-1 ; 
		} else if (costRangeType.equalsIgnoreCase("days")) {	
			return costRange;
		}
		else{
			return null;
			}
}
