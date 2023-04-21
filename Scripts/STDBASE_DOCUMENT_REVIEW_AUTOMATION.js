/*
 Title : STDBASE_DOCUMENT_REVIEW_AUTOMATION
 
 Purpose : assign certain document types by discipline and district and round robin assignment. 
 IN addition, workflow tasks might be updated and set to a due date and the documents may have a status set to them.
 
 Author: Israa Ismail
 Functional Area : After - All (This function can run on any after event and does not support pageflow.)
 Description : JSON sample :	

 {
  "Building/Commercial/Alteration/*": {
    "WorkflowTaskUpdateAfter": [
      {
        "preScript": "",
        "metadata": {
          "description": "Plans Distribution - Routed For Review will trigger document review tasks for the listed document types, for each workflowSubTask where the userDistrict and userDiciple match. It will use round robin assignment and update the document status to In Review",
          "operators": {
            
          }
        },
        "criteria": {
          "task": [
            "Plans Distribution"
          ],
          "status": [
            "Routed for Review",
            
          ],
          "customFields": {
            "Review Cycle": "PPR"
          },
          "workflow": [
            {
              "task": "Planning Review",
              "status": "In Progress"
            }
          ],
          "isCreatedByACA": false,
          "balanceAllowed": true,
        },
        "action": {
          "userDisciplines": [
            "Site Plan Reviewer"
          ],
          "userDistricts": [
            "ALL"
          ],
          "roundRobinAssignment": true,
          "documentTypes": [
            "Building Plans",
            "Site Plans"
          ],
          "updateTasks": [
            {
              "task": "Planning Review",
              "status": "In Progress"
            }
          ],
          "daysOut": "10",
          "useCalendarDays": true,
          "updateDocumentStatus": "In Review"
        },
        "postScript ": ""
      }
    ]
  }
}
 
 
Notes:
- workflow and updateTasks properties are JSON arrays of task and status fields, ex:
"updateTasks": [
	{"task":"Planning Review","status":"In Progress"},{...}
]

Dependencies:
- standard choice: DOC_REVIEW_LOAD_BALANCE_DATA [System Switch] (should be added manually)

roundRobinAssignment uses load balance to find next user to do the job, 
load balance data is stored in this standard choice. 
 - it has a row per User, with UserID in VALUE and load balance data in DESC.
 - load balance data is lastAssignDate and countOfJobs for that date, formatted as following: YYYYMMDD|count.
 - count is accumulated for same date (same day) and reseted the next day on first assignment.
 - if a user was picked to be assigned (by Disciplines and Districts) but was not assigned yet,
   the user will have initial load balance data "date|count" as following: "19000101|0"
 *
 */

var WORKLOAD_DATA_BIZDOMAIN = "DOC_REVIEW_LOAD_BALANCE_DATA";

