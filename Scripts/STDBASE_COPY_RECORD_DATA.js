/*

Title : Copy Record Data Automation (After)
Purpose : Copy data between parent and child records
Author: Yazan Barghouth

Functional Area :

JSON Example : 
{
  "Marijuana/Combo/Testing Facility/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Copy data between parent and child records",
          "operators": {
            "status":"!="
          }
        },
        "preScript": "",
        "criteria": {
          "task": [
            "Inspections"
          ],
          "status": [
            "Denied"
          ],
          "recordType": "Marijuana/Combo/Testing Facility/Application"
        },
        "action": {
          "usageType": "copyToChild",
          "CONTACTS": [
            "ALL"
          ],
          "ASI": [
            "ALL"
          ],
          "ASIT": [
            "ALL"
          ],
          "CONDITIONS": [
            "ALL"
          ],
          "ADDRESS": [
          ],
          "Renewal": false,
          "LICENSEDPROFESSIONALS": [
            "ALL"
          ],
          "ASSETS": [
            "ALL"
          ],
          "keepExistingAPO": false,
          "RECORDDETAILS": false,
          "RECORDNAME": false,
          "PARCEL": false,
          "OWNER": false,
          "ADDITIONALINFO": false,
          "EDUCATION": false,
          "CONTEDUCATION": false,
          "EXAM": false,
          "DOCUMENT": false
        },
        "postScript": ""
      }
    ]
  }
}

- Available "usageType": copyToParent, copyFromParent and copyToChild
- "recordType" can be un-set, if so, all parent/child records from all types will be used
- for items to copy, ex "ASIT", should be in Array: ["type1","type2","..."] values allowed ["ALL"] copy all, a "TYPE" copy this TYPE only, empty array [] don't copy
Notes:
- Pageflow Event, script should be placed onLoad of step-1 / page-1, once only to prevent data duplication
- Copy RECORDDETAILS uses method aa.cap.copyCapDetailInfo() (as is), the method copy some of the fields, not all of them
- Copy RECORDNAME is handled
- Only Following is supported in Pageflow: Contact, APO , LP and Parcel
- Copy Document is not supported in ACA
 *
 * updated by:  Ali Hasan @02/05/2019 to resolve the copy contacts from/to parent and
 * changes are: 
 * 1. Method copyContactFromParent4ACA and contactAddFromUser4ACA removed
 * 2. Methods added: copyContactFromParent,copyContactsFromParentByType,syncronizeContactsWithParent and syncronizeContactsWithParentByType
 * 3. Edit the way Method copyContactsLocal is working to use the added methods to:
 * a) Copy Direction is FROM_PARENT: call copyContactFromParent Method to work for both AV and ACA case to 
 * copy data from parent with keep the existing reference contact id.
 * b) Copy Direction is not FROM_PARENT: call the syncronizeContactsWithParent Method to 
 *    copy/synchronize contacts to the parent record.
 * c) Modify the declaration of isRenewal to be global variable.  
 * 
 * updated by:  Ali Hasan @02/13/2019 to resolve the copy LPs from/to parent and
 * changes are: 
 * 1. Methods added: syncronizeLPWithParent and updateFromRecordLicensedProf
 * 2. Edit the way Method copyAppLPLocal is working to use the added methods by
 *    call the syncronizeLPWithParent Method when Copy Direction is not FROM_PARENT to  
 *    copy/synchronize LPs to the parent record.  
 *    
 * updated by: Ali Hasan @07/23/2019 edit copyAssetsLocal method to work as the following:
 * When click on renewal button populate asset data from permit record to renewal record,   
 * This option work on ACA & Back-office and work to clone data between two directions:
 *   1)clone asset data from parent record to child record.
 *   2)clone  asset data from child record to permit record.     
 * Method Added: 
 * 1) copyAssetsFromParent
 * 2) syncronizeAssetsWithParent
 * And other modification(s) is: Change the way to get capIdsArray by adding a code for this case
 */
/*
showMessage =true ;
showDebug =true ;

aa.env.setValue("ErrorMessage", "write something ");
 */
//CONSTANTS



var TO_PARENT = 1;
var FROM_PARENT = 2;
var TO_CHILD = 3;
var USAGE_TYPES = new Array();
USAGE_TYPES["copyfromparent"] = FROM_PARENT;
USAGE_TYPES["copytoparent"] = TO_PARENT;
USAGE_TYPES["copytochild"] = TO_CHILD;

//this function is added so this script would work on pageflow
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

//This should be included in all Configurable Scripts
eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
var scriptSuffix = "COPY_RECORD_DATA";

try {

	var capIdsArray = null;

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

			copyRecordData(rules);

			var postScript = rules.postScript;
			if (!matches(postScript, null, "")) {
				eval(getScriptText(postScript));
			}
		} //for all settings
	} //isConf()
} catch (ex) {
	logDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + ex);
}
var isRenewal;
function copyRecordData(rules) {
	isRenewal = false;
	if (rules.action.hasOwnProperty("Renewal") && String(rules.action.Renewal) != "") {
		isRenewal = rules.action.Renewal;
	}

	if (isRenewal) {
		var dbParentId = getParentCapID4Renewal();
		if (typeof dbParentId == undefined || !dbParentId || dbParentId == null || dbParentId == "") {
			logDebug("**WARN " + scriptSuffix + " renewal relation not exist, creating relation, parent=" + parentCapId);
			var result = aa.cap.createRenewalCap(parentCapId, capId, true);
		}
		else
		{
			return;
		}
	}//renewal=true
    
	//set usageType, toLower() : avoid upper/lower mistakes in JSON
	var usageType = USAGE_TYPES[rules.action.usageType.toLowerCase()];
	var getCapRenewalResult = aa.cap.getProjectByChildCapID(capId, "Renewal", null);
	if(usageType == TO_PARENT && getCapRenewalResult.getSuccess())
	{   
        logDebug("renewal record & copy to parent")
		capIdsArray = new Array();
		var tmpParentId = getParentCapID4Renewal();
		if (tmpParentId)
			capIdsArray.push(tmpParentId);
	}
	else
	{   
        logDebug("parent record or amend record or ( renewal record & copy from parent ) ")
		capIdsArray = getCapIdsArray(rules.criteria.recordType, usageType, isRenewal);
	}
	if (capIdsArray == null || capIdsArray.length == 0) {
		logDebug("**INFO capIdsArray empty or null, usageType=" + rules.action.usageType);
		return;
	}

	copyContactsLocal(capIdsArray, rules.action.CONTACTS, usageType);
	copyAppSpecificLocal(capIdsArray, rules.action.ASI, usageType);
	copyAppSpecificTableLocal(capIdsArray, rules.action.ASIT, usageType);
	copyAppConditionsLocal(capIdsArray, rules.action.CONDITIONS, usageType);
	copyAppAddressesLocal(capIdsArray, rules.action.ADDRESS, usageType, rules.keepExistingAPO);
	copyAppLPLocal(capIdsArray, rules.action.LICENSEDPROFESSIONALS, usageType);
	copyAssetsLocal(capIdsArray, rules.action.ASSETS, usageType);

	if (rules.action.RECORDNAME) {
		copyRecordNameLocal(capIdsArray, usageType);
	}
	if (rules.action.RECORDDETAILS) {
		copyRecordDetailsLocal(capIdsArray, usageType);
	}
	if (rules.action.PARCEL) {
		copyParcelsLocal(capIdsArray, usageType, rules.action.keepExistingAPO);
	}
	if (rules.action.OWNER) {
		copyOwnerLocal(capIdsArray, usageType, rules.action.keepExistingAPO);
	}
	if (rules.action.ADDITIONALINFO) {
		copyAdditionalInfoLocal(capIdsArray, usageType);
	}
	if (rules.action.EDUCATION) {
		copyEducationLocal(capIdsArray, usageType);
	}
	if (rules.action.CONTEDUCATION) {
		copyContEducationLocal(capIdsArray, usageType);
	}
	if (rules.action.EXAM) {
		copyExamsLocal(capIdsArray, usageType);
	}
	if (rules.action.DOCUMENT) {
		copyDocumentsLocal(capIdsArray, usageType);
	}
}

