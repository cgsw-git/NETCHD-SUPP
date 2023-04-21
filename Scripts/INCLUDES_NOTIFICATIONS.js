/**
 * INCLUDES_NOTIFICATIONS
 * 	- this object is used to read any Accela records. Additional utility functions included.
 * @module INCLUDES_NOTIFICATIONS
 * @namespace INCLUDES_NOTIFICATIONS
 * Dependencies:
 * INCLUDES_BATCHBASE
 */
/**
 * processBatchNotification
 * 
 * @param {*} recordIdObjectArray 
 * @param {*} noticeConfScriptName 
 */
function processBatchNotification(recordIdObjectArray, searchRules, noticeRules) {

    try {

        // setup variables for stats
        // main loop
        var statFilterType = 0
        var statFilterInactive = 0;
        var statFilterError = 0;
        var statFilterStatus = 0;
        var statDeactivated = 0;
        var statExceptions = 0;
        var statTotalCount = 0 + recordIdObjectArray.length;
        var statProcessedCount = 0;
        var statMailerSetCount = 0;

        // prep variables for search rules - for additional filtering and notification params
        var firstNotice = searchRules.firstNotice;
        var excludeRecordsArray = searchRules.excludeRecordType;
        var excludeRecordStatusArray = searchRules.excludeRecordStatus;
        var adminEmail = searchRules.adminEmail;
		var batchJobName = aa.env.getValue("BatchJobName") ; 
		if(  isEmptyOrNull(adminEmail) &&  !isEmptyOrNull(batchJobName) ) 
		{
			
	var batchEngineObj =  aa.proxyInvoker.newInstance("com.accela.v360.batchjob.BatchEngineBusiness");
    if(batchEngineObj.getSuccess())
	{
		var agencyName =  aa.getServiceProviderCode() ;
		logDebug("agencyName:" +agencyName  + " batchJobName:" +batchJobName ) ;
		var batchJob = batchEngineObj.getOutput().getBatchJobByName(agencyName ,batchJobName)  ;
		if( batchJob != null )
			{
			var jobEmailID = batchJob.getEmailID();
			logDebug("fetch email from job details:" +jobEmailID)
			if(!isEmptyOrNull(jobEmailID)) 
			{
				adminEmail =jobEmailID 
			}
			}
	  }
		}
        var batchResultEmailTemplate = searchRules.batchResultEmailTemplate;
        var agencyReplyEmail = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
        var acaURL = lookup("ACA_CONFIGS", "ACA_SITE");
        acaURL = acaURL.substr(0, acaURL.toUpperCase().indexOf("/ADMIN"));

        /******
         * TO DO: 
         * 		1) ADD JSON PARAMETERS FOR RECORD TYPE AND STATUS
         * 		2) BUILD CAP MODEL TO USE IN SEARCH
         */

        logDebug("firstNotice: " + firstNotice);
        logDebug("excludeRecordType: " + excludeRecordsArray);
        logDebug("excludeRecordStatus: " + excludeRecordStatusArray);
        logDebug("adminEmail: " + adminEmail);
        logDebug("batchResultEmailTemplate: " + batchResultEmailTemplate);

        // get max seconds
        var maxSeconds = aa.env.getValue("Time Out");
        if (!maxSeconds || typeof(maxSeconds, 'undefined')) {
            maxSeconds = 5 * 60; //default 5 minutes
        }

        // loop through array and process notification rules
        for (rec in recordIdObjectArray) {
            if (elapsed() > maxSeconds) // only continue if time hasn't expired
            {
                logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
                timeExpired = true;
                break;
            }

            thisCap = recordIdObjectArray[rec];
            logDebug("thisCap: " + thisCap);
            recordIdObject = aa.cap.getCapID(thisCap.getCapID().getID1(), thisCap.getCapID().getID2(), thisCap.getCapID().getID3()).getOutput();
            if (!recordIdObject) {
                logDebug("Could not get a capIdObject for " + thisCap.getCapID().getID1() + "-" + thisCap.getCapID().getID2() + "-" + thisCap.getCapID().getID3());
                continue;
            }
            var recordId = recordIdObject.getCustomID();
            var thisRecord = new Record(recordId);
            var thisRecordType = thisRecord.getCapType();
            var thisRecordTypeString = thisRecordType.toString();
            var thisRecordStatus = thisRecord.getCapStatus();
            var recordName = thisRecord.getApplicationName();

            //get expiration info for license
            var b1ExpDate = thisRecord.getExpirationDate();
            logDebug("Expiration date: " + b1ExpDate)

            //use values configured in JSON (search JSON) or use Default
            var nextNotifDateGrp=null,nextNotifDateFld=null;
            if(searchRules.hasOwnProperty("nextDateField") && searchRules.nextDateField!=null && searchRules.nextDateField!=""){
            	var tmpJsonVal = searchRules.nextDateField.split(".");
            	nextNotifDateGrp = tmpJsonVal[0];
            	nextNotifDateFld = tmpJsonVal[1];
            }else{
            	nextNotifDateGrp = null;
            	nextNotifDateFld = "Next Notification Date";
            }
            var nextNotifGrp=null,nextNotifFld=null;
            if(searchRules.hasOwnProperty("nextNotificationField") && searchRules.nextNotificationField!=null && searchRules.nextNotificationField!=""){
            	var tmpJsonVal = searchRules.nextNotificationField.split(".");
            	nextNotifGrp = tmpJsonVal[0];
            	nextNotifFld = tmpJsonVal[1];
            }else{
            	nextNotifGrp = null;
            	nextNotifFld = "Next Notification";
            }
            
            //check record for next notification
            var thisNextNotificationDate = thisRecord.getASI(nextNotifDateGrp, nextNotifDateFld);
            var thisNextNotification = thisRecord.getASI(nextNotifGrp, nextNotifFld);
            logDebug("thisNextNotification: " + thisNextNotification);
            if (!thisNextNotification) {
                thisNextNotification = firstNotice;
            }
            if (!thisNextNotification) {
                logDebug("Next Notification custom field is blank and firstNotice is not configured, no notification will be sent.");
                continue;
            }

            logDebug("Processing record: " + recordId + " - " + recordName + ": Record Status : " + thisRecordStatus + ", Expires on " + b1ExpDate);
            statProcessedCount++;
            // check if record type is in excludeRecordsArray
            var skipRecord = isRecordTypeExcluded(thisRecordTypeString, excludeRecordsArray);
            if (skipRecord) {
                statFilterType++;
                logDebug("This records type is in the list of records to exclude: " + recordId + " - " + thisRecordTypeString);
                continue;
            }
            // check if record status is in excludeRecordStatusArray
            var skipRecord = isRecordStatusExcluded(thisRecordStatus, excludeRecordStatusArray);
            if (skipRecord) {
                statFilterStatus++;
                logDebug("This records status is in the list of statuses to exclude: " + recordId + " - " + thisRecordStatus)
                continue;
            }

            // get JSON rules for record type
            var myRules = getJSONRulesForNotification(noticeRules, thisRecordTypeString, thisNextNotification);
            if (!myRules || typeof myRules === 'undefined') {
                logDebug("No Rules defined for the configured search criteria. Record Type: " + thisRecordTypeString + ". Notice: " + thisNextNotification);
                logDebug("Please check the batch job configuration script.");
                logException("EXCEPTION: Record ID: " + recordId + ", Type: " + thisRecordTypeString + ", Status: " + thisRecordStatus);
                statExceptions++;
                continue;
            }

            // create variables for notification rules
            var notificationTemplate = myRules.notificationTemplate;
            var notificationReport = myRules.notificationReport;
            var mailerSetType = myRules.mailerSetType;
            var mailerSetStatus = myRules.mailerSetStatus;
            var mailerSetPrefix = myRules.mailerSetPrefix;
            var notifyContactTypes = myRules.notifyContactTypes;
            var updateExpirationStatus = myRules.updateExpirationStatus;
            var updateRecordStatus = myRules.updateRecordStatus;
            var updateWorkflowTask = myRules.updateWorkflowTask;
            var updateWorkflowStatus = myRules.updateWorkflowStatus;
            var nextNotificationDays = myRules.nextNotificationDays;
            var nextNotification = myRules.nextNotification;
            var inspectionType = myRules.inspectionType;
            var scheduleOutDays = myRules.scheduleOutDays;
            var cancelAllInspections = myRules.cancelAllInspections ;
            var assessFeesArray = myRules.assessFees ;

            // validate configuration
            if (!mailerSetPrefix || !notificationTemplate || !notifyContactTypes) {
                logDebug("WARNING: Cannot process this renewal. Check the JSON configuration. The following parameters are required in order to process a renewal: ");
                logDebug("notificationTemplate, mailerSetPrefix, notifyContactTypes");
                logException("EXCEPTION: Record ID: " + recordId + ", Type: " + thisRecordTypeString + ", Status: " + thisRecordStatus);
                statExceptions++;
                continue;
            }
            if (!notificationReport) logDebug("notificationReport is not configured for this record type, no notification report will be printed or sent.");
            if (typeof updateExpirationStatus === 'undefined') logDebug("updateExpirationStatus is not configured, expiration status will not be updated.");
            if (typeof updateRecordStatus === 'undefined') logDebug("updateRecordStatus is not configured, record status will not be updated.");
            if (typeof updateWorkflowTask === 'undefined' || typeof updateWorkflowStatus === 'undefined') logDebug("updateWorkflowTask and/or updateWorkflowStatus is not configured, workflow will not be updated.");

            logDebug("notificationTemplate: " + notificationTemplate);
            logDebug("notificationReport: " + notificationReport);
            logDebug("mailerSetType: " + mailerSetType);
            logDebug("mailerSetStatus: " + mailerSetStatus);
            logDebug("mailerSetPrefix: " + mailerSetPrefix);
            logDebug("notifyContactTypes: " + notifyContactTypes);
            logDebug("updateExpirationStatus: " + updateExpirationStatus);
            logDebug("updateRecordStatus: " + updateRecordStatus);
            logDebug("updateWorkflowTask: " + updateWorkflowTask);
            logDebug("updateWorkflowStatus: " + updateWorkflowStatus);
            logDebug("nextNotificationDays: " + nextNotificationDays);
            logDebug("nextNotification: " + nextNotification);
            logDebug("cancelAllInspections:" + cancelAllInspections ) ; 
         
            // TO DO: add validation of rule params

            // update expiration status
            if (updateExpirationStatus) {
                thisExpDate = new Date(b1ExpDate);
                thisRecord.setExpiration(thisExpDate, updateExpirationStatus);
            }
            // update record status
            if (updateRecordStatus) {
                thisRecord.updateStatus(updateRecordStatus, "Updated by renewal batch process.")
            }
            // update workflow task and status
            if (updateWorkflowTask && updateWorkflowStatus) {
                updateTask(updateWorkflowTask, updateWorkflowStatus, "", "Updated by renewal batch process.", false, recordIdObject);
            }
            // send email notifications
            if (notifyContactTypes) {
                var contactTypeString = new String(notifyContactTypes);
                var _contactTypeArr = contactTypeString.split(",");
				var contactTypeArr = new Array() ;
				for(index in _contactTypeArr)
				{
					contactTypeArr.push(_contactTypeArr[index].trim()) ; 
				}
                prepAndSendNotification(agencyReplyEmail, contactTypeArr, acaURL, notificationTemplate, notificationReport, recordIdObject);
            }

            // TO DO: add to mailer set if preferred channel is not email

            var addResult = addRecordToMailerSet(recordIdObject, mailerSetPrefix, mailerSetType, mailerSetStatus);
            if (addRecordToMailerSet) statMailerSetCount++;

            // update next notification and next notification date custom fields
            thisRecord.editASI(nextNotifGrp, nextNotifFld, nextNotification);
            var nextNotificationDate = "";
            if (nextNotificationDays != "") {
                nextNotificationDate = dateAdd(b1ExpDate, parseInt(-nextNotificationDays));
            }
            thisRecord.editASI(nextNotifDateGrp, nextNotifDateFld, nextNotificationDate);
            //logDebug("nextNotification: " + nextNotification);
            //logDebug("nextNotificationDate: " + nextNotificationDate);

            //schedule inspection 
            if (inspectionType != null && inspectionType != "" && scheduleOutDays != null && scheduleOutDays != "") {
                scheduleInspection(inspectionType, scheduleOutDays);
            }
		    //cancel All Inspections 
            if(cancelAllInspections)
        	{
        	 thisRecord.cancelAllInspection() ;
        	}
		 //Adding auto assess invoice 	 
      if (!isEmptyOrNull(assessFeesArray) ) {
		for ( var i in assessFeesArray) {
			var feeCode = assessFeesArray[i]["feeCode"];  
			var feeSchedule = assessFeesArray[i]["feeSchedule"];
			var feeInvoice = assessFeesArray[i]["feeInvoice"];
			var feePeriod = assessFeesArray[i]["feePeriod"];
			var isCUPAOversight = assessFeesArray[i]["isCUPAOversight"];
			var feeQuantity = assessFeesArray[i]["feeQuantity"];
			var customFieldToQuantity =assessFeesArray[i]["customFieldToQuantity"]; 
			var isCUPAOversight = assessFeesArray[i]["isCUPAOversight"] ;
			var isCUPAOversight_parentRecordType_arr = [] ;
			var isCUPAOversight_childRecordType_arr =[] ; 
			var isCUPAOversight_checkInvoiceExist =false;
			var isCUPAOversight_checkDays = null;
			
			var invoiceExists =false; 
			if( !isEmptyOrNull(isCUPAOversight))
				{
				if(isCUPAOversight.hasOwnProperty("parentRecordType"))
				{
				isCUPAOversight_parentRecordType_arr =  isCUPAOversight.parentRecordType ;
				}
				if(isCUPAOversight.hasOwnProperty("childRecordType"))
				{
				isCUPAOversight_childRecordType_arr = isCUPAOversight.childRecordType ;
				}
				if(isCUPAOversight.hasOwnProperty("checkInvoiceExist"))
				{
				isCUPAOversight_checkInvoiceExist = isCUPAOversight.checkInvoiceExist ;
				}
				if(isCUPAOversight.hasOwnProperty("checkDays"))
				{
				isCUPAOversight_checkDays = isCUPAOversight.checkDays ;
				}
				
				if(isCUPAOversight_checkInvoiceExist)
				{
					var parentCapId= null ;
					parentCapId = getParentCapByChildCapIdAndParentCapType( isCUPAOversight_parentRecordType_arr , recordIdObject );
						if(parentCapId !=null)
						{
						logDebug("parentCapId:" + parentCapId.getCustomID() + " to record ID:" + recordIdObject.getCustomID() );
						var childCapArr = [];
						getChildsCapIDsByParentCapAndChildCapType( parentCapId ,isCUPAOversight_childRecordType_arr ,childCapArr   );
					    logDebug("length childCapArr:" + childCapArr.length + " to parent record ID:" + parentCapId.getCustomID());
						if(childCapArr.length >0)
							{
							  invoiceExists= checkInvoiceExists(childCapArr , feeSchedule, feeCode , isCUPAOversight_checkDays ) ;  
							}
						}
					
				}
				}
			if(!invoiceExists)
				{
				 
				var feeQuantityValue = getFeeQuantity(feeQuantity , customFieldToQuantity , recordIdObject ) ;
				if( isEmptyOrNull(feeQuantityValue) ||  feeQuantityValue.toString().trim() == "" || isNaN(feeQuantityValue)  )
				{
				logDebug("Invoice quantity value is empty or string, JSON 'feeQuantity' value=" + feeQuantity + " JSON 'customFieldToQuantity'="+customFieldToQuantity +" recordid=" + recordIdObject.getCustomID() ) ;
				continue ;
				}
				var feeSchduleList = aa.finance.getFeeScheduleList("").getOutput();				
				for ( var i in feeSchduleList) {
					if (feeSchduleList[i].getFeeSchedule() == feeSchedule) 
					{
						addFee(feeCode, feeSchedule, feePeriod, feeQuantityValue, feeInvoice, recordIdObject);
						var invoiceDetails = "feeCode:" + feeCode + " " +" feeGroup:" + feeSchedule  +" feePeriod:" +  feePeriod + " " + " feeQuantity:" +  feeQuantityValue + " "  + " feeInvoice:" +  feeInvoice 
						logDebug ( "Automatic invoice has been added to record id: " + recordIdObject.getCustomID() +" , invoice Details "  +invoiceDetails  ) ;
					}
					}	
				} 
			} 
		}		 
        }

        var resultParams = aa.util.newHashtable();
        addParameter(resultParams, "$$batchProcess$$", batchProcess.toString());
        addParameter(resultParams, "$$statTotalCount$$", statTotalCount.toString());
        addParameter(resultParams, "$$statProcessedCount$$", statProcessedCount.toString());
        addParameter(resultParams, "$$statFilterType$$", statFilterType.toString());
        addParameter(resultParams, "$$statFilterStatus$$", statFilterStatus.toString());
        addParameter(resultParams, "$$statMailerSetCount$$", statMailerSetCount.toString());

        // send batch result email
        sendBatchResultEmail(agencyReplyEmail, adminEmail, batchResultEmailTemplate, resultParams, null, null);

        logMessage("Total records found: " + statTotalCount);
        logMessage("Total records processed: " + statProcessedCount);
        logMessage("Ignored due to record type: " + statFilterType);
        logMessage("Ignored due to record status: " + statFilterStatus);
        logMessage("Total exceptions: " + statExceptions);
        logMessage("Total records added to mailer sets: " + statMailerSetCount);

        logMessage(exceptions);


    } catch (e) {
        logMessage("ERROR:" + e + "");
        logMessage("Total records found: " + statTotalCount);
        logMessage("Total records processed: " + statProcessedCount);
        logMessage("Ignored due to record type: " + statFilterType);
        logMessage("Ignored due to record status: " + statFilterStatus);
        logMessage("Total exceptions: " + statExceptions);
        logMessage("Total records added to mailer sets: " + statMailerSetCount);

        logMessage(exceptions);


        var resultParams = aa.util.newHashtable();
        addParameter(resultParams, "$$batchProcess$$", batchProcess);
        addParameter(resultParams, "$$statTotalCount$$", statTotalCount);
        addParameter(resultParams, "$$statProcessedCount$$", statProcessedCount);
        addParameter(resultParams, "$$statFilterType$$", statFilterType);
        addParameter(resultParams, "$$statFilterStatus$$", statFilterStatus);
        addParameter(resultParams, "$$statExceptions$$", statExceptions);
        addParameter(resultParams, "$$statMailerSetCount$$", statMailerSetCount);

        // send batch result email
        // potentially add result report to the batch result email, data/queries to validate the renewal process
        sendBatchResultEmail(agencyReplyEmail, adminEmail, batchResultEmailTemplate, resultParams, null, null);
    }

}