try {
	// This should be included in all Configurable Scripts
	eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
	var settingsArray = [];
	var scriptSuffix = "DOCUMENT_REVIEW_AUTOMATION";
	isConfigurableScript(settingsArray, scriptSuffix);
	for (s in settingsArray) {

		var rules = settingsArray[s];
		var preScript = rules.preScript;
		var postScript = rules.postScript;

		// run preScript
		if (!isEmptyOrNull(preScript)) {
			eval(getScriptText(preScript, null, false));
		}
		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}

		// validate isCreatedByACA
		if (rules.criteria.hasOwnProperty("isCreatedByACA")) {
			var myCap = null;
			if (typeof cap == "undefined" || cap == null) {
				myCap = aa.cap.getCap(capId).getOutput();
			} else {
				myCap = cap;
			}
			if (rules.criteria.isCreatedByACA && myCap.getCapModel().getCreatedByACA() == "N") {
				continue;
			} else if (!rules.criteria.isCreatedByACA && myCap.getCapModel().getCreatedByACA() == "Y") {
				continue;
			}
		}//has isCreatedByACA

		// validate balanceAllowed
		if (rules.criteria.hasOwnProperty("balanceAllowed")) {
			if (!rules.criteria.balanceAllowed && getCapBalance() > 0) {
				continue;
			}
		}

		//validate workflow:
		var workflowCriteriaMatched = true;

		for (w in rules.criteria.workflow) {
			if (!isTaskStatus(rules.criteria.workflow[w].task, rules.criteria.workflow[w].status)) {
				workflowCriteriaMatched = false;
				break;
			}
		}
		if (!workflowCriteriaMatched) {
			continue;
		}

		documentReviewAutomation(rules);

		// run post script
		if (!isEmptyOrNull(postScript)) {
			eval(getScriptText(postScript, null, false));
		}
	}
} catch (ex) {
	logDebug("**ERROR: Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex);
}
/**
 * Main function is used to :
 * 1-assign document to user by discipline and district
 * 2-use Round Robin assignment
 * 3-update document status
 * 4-update/activate a task
 * 5-update a task Due Date based  on Calendar or business days
 * @param rules
 */
function documentReviewAutomation(rules) {
	try {
		var userDisciplines = rules.action.userDisciplines;
		var userDistricts = rules.action.userDistricts;
		var roundRobinAssignment = rules.action.roundRobinAssignment;
		var documentTypes = rules.action.documentTypes;
		var updateTasks = rules.action.updateTasks;
		var daysOut = rules.action.daysOut
		var useCalendarDays = rules.action.useCalendarDays
		var updateDocumentStatus = rules.action.updateDocumentStatus;

		//var docList=aa.document.getDocumentListByEntity(capId, 'CAP').getOutput();
		var docList = aa.document.getCapDocumentList(capId, "ADMIN");
		if (!docList.getSuccess()) {
			logDebug("**WARN: getCapDocumentList failed in script " + scriptSuffix + ". Error: " + docList.getErrorMessage());
			return false;
		}
		docList = docList.getOutput();
		var docsToReview = aa.util.newArrayList();

		for (c in documentTypes) {
			for (d in docList) {
				if (docList[d].getDocCategory() == documentTypes[c]) {
					docsToReview.add(docList[d]);
					break;
				}
			}//for all cap docs
		}//for all doc types in JSON

		var reviewerUser = null;

		var taskItems = aa.workflow.getTaskItemByCapID(capId, null);
		if (!taskItems.getSuccess()) {
			logDebug("**WARN get task items failed, " + taskItems.getErrorMessage());
			return false;
		}
		taskItems = taskItems.getOutput();

		//update tasks
		for (k in updateTasks) {
			for (t in taskItems) {
				if (taskItems[t].getTaskDescription() != updateTasks[k].task) {
					continue;
				}
				taskItems[t].setActiveFlag("Y");
				taskItems[t].setCompleteFlag("N");
				taskItems[t].setDisposition(updateTasks[k].status);

				var dueDate;
				// if useCalendarDays true use calendar days to set Due date, false use Business days
				if (useCalendarDays) {
					dueDate = dateAdd(new Date(), daysOut);
				} else {
					dueDate = dateAdd(new Date(), daysOut, true);
				}
				taskItems[t].setDueDate(aa.date.parseDate(dueDate));
				aa.workflow.editTask(taskItems[t]);

				//assign docs for review
				if (reviewerUser == null) {
					reviewerUser = getReviewerUser(userDisciplines, userDistricts, roundRobinAssignment, docsToReview.size());
					if (reviewerUser == false) {
						logDebug("**WARN: Could not get Reviewer User, " + userDisciplines.join(",") + " // " + userDistricts.join(","));
						return false;
					}//no reviewers found
				}//reviewerUser == null

				var reviewerList = aa.util.newArrayList();
				reviewerList.add(reviewerUser);
				//assign Doc2User
				var associateResult = aa.document.associateReviewer2Doc(docsToReview, reviewerList, taskItems[t].getTaskItem());
				if (!associateResult.getSuccess()) {
					logDebug("**WARN associateReviewer2Doc failed, error: " + associateResult.getErrorMessage());
				}
			}//for all cap tasks
		}//for all tasks in JSON

		if (updateDocumentStatus) {
			for (var d = 0; d < docsToReview.size(); d++) {
				docsToReview.get(d).setDocStatus(updateDocumentStatus);
				updateDocResult = aa.document.updateDocument(docsToReview.get(d));
			}
		}//updateDocumentStatus
	} catch (ex) {
		logDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + ex);
	}
}