/**
 * Copy Contacts from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes ALL or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyContactsLocal(capIdsArray, copyTypesValue, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyContactsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}
		
		if(copyDirection == FROM_PARENT || copyDirection == TO_CHILD )
		{
			var currCapModel = aa.env.getValue('CapModel');
            if(isPublicUser && !isRenewal && (!controlString.equalsIgnoreCase("ApplicationSubmitAfter") && !isRenewal))
			{
				var contactsGroup = currCapModel.getContactsGroup();
				if (contactsGroup.size() > 0) {
					return;
				}
			}			
			if (copyTypes == null)
			{
				copyContactFromParent(srcDestArray["src"], srcDestArray["dest"],currCapModel);
			}
			else
			{
				for (cd in copyTypes) {					
					copyContactsFromParentByType(srcDestArray["src"], srcDestArray["dest"], copyTypes[cd],currCapModel);
				}		
			}
			//This to remove the contacts on the child record(s) incase not exist in the parent record.
			var removeContactsArr = []
			checkConactsToRemove(srcDestArray["src"], srcDestArray["dest"] ,removeContactsArr)
			if(removeContactsArr.length > 0) 
				{
				removeContacts(srcDestArray["dest"] , removeContactsArr) ;
				}

			
			//return;
		}
		else if (copyDirection == TO_PARENT)
		{
			if (copyTypes == null)
				syncronizeContactsWithParent(srcDestArray["dest"]);
			else
				syncronizeContactsWithParentByType(copyTypes,srcDestArray["dest"]);
		}		
	} //for all capIdsArray
	return true;
}

/**
 * Copy ASI from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppSpecificLocal(capIdsArray, copyTypesValue, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);
		if (!srcDestArray) {
			logDebug("**INFO: copyAppSpecificLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyASIFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
			//copy from 1st parent only (other will just overwrite)
			return;
		}

		copyAppSpecificByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy ASIT from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppSpecificTableLocal(capIdsArray, copyTypesValue, copyDirection) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyAppSpecificTableLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyAsitFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
			//copy from 1st parent only (other will just overwrite)
			return;
		}

		copyASITablesByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Conditions from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppConditionsLocal(capIdsArray, copyTypesValue, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}

	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyAppConditionsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		copyConditionsByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Addresses from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppAddressesLocal(capIdsArray, copyTypesValue, copyDirection, keepExistingAPO) {
	for (ca in capIdsArray) {
		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);
    
		if (!srcDestArray) {
			logDebug("**INFO: copyAppAddressesLocal(): Invalid usageType: " + copyDirection);
			return false;
		}
		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}
		//delete existing
		deleteExistingAPO(srcDestArray["dest"], keepExistingAPO, "A");
		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyAddressFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
			//copy from 1st parent only (other will just overwrite)
			return;
		}
		copyAddressesByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Licensed Professionals from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAppLPLocal(capIdsArray, copyTypesValue, copyDirection) {

	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyAppLPLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		//handle ("" means don't copy)
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		if (copyDirection == FROM_PARENT) {
			if (controlString.equalsIgnoreCase("Pageflow")) {
				var currCapModel = aa.env.getValue('CapModel');
				copyLPFromParent4ACA(currCapModel, srcDestArray["src"], copyTypes);
				return;
			}

			copyLicensedProfByType(srcDestArray["src"], srcDestArray["dest"], copyTypes);
			return true;
		}
		else if (copyDirection == TO_PARENT)
		{
			syncronizeLPWithParent(srcDestArray["dest"], copyTypes);
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Assets from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyTypes all or a bar separated values (group names, or types)
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAssetsLocal(capIdsArray, copyTypesValue, copyDirection) {
	
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyContactsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		copyTypes = getCopyTypesArray(copyTypesValue);
		if (copyTypes != null && copyTypes.length == 0) {
			return;
		}

		if (copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');

			copyAssetsFromParent(srcDestArray["src"], srcDestArray["dest"], copyTypes);
			return;
		} else if (copyDirection == TO_PARENT) {
			syncronizeAssetsWithParent(srcDestArray["dest"],copyTypes);
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Parcels from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyParcelsLocal(capIdsArray, copyDirection, keepExistingAPO) {

	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyParcelsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		//delete existing
		deleteExistingAPO(srcDestArray["dest"], keepExistingAPO, "P");

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyParcelsFromParent4ACA(currCapModel, srcDestArray["src"]);

			//copy from 1st parent only (other will just overwrite)
			return;
		}

		copyParcels(srcDestArray["src"], srcDestArray["dest"]);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Owner from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyOwnerLocal(capIdsArray, copyDirection, keepExistingAPO) {
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyOwnerLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		//delete existing
		deleteExistingAPO(srcDestArray["dest"], keepExistingAPO, "O");

		//ACA PageFlow/ FROM_PARENT
		if (controlString.equalsIgnoreCase("Pageflow") && copyDirection == FROM_PARENT) {
			var currCapModel = aa.env.getValue('CapModel');
			copyOwnersFromParent4ACA(currCapModel, srcDestArray["src"]);
			//copy from 1st parent only (other will just overwrite)
			return;
		}

		copyOwner(srcDestArray["src"], srcDestArray["dest"]);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Education from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyEducationLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}

	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyEducationLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		var cr = aa.education.copyEducationList(srcDestArray["src"], srcDestArray["dest"]);

		if (!cr.getSuccess()) {
			logDebug("**INFO: copyEducationLocal(): failed: " + cr.getErrorMessage());
		}
		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Exams from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyExamsLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyExamsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		var cr = aa.examination.copyExaminationList(srcDestArray["src"], srcDestArray["dest"]);

		if (!cr.getSuccess()) {
			logDebug("**INFO: copyExamsLocal(): failed: " + cr.getErrorMessage());
		}
		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Documents from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyDocumentsLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		if (!srcDestArray) {
			logDebug("**INFO: copyDocumentsLocal(): Invalid usageType: " + copyDirection);
			return false;
		}

		if (controlString == "ConvertToRealCAPAfter" && copyDirection == FROM_PARENT) {
			copyDocumentFromParent4ACA(srcDestArray["src"]);
			return;
		} else {
			aa.cap.copyRenewCapDocument(srcDestArray["src"], srcDestArray["dest"], aa.getAuditID());
		}

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Additional Info from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyAdditionalInfoLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}

	for (ca in capIdsArray) {
		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		var adFrom = aa.cap.getBValuatn4AddtInfo(srcDestArray["src"]);
		if (!adFrom.getSuccess()) {
			logDebug("**INFO: copyAdditionalInfoLocal(): failed: " + adFrom.getErrorMessage());
			return false;
		}
		adFrom = adFrom.getOutput();
		var valueTnFrom = adFrom.getbValuatn();

		var cdFrom = aa.cap.getCapDetail(srcDestArray["src"]);
		if (!cdFrom.getSuccess()) {
			logDebug("**INFO: copyAdditionalInfoLocal(): failed: " + cdFrom.getErrorMessage());
			return false;
		}
		cdFrom = cdFrom.getOutput();

		var adTo = aa.cap.getBValuatn4AddtInfo(srcDestArray["dest"]);
		if (!adTo.getSuccess()) {
			logDebug("**INFO: copyAdditionalInfoLocal(): failed: " + adTo.getErrorMessage());
			return false;
		}
		adTo = adTo.getOutput();
		var valueTnTo = adTo.getbValuatn();

		var cdTo = aa.cap.getCapDetail(srcDestArray["dest"]);
		if (!cdTo.getSuccess()) {
			logDebug("**INFO: copyAdditionalInfoLocal(): failed: " + cdTo.getErrorMessage());
			return false;
		}
		cdTo = cdTo.getOutput();

		adTo.setFeeFactorFlag(adFrom.getFeeFactorFlag());
		adTo.setEstimatedValue(adFrom.getEstimatedValue());
		adTo.setValuationPeriod(adFrom.getValuationPeriod());
		adTo.setCalculatedValue(adFrom.getCalculatedValue());
		adTo.setPlanCheckValue(adFrom.getPlanCheckValue());

		adTo.getbValuatn().setFeeFactorFlag(valueTnFrom.getFeeFactorFlag());
		adTo.getbValuatn().setEstimatedValue(valueTnFrom.getEstimatedValue());
		adTo.getbValuatn().setValuationPeriod(valueTnFrom.getValuationPeriod());
		adTo.getbValuatn().setCalculatedValue(valueTnFrom.getCalculatedValue());
		adTo.getbValuatn().setPlanCheckValue(valueTnFrom.getPlanCheckValue());

		cdTo.setHouseCount(cdFrom.getHouseCount());
		cdTo.setConstTypeCode(cdFrom.getConstTypeCode());
		cdTo.setBuildingCount(cdFrom.getBuildingCount());
		cdTo.setPublicOwned(cdFrom.getPublicOwned());

		aa.cap.editAddtInfo(cdTo, adTo);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Record Details from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyRecordDetailsLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}

	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		aa.cap.copyCapDetailInfo(srcDestArray["src"], srcDestArray["dest"]);

		//for Description Field
		aa.cap.copyCapWorkDesInfo(srcDestArray["src"], srcDestArray["dest"]);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
/**
 * Copy Continuing Education from Current record to Parent or Child records, Or from Parent to Current Record, based on copyDirection parameter
 * @param capIdsArray array of Parent or Child CapIdModel
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns {Boolean} true if success, false otherwise
 */
function copyContEducationLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}
	for (ca in capIdsArray) {

		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		aa.continuingEducation.copyContEducationList(srcDestArray["src"], srcDestArray["dest"]);

		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}
function copyRecordNameLocal(capIdsArray, copyDirection) {

	//This Portlet is not supported in Pageflow
	if (controlString.equalsIgnoreCase("Pageflow")) {
		return;
	}

	for (ca in capIdsArray) {
		var srcDestArray = getCopySrcDest(capId, capIdsArray[ca], copyDirection);

		var fromCapModel = aa.cap.getCapByPK(srcDestArray["src"], true);
		if (fromCapModel.getSuccess()) {
			fromCapModel = fromCapModel.getOutput();

			var toCapModel = aa.cap.getCapByPK(srcDestArray["dest"], true);
			if (toCapModel.getSuccess()) {
				toCapModel = toCapModel.getOutput();
				toCapModel.setSpecialText(fromCapModel.getSpecialText());
				aa.cap.editCapByPK(toCapModel).getSuccess();
			}
		}
		//copy from 1st parent only (other will just overwrite)
		if (copyDirection == FROM_PARENT) {
			return true;
		}
	} //for all capIdsArray
	return true;
}

/**
 * get a list of Parent or Child records related to Current capId.<br>- Child or Parent is determined by copyDirection parameter
 * @param recordType get Caps of this type only, null or empty means ANY
 * @param copyDirection Number: TO_PARENT = 1, FROM_PARENT = 2, TO_CHILD = 3
 * @returns array of CapIdModel
 */
function getCapIdsArray(recordType, copyDirection, isRenewal) {
	var capIdsArray = null;
	if ((recordType == null || recordType.equals("")) && copyDirection == FROM_PARENT) {
		logDebug("**INFO recordType=null && FROM_PARENT, abort");
		return new Array();
	}

	if (controlString == "Pageflow" && (copyDirection == FROM_PARENT || copyDirection == TO_PARENT)) {
		var myParentCapID = null;

		if (isRenewal) {
			myParentCapID = getParentCapID4Renewal()
		} else {
			myParentCapID = getParentCapId4ACA(capId);
		}

		if (myParentCapID == null) {
			logDebug("**INFO could not get parent CAP-ID for: " + capId);
			return new Array();
		}

		capIdsArray = new Array();
		capIdsArray.push(myParentCapID);
		return capIdsArray;
	}

	if (controlString == "ConvertToRealCAPAfter" && (copyDirection == FROM_PARENT || copyDirection == TO_PARENT)) {

		if (isRenewal) {
			capIdsArray = new Array();
			var tmpParentId = getParentCapID4Renewal();
			if (tmpParentId)
				capIdsArray.push(tmpParentId);
			return capIdsArray;
		}

		var myParentCapID = aa.env.getValue("ParentCapID"); //getParentByCapId(capId);
		if (myParentCapID == null || myParentCapID == "") {
			logDebug("**INFO could not get parent CAP-ID for: " + capId);
			return new Array();
		}

		capIdsArray = new Array();
		capIdsArray.push(myParentCapID);
		return capIdsArray;
	}

	if (copyDirection == TO_PARENT || copyDirection == FROM_PARENT) {
		if (isRenewal) {
			capIdsArray = new Array();
			var tmpParentId = getParentCapID4Renewal();
			if (tmpParentId)
				capIdsArray.push(tmpParentId);
			return capIdsArray;
		}

		if (recordType == null || recordType.equals("")) {
			capIdsArray = getParents();
		} else {
			capIdsArray = getParents(recordType);
		}

	} else if (copyDirection == TO_CHILD) {
		capIdsArray = getChilds(recordType);
	}

	if (!capIdsArray || capIdsArray == null) {
		capIdsArray = new Array();
	}
	return capIdsArray;
}
/**
 * get list of Child records, related to Current capId
 * @param recordType
 * @returns array of CapIdModel
 */
function getChilds(recordType) {
	var caps = aa.cap.getChildByMasterID(capId);
	if (caps.getSuccess()) {
		caps = caps.getOutput();
	} else {
		logDebug("**INFO: getChilds returned an error: " + caps.getErrorMessage());
		return null;
	}

	if (!caps.length) {
		logDebug("**INFO: getChilds function found no children");
		return null
	}

	var recordTypeArray = null;
	var resultArray = new Array();

	for (c in caps) {
		//All
		if (recordType == null || recordType.equals("")) {
			resultArray.push(caps[c].getCapID());
		} else if (caps[c].getCapType().toString().equals(recordType)) {
			resultArray.push(caps[c].getCapID());
		} //recordTypeArray !null
	} //for all childs
	return resultArray;
}
/**
 * puts capId1 and capId2 in an array ["src"], ["dest"] based on copyDirection
 * @param capId1 CapID of current record
 * @param capId2 CapID of Other record
 * @param copyDirection Number, TO_PARENT=1, FROM_PARENT=2 and TO_CHILD=3
 * @returns Associative array ["src"], ["dest"], or false if copyDirection not supported
 */
function getCopySrcDest(capId1, capId2, copyDirection) {
	var srcDestArr = new Array();
	if (copyDirection == TO_PARENT || copyDirection == TO_CHILD) {
		srcDestArr["src"] = capId1;
		srcDestArr["dest"] = capId2;
	} else if (copyDirection == FROM_PARENT) {
		srcDestArr["src"] = capId2;
		srcDestArr["dest"] = capId1;
	} else {
		return false;
	}
	return srcDestArr;
}
/**
 *
 * @param copyTypes {Array} have "ALL" Or types/group names
 * @returns null, if copyTypes length=1 and copyTypes[0] equals "ALL", otherwise, returns same array
 */
function getCopyTypesArray(copyTypes) {
	if (copyTypes && copyTypes != null && copyTypes != "" && copyTypes.length > 0 && copyTypes[0].equalsIgnoreCase("all")) {
		return null;
	} else if (copyTypes == null || copyTypes == "") {
		return new Array();
	} else {
		return copyTypes;
	}
}
///ACA (PageFlow) METHODS-----------------------

function copyDocumentFromParent4ACA(parentCapId) {
	var capDocumentList = aa.document.getDocumentListByEntity(String(parentCapId), "CAP").getOutput();
	if (capDocumentList == null || capDocumentList.size() == 0) {
		return;
	}
	copyAssosiateFormDocuments(capDocumentList, capId);
}

function copyAssosiateFormDocuments(documentList, toCapIDModel) {
	var edmsPolicyModel = aa.proxyInvoker.newInstance("com.accela.aa.policy.policy.EdmsPolicyModel").getOutput();
	var documentBusiness = aa.proxyInvoker.newInstance("com.accela.aa.ads.ads.DocumentBusiness").getOutput();
	if (documentList != null && documentList.size() > 0) {
		for (var i = 0; i < documentList.size(); i++) {
			var documentModel = documentList.get(i);
			var documentContentModel = documentBusiness.getDocumentContent(aa.getServiceProviderCode(), documentModel.getDocumentNo());
			documentModel.setEntityID(toCapIDModel.getID1() + "-" + toCapIDModel.getID2() + "-" + toCapIDModel.getID3());
			documentModel.setEntityType("CAP");
			documentModel.setDocumentContent(documentContentModel);
			var documenta = aa.document.createDocument(documentModel);
			if (documentModel.getDocumentContent() != null && documentModel.getDocumentContent().getDocInputStream() != null) {
				documentModel.getDocumentContent().getDocInputStream().close();
			}
		}
		for (var i = 0; i < documentList.size(); i++) {
			var clearModel = documentList.get(i);
			if (clearModel.getDocumentContent() != null) {
				clearModel.setDocumentContent(null);
			}
		}
	}
}

function copyAddressFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {

	var capAddressResult = aa.address.getAddressWithAttributeByCapId(parentCapId).getOutput();
	if (capAddressResult == null || capAddressResult.length == 0) {
		return;
	}

	var adrr = getPrimaryOrAddressByType(capAddressResult, typesArray);
	if (adrr != null) {
		currentRecordCapModel.setAddressModel(adrr);
	}
}
function getPrimaryOrAddressByType(addresses, typesArray) {
	var ourTypeAddress = null;

	for (a in addresses) {
		if (typesArray != null && arrayContainsValue(typesArray, addresses[a].getAddressType()) && addresses[a].getPrimaryFlag() == "Y") {
			return addresses[a];
		} else if (typesArray == null && addresses[a].getPrimaryFlag() == "Y") {
			return addresses[a];
		} else if (typesArray != null && arrayContainsValue(typesArray, addresses[a].getAddressType()) && ourTypeAddress == null) {
			ourTypeAddress = addresses[a];
		} else if (typesArray == null && ourTypeAddress == null) {
			ourTypeAddress = addresses[a];
		}
	} //for

	return ourTypeAddress;
}
function copyParcelsFromParent4ACA(currentRecordCapModel, parentCapId) {

	//assume primary parcel is at index=0
	var primaryIndex = 0;

	var capParcelResult = aa.parcel.getParcelandAttribute(parentCapId, null).getOutput();

	if (capParcelResult == null || capParcelResult.size() == 0) {
		return;
	}

	for (var i = 0; i < capParcelResult.size(); i++) {

		if (capParcelResult.get(i).getPrimaryParcelFlag() == "Y") {
			primaryIndex = i;
			break;
		}
	} //for all parcels

	var capParcel = aa.parcel.getCapParcelModel().getOutput();
	capParcel.setParcelModel(capParcelResult.get(primaryIndex));
	currentRecordCapModel.setParcelModel(capParcel);
}

function copyOwnersFromParent4ACA(currentRecordCapModel, parentCapId) {
	var owners = aa.owner.getOwnerByCapId(parentCapId).getOutput();
	if (owners.length > 0) {
		currentRecordCapModel.setOwnerModel(owners[0].getCapOwnerModel());
	}
}

function copyLPFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {

	if (currentRecordCapModel.getLicenseProfessionalList() == null) {
		currentRecordCapModel.setLicenseProfessionalList(aa.util.newArrayList());
	}
	if (currentRecordCapModel.getLicenseProfessionalList().size() > 0) {
		return;
	}

	var t = aa.licenseProfessional.getLicenseProf(parentCapId);
	if (t.getSuccess()) {
		t = t.getOutput();

		for (lp in t) {
			if (typesArray != null && !arrayContainsValue(typesArray, t[lp].getLicenseProfessionalModel().getLicenseType())) {
				continue;
			}

			var newLicenseModel = t[lp].getLicenseProfessionalModel();
			newLicenseModel.setComponentName(null);
			newLicenseModel.setCapID(null);
			newLicenseModel.setAgencyCode(aa.getServiceProviderCode());
			newLicenseModel.setAuditID(aa.getAuditID());
			currentRecordCapModel.getLicenseProfessionalList().add(newLicenseModel);
		}
	}
}


function copyASIFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {
	var asiGroups = currentRecordCapModel.getAppSpecificInfoGroups();
	var asiArray = new Array();
	loadAppSpecific4ACA(asiArray, parentCapId);
	setFieldValue(asiArray, asiGroups, typesArray);
}

function copyAsitFromParent4ACA(currentRecordCapModel, parentCapId, typesArray) {
	var currentRecordAsitGroups = capModel.getAppSpecificTableGroupModel();

	if (currentRecordAsitGroups == null || currentRecordAsitGroups.getTablesMap() == null) {
		return;
	}

	var ta = currentRecordAsitGroups.getTablesMap().values();
	var tai = ta.iterator();
	while (tai.hasNext()) {
		var tsm = tai.next();
		var tableName = "" + tsm.getTableName().toString();
		if (typesArray != null && !arrayContainsValue(typesArray, tableName)) {
			continue;
		}
		var asitArray = loadASITable(tableName, parentCapId);
		currentRecordAsitGroups = addASITable4ACAPageFlowCamp(currentRecordAsitGroups, tableName, asitArray, capModel.getCapID());
	}
}

function setFieldValue(asiValuesArray, asiGroups, typesArray) {
	if (asiGroups == null) {
		return false;
	}
	var iteGroups = asiGroups.iterator();
	while (iteGroups.hasNext()) {
		var group = iteGroups.next();
		if (typesArray != null && !arrayContainsValue(typesArray, group.getGroupName())) {
			continue;
		}
		var fields = group.getFields();
		if (fields != null) {
			var iteFields = fields.iterator();
			while (iteFields.hasNext()) {
				var field = iteFields.next();
				field.setChecklistComment(asiValuesArray[field.getCheckboxDesc()]);
			}
		}
	} //for all groups
	return true;
}

function addASITable4ACAPageFlowCamp(destinationTableGroupModel, tableName, tableValueArray) {
	var itemCap = capId
	if (arguments.length > 3)
		itemCap = arguments[3];

	if (destinationTableGroupModel == null || destinationTableGroupModel.getTablesMap() == null) {
		return;
	}

	var ta = destinationTableGroupModel.getTablesMap().values();
	var tai = ta.iterator();

	var found = false;
	while (tai.hasNext()) {
		var tsm = tai.next();
		if (tsm.getTableName().equals(tableName)) {
			if (tsm.getTableFields() != null && tsm.getTableFields().size() > 0) {
				return destinationTableGroupModel;
			}
			found = true;
			break;
		}
	}

	if (!found) {
		logDebug("cannot update asit for ACA, no matching table name");
		return false;
	}

	var i = -1;
	if (tsm.getTableFields() != null) {
		i = 0 - tsm.getTableFields().size()
	}

	for (thisrow in tableValueArray) {
		var fld = aa.util.newArrayList();
		var fld_readonly = aa.util.newArrayList();
		var col = tsm.getColumns()
		var coli = col.iterator();
		while (coli.hasNext()) {
			var colname = coli.next();
			if (!tableValueArray[thisrow][colname.getColumnName()]) {
				logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
				tableValueArray[thisrow][colname.getColumnName()] = "";
			}

			if (typeof (tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") {
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue ? tableValueArray[thisrow][colname.getColumnName()].fieldValue : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
				fld.add(fldToAdd);
				fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);

			} else {
				var args = new Array(tableValueArray[thisrow][colname.getColumnName()] ? tableValueArray[thisrow][colname.getColumnName()] : "", colname);
				var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
				fldToAdd.setRowIndex(i);
				fldToAdd.setFieldLabel(colname.getColumnName());
				fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
				fldToAdd.setReadOnly(false);
				fld.add(fldToAdd);
				fld_readonly.add("N");
			}
		}
		i--;
		if (tsm.getTableFields() == null) {
			tsm.setTableFields(fld);
		} else {
			tsm.getTableFields().addAll(fld);
		}
		if (tsm.getReadonlyField() == null) {
			tsm.setReadonlyField(fld_readonly);
		} else {
			tsm.getReadonlyField().addAll(fld_readonly);
		}
	}

	tssm = tsm;
	return destinationTableGroupModel;
}
function getParentCapId4ACA(myCapId) {
	var getCapResult = aa.cap.getProjectParents(myCapId, 1);
	if (getCapResult.getSuccess()) {
		var parentArray = getCapResult.getOutput();
		if (parentArray.length) {
			return parentArray[0].getCapModel().getCapID();
		}
	}
	return null;
}

/**
 * Deletes selected component from deleteFromCapId if keepExisting is true,<br/>flag 'keepExisting' is passed and checked in case it's coming from a settings source
 * @param deleteFromCapId capId to delete related APO from
 * @param keepExisting boolean, check if delete required
 * @param whichAPO which component to delete A: address P: Parcel O:Owner
 */