/** 
 * addRecordToMailerSet(recordIdObject,setPrefix,setType,setStatus);
 */
function addRecordToMailerSet(recordIdObject, setPrefix, setType, setStatus) {
    // search for an open mailer set, if it doesn't exist, create a new one
    var setId = generateSetID(setPrefix) ;
    var setType = "Renewal";
    var setStatus = "Open";
   
        // get or create the set and add the record to the set
        var mailerSet = new capSet(setId);
        if (mailerSet.empty) {
            // This is a new set that needs to be updated with informaiton
            mailerSet.type = setType;
            mailerSet.status = setStatus;
            mailerSet.comment = "Renewal mailer set created by renewal batch script process.";
            mailerSet.update();
            logDebug("addRecordToMailerSet:Create new set: " +setId ) ;
            mailerSet.add(recordIdObject);
            logDebug("addRecordToMailerSet:Adding record Id: " + recordIdObject.getCustomID() + " to Set ID:" + setId) ;
        } else {
            // This is an existing set so we will add the new record to it
            mailerSet.add(recordIdObject);
            logDebug("addRecordToMailerSet:Adding record Id: " + recordIdObject.getCustomID() + " to Set ID:" + setId) ;
        }
        
    return true;
}

/** 
 * generateSetID(setPrefix)
 */
 function generateSetID(setPrefix)
{
	var startDate = aa.date.getCurrentDate() ;
    var yy = startDate.getYear().toString();
    var mm = (startDate.getMonth() ).toString();
    if (mm.length < 2)
        mm = "0" + mm;
    var dd = startDate.getDayOfMonth().toString();
    if (dd.length < 2)
        dd = "0" + dd;

    var setId = setPrefix + "_" + mm + "/" + dd + "/" + yy;
    
    return setId ;
}

