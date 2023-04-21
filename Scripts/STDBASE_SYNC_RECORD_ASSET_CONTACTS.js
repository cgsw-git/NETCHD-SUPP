/*
Title : STDBASE_SYNC_RECORD_ASSET_CONTACTS
Purpose : Sync asset contacts with record contacts
Author: Ali Hasan

Functional Area :

JSON Example : 
{  
  "EnvHealth/Amendment/NA/NA": {
	    "WorkflowTaskUpdateAfter": [
	      {
	        "metadata": {
	          "description": "Copy contacts from Permit record to Asset",
	          "operators": {}
	        },
	        "preScript": "",
	        "criteria": {
	          "task": [
	             "Modification Review"
	          ],
	          "status": [ 
	             "Modification Request Approved"
	          ],
	          "recordType": "EnvHealth/Rec Health/Pool/Permit"
	        },
	        "action": {
	          "usageType": "copyToAsset"	          	          
	        },
	        "postScript": ""
	      }
	    ]	    
	  }
}
*/
//showMessage = true;
//showDebug   = true;

var TO_ASSET = 1;
var FROM_ASSET = 2;
var USAGE_TYPES = new Array();
USAGE_TYPES["copytoasset"] = TO_ASSET;
USAGE_TYPES["copyfromAsset"] = FROM_ASSET;


//This should be included in all Configurable Scripts
eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
var scriptSuffix = "SYNC_RECORD_ASSET_CONTACTS";

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

			syncContacts(rules);

			var postScript = rules.postScript;
			if (!matches(postScript, null, "")) {
				eval(getScriptText(postScript));
			}
		} //for all settings
	} //isConf()
} catch (ex) {
	logDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + ex);
}

var assetSeqNumber = null;
function syncContacts(rules) {				
	//set usageType, toLower() : avoid upper/lower mistakes in JSON
	var usageType = USAGE_TYPES[rules.action.usageType.toLowerCase()];
	
	if(usageType == TO_ASSET && controlString == "ContactLookUpAfter")
	{		
		assetSeqNumber = getAssetNumber(capId);		
		if(!assetSeqNumber) return;
		var contactsArray = new Array;
		for (var i = 0; i < contactModelList.size(); i++) {
			contactsArray.push(contactModelList.get(i));
		}
		logDebug("**INFO selected contacts: " + contactsArray.length);
		addParentContactToAsset(contactsArray,assetSeqNumber);
		return;
	}
	else if(usageType == TO_ASSET && controlString == "ContactEditAfter")
	{
		var assetContacts = getAssetContacts(capId);			
		if (!assetContacts || assetContacts == null) {
			logDebug("**WARN getAssetContacts error - failed to get asset contacts of cap: " + parentCapId);
			return false;
		}

		var assetContact;
		var parentContact = ContactObj;
		var capContactExistOnAsset;		
		if(!parentContact.getRefContactNumber()) return;
		for(xx in  assetContacts)
		{				
			assetContact = assetContacts[xx];
			capContactExistOnAsset = false;			
			if(assetContact.getContactSeqNumber() == parentContact.getRefContactNumber())
			{						
				capContactExistOnAsset = true;
				//Update asset contact from parent contact
				updateAssetContactFromParent(parentContact,assetContact);
				break;
			}						
		}
		if(!capContactExistOnAsset)
		{		
			var contactsArray = new Array;
			contactsArray.push(parentContact);
			addParentContactToAsset(contactsArray,assetSeqNumber);
		}	
		
	}
	else if(usageType == TO_ASSET && controlString == "ContactRemoveBefore")
	{				
		var contactsNumbersList = contactNbrList.toString();//contactNbrList exist in event script		
		contactsNumbersList = contactsNumbersList.replace(']','').replace('[','').replace('|',',');		
		var contactsNumbersArray = contactsNumbersList.split(",");		
		for (i = 0; i < contactsNumbersArray.length; i++) {
			var ccm = aa.people.getCapContactByPK(capId, contactsNumbersArray[i] * 1).getOutput();								
			aa.people.removePeople(ccm.getCapContactModel().getRefContactNumber() * 1);
		}				
		return;
	}
	else if(usageType == TO_ASSET && controlString == "ContactAddAfter")
	{
		assetSeqNumber = getAssetNumber(capId);
		if(!assetSeqNumber) return;
		var ccm = aa.people.getCapContactByPK(capId, ContactSeq * 1).getOutput();//ContactSeq exist in event script		
		var contactsToAddToAsset = new Array();		
		var transactionalContactNumber = null;
				
			var parentContact = ccm.getCapContactModel();				
			if(parentContact.getRefContactNumber() == null)
			{	
				var p = parentContact.getPeople();		
				var a = p.getAttributes();
				transactionalContactNumber = p.getContactSeqNumber() * 1;
						
				var r = aa.people.createPeopleWithAttribute(p, a);

				if (!r.getSuccess()) {
					logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage());
					return false;
				}
				
				var refPeopleId = p.getContactSeqNumber();
				logDebug("Successfully created reference contact #" + refPeopleId);
				
				var ccmSeq = transactionalContactNumber;
				var ccm = aa.people.getCapContactByPK(capId, ccmSeq).getOutput();
				if (ccm != null) {
					ccm = ccm.getCapContactModel();
				}
				ccm.setRefContactNumber(refPeopleId);
				aa.people.editCapContact(ccm);
				
				if(ccm.getRefContactNumber() != null)
				contactsToAddToAsset.push(ccm);
			}
		
		addParentContactToAsset(contactsToAddToAsset,assetSeqNumber);
		return;
	}
	
	//***************** Start check if record contacts modified by amendment or due renewal *****************//
	var isRenewal = false;
	if (rules.action.hasOwnProperty("Renewal") && String(rules.action.Renewal) != "") {
		isRenewal = rules.action.Renewal;
	}	
    	
	var getCapRenewalResult = aa.cap.getProjectByChildCapID(capId, "Renewal", null);
	if(usageType == TO_ASSET && getCapRenewalResult.getSuccess())
	{   
        logDebug("renewal record - copy to asset from parent(Permit)");
		capIdsArray = new Array();
		var tmpParentId = getParentCapID4Renewal();
		if (tmpParentId)
			capIdsArray.push(tmpParentId);
	}
	else
	{   
        logDebug("amend record - copy to asset from parent(Permit)");
		capIdsArray = getCapIdsArray(rules.criteria.recordType, usageType, isRenewal);
	}
	if (capIdsArray == null || capIdsArray.length == 0) {
		logDebug("**INFO capIdsArray empty or null, usageType=" + rules.action.usageType);
		return;
	}

	for (ca in capIdsArray) {
		var parentCapId = capIdsArray[ca];
		logDebug("**INFO parentCapId - Stdbase SYNC_RECORD_ASSET_CONTACTS:" + parentCapId);		 
		syncronizeAssetContactsWithParent(parentCapId);
	}		
}