function deleteExistingAPO(deleteFromCapId, keepExisting, whichAPO) {
	if (keepExisting || whichAPO == null || whichAPO == "") {
		return;
	}

	if (whichAPO.equalsIgnoreCase("A")) {
		var addresses = aa.address.getAddressByCapId(deleteFromCapId, null);
		if (addresses.getSuccess()) {
			addresses = addresses.getOutput();
			for (a in addresses) {
				aa.address.removeAddress(deleteFromCapId, addresses[a].getAddressId());
			}
		}
	} else if (whichAPO.equalsIgnoreCase("P")) {
		var pbzns = aa.proxyInvoker.newInstance("com.accela.aa.aamain.parcel.ParcelBusiness").getOutput();
		var capModelDeleteFrom = aa.cap.getCap(deleteFromCapId);
		if (capModelDeleteFrom.getSuccess()) {
			capModelDeleteFrom = capModelDeleteFrom.getOutput();
			capModelDeleteFrom = capModelDeleteFrom.getCapModel();
			pbzns.removeParcel(capModelDeleteFrom);
		}
	} else if (whichAPO.equalsIgnoreCase("O")) {
		var owners = null;
		owners = aa.owner.getOwnerByCapId(deleteFromCapId);
		if (owners.getSuccess()) {
			owners = owners.getOutput();
			for (o in owners) {
				aa.owner.removeCapOwnerModel(owners[o]);
			}
		}
	}
}

function copyContactFromParent(pFromCapId, pToCapId,capModel) {
	//Copies all contacts from pFromCapId to pToCapId
	//07SSP-00037/SP5017
	//
	if (pToCapId == null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
	var copied = 0;
	if (capContactResult.getSuccess()) {
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts) {			
		    var xNewContact = Contacts[yy].getCapContactModel(); 
		    var refContactId= xNewContact.getRefContactNumber() ;
		    var contactType = xNewContact.getContactType() ;
		    var contactTypeTransitionArr = [] 
		    checkContactTypeTransitionExists(vToCapId ,xNewContact , contactTypeTransitionArr)
		    var contactTypeRefernceExists = checkContactTypeRefernceExists( vToCapId , refContactId , contactType )	
			if( contactTypeTransitionArr.length >0) 
				{
				//update transition contacts
				updateTransitionContact( xNewContact,contactTypeTransitionArr)
				}
			else if(!contactTypeRefernceExists)
				{
				//adding new contact types (transition , reference) dosn't exist, the automation will add this cap contact 
				var peopleModel = xNewContact.getPeople();
				var newContact = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactModel").getOutput();			
				try
				{		    
					newContact.setRefContactNumber(xNewContact.getRefContactNumber());
				    peopleModel.setServiceProviderCode(aa.getServiceProviderCode());
				    peopleModel.setContactSeqNumber(newContact.getPeople().getContactSeqNumber());
				    peopleModel.setAuditID(aa.getAuditID());
				    newContact.setPeople(peopleModel);
				}
				catch(ex)
				{
	   			  logDebug("**ERROR: Exception while update contact people model for " + xNewContact + ". Error: " + ex);
				}
				// Retrieve contact address list and set to related contact
				var contactAddressrs = aa.address.getContactAddressListByCapContact(newContact);
				if (contactAddressrs.getSuccess()) {
					var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
					newContact.getPeople().setContactAddressList(contactAddressModelArr);
				}
				newContact.setCapID(vToCapId);

				// Create cap contact, contact address and contact template						
	            if(isPublicUser && !isRenewal && (!controlString.equalsIgnoreCase("ApplicationSubmitAfter") && !isRenewal))
					capModel.getContactsGroup().add(newContact);
				else
					aa.people.createCapContactWithAttribute(newContact);

				copied++;
				logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
				} 
		}
	} else {
		logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
		return false;
	}
	return copied;
}