/**
 * Sends the renewal notification via email
 * @param {*} agencyReplyEmail 
 * @param {*} contactTypesArray 
 * @param {*} acaURL 
 * @param {*} notificationTemplate 
 * @param {*} reportName 
 */
function prepAndSendNotification(agencyReplyEmail, contactTypesArray, acaURL, notificationTemplate, reportName) {

    var itemCapId = capId;
    if (arguments.length == 6) itemCapId = arguments[5]; // use cap ID specified in args

    // work around until enhanced
    capId = itemCapId;

    capIDString = itemCapId.getCustomID();
    cap = aa.cap.getCap(itemCapId).getOutput();
    capName = cap.getSpecialText();
    capStatus = cap.getCapStatus();
    capTypeAlias = cap.getCapType().getAlias();
    partialCap = !cap.isCompleteCap();
    fileDateObj = cap.getFileDate();
    fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
    fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(), fileDateObj.getDayOfMonth(), fileDateObj.getYear(), "YYYY-MM-DD");
    var capDetailObjResult = aa.cap.getCapDetail(itemCapId);
    if (capDetailObjResult.getSuccess()) {
        capDetail = capDetailObjResult.getOutput();
        houseCount = capDetail.getHouseCount();
        feesInvoicedTotal = capDetail.getTotalFee();
        balanceDue = capDetail.getBalance();
    }

    // Get an array of Contact Objects using Master Scripts 3.0
    logDebug("contactTypesArray: " + contactTypesArray);
    var contactObjArray = getContactObjs(itemCapId, contactTypesArray);

    for (iCon in contactObjArray) {

        var tContactObj = contactObjArray[iCon];
        logDebug("ContactName: " + tContactObj.people.getFirstName() + " " + tContactObj.people.getLastName());
        if (!matches(tContactObj.people.getEmail(), null, undefined, "")) {
            logDebug("Contact Email: " + tContactObj.people.getEmail());
            var eParams = aa.util.newHashtable();
            addParameter(eParams, "$$recordTypeAlias$$", capTypeAlias);  
			getRecordParams4Notification(eParams);
			addParameter(eParams, "$$recordAlias$$", capTypeAlias);
			addParameter(eParams, "$$recordStatus$$", capStatus);
			addParameter(eParams, "$$balance$$", balanceDue);
			addParameter(eParams, "$$recordName$$",capName );			
			var capAddresses = aa.address.getAddressByCapId(capId);
				if (capAddresses.getSuccess()) {
					capAddresses = capAddresses.getOutput();
					if (capAddresses != null && capAddresses.length > 0) {
						capAddresses = capAddresses[0];
						var addressVar = "";
						addressVar = capAddresses.getHouseNumberStart() + " ";
						addressVar = addressVar + capAddresses.getStreetName() + " ";
						addressVar = addressVar + capAddresses.getCity() + " ";
						addressVar = addressVar + capAddresses.getState() + " ";
						addressVar = addressVar + capAddresses.getZip();
						addParameter(eParams, "$$FullAddress$$", addressVar);
					}
				}
				
				var b1ExpResult = aa.expiration.getLicensesByCapID(capId );
				if(b1ExpResult.getSuccess())
					{
					var b1Exp = b1ExpResult.getOutput();
					var tmpDate = b1Exp.getExpDate(); 
					if(tmpDate)
						{
						var expirationDate =  tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear(); 
						addParameter(eParams, "$$ExpirationDate$$", expirationDate);
						}
					}
            getACARecordParam4Notification(eParams, acaURL);
            tContactObj.getEmailTemplateParams(eParams, "Contact");
            //getInspectionResultParams4Notification(eParams);
            //getPrimaryAddressLineParam4Notification(eParams);

            if (!matches(reportName, null, undefined, false, "")) {
                // Call runReport4Email to generate the report and send the email
                // Set the report parameters. For Ad Hoc use p1Value, p2Value etc.
                var rptParams = aa.util.newHashMap();
                rptParams.put("p1Value", capIDString);
                runReport4Email(itemCapId, reportName, tContactObj, rptParams, eParams, notificationTemplate, cap.getCapModel().getModuleName(), agencyReplyEmail);
            } else {
                // Call sendNotification if you are not using a report
                sendNotification(agencyReplyEmail, tContactObj.people.getEmail(), "", notificationTemplate, eParams, null, itemCapId);
            }
        }
    }
}


