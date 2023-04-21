/*Title : Asset Automation
 Purpose : Create an asset (optionally) and link it to a record
 Author: Yazan Barghouth
 Functional Area : After All
 Description : JSON Example :
 
 {
  "EnvHealth/Food Retail/Food Facility/Application": {
    "WorkflowTaskUpdateAfter": [
      {
        "metadata": {
          "description": "Create Food Facility Asset",
          "operators": {
            
          }
        },
        "preScript": "",
        "criteria": {
          "customFields": {
            "Create New Facility": "Yes"
          },
          "task": [
            "Permit Issuance"
          ],
          "status": [
            "Issued"
          ]
        },
        "action": {
          "updateExistingRefAsset": true,
          "assetType": "Drainage Main",
          "assetGroup": "Health",
          "checkExistingAsset": true,
          "dateOfService": "",
          "copyAppNameToAssetName": true,
          "status": "Active",
          "copyContacts": [
            "Facility Owner",
            "Property Manager"
          ],
          "copyAddress": [
            "ALL"
          ],
          "customFieldsAttributeMapping": {
            "asiFieldName1": "AttributeField1",
            "asiFieldName2": "AttributeField2"
          },
          "customFieldsDefaultMapping": {
			"G1AssetName": "asi_G1AssetName",
            "G1AssetGroup": "asi_G1AssetGroup",
            "G1AssetType": "asi_G1AssetType",
            "G1Description": "asi_G1Description",
            "DateOfService": "asi_DateOfService",
            "G1ClassType": "asi_G1ClassType",
            "G1AssetStatus": "asi_G1AssetStatus",
            "StartValue": "asi_StartValue",
            "CurrentValue": "asi_CurrentValue",
            "DepreciationValue": "asi_DepreciationValue",
            "DepreciationAmount": "asi_DepreciationAmount",
            "StartDate": "asi_StartDate",
            "EndDate": "asi_EndDate",
            "SalvageValue": "asi_SalvageValue",
            "UseFulLife": "asi_UseFulLife",
            "AssetSize": "asi_AssetSize",
            "SizeUnit": "asi_SizeUnit"
          },
          "linkParent": true,
          "copyDocumentTypes": [
            "Site Plan",
            "Building Plan"
          ]
        },
        "postScript": ""
      }
    ]
  }
}

Notes:
- Script does NOT support pageflow.
- Duplication of asset is not possible, since a unique assetID is required to create a new asset.
- G1AssetID: AltID is used as it's required when creating an asset
- customFieldsAttributeMapping: mapping for attributes (ASI-Fieldname:attributeName)
- customFieldsDefaultMapping: mapping for default asset properties and ASI field name (propertyName:asiFieldName)
	- property namees must be correct as in the Object (provided sample has the correct names)
- updateExistingRefAsset: if set to true and a ref asset was found the asset prperties, attributes, contacts, ... will be updated
	though, linking asset to cap is not controlled with updateExistingRefAsset (it is always linked)
*/
var cacheService = null;
var assetDataService = null;

try {
	var configurableCommonContent = getScriptText("CONFIGURABLE_SCRIPTS_COMMON");
	if (configurableCommonContent && configurableCommonContent != null && configurableCommonContent != "") {
		eval(configurableCommonContent);
	} else {
		eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON", null, true));
	}
	var settingsArray = [];
	var scriptSuffix = "ASSET_AUTOMATION";
	isConfigurableScript(settingsArray, scriptSuffix);
	for (s in settingsArray) {

		if (cacheService == null) {
			cacheService = com.accela.aa.emse.dom.service.CachedService.getInstance();
			assetDataService = cacheService.getAssetDataService();
		}

		var rules = settingsArray[s];

		var preScript = rules.preScript;
		var postScript = rules.postScript;

		if (!isEmptyOrNull(preScript)) {
			eval(getScriptText(preScript, null, false));
		}
		if (cancelCfgExecution) {
			logDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
			cancelCfgExecution = false;
			continue;
		}

		assetAutomation(rules);

		if (!isEmptyOrNull(postScript)) {
			eval(getScriptText(postScript, null, false));
		}
	}//for all settingsArray

} catch (ex) {
	logDebug("**ERROR: Exception while verifying the rules for " + scriptSuffix + ". Error: " + ex + " on line " + ex.lineNumber);
}