function copyContactsFromParentByType(pFromCapId, pToCapId, pContactType,capModel)
{
//	Copies all contacts from pFromCapId to pToCapId
//	where type == pContactType
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
	var copied = 0;

	if (capContactResult.getSuccess())
	{
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts)
		{
			if(Contacts[yy].getCapContactModel().getContactType() == pContactType)
			{
				    var xNewContact = Contacts[yy].getCapContactModel(); 
				    var refContactId= xNewContact.getRefContactNumber() ;
				    var contactType = xNewContact.getContactType() ;
				    var contactTypeTransitionArr = [] 
				    checkContactTypeTransitionExists(vToCapId ,xNewContact , contactTypeTransitionArr)
				    var contactTypeRefernceExists = checkContactTypeRefernceExists( vToCapId , refContactId , contactType )	
					if( contactTypeTransitionArr.length >0) 
				     {
				       //transition contact already exist, the automation will update the match transition contacts.
				        updateTransitionContact( xNewContact,contactTypeTransitionArr)
				    }
					else if(!contactTypeRefernceExists)
					{
					// if the cap contact types (transition , reference) dosn't exist, the automation will add this cap contact 
						var peopleModel = xNewContact.getPeople();
						var newContact = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactModel").getOutput();
						newContact.setRefContactNumber(xNewContact.getRefContactNumber());
					    peopleModel.setServiceProviderCode(aa.getServiceProviderCode());
					    peopleModel.setContactSeqNumber(newContact.getPeople().getContactSeqNumber());
					    peopleModel.setAuditID(aa.getAuditID());
					    newContact.setPeople(peopleModel);
					    var contactAddressrs = aa.address.getContactAddressListByCapContact(newContact);
						if (contactAddressrs.getSuccess()) {
							var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
							newContact.getPeople().setContactAddressList(contactAddressModelArr);
						}	
						newContact.setCapID(vToCapId);	
						if(isPublicUser && !isRenewal)
							capModel.getContactsGroup().add(newContact);
						else
							aa.people.createCapContact(newContact);

						copied++;
						logDebug("Copied contact from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
						}			
			}

		}
	}
	else
	{
		logDebug("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage()); 
		return false; 
	}
	return copied;
}

function syncronizeContactsWithParent(parentCapId)
{	
	var capContacts = null;
	var parentCapContacts = null;		
	var capContactResult = aa.people.getCapContactByCapID(capId);
	var parentCapContactResult = aa.people.getCapContactByCapID(parentCapId);
	if (!capContactResult.getSuccess() || !parentCapContactResult.getSuccess()) {
		logDebug("**WARN getCapContactByCapID error " + capContactResult.getErrorMessage());
		return false;
	}
	capContacts = capContactResult.getOutput();
	parentCapContacts = parentCapContactResult.getOutput();
	if (!capContacts || capContacts == null || capContacts == "" || capContacts.length == 0) {
		return false;
	}
	if (!parentCapContacts || parentCapContacts == null || parentCapContacts == "" || parentCapContacts.length == 0) {
		return false;
	}

	var capContact;
	var parentCapContact;
	var vCCSM;
	var vParentCCSM;
	var vContactObj;
	var vParentContactObj;
	var deleteContactFromParent;
	var addContactToParent;

	for(xx in  parentCapContacts)//Synchronize contacts with parent record and delete from parent the deleted contact(s) at the amendment record
	{						
		parentCapContact = parentCapContacts[xx].getCapContactModel();

		deleteContactFromParent = true;
		for (yy in capContacts)
		{			
			try//This try to skip delete the contact of parent when an exception happened while getting info
			{
				capContact = capContacts[yy].getCapContactModel();
				if(capContact.getRefContactNumber() == parentCapContact.getRefContactNumber())
				{						
					deleteContactFromParent = false;
					vCCSM = new com.accela.aa.emse.dom.CapContactScriptModel(capContact,aa.getServiceProviderCode(),
							aa.getAuditID());
					vContactObj = new contactObj(vCCSM);
					vContactObj.syncCapContactToReference();
				}
			}
			catch (err)
			{
				deleteContactFromParent = false;
			}				
		}
		if(deleteContactFromParent)
		{				
			vParentCCSM = new com.accela.aa.emse.dom.CapContactScriptModel(parentCapContact,aa.getServiceProviderCode(),
					aa.getAuditID());
			vParentContactObj = new contactObj(vParentCCSM);
			vParentContactObj.remove();
		}						
	}
	for (yy in capContacts)//Add to parent record the contact(s) added on by amendment record
	{					
		capContact = capContacts[yy].getCapContactModel();

		addContactToParent = true;
		for(xx in  parentCapContacts)
		{			
			try//This try to skip delete the contact of parent when an exception happened while getting info
			{
				parentCapContact = parentCapContacts[xx].getCapContactModel();
				if(capContact.getRefContactNumber() == parentCapContact.getRefContactNumber())
				{						
					addContactToParent = false;						
				}
			}
			catch (err)
			{
				addContactToParent = false;
			}				
		}
		if(addContactToParent)
		{								
			var newContact = capContact;
			// Retrieve contact address list and set to related contact
			var contactAddressrs = aa.address.getContactAddressListByCapContact(newContact);
			if (contactAddressrs.getSuccess()) {
				var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
				newContact.getPeople().setContactAddressList(contactAddressModelArr);
			}				
			newContact.setCapID(parentCapId);	
			aa.people.createCapContact(newContact);
		}						
	}

}

function syncronizeContactsWithParentByType(copyTypes,parentCapId)
{	
	var capContacts = null;
	var parentCapContacts = null;		
	var capContactResult = aa.people.getCapContactByCapID(capId);
	var parentCapContactResult = aa.people.getCapContactByCapID(parentCapId);
	if (!capContactResult.getSuccess() || !parentCapContactResult.getSuccess()) {
		logDebug("**WARN getCapContactByCapID error " + capContactResult.getErrorMessage());
		return false;
	}
	capContacts = capContactResult.getOutput();
	parentCapContacts = parentCapContactResult.getOutput();
	if (!capContacts || capContacts == null || capContacts == "" || capContacts.length == 0) {
		return false;
	}
	if (!parentCapContacts || parentCapContacts == null || parentCapContacts == "" || parentCapContacts.length == 0) {
		return false;
	}

	var capContact;
	var parentCapContact;
	var vCCSM;
	var vParentCCSM;
	var vContactObj;
	var vParentContactObj;
	var deleteContactFromParent;
	var addContactToParent;

	for (vContactType in copyTypes) {		
		for(xx in  parentCapContacts)//Synchronize contacts with parent record and delete from parent the deleted contact(s) at the amendment record
		{						
			parentCapContact = parentCapContacts[xx].getCapContactModel();

			deleteContactFromParent = true;
			for (yy in capContacts)
			{			
				try//This try to skip delete the contact of parent when an exception happened while getting info
				{
					capContact = capContacts[yy].getCapContactModel();
					if(capContact.getContactType() == vContactType)
					{
						if(capContact.getRefContactNumber() == parentCapContact.getRefContactNumber())
						{						
							deleteContactFromParent = false;
							vCCSM = new com.accela.aa.emse.dom.CapContactScriptModel(capContact,aa.getServiceProviderCode(),
									aa.getAuditID());
							vContactObj = new contactObj(vCCSM);
							vContactObj.syncCapContactToReference();
						}
					}
					else
					{
						deleteContactFromParent = false;
					}
				}
				catch (err)
				{
					deleteContactFromParent = false;
				}				
			}
			if(deleteContactFromParent)
			{				
				vParentCCSM = new com.accela.aa.emse.dom.CapContactScriptModel(parentCapContact,aa.getServiceProviderCode(),
						aa.getAuditID());
				vParentContactObj = new contactObj(vParentCCSM);
				vParentContactObj.remove();
			}	
		}
		for (yy in capContacts)//Add to parent record the contact(s) added on by amendment record
		{						
			capContact = capContacts[yy].getCapContactModel();
			if(capContact.getContactType() == vContactType)
			{
				addContactToParent = true;
				for(xx in  parentCapContacts)
				{			
					try//This try to skip delete the contact of parent when an exception happened while getting info
					{
						parentCapContact = parentCapContacts[xx].getCapContactModel();
						if(capContact.getRefContactNumber() == parentCapContact.getRefContactNumber())
						{						
							addContactToParent = false;						
						}
					}
					catch (err)
					{
						addContactToParent = false;
					}				
				}
				if(addContactToParent)
				{								
					var newContact = capContact;
					newContact.setCapID(parentCapId);	
					aa.people.createCapContact(newContact);						   
				}	
			}
		}
	}	
}

function updateFromRecordLicensedProf(vParentLPObject,vLPObject,vParentCapId)
{
	var retVal = false;
        var newLP =  vLPObject;  
	newLP.setCapID(vParentCapId);
	
	aa.licenseProfessional.editLicensedProfessional(newLP);		
	return true;    			
}

function syncronizeLPWithParent(parentCapId,typesArray)
{			
	var capLPs = null;
	var parentCapLPs = null;		
	var capLPResult = aa.licenseProfessional.getLicenseProf(capId);
	var parentCapLPResult = aa.licenseProfessional.getLicenseProf(parentCapId);
	if (!capLPResult.getSuccess() || !parentCapLPResult.getSuccess()) {
		logDebug("**WARN getLicenseProf error " + capLPResult.getErrorMessage());
		return false;
	}
	capLPs = capLPResult.getOutput();
	parentCapLPs = parentCapLPResult.getOutput();
	if (!capLPs || capLPs == null || capLPs == "" || capLPs.length == 0) {
		return false;
	}
	if (!parentCapLPs || parentCapLPs == null || parentCapLPs == "" || parentCapLPs.length == 0) {
		return false;
	}

	var capLP;
	var parentCapLP;			
	var deleteLPFromParent;
	var addLPToParent;
    		
	for(xx in  parentCapLPs)//Synchronize LPs with parent record and delete from parent the deleted LP(s) at the amendment record
	{						
		parentCapLP = parentCapLPs[xx];

		deleteLPFromParent = true;
		for (yy in capLPs)
		{			
			try//This try to skip delete the LP of parent when an exception happened while getting info
			{
				capLP = capLPs[yy];							
				if (capLP.getLicenseNbr() + "" == parentCapLP.getLicenseNbr() + ""
						&& capLP.getLicenseType() + "" == parentCapLP.getLicenseType() + "")					
				{						
					deleteLPFromParent = false;
					//Update Parent LP
					updateFromRecordLicensedProf(parentCapLP,capLP,parentCapId);
				}
			}
			catch (err)
			{
				deleteLPFromParent = false;
			}				
		}
		if(deleteLPFromParent)
		{				
			aa.licenseProfessional.removeLicensedProfessional(parentCapLP);
		}						
	}
	for (yy in capLPs)//Add to parent record the LP(s) added on by amendment record
	{					
		capLP = capLPs[yy];

		addLPToParent = true;
		for(xx in  parentCapLPs)
		{						
			try//This try to skip delete the LP of parent when an exception happened while getting info
			{
				parentCapLP = parentCapLPs[xx];
				if (capLP.getLicenseNbr() + "" == parentCapLP.getLicenseNbr() + ""
						&& capLP.getLicenseType() + "" == parentCapLP.getLicenseType() + "")					
				{						
					addLPToParent = false;					
				}
			}
			catch (err)
			{
				addLPToParent = false;
			}				
		}
		if(addLPToParent)
		{							
			var isByType = typesArray != null && typesArray.length > 0;
			var newLP = capLP;
			if (isByType){
				if(!arrayContainsValue(typesArray, newLP.getLicenseType())) {									
					newLP.setCapID(parentCapId);
					aa.licenseProfessional.createLicensedProfessional(newLP);	
				}}
			else
			{
				newLP.setCapID(parentCapId);
				aa.licenseProfessional.createLicensedProfessional(newLP);	
			}
		}						
	}
}

function copyAssetsFromParent(capIdFrom, capIdTo, typesArray) {
	copyAssetsByType
	var isByType = typesArray != null && typesArray.length > 0;		
	var a = aa.asset.getRecordAssetsByRecordId(capIdFrom);//WorkOrderAssetModel

	if (!a.getSuccess()) {

		logDebug("**INFO: Failed to get src Assets: " + r.getErrorMessage());
		return false;
	}
	var assets = a.getOutput();

	for (as in assets) {

		var seqNum = assets[as].getAssetPK().getG1AssetSequenceNumber();
		var assetData = aa.asset.getAssetData(seqNum);
		if (assetData.getSuccess()) {
			assetData = assetData.getOutput(); //array of AssetScriptModel
		} else {
			continue;
		}
		var assetMasterModel = assetData.getAssetMasterModel();//AssetMasterModel		
		if (isByType && !arrayContainsValue(typesArray, assetMasterModel.getG1AssetType())) {
			continue;
		}
		assets[as].setCapID(capIdTo);		
		aa.asset.createWorkOrderAsset(assets[as]);
	}//for all assets
	return true;
}


function copyAssetsFromParent(capIdFrom, capIdTo, typesArray) {
	var isByType = typesArray != null && typesArray.length > 0;
	var a = aa.asset.getRecordAssetsByRecordId(capIdFrom);//WorkOrderAssetModel

	if (!a.getSuccess()) {

		logDebug("**INFO: Failed to get src Assets: " + r.getErrorMessage());
		return false;
	}
	var assets = a.getOutput();

	for (as in assets) {

		var seqNum = assets[as].getAssetPK().getG1AssetSequenceNumber();
		var assetData = aa.asset.getAssetData(seqNum);
		if (assetData.getSuccess()) {
			assetData = assetData.getOutput(); //array of AssetScriptModel
		} else {
			continue;
		}
		var assetMasterModel = assetData.getAssetMasterModel();//AssetMasterModel		
		if (isByType && !arrayContainsValue(typesArray, assetMasterModel.getG1AssetType())) {
			continue;
		}
		assets[as].setCapID(capIdTo);
		aa.asset.createWorkOrderAsset(assets[as]);
	}//for all assets
	return true;
}

function syncronizeAssetsWithParent(parentCapId,typesArray) {
	var capAssets = null;
	var parentCapAssets = null;
	var capAssetResult = aa.asset.getRecordAssetsByRecordId(capId);
	var parentCapAssetResult = aa.asset.getRecordAssetsByRecordId(parentCapId);
	if (!capAssetResult.getSuccess() || !parentCapAssetResult.getSuccess()) {
		logDebug("**WARN getRecordAssetsByRecordId error " + capAssetResult.getErrorMessage());
		return false;
	}
	capAssets = capAssetResult.getOutput();
	parentCapAssets = parentCapAssetResult.getOutput();
	if (!capAssets || capAssets == null || capAssets == "" || capAssets.length == 0) {
		return false;
	}
	if (!parentCapAssets || parentCapAssets == null || parentCapAssets == "" || parentCapAssets.length == 0) {
		return false;
	}

	var capAsset;
	var parentCapAsset;
	var deleteAssetFromParent;
	var addAssetToParent;

	for (xx in parentCapAssets)//Synchronize Assets with parent record and delete from parent the deleted Asset(s) at the child record
	{
		parentCapAsset = parentCapAssets[xx];

		deleteAssetFromParent = true;
		for (yy in capAssets) {
			try//This try to skip delete the Asset of parent when an exception happened while getting info
			{
				capAsset = capAssets[yy];
				if (capAsset.getAssetPK().getG1AssetSequenceNumber() + "" == parentCapAsset.getAssetPK().getG1AssetSequenceNumber() + "") {
					deleteAssetFromParent = false;
					//Update Parent Asset					
				}
			} catch (err) {
				deleteAssetFromParent = false;
			}
		}
		if (deleteAssetFromParent) {
			aa.asset.removeWorkOrderAssetByPK(parentCapAsset);
		}
	}
	for (yy in capAssets)//Add to parent record the Asset(s) added on by child record
	{
		capAsset = capAssets[yy];

		addAssetToParent = true;
		for (xx in parentCapAssets) {
			try//This try to skip delete the Asset of parent when an exception happened while getting info
			{
				parentCapAsset = parentCapAssets[xx];
				if (capAsset.getAssetPK().getG1AssetSequenceNumber() + "" == parentCapAsset.getAssetPK().getG1AssetSequenceNumber() + "") {
					addAssetToParent = false;
				}
			} catch (err) {
				addAssetToParent = false;
			}
		}
		if (addAssetToParent) {
			var seqNum = capAsset.getAssetPK().getG1AssetSequenceNumber();
			var assetData = aa.asset.getAssetData(seqNum);
			if (assetData.getSuccess()) {
				assetData = assetData.getOutput(); //array of AssetScriptModel
			} else {
				continue;
			}
			var assetMasterModel = assetData.getAssetMasterModel();//AssetMasterModel		

			var isByType = typesArray != null && typesArray.length > 0;
			var newAsset = capAsset;
			if (isByType) {
				if (!arrayContainsValue(typesArray, assetMasterModel.getG1AssetType())) {
					newAsset.setCapID(parentCapId);
					aa.asset.createWorkOrderAsset(newAsset);
				}
			} else {
				newAsset.setCapID(parentCapId);
				aa.asset.createWorkOrderAsset(newAsset);
			}
		}
	}
}

/**
* checking the contact type reference exists by using the reference number and type of contact
*
* @param {object} capId
* @param {integer} refContactId 
* @param {string} contactType  
* @return {boolean} returns true if successful, false if not 
 */
function checkContactTypeRefernceExists( capId , refContactId , contactType )
{
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess()) {
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts) {			
		    var xNewContact = Contacts[yy].getCapContactModel();            
		    var _refContactId= xNewContact.getRefContactNumber() ;
		    var _contactType= xNewContact.getContactType()
		   
		   
		    if(refContactId != null && _refContactId == refContactId &&  _contactType == contactType )
		    {
		    	logDebug("Refernce contact No: " +refContactId + " and contact type:" + contactType + " already exists in record id:" + capId.getCustomID())
		    	return true ; 	
		    }
	}
	}
	else
	{
		logDebug("Error with aa.people.getCapContactByCapID. Message = " + capContactResult.getErrorMsg());
	}
	return false ;		
}