/**
 * Gets the notification rules from JSON config by searching for record type.
 * This function uses wild card searches in config. It will return the most exact match first.
 * @example The JSON is configured in CONF_LIC_RENEWAL
 * Example JSON Configuration (Use stars instead of ~ in example) :
 * var noticeRules = {
  "Licenses/~/~/~": {
	"60 Day Notice": {
	  "notificationTemplate": "LIC_ABOUT_TO_EXPIRE",
	  "notificationReport": "Licenses About to Expire",
	  "mailerSet": "LIC_ABOUT_TO_EXPIRE_MAILER",
	  "updateStatus": "About to Expire",
	  "nextNotificationDays": 45,
	  "nextNotification": "45 Day Notice"
	},
	"45 Day Notice": {
	  "notificationTemplate": "LIC_EXPIRE_45_DAY_NOTICE",
	  "notificationReport": "License Expiration 45 Day Notice",
	  "mailerSet": "LIC_EXPIRATION_45_DAY_NOTICE",
	  "updateStatus": false,
	  "nextNotificationDays": 30,
	  "nextNotification": "30 Day Notice"
	},
	"30 Day Notice": {
	  "notificationTemplate": "LIC_EXPIRE_30_DAY_NOTICE",
	  "notificationReport": "License Expiration 30 Day Notice",
	  "mailerSet": "LIC_EXPIRATION_30_DAY_NOTICE",
	  "updateStatus": false,
	  "nextNotificationDays": 0,
	  "nextNotification": "Expiration Notice"
	},
	"Expiration Notice": {
	  "notificationTemplate": "LIC_EXPIRE_NOTICE",
	  "notificationReport": "License Expiration Notice",
	  "mailerSet": "LIC_EXPIRATION_NOTICE",
	  "updateStatus": false,
	  "nextNotificationDays": false,
	  "nextNotification": false ,
	  "cancelAllInspections" : true ,
	  "assessFeesArray" : [
                
                    {
                    	"feeSchedule": "EH_CUPA",
                    	"feeCode": "CUPA_APSA",
                    	"isCUPAOversight": {
                    		"checkInvoiceExist" :true, 
							"checkDays": "90",
                    		"parentRecordType": ["EnvHealth/Facility/NA/NA"] ,
                    		"childRecordType":["EnvHealth/Hazmat/NA/Permit"]
                    	}	,
						"feeQuantity": "CUSTOM",
                    	"customFieldToQuantity": "CERS_ID",
                    	"feeInvoice": "Y",
                    	"feePeriod": "FINAL"  
                    	} ,
                    	  {
                            "feeSchedule": "EH_CUPA",  
                            "feeCode": "CUPA_UST",
                            "feeQuantity": 3,
                            "feeInvoice": "Y",
                            "feePeriod": "FINAL"
                          }
                  ]
	}
  }
}
 * 
 * @param {JSONConfig} rules The noticeRules in the CONF_LIC_RENEWAL JSON Config object
 * @param {String} recordType The record type to search for (Example: Licenses/Business/General/License)
 * @param {String} notification The notification to search for (Example: 30 Day Notice)
 */