function assetAutomation(rules) {

	var masterAssetModelForSearch = null;
	var masterAsset = null;
	var refAssetExist = false;
	var assetSeqNum = null;
	var vParentCapId = null;
	var rulesAssetGroup = handleUndefined(rules.action.assetGroup,false);
	var rulesAssetType = handleUndefined(rules.action.assetType,false);

	if (rules.action.checkExistingAsset) {
		
		// This search looks at assets added to an application and attempts to find a reference asset
		capAssetList = aa.asset.getAssetListByWorkOrder(capId,null).getOutput();
		for (a in capAssetList)
		{
			capAssetDataModel = capAssetList[a].getAssetDataModel();	
			capAssetMasterModel = capAssetList[a].getAssetMasterModel();
			if(capAssetMasterModel.getG1AssetGroup() == rulesAssetGroup && 
				capAssetMasterModel.getG1AssetType() == rulesAssetType){
					var capMasterAssetModelForSearch = aa.proxyInvoker.newInstance("com.accela.ams.asset.AssetMasterModel").getOutput();
					capMasterAssetModelForSearch.setServiceProviderCode(aa.getServiceProviderCode());
					capMasterAssetModelForSearch.setG1AssetGroup(capAssetMasterModel.getG1AssetGroup());
					capMasterAssetModelForSearch.setG1AssetType(capAssetMasterModel.getG1AssetType());
					capMasterAssetModelForSearch.setG1AssetID(capAssetMasterModel.getG1AssetID())
					capMasterAssetModelForSearch.setRecFulNam("ADMIN");
					masterAsset = findAssetByMasterAssetModel(capMasterAssetModelForSearch);
					if(masterAsset != null){
						assetSeqNum = masterAsset.getG1AssetSequenceNumber();
						break;
					}
				}
		}
		// If no masterAsset is found attempt to find it by Custom Fields if any are defined
		if(!masterAsset && rules.action.hasOwnProperty("customFieldsDefaultMapping") && rules.action.customFieldsDefaultMapping.length > 0){
			logDebug("Search by Custom Fields customFieldsDefaultMapping.length = "+ rules.action.customFieldsDefaultMapping.length);
			masterAssetModelForSearch = fillMasterModelFromASI(rules, false);
			masterAsset = findAssetByMasterAssetModel(masterAssetModelForSearch);
			if (masterAsset != null) {
				assetSeqNum = masterAsset.getG1AssetSequenceNumber();
			}
		}
		
	}//checkExistingAsset

	refAssetExist = (masterAsset != null);
	var newAssetDataModel = aa.asset.newAssetScriptModel();
	if (newAssetDataModel.getSuccess()) {
		newAssetDataModel = newAssetDataModel.getOutput().getAssetDataModel();
	}
	if (!refAssetExist) {
		masterAsset = fillMasterModelFromASI(rules, true);

		if (rules.action.copyAppNameToAssetName) {
			var capBasicInfo = aa.cap.getCapBasicInfo(capId).getOutput();
			masterAsset.setG1AssetName(capBasicInfo.getSpecialText());
		}

		//if not empty will overwrite asi value (if an asi is mapped)
		if (rules.action.status) {
			masterAsset.setG1AssetStatus(rules.action.status);
		}

		newAssetDataModel.setAssetMaster(masterAsset);
		try {
			assetSeqNum = assetDataService.createAssetDataWithoutEvent(newAssetDataModel);
		} catch (ex) {
			logDebug("**Exception while creating asset, script STDBASE_" + scriptSuffix + " Error:" + ex);
			return;
		}

		//initialize from search object
		if (assetSeqNum) {
			masterAsset = assetDataService.getAssetMasterBySeq(aa.getServiceProviderCode(), assetSeqNum);
		}
		assetDataService.editDataAttributes(fillAssetAttributes(rules, assetSeqNum));
	}//ref !exist

	if (refAssetExist && rules.action.updateExistingRefAsset) {
		//if set to true will overwrite asi value (if an asi is mapped)
		if (rules.action.copyAppNameToDescription) {
			var capBasicInfo = aa.cap.getCapBasicInfo(capId).getOutput();
			masterAsset.setG1AssetName(capBasicInfo.getSpecialText());

		}
		//if not empty will overwrite asi value (if an asi is mapped)
		if (rules.action.status) {
			masterAsset.setG1AssetStatus(rules.action.status);
		}
		assetDataService.editAssetMaster(masterAsset);
		assetDataService.editDataAttributes(fillAssetAttributes(rules, assetSeqNum));
	}//exist and update required

	if (!refAssetExist || (refAssetExist && rules.action.updateExistingRefAsset)) {
		//copy addresses
		if (rules.action.hasOwnProperty("copyAddress") && rules.action.copyAddress.length > 0) {
			var reqAddresses = rules.action.copyAddress;
			copyAddresses(reqAddresses, assetSeqNum);
		}//copy address

		//add contacts list:
		if (rules.action.hasOwnProperty("copyContacts") && rules.action.copyContacts.length > 0) {
			var contactsReqList = rules.action.copyContacts;
			var xrefContactsReqList = fillXRefContactList(contactsReqList, assetSeqNum);
			if (xrefContactsReqList.size() > 0) {
				var linkedXrefCon = aa.people.createRefContactRelationship(xrefContactsReqList);
			}
		}//copyContacts exist and filled

		if (rules.action.hasOwnProperty("copyDocumentTypes") && rules.action.copyDocumentTypes.length > 0) {
			var reqDocTypes = rules.action.copyDocumentTypes;
			var docAssocList = fillEntityAssocDocsList(reqDocTypes, assetSeqNum);
			if (docAssocList != null && docAssocList.size() > 0) {
				var docEntityAssocService = cacheService.getDocumentEntityAssociationService();
				var created = docEntityAssocService.createEntityAssociations(docAssocList);
			}
		}//copyDocumentTypes
	}//!found, or found and update required

	if (rules.action.linkParent && masterAsset) {
		vParentCapId = getParentByCapId(capId);
		if(vParentCapId){
			var workOrderAsset = aa.asset.newWorkOrderAssetScriptModel().getOutput();
			workOrderAsset.setCapID(vParentCapId);
			workOrderAsset.setAssetPK(masterAsset.getAssetPK());
			var linked = aa.asset.createWorkOrderAsset(workOrderAsset.getWorkOrderAssetModel());
			if (!linked.getSuccess()) {
				logDebug("**WARN failed to link asset with record=" + linked.getErrorMessage());
			}
		}
		else{
			logDebug("**WARN failed to find parent record to link asset for record " + capId.getCustomID());
		}
		
		
	}//linkParent
}//assetAutomation