//=====================================Internal Functions-START=====================================
function getCapBalance() {
	var capBal = 0;
	var capDetailScriptModel = aa.cap.getCapDetail(capId).getOutput();
	if (capDetailScriptModel != null) {
		var capDetail = capDetailScriptModel.getCapDetailModel();
		capBal = capDetail.getBalance();
	}
	return capBal;
}

function getReviewerUser(disciplines, districts, useRoundRobin, assignmentCount) {

	if (districts == null || districts.length == 0) {
		districts = new Array();
		districts.push("ALL");
	}

	var users = new Array();
	//find users by disciplines
	for (d in disciplines) {
		var sysUserBydiscList = aa.people.getSysUserListByDiscipline(disciplines[d]);
		if (!sysUserBydiscList.getSuccess())
			continue;
		sysUserBydiscList = sysUserBydiscList.getOutput();

		//check District of each user
		for (var u = 0; u < sysUserBydiscList.size(); u++) {
			if (districts[0] == "ALL") {
				users = addUserModel(users, sysUserBydiscList.get(u));
				continue;//next user
			}

			//if not ALL, get user Districts and check
			var userDistricts = aa.people.getUserDistricts(sysUserBydiscList.get(u).getUserID());
			if (!userDistricts.getSuccess())
				continue;
			userDistricts = userDistricts.getOutput();
			if (hasRequiredDistrict(districts, userDistricts)) {
				users = addUserModel(users, sysUserBydiscList.get(u));
			}//has district
		}//for all users
	}//for all disciplines

	//no users were found
	if (users.length == 0) {
		return false;
	}

	//no round robin, return 1st user (small agency, should be 1 user already)
	if (!useRoundRobin) {
		return users[0];
	}

	//get user from list by load balance
	return getUserByLoadBalance(users, assignmentCount);
}

function getUserByLoadBalance(usersArray, assignCount) {

	if (usersArray == null || usersArray.length == 0) {
		return false;
	}

	var nowNumber = aa.util.formatDate(new Date(), "YYYYMMdd");
	var nowNumberInt = parseInt(nowNumber);

	var workLoadArray = new Array();
	for (u in usersArray) {
		var workLoadStr = lookup(WORKLOAD_DATA_BIZDOMAIN, usersArray[u].getUserID());
		if (String(workLoadStr) == "undefined") {
			workLoadArray.push(new WorkLoadItem(usersArray[u].getUserID(), "19000101|0", u));
			addOrUpdateBizDomain(WORKLOAD_DATA_BIZDOMAIN, usersArray[u].getUserID(), nowNumber + "|0")
		} else {
			workLoadArray.push(new WorkLoadItem(usersArray[u].getUserID(), workLoadStr, u));
		}
	}

	//sort ASC by last job date
	workLoadArray.sort(function(a, b) {
		return (a.lastJob > b.lastJob) ? 1 : ((b.lastJob > a.lastJob) ? -1 : 0);
	});

	//extract users with oldest lastJob date
	var oldestLastDate = new Array();
	for (w in workLoadArray) {
		if (oldestLastDate.length == 0) {
			oldestLastDate.push(workLoadArray[w]);
		} else {
			if (oldestLastDate[w - 1].lastJob == workLoadArray[w].lastJob) {
				oldestLastDate.push(workLoadArray[w]);
			} else {
				break;
			}
		}
	}//extract oldest loop

	//sort ASC by jobs count
	oldestLastDate.sort(function(a, b) {
		return (a.count > b.count) ? 1 : ((b.count > a.count) ? -1 : 0);
	});

	//select first user (will have min count)
	var oldestMinWorkItem = oldestLastDate[0];

	//update user Workload data
	if (oldestMinWorkItem.lastJob == nowNumberInt) {
		oldestMinWorkItem.count = oldestMinWorkItem.count + parseInt(assignCount);
	} else {
		oldestMinWorkItem.count = parseInt(assignCount);
		oldestMinWorkItem.lastJob = nowNumberInt;
	}
	addOrUpdateBizDomain(WORKLOAD_DATA_BIZDOMAIN, oldestMinWorkItem.userID, oldestMinWorkItem.getWorkLoadData())

	//return selected user model
	if (oldestMinWorkItem) {
		return usersArray[oldestMinWorkItem.index];
	}

	return false;
}