function getJSONRulesForNotification(rules, recordType, notification) {
    if (typeof rules != 'undefined' && typeof notification != 'undefined') {
        if (typeof(recordType) == "object") {
            var appTypeArray = recordType.split("/");
            var thisRule;

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);
            var thisRule = rules[appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/" + appTypeArray[1] + "/*/" + appTypeArray[3]);
            var thisRule = rules[appTypeArray[0] + "/" + appTypeArray[1] + "/*/" + appTypeArray[3]];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/*/*/" + appTypeArray[3]);
            var thisRule = rules[appTypeArray[0] + "/*/*/" + appTypeArray[3]];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/*/" + appTypeArray[2] + "/" + appTypeArray[3]);
            var thisRule = rules[appTypeArray[0] + "/*/" + appTypeArray[2] + "/" + appTypeArray[3]];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/*/" + appTypeArray[2] + "/*");
            thisRule = rules[appTypeArray[0] + "/*/" + appTypeArray[2] + "/*"];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/*");
            thisRule = rules[appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/*"];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/" + appTypeArray[1] + "/*/*");
            thisRule = rules[appTypeArray[0] + "/" + appTypeArray[1] + "/*/*"];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            //logDebug("Searching for JSON Rules for " + appTypeArray[0] + "/*/*/*");
            thisRule = rules[appTypeArray[0] + "/*/*/*"];
            if (typeof thisRule != 'undefined' && typeof thisRule[notification] != 'undefined') return thisRule[notification];

            return false;

        }
    }
}