function fillAssetAttributes(rules, assetSeqNum) {
	var dataAttributeModels = aa.util.newArrayList();

	var asiAttrMapping = rules.action.customFieldsAttributeMapping;
	for ( var asiName in asiAttrMapping) {
		var attrName = asiAttrMapping[asiName];
		var attrVal = getAppSpecific(asiName);

		var dataAttributeModel = aa.proxyInvoker.newInstance("com.accela.ams.asset.DataAttributeModel").getOutput();
		dataAttributeModel.setG1AssetSequenceNumber(assetSeqNum);
		dataAttributeModel.setG1AttributeName(attrName);
		dataAttributeModel.setG1AttributeValue(attrVal);
		dataAttributeModel.setRecDate(new Date());
		dataAttributeModel.setRecFulNam("ADMIN");
		dataAttributeModel.setRecStatus("A");
		dataAttributeModel.setServiceProviderCode(aa.getServiceProviderCode());

		dataAttributeModels.add(dataAttributeModel);
	}//for all asiMapping
	return dataAttributeModels;
}

function copyAddresses(reqAddresses, assetSeqNum) {
	var capAddresses = aa.address.getAddressByCapId(capId, null)
	if (capAddresses.getSuccess()) {
		capAddresses = capAddresses.getOutput();

		var assetLocServiceClazz = java.lang.Class.forName("com.accela.ams.asset.AssetLocationService");
		var assetLocationService = com.accela.util.AVContext.getBean(assetLocServiceClazz);

		for ( var cc in capAddresses) {
			var adrsScriptModel = capAddresses[cc];

			//skip address if not required to be copied
			if (reqAddresses[0].toUpperCase() != "ALL" && !exists(adrsScriptModel.getAddressType(), reqAddresses)) {
				continue;
			}

			var adrsModel = adrsScriptModel.getAddressModel();
			var refAdrsModel = aa.address.getRefAddressByPK(adrsModel.getRefAddressId());

			if (refAdrsModel.getSuccess()) {

				refAdrsModel = refAdrsModel.getOutput();

				var assetLocationModel = aa.proxyInvoker.newInstance("com.accela.ams.asset.AssetLocationModel").getOutput();
				assetLocationModel.setServiceProviderCode(aa.getServiceProviderCode());
				assetLocationModel.setG1AssetSeqNbr(assetSeqNum);
				assetLocationModel.setRecDate(new Date());
				assetLocationModel.setRecFulNam("ADMIN");
				assetLocationModel.setPrimaryFlag("N");
				assetLocationModel.setExtUID(adrsModel.getUID());
				assetLocationModel.setG1LocationID1(adrsScriptModel.getAddressId());

				try{
					assetLocationService.createAssetLocationAddress(refAdrsModel.getRefAddressModel(), assetLocationModel);
				}
				catch(err){
					logDebug("***WARNING Address already exists for this asset " + assetSeqNum + " Error Message - " + err);
				}
				
			}//get refAdrsModel success

		}//for all addresses
	}//get address success
}