function syncronizeAssetContactsWithParent(parentCapId)
{			
	var parentContacts = null;		
	var assetContacts = getAssetContacts(parentCapId);
	var parentContactResult = aa.people.getCapContactByCapID(parentCapId);
	if (!parentContactResult.getSuccess()) {
		logDebug("**WARN getCapContactByCapID error " + capContactResult.getErrorMessage());
		return false;
	}
	parentContacts = parentContactResult.getOutput();
	
	if (!parentContacts || parentContacts == null || parentContacts == "" || parentContacts.length == 0) {
		logDebug("**WARN Failed to get parentContacts");
		return false;
	}
	if (!assetContacts || assetContacts == null) {
		logDebug("**WARN getAssetContacts error - failed to get asset contacts of cap: " + parentCapId);
		return false;
	}

	var assetContact;
	var parentContact;	
	var deleteContactFromAsset;
	var addContactToAsset;		
	for(xx in  assetContacts)//Update/Delete asset contacts updated/deleted at parent record
	{				
		assetContact = assetContacts[xx];

		deleteContactFromAsset = true;
		for (yy in parentContacts)
		{			
			try//This try to skip delete the contact of asset when an exception happened while getting info
			{
				parentContact = parentContacts[yy].getCapContactModel();
				if(assetContact.getContactSeqNumber() == parentContact.getRefContactNumber())
				{						
					deleteContactFromAsset = false;
					//Update asset contact from parent contact
					updateAssetContactFromParent(parentContact,assetContact);
				}
			}
			catch (err)
			{
				deleteContactFromAsset = false;
			}				
		}
		if(deleteContactFromAsset)
		{				
			aa.people.removePeople(assetContact.getContactSeqNumber().toString());
		}						
	}
	var contactsArrayToAddToAsset = new Array();
	
	for (yy in parentContacts)//Add to parent record the contact(s) added at parent record
	{					
		parentContact = parentContacts[yy].getCapContactModel();

		addContactToAsset = true;		
		for(xx in  assetContacts)
		{			
			try//This try to skip delete the contact of asset when an exception happened while getting info
			{
				assetContact = assetContacts[xx];
				if(assetContact.getContactSeqNumber() == parentContact.getRefContactNumber())
				{								
					addContactToAsset = false;						
				}				
			}
			catch (err)
			{								
				addContactToAsset = false;
			}				
		}
		if(addContactToAsset)
		{					
			//Add parent contact to asset contacts
			contactsArrayToAddToAsset.push(parentContact);
		}						
	}
	
	if(assetSeqNumber)
	addParentContactToAsset(contactsArrayToAddToAsset,assetSeqNumber);
}