function isEmptyOrNull(value) {
	return value == null || value === undefined || String(value) == "";
}

/**
 * return fee quantity value by 'feeQuantity' or 'customFieldToQuantity' JSON properties
 *
 * @param {number} set value by JSON property 'feeQuantity'
 * @param {ASI field name} set ASI field name by JSON property 'customFieldToQuantity'
 * @param {object} capIdObj
 * @return {number} Returns quantity value from JSON 'feeQuantity' or 'customFieldToQuantity' property. 
  */
function getFeeQuantity(feeQuantity , customFieldToQuantity , capIdObj)
{
	  var feeQuantityValue = "";
	  if( !isEmptyOrNull(feeQuantity) && feeQuantity.toString().trim() != "" && !isNaN(feeQuantity)) 
	  {
		feeQuantityValue= feeQuantity ;
	  }
	else
		{
			capId = capIdObj; // method 'getAppSpecific' needs to define 'capId' object. 
		if( !isEmptyOrNull(customFieldToQuantity) && customFieldToQuantity.indexOf(".") > -1)
			{
			useAppSpecificGroupName =true;
			feeQuantityValue = getAppSpecific(customFieldToQuantity); 
			}
		else
			{
			useAppSpecificGroupName =false;
			feeQuantityValue = getAppSpecific(customFieldToQuantity); 			
		    }  			
}
	 return feeQuantityValue ;
}