function fillEntityAssocDocsList(reqDocTypes, assetSeqNum) {
	var docAssocList = aa.util.newArrayList();
	var capDocs = aa.document.getCapDocumentList(capId, "ADMIN");

	if (!capDocs.getSuccess()) {
		logDebug("**WARN getCapDocumentList error " + capDocs.getErrorMessage());
		return docAssocList;
	}

	capDocs = capDocs.getOutput();
	var isAllDocs = reqDocTypes.length == 1 && reqDocTypes[0].toUpperCase() == "ALL";

	for ( var pp in capDocs) {

		if (!isAllDocs && !exists(capDocs[pp].getDocCategory(), reqDocTypes)) {
			continue;
		}

		var docAssocModel = aa.proxyInvoker.newInstance("com.accela.orm.model.document.DocumentEntityAssociationModel").getOutput();
		docAssocModel.setServiceProviderCode(aa.getServiceProviderCode());
		docAssocModel.setDocumentID(capDocs[pp].getDocumentNo() * 1);
		docAssocModel.setEntityType("ASSET");
		docAssocModel.setEntityID(assetSeqNum);
		docAssocModel.setStatus(capDocs[pp].getDocStatus());

		var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel").getOutput();
		auditModel.setAuditDate(new Date());
		auditModel.setAuditStatus("A");
		auditModel.setAuditID("ADMIN");
		docAssocModel.setAuditModel(auditModel);

		//invokeGetters(auditModel);
		docAssocList.add(docAssocModel);
	}//for all docs
	return docAssocList;
}

function fillXRefContactList(contactsReqList, assetSeqNum) {
	var capContacts = null;
	var xrefContactsList = aa.util.newArrayList();

	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (!capContactResult.getSuccess()) {
		logDebug("**WARN getCapContactByCapID error " + capContactResult.getErrorMessage());
		return xrefContactsList;
	}
	capContacts = capContactResult.getOutput();

	if (!capContacts || capContacts == null || capContacts == "" || capContacts.length == 0) {
		return xrefContactsList;
	}

	var isAllContatcs = contactsReqList.length == 1 && contactsReqList[0].toUpperCase() == "ALL";

	for (yy in capContacts) {
		var capContact = capContacts[yy].getCapContactModel();

		//not ref contact
		if (!capContact.getRefContactNumber() || capContact.getRefContactNumber() == null || capContact.getRefContactNumber() == "") {
			continue;
		}

		//contact type not required for copy
		if (!isAllContatcs && !exists(capContact.getContactType(), contactsReqList)) {
			continue;
		}

		var xrefContactModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.XRefContactEntityModel").getOutput();
		xrefContactModel.setContactSeqNumber(capContact.getRefContactNumber() * 1);
		xrefContactModel.setPrimaryFlag("N");
		xrefContactModel.setEntityType("ASSET");
		xrefContactModel.setEntityID1(assetSeqNum);
		xrefContactModel.setServiceProviderCode(aa.getServiceProviderCode());

		var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel").getOutput();
		auditModel.setAuditDate(new Date());
		auditModel.setAuditStatus("A");
		auditModel.setAuditID("ADMIN");
		xrefContactModel.setAuditModel(auditModel);

		xrefContactsList.add(xrefContactModel);
	}//for all contacts
	return xrefContactsList;
}