function getAssetContacts(parentCapId)
{
	var assetDataBusiness = aa.proxyInvoker.newInstance("com.accela.ams.asset.AssetDataBusiness").getOutput();
    
	var recordAssets = aa.asset.getRecordAssetsByRecordId(parentCapId);

	if (!recordAssets.getSuccess()) {
	
		logDebug("**ERROR: Failed to get src Assets: " + r.getErrorMessage());
		return false;
	}
	var assets = recordAssets.getOutput();
	var assetContactsResult  = new Array();
	if(assets.length ==0 ) { 
		logDebug("**INFO: Failed, there is no linked asset to clone contacts" );
		return null ; 
		} 
	assetSeqNumber = assets[0].getAssetPK().getG1AssetSequenceNumber(); //Relation between cap and asset is one to one, therefore we get first index
	var assetData = aa.asset.getAssetData(assetSeqNumber);
	if (assetData.getSuccess()) {
		assetData = assetData.getOutput(); //array of AssetScriptModel
	} else {
		logDebug("**ERROR: Failed to get asset data: " + r.getErrorMessage());
		return false;
	}
	var assetMasterModel = assetData.getAssetMasterModel();	 
	var arr = new Array();
	arr[0] = assetMasterModel;

	assetDataBusiness.addContactsToAssetList(arr);
	var assetContactsList = assetMasterModel.getRefContactsList();
	
	for (var iterator = assetContactsList.iterator(); iterator.hasNext();) {
		var scriptModel = iterator.next();
		assetContactsResult.push(scriptModel);						
	}		
	
	return assetContactsResult;
}

function updateAssetContactFromParent(parentContact,assetContact)
{	
	var assetContactSeqNumber = assetContact.getContactSeqNumber() * 1;
	
	var parentPeopleModel = parentContact.getPeople();	
	var assetPeopleModel = parentPeopleModel;
	assetPeopleModel.setContactSeqNumber(assetContactSeqNumber);
	aa.people.editPeople(assetPeopleModel);		
}

function addParentContactToAsset(contactsArrayToAddToAsset,assetSeqNumber)
{	
	var xrefContactsList = aa.util.newArrayList();
	for (yy in contactsArrayToAddToAsset) {
		
		var parentContact = contactsArrayToAddToAsset[yy];				
		var xrefContactModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.XRefContactEntityModel").getOutput();
		xrefContactModel.setContactSeqNumber(parentContact.getRefContactNumber() * 1);
		xrefContactModel.setPrimaryFlag("N");
		xrefContactModel.setEntityType("ASSET");		
		xrefContactModel.setEntityID1(assetSeqNumber);
		xrefContactModel.setServiceProviderCode(aa.getServiceProviderCode());

		var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel").getOutput();
		auditModel.setAuditDate(new Date());
		auditModel.setAuditStatus("A");
		auditModel.setAuditID("ADMIN");
		xrefContactModel.setAuditModel(auditModel);

		xrefContactsList.add(xrefContactModel);
	}//for all contacts
	aa.people.createRefContactRelationship(xrefContactsList);	
}


function getCapIdsArray(recordType, copyDirection, isRenewal) {
	if(copyDirection != TO_ASSET) return; 
	var capIdsArray = null;
	if (recordType == null || recordType.equals("")) {
		logDebug("**INFO recordType=null && TO_ASSET, abort");
		return new Array();
	}

	if (isRenewal) {
		capIdsArray = new Array();
		var tmpParentId = getParentCapID4Renewal();
		if (tmpParentId)
			capIdsArray.push(tmpParentId);
		return capIdsArray;
	}

	capIdsArray = getParents(recordType);
	
	if (!capIdsArray || capIdsArray == null) {
		capIdsArray = new Array();
	}
	return capIdsArray;
}

function getAssetNumber(parentCapId) {
	var recordAssets = aa.asset.getRecordAssetsByRecordId(parentCapId);

	if (!recordAssets.getSuccess()) {

		logDebug("**INFO: Failed to get src Assets: " + r.getErrorMessage());
		return null;
	}
	var assets = recordAssets.getOutput();
	if(assets.length ==0 ) { 
		logDebug("**INFO: Failed, there is no linked asset to clone contacts" );
		return null ; 
		} 
	return assets[0].getAssetPK().getG1AssetSequenceNumber(); //Relation between cap and asset is one to one, therefore we get first index
}