/**
* checking the contact type transition exists by using the contact values (contact Type, first Name, last Name, business Name, email) 
*
* @param {object} capId
* @param {object} contactCapModel 
* @param {Array} matchContactCapModelArr  
* @return {Array}  list of match contacts type transition
 */
function checkContactTypeTransitionExists(capId, contactCapModel ,  matchContactCapModelArr)
{  
	var contactType = contactCapModel.getContactType();
	var firstName = contactCapModel.getFirstName() ;
	var lastName = contactCapModel.getLastName() ;
	var businessName = contactCapModel.getBusinessName() ;
	var email= contactCapModel.getEmail() ;
	var refContactId = contactCapModel.getRefContactNumber() ;
	if(refContactId == null )
		{
		var capContact = aa.people.getCapContactByCapID(capId) ;
		if( capContact.getSuccess())
			{
			var capContactScriptModel = capContact.getOutput() ;
			for (i in capContactScriptModel) 
				{
				 var capContactModel = capContactScriptModel[i].getCapContactModel() ;
				 var _contactType = capContactModel.getContactType();
				 var _firstName = capContactModel.getFirstName() ;
				 var _lastName = capContactModel.getLastName() ;
				 var _businessName = capContactModel.getBusinessName() ;
				 var _email= contactCapModel.getEmail() ;
				 if( contactType == _contactType && firstName == _firstName && lastName == _lastName && email == _email && businessName == _businessName)
					 {
					logDebug("Contact type transition details: contactType:" + _contactType + " firstName:" + _firstName + " lastName:" +_lastName + " businessName:" + _businessName + " email:" + _email + " already exist in record ID:" + capId.getCustomID()  ) ;
					matchContactCapModelArr.push(capContactModel) ;
					 }
				}
	      }
		else 
			{
				logDebug("Error in aa.people.getCapContactByCapID API. Message = " + capContact.getErrorMsg());
			}
		}
}

/**
 * update array of contact cap objects by source cap contact object 
 *
 * @param {object} contactCapModel         set source contact model 
 * @param {array} matchContactCapModelArr  set array of contacts models need to update
  */