function fillMasterModelFromASI(rules, fillAssetId) {
	var defaultMapping = rules.action.customFieldsDefaultMapping;

	//Default property name - setter name for AssetMasterModel object
	var setters = new Array();
	setters["G1AssetName"] = "setG1AssetName('#VAL#')";
	setters["G1AssetGroup"] = "setG1AssetGroup('#VAL#')";
	setters["G1AssetType"] = "setG1AssetType('#VAL#')";
	setters["G1Description"] = "setG1Description('#VAL#')";
	setters["DateOfService"] = "setDateOfService('#VAL#')";
	setters["G1ClassType"] = "setG1ClassType('#VAL#')";
	setters["G1AssetStatus"] = "setG1AssetStatus('#VAL#')";
	setters["StartValue"] = "setStartValue(+#VAL#)";
	setters["CurrentValue"] = "setCurrentValue(+#VAL#)";
	setters["DepreciationValue"] = "setDepreciationValue(+#VAL#)";
	setters["DepreciationAmount"] = "setDepreciationAmount(+#VAL#)";
	setters["StartDate"] = "setStartDate('#VAL#')";
	setters["EndDate"] = "setEndDate('#VAL#')";
	setters["SalvageValue"] = "setSalvageValue(+#VAL#)";
	setters["UseFulLife"] = "setUseFulLife(+#VAL#)";
	setters["AssetSize"] = "setAssetSize(+#VAL#)";
	setters["SizeUnit"] = "setSizeUnit('#VAL#')";

	var assetMasterModel = aa.proxyInvoker.newInstance("com.accela.ams.asset.AssetMasterModel").getOutput();
	assetMasterModel.setServiceProviderCode(aa.getServiceProviderCode());
	assetMasterModel.setG1AssetGroup(rules.action.assetGroup);
	assetMasterModel.setG1AssetType(rules.action.assetType);
	assetMasterModel.setRecFulNam("ADMIN");

	for ( var propName in defaultMapping) {
		var asiValue = GetASIValue(defaultMapping[propName]);
		var setterName = setters[propName];
		if (asiValue != null && asiValue != "" && setterName) {
			var evalExpr = "assetMasterModel." + setterName.replace("#VAL#", asiValue);
			eval(evalExpr);
		}//asi field is filled
	}//for all mapping prop names

	if (fillAssetId) {
		if(rules.action.linkParent){
			vParentCapId = getParentByCapId(capId);
			assetMasterModel.setG1AssetID(vParentCapId.getCustomID());
		}
		else{
			assetMasterModel.setG1AssetID(capId.getCustomID());
		}
		
	}//fillAssetId

	return assetMasterModel;
}

function getRecordAssetList(pCapId)
{
	assetIdList = new Array();
	capAssetList = aa.asset.getAssetListByWorkOrder(pCapId,null).getOutput();
	for (a in capAssetList)
	{
		capAssetDataMdl = capAssetList[a].getAssetDataModel();	
		capAssetMstrMdl = capAssetList[a].getAssetMasterModel();					
		assetIdList = assetIdList.concat(capAssetMstrMdl.getG1AssetID());
	}
		
	return assetIdList;
}

function findAssetByMasterAssetModel(assetMasterModel) {

	var asts = assetDataService.getAssetListByAssetMaster(assetMasterModel, null, null);
	if (asts != null && asts.size() > 0) {
		return asts.get(0);
	}
	return null;
}