/**
* returns array cap Id object of childs by cap Id object of parant and cap type of childs
*
* @param {object} parentCapID
* @param {Array} capFilterType
* @param {Array} matchCapRecordArr
* @return {Array}  
 */
function getChildsCapIDsByParentCapAndChildCapType(parentCapID, capFilterType, matchCapRecordArr) {
    var childCapArr = [];
    var childCapArrResult = aa.cap.getChildByMasterID(parentCapID);
    if (childCapArrResult.getSuccess()) {
        childCapArr = childCapArrResult.getOutput();
    } else {
        logDebug("Error in aa.cap.getChildByMasterID API. Message = " + childCapArrResult.getErrorMsg());
        return matchCapRecordArr;
    }
    if (childCapArr != null) {
        for (var i = 0; i < childCapArr.length; i++) {
            var childCapID = childCapArr[i].getCapID();
            if (capFilterType.length == 0) {
                matchCapRecordArr.push(childCapID);
            }
            else {
                for (var j = 0; j < capFilterType.length; j++) {
                    var filterType = capFilterType[j];
                    var arrRecordPath = filterType.split("/");
                    var filterGroup = arrRecordPath[0];
                    var filterType = arrRecordPath[1];
                    var filterSubType = arrRecordPath[2];
                    var filterCategory = arrRecordPath[3];
 
                    var skipCheckgroup = ((filterGroup == "*") ? true : false);
                    var skipCheckType = ((filterType == "*") ? true : false);
                    var skipCheckSubType = ((filterSubType == "*") ? true : false);
                    var skipCheckCategory = ((filterCategory == "*") ? true : false);
 
                    var childType = childCapArr[i].getCapType() + "";
                    var childTypeArr = childType.toString().split("/");
                    var childGroup = childTypeArr[0];
                    var childType = childTypeArr[1];
                    var childSubtype = childTypeArr[2];
                    var childCategory = childTypeArr[3];
 
                    if (
                        (skipCheckgroup || (filterGroup == childGroup)) &&
                        (skipCheckType || (filterType == childType)) &&
                        (skipCheckSubType || (filterSubType == childSubtype)) &&
                        (skipCheckCategory || (filterCategory == childCategory))
                    ) {
                        matchCapRecordArr.push(childCapID);
                    }
                }
            }
        }
    }
    return matchCapRecordArr;
}

/**
 * return capId object of the parent by cap Id object of child and cap type of parent
 *
* @param {Array} capFilterType
* @param {object} capIdObj
* @return {object} returns the capId object of the parent.  Assumes only one parent!
 */  