function updateTransitionContact( contactCapModel  , matchContactCapModelArr)
{
	for (i in matchContactCapModelArr)
		{
		  var updateCapContactModel = matchContactCapModelArr[i];
			updateCapContactModel.setFirstName( contactCapModel.getFirstName() )                      
			updateCapContactModel.setFullName( contactCapModel.getFullName() )  
			updateCapContactModel.setLastName( contactCapModel.getLastName() )     		 		 
			updateCapContactModel.setAccessLevel(contactCapModel.getAccessLevel())                     
			updateCapContactModel.setAddressLine1(contactCapModel.getAddressLine1())                    
			updateCapContactModel.setAddressLine2( contactCapModel.getAddressLine2())                   
			updateCapContactModel.setAddressLine3( contactCapModel.getAddressLine3())                   
			updateCapContactModel.setBirthDate( contactCapModel.getBirthDate())                        
			updateCapContactModel.setBusinessName( contactCapModel.getBusinessName())                   
			updateCapContactModel.setBusName2( contactCapModel.getBusName2())                   
			updateCapContactModel.setCity(contactCapModel.getCity())                            
			updateCapContactModel.setComment(contactCapModel.getComment())                      
			updateCapContactModel.setComponentName(contactCapModel.getComponentName())                   
			updateCapContactModel.setContactOnSRChange( contactCapModel.getContactOnSRChange())             	 
			updateCapContactModel.setContactType( contactCapModel.getContactType())                    
			updateCapContactModel.setContactTypeFlag(contactCapModel.getContactTypeFlag())                 
			updateCapContactModel.setCountry( contactCapModel.getCountry())                        
			updateCapContactModel.setCountryCode( contactCapModel.getCountryCode())                    
			updateCapContactModel.setEmail(contactCapModel.getEmail())                           
			updateCapContactModel.setEndBirthDate( contactCapModel.getEndBirthDate())                     
			updateCapContactModel.setEndDate( contactCapModel.getEndDate())                          
			updateCapContactModel.setFax( contactCapModel.getFax())                            
			updateCapContactModel.setFaxCountryCode(  contactCapModel.getFaxCountryCode())                
			updateCapContactModel.setFein(contactCapModel.getFein())                                             
			updateCapContactModel.setGender(contactCapModel.getGender())    
			updateCapContactModel.setI18NContactType(contactCapModel.getI18NContactType())        
			updateCapContactModel.setI18NGender(contactCapModel.getI18NGender())             
			updateCapContactModel.setI18NPreferredChannel(contactCapModel.getI18NPreferredChannel())   
			updateCapContactModel.setI18NRelation(contactCapModel.getI18NRelation())           
			updateCapContactModel.setI18NSalutation(contactCapModel.getI18NSalutation())         
			updateCapContactModel.setInternalUserFlag(contactCapModel.getInternalUserFlag()) 
			updateCapContactModel.setIsPrinted(contactCapModel.getIsPrinted())                                         
			updateCapContactModel.setMakePayments(contactCapModel.getMakePayments())                    
			updateCapContactModel.setManageDocuments(contactCapModel.getManageDocuments())                 
			updateCapContactModel.setManageInspections(contactCapModel.getManageInspections())               
			updateCapContactModel.setMaskedSsn(contactCapModel.getMaskedSsn())                
			updateCapContactModel.setMiddleName(contactCapModel.getMiddleName())                                       
			updateCapContactModel.setPersonType(contactCapModel.getPersonType())                      
			updateCapContactModel.setPhone1( contactCapModel.getPhone1())                         
			updateCapContactModel.setPhone1CountryCode( contactCapModel.getPhone1CountryCode())              
			updateCapContactModel.setPhone2(contactCapModel.getPhone2())                          
			updateCapContactModel.setPhone2CountryCode(contactCapModel.getPhone2CountryCode())               
			updateCapContactModel.setPhone3( contactCapModel.getPhone3())                         
			updateCapContactModel.setPhone3CountryCode(contactCapModel.getPhone3CountryCode())               
			updateCapContactModel.setPostOfficeBox(contactCapModel.getPostOfficeBox()) 
			updateCapContactModel.setNamesuffix( contactCapModel.getNamesuffix())                                     
			updateCapContactModel.setPrimaryFlag(contactCapModel.getPrimaryFlag())       
			updateCapContactModel.setRelation(contactCapModel.getRelation())                        
			updateCapContactModel.setRenewalsAndAmendments( contactCapModel.getRenewalsAndAmendments())          
			updateCapContactModel.setSalutation( contactCapModel.getSalutation())                     
			updateCapContactModel.setSearchFlag( contactCapModel.getSearchFlag())                     
			updateCapContactModel.setSocialSecurityNumber(contactCapModel.getSocialSecurityNumber())            
			updateCapContactModel.setStartDate(contactCapModel.getStartDate())                         
			updateCapContactModel.setState(contactCapModel.getState())                           
			updateCapContactModel.setStreetName( contactCapModel.getStreetName())                     
			updateCapContactModel.setSyncFlag( contactCapModel.getSyncFlag())                       
			updateCapContactModel.setTemplate(contactCapModel.getTemplate())                 
			updateCapContactModel.setTitle(contactCapModel.getTitle())                           
			updateCapContactModel.setTradeName(contactCapModel.getTradeName())                                            
			updateCapContactModel.setUserID(contactCapModel.getUserID())                          
			updateCapContactModel.setZip(contactCapModel.getZip())  
			var contactAddressrs = aa.address.getContactAddressListByCapContact(contactCapModel);
							if (contactAddressrs.getSuccess()) 
							{
								var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
								updateCapContactModel.getPeople().setContactAddressList(contactAddressModelArr);
							}
							else
							{
								 logDebug("Error in aa.address.getContactAddressListByCapContact API. Message = " + contactAddressrs.getErrorMsg());
							}
			aa.people.editCapContactWithAttribute(updateCapContactModel);
			logDebug("Transition Contact Details: contactType:" + contactCapModel.getContactType() + " firstName:" + contactCapModel.getFirstName() + " lastName:" +contactCapModel.getLastName() + " businessName:" + contactCapModel.getBusinessName() + " email:" + contactCapModel.getEmail() + " has been updated for record ID:" + aa.cap.getCap(updateCapContactModel.getCapID()).getOutput().getCapID().getCustomID()  ) ;
		}		
}

/**
 * returns array of un match contacts between source cap Id object and sub cap Id object. 
 *
 * @param {object} sourceCapId
 * @param {object} subCapId
 * @param {removeContactsArr} array 
 * @return {array} un match contacts between source and sub cap Ids objects.
  */
function checkConactsToRemove( sourceCapId, subCapId  , removeContactsArr)
{
	var capContactResult = aa.people.getCapContactByCapID(subCapId);

	if (capContactResult.getSuccess()) {
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts) {	
			var xNewContact = Contacts[yy].getCapContactModel();            
		    var _refContactId= xNewContact.getRefContactNumber() ;
		    var _contactType= xNewContact.getContactType() ;
		    var _contactSeqNumber  = xNewContact.getContactSeqNumber();
		    if(_refContactId != null )
		    	{
		    	var res =checkContactTypeRefernceExists( sourceCapId , _refContactId , _contactType )
		      if(!res) 
		    	  {
		    	  removeContactsArr.push(_contactSeqNumber);
		    	  logDebug("reference contact id:"+_refContactId+" and contact Seq Number: " +  _contactSeqNumber +" exists on sub record Id: " +subCapId.getCustomID()+  " and dosn't exist on main record Id:" + sourceCapId.getCustomID()  );
		    	  }
		    	}
		    else
		    	{
		    	var arr = []
		    	checkContactTypeTransitionExists(sourceCapId ,xNewContact , arr) ;
		    	if(arr.length == 0) 
		    		{
			    	  removeContactsArr.push(_contactSeqNumber);
		    		  logDebug("Transition contact details for contact Seq Number:" + _contactSeqNumber + " exist on sub record Id: " +subCapId.getCustomID() + " and dosn't exist on main record Id:" + sourceCapId.getCustomID()  )
		    		}
		    	
		    	}
		}
		}
}

/**
 * Remove contacts by cap Id object and array of sequance contacts numbers 
 *
 * @param {object} capId
 * @parm  {array}  sequance contacts numbers  
  */
function removeContacts(capId,removeContactsArr )
{
	for(i in removeContactsArr) 
	{
	var seqNumber = removeContactsArr[i] ;
		 var removeResult = aa.people.removeCapContact(capId, seqNumber)
         if (removeResult.getSuccess())
		 {
		   logDebug("(contactObj) contact removed  seqNumber: " + seqNumber + " from record " + capId.getCustomID());
		 }
	   else
	   {
           logDebug("(contactObj) error removing contact seqNumber: " + seqNumber + " from record " + capId.getCustomID() + " : " + removeResult.getErrorMessage());
	   } 
	}

}