function WorkLoadItem(userId, workloadDataStr, itemIndex) {
	this.lastJob = null;
	this.count = 0;
	this.index = -1;

	this.userID = userId;
	this.index = itemIndex;

	if (workloadDataStr) {
		workloadDataStr = workloadDataStr.split("|");
		this.lastJob = parseInt(workloadDataStr[0]);
		this.count = parseInt(workloadDataStr[1]);
	}
	this.getWorkLoadData = function() {
		return this.lastJob + "|" + this.count;
	}
	this.toString = function() {
		return this.userID + ", " + this.lastJob + ", " + this.count;
	}
}//Class WorkLoadItem

/**
 * Add or Update a row in the standard choice bizDomainName
 * @param bizDomainName standard choice name
 * @param bizDomainValue
 * @param bizDomainDesc
 * @returns true if success, false if failed
 */
function addOrUpdateBizDomain(bizDomainName, bizDomainValue, bizDomainDesc) {

	var bizModel = null;
	var oper = null;

	var bizDomainItem = aa.bizDomain.getBizDomainByValue(bizDomainName, bizDomainValue);
	if (!bizDomainItem.getSuccess() || bizDomainItem.getOutput() == null) {
		bizModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.systemConfig.BizDomainModel").getOutput();
		bizModel.setBizdomain(bizDomainName);
		bizModel.setBizdomainValue(bizDomainValue);
		bizModel.setDescription(bizDomainDesc);
		bizModel.setAuditID("ADMIN");
		bizModel.setAuditStatus("A");
		bizModel.setServiceProviderCode(aa.getServiceProviderCode());
		oper = aa.bizDomain.createBizDomain(bizModel);
	} else {
		bizModel = bizDomainItem.getOutput().getBizDomain();
		bizModel.setDescription(bizDomainDesc);
		oper = aa.bizDomain.editBizDomain(bizModel);
	}

	if (!oper.getSuccess()) {
		logDebug("**ERROR " + oper.getErrorMessage());
		logDebug("**ERROR make sure standard choice " + WORKLOAD_DATA_BIZDOMAIN + " is added (System Switch)");
	}

	return oper.getSuccess();
}

/**
 * check if any value in userDistrictModelsArray is exist in requiredDistrictsArray
 * 
 * @param requiredDistrictsArray array of String
 * @param userDistrictModelsArray array of DistrictModel
 * @returns {Boolean} true if a value exists, false otherwise
 */
function hasRequiredDistrict(requiredDistrictsArray, userDistrictModelsArray) {
	for (r in requiredDistrictsArray) {
		for (d in userDistrictModelsArray) {
			if (requiredDistrictsArray[r] == userDistrictModelsArray[d].getDistrict()) {
				return true;
			}
		}
	}
	return false;
}

/**
 * adds userModel to usersArray if not already added
 * 
 * @param usersArray
 * @param userModel
 * @returns {Array} updated usersArray
 */
function addUserModel(usersArray, userModel) {
	if (usersArray == null)
		usersArray = new Array();
	if (usersArray.length == 0) {
		usersArray.push(userModel);
		return usersArray;
	}
	for (u in usersArray) {
		if (usersArray[u].getUserID() == userModel.getUserID()) {
			return usersArray;
		}
	}
	usersArray.push(userModel);
	return usersArray;
}
//=====================================Internal Functions-END=======================================