function getParentCapByChildCapIdAndParentCapType(capFilterType, capIdObj) {
    var parentCapID = getParentByCapId(capIdObj);
    if (parentCapID != false) {
        var parentCapResult = aa.cap.getCap(parentCapID);
        var parentId = null; 
		
        if (parentCapResult.getSuccess()) {
            parentId = parentCapResult.getOutput();
        } else {
            logDebug("Error with aa.cap.getCap API. Message = " + parentCapResult.getErrorMsg());
            return null ;
        }
 
        if (capFilterType.length == 0) {
           return parentCapID ;
        }
        else {
            for (var j = 0; j < capFilterType.length; j++) {
                var filterType = capFilterType[j];
 
                var arrRecordPath = filterType.split("/");
                var filterGroup = arrRecordPath[0];
                var filterType = arrRecordPath[1];
                var filterSubType = arrRecordPath[2];
                var filterCategory = arrRecordPath[3];
 
                var skipCheckgroup = ((filterGroup == "*") ? true : false);
                var skipCheckType = ((filterType == "*") ? true : false);
                var skipCheckSubType = ((filterSubType == "*") ? true : false);
                var skipCheckCategory = ((filterCategory == "*") ? true : false);

                var parentAppTypeResult = parentId.getCapType();
                var parentAppTypeString = parentAppTypeResult.toString();
                var parentAppTypeArr = parentAppTypeString.toString().split("/");
 
                var parentGroup = parentAppTypeArr[0];
                var parentType = parentAppTypeArr[1];
                var parentSubtype = parentAppTypeArr[2];
                var parentCategory = parentAppTypeArr[3];
 
                if (
                    (skipCheckgroup || (filterGroup == parentGroup)) &&
                    (skipCheckType || (filterType == parentType)) &&
                    (skipCheckSubType || (filterSubType == parentSubtype)) &&
                    (skipCheckCategory || (filterCategory == parentCategory))
                ) {
                    return parentCapID ;
                }
            }
        }
    }
    return null;
}

/**
    * Check invoice details(feeGroup,feeCode and invoice age) link to in one or more cap Id object.
    * @param {Array} capIdsArr
    * @param {string} feeGroup
    * @param {string} feeCode
    * @param {integer} checkDays
    * @return {boolean} returns true if successful, false if not 
     */
    function checkInvoiceExists(capIdsArr, feeGroup, feeCode , checkDays) {
        var invoiceExists = false;
        for (var i in capIdsArr) {
            var result = checkInvoiceExistsByCapId(capIdsArr[i], feeGroup, feeCode, checkDays);
            if (result == true) {
                logDebug("Invoice details (feeGroup ='" +feeGroup+"' and feeCode = '"+feeCode +"' ) already exists on child record id: " + capIdsArr[i].getCustomID());
                invoiceExists = true;
                break;
            } else {
                logDebug("checkInvoiceExistsByCapId function returned false for record id: " + capIdsArr[i].getCustomID());
            }
        }
        return invoiceExists;
    }
	
/**
 * Check invoice details(feeGroup,feeCode and invoice age) link to capId object. 
 * @param {object} capId
 * @param {string} feeGroup
 * @param {string} feeCode
 * @parm  {integer} checkDays (optional)
 * @return {boolean} returns true if successful, false if not. 
  */
 function checkInvoiceExistsByCapId(capId, feeGroup, feeCode , checkDays) {
	 var ignoreCheckDays = false; 
	 if( isEmptyOrNull (checkDays) || isNaN(checkDays))
	 {
		 ignoreCheckDays = true; 
	 }
     var invoiceExist = false;
     var feeResult = aa.finance.getFeeItemByCapID(capId);
     if (feeResult.getSuccess()) {
         var feeArray = feeResult.getOutput();
         for (var feeNumber in feeArray) {
             var fCode = feeArray[feeNumber].getFeeCod();
             var fGroup = feeArray[feeNumber].getFeeSchudle();
             var fStatus = feeArray[feeNumber].getFeeitemStatus();
             var inviceDate= feeArray[feeNumber].getApplyDate() ;
             var inviceDateMMDDYYYY = dateFormatted(inviceDate.getMonth(), inviceDate.getDayOfMonth(), inviceDate.getYear(), "MM/DD/YYYY");
             var currentInvoiceAge = getDateDiff(inviceDateMMDDYYYY);
	      if (fStatus != "VOIDED" && feeGroup == fGroup && feeCode == fCode &&  ( ignoreCheckDays || (currentInvoiceAge <= checkDays) )   ) {
                 invoiceExist = true;
                 logDebug("Record ID: "+capId.getCustomID()+" has invoice details (feeGroup:" + feeGroup + " feeCode:" +feeCode + " Invice Age:" + currentInvoiceAge +") , current invoice age <=" + checkDays  + " ,invoiceExist:" +invoiceExist);
                 break;
             }
         }
     } else {
         logDebug("Error in aa.finance.getFeeItemByCapID API. Message = " + feeResult.getErrorMsg());
     }
     return invoiceExist;
 }
  