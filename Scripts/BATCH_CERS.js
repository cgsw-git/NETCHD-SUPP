//#region Load Environment
var SCRIPT_VERSION = "3.0";
var BATCH_NAME = "";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, true));
eval(getScriptText("INCLUDES_CUSTOM", null, true));
var currentUserID = "ADMIN";
//#endregion

//manual Download/Upload dates
//auto only email and payloadDays/payLoadHours
//#region Batch Parameters
var jsonOptions = aa.env.getValue("Additional Options");
var facilityDownload = aa.env.getValue("FacilityDownload");
var cmeUpload = aa.env.getValue("CMEUpload");
var downloadQueryFrom = aa.env.getValue("DownloadQueryFrom");
var downloadDays = aa.env.getValue("DownloadDays");
var uploadQueryFrom = aa.env.getValue("UploadQueryFrom");
var uploadDays = aa.env.getValue("UploadDays");
var emailTo = aa.env.getValue("EmailTo");
//#endregion

/**Testing only */
// baseURL = "https://cersservices.calepa.ca.gov/Staging/Regulator/";
// userName = "DecadeTestEDT";
// password = "p8yqRSnMdfqG6CE8wojsmGwoGnU=";//"Envision123";
// regulatorCode = "1500";
// facilityDownload = "Y";
// cmeUpload = "N";
// downloadQueryFrom = "10/14/2021";
// downloadDays = "1";
// uploadQueryFrom = "08/06/2021";
// uploadDays = "30";
// jsonOptions = "CERS_OPTIONS";
// emailTo = "ishac7@gmail.com";

//#region Batch Globals
var showDebug = false; // Set to true to see debug messages
var maxSeconds = 5 * 60; // number of seconds allowed for batch processing,
// usually < 5*60
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime(); // Start timer
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var servProvCode = aa.getServiceProviderCode();
var capId = null;
var altId = "";
var documentOnly = false;
var facilitiesCreated = new Array();
var facilitiesUpdated = new Array();
var facilitiesInXML = new Array();
var submittalsUpdated = new Array();
var newSubmittalsCreated = new Array();
var submittalsInXML = 0;
var inspectionsUploaded = 0;
var failedFcilities = 0;
var failedPermits = 0;
var exceptionLogs = new Array();
var newInspectionIds = new Array();
var batchJobName = aa.env.getValue("batchJobName");
logDebug("BATCH NAME IS " + batchJobName);
if (isBlank(batchJobName))
    batchJobName = "BATCH_CERS_AUTO";

logMessage = function (etype, edesc) {
    aa.print(etype + " : " + edesc);
}
logDebug = function (edesc) {
    var msg = "";
    var color = "black";
    if (arguments.length > 1)
        color = arguments[1];
    if (showDebug)
        msg = edesc;
    else
        msg = "<font color='"+ color +"' size=4>" + edesc + "</><BR>";
    aa.print(msg);
}
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
//#endregion

logDebug("START: Start of Job");
var cersOptions = null;
var baseURL = "";
var userName = "";
var password = "";
var regulatorCode = "";
var allowedFacilityStatus = new Array();

try{
    cersOptions = JSON.parse(getScriptText(jsonOptions));
    baseURL = cersOptions.baseURL;
    userName = cersOptions.userName;
    password = getCersPassword(cersOptions.password);
    regulatorCode = cersOptions.regulatorCode;
    if (cersOptions && cersOptions.facilityStatus && cersOptions.facilityStatus.length > 0)
        allowedFacilityStatus = cersOptions.facilityStatus;
}
catch(e){
    cersOptions = new Object();
}
if (isBlank(facilityDownload))
    facilityDownload = "Y";
if (isBlank(cmeUpload))
    cmeUpload = "Y";
if (isBlank(cersOptions.payloadSize))
    cersOptions.payloadSize = downloadDays;
if (isBlank(downloadQueryFrom))
    downloadQueryFrom = getLastDownloadDate();

if (isBlank(uploadQueryFrom))
    uploadQueryFrom = getLastUploadDate();

if (!timeExpired) mainProcess();
if (documentOnly) {
    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
    aa.abortScript();
}
logDebug("END: End of Job: Elapsed Time : " + elapsed() + " Seconds");

//#region Main
function mainProcess()
{

    // if (!validateParams())
    //     return false;
    if (matches(facilityDownload, "Y", "Yes"))
        downloadFacilityInfo();
    if (matches(cmeUpload, "Y", "Yes"))
        uploadToCME(uploadQueryFrom, uploadDays);
    sendLogs();
}
//#endregion

//#region Private Functions
function getCersPassword(psswrd)
{
    var hasher = java.security.MessageDigest.getInstance("SHA-1");
    var base64encode = java.util.Base64.getEncoder();


    var data = [];
    for (var i = 0; i < psswrd.length; i++){
        data.push(psswrd.charCodeAt(i));
    }

    var gg = hasher.digest(data);
    var tg = base64encode.encode(gg);
    var hashpass = "";
    for (var x in tg)
        hashpass += String.fromCharCode(tg[x]);

    return hashpass;
}
function sendLogs()
{
    var emailSubject = "CERS Logs for " + sysDateMMDDYYYY + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();
    var emailBody = "";

    var params = aa.util.newHashtable();
    emailBody += "Date: " + sysDateMMDDYYYY + "<\BR>";
    emailBody += "User: " +  aa.env.getValue("CurrentUserID") + "<\BR>";
    if ("Y".equals(facilityDownload))
    {
        emailBody += "Download From " + downloadQueryFrom + "<\BR>";
        emailBody += "Download to " + dateAdd(downloadQueryFrom, downloadDays) + "<\BR>";
        if (cersOptions.permitsToProcess && cersOptions.permitsToProcess.length > 0)
        {
            emailBody += "Permits to processs: <\BR>";
            for (var p in cersOptions.permitsToProcess)
                emailBody += cersOptions.permitsToProcess[p] + "<\BR>";
        }
        if (cersOptions.facilityStatus)
            emailBody += "Facility status: " + cersOptions.facilityStatus + "<\BR>";
        emailBody += "Facilities in XML: " + facilitiesInXML.length + " " + facilitiesInXML + "<\BR>";
        emailBody += "Facilities updated: " + facilitiesUpdated.length + " " + facilitiesUpdated + "<\BR>";
        emailBody += "Facilities created: " + facilitiesCreated.length + " " + facilitiesCreated + "<\BR>";
        emailBody += "Facilities failed: " + failedFcilities + "<\BR>";
        emailBody += "Permits in XML: " + submittalsInXML + "<\BR>";
        emailBody += "Permits Updated: " + submittalsUpdated.length + " " + submittalsUpdated + "<\BR>";
        emailBody += "Permits Created: " + newSubmittalsCreated.length + " " + newSubmittalsCreated + "<\BR>";
        emailBody += "Permits failed: " + failedPermits + "<\BR>";

    }
    if ("Y".equals(cmeUpload))
    {
        emailBody += "Upload from: " + uploadQueryFrom + "<\BR>";
        emailBody += "Upload to: " +  dateAdd(uploadQueryFrom, uploadDays) + "<\BR>";
        emailBody += "Inspection in upload: " + inspectionsUploaded + "<\BR>";
    }

    if (exceptionLogs.length > 0)
    {
        emailBody += "Exceptions: <\BR>";
        for (var e in exceptionLogs)
            emailBody += exceptionLogs[e] + " <\BR>";
    }
    // aa.print(emailSubject);
    // aa.print(emailBody);
    var sendResult = aa.sendMail("Auto_Sender@Accela.com", emailTo, "", emailSubject, emailBody);
    if (sendResult.getSuccess())
        logDebug("Successfully sent email to " + emailTo);
    else
        logDebug("Problem sending email " + sendResult.getErrorMessage());
}
function getLastDownloadDate()
{
    var q = "SELECT TO_CHAR(UDF_DATE1, 'MM/DD/YYYY') UDF_DATE1 FROM BATCH_JOB WHERE BATCH_JOB_NAME = '$$BATCHJOBNAME$$' AND SERV_PROV_CODE = '$$SERVPROVCODE$$'";
    q = q.replace("$$BATCHJOBNAME$$", batchJobName).replace("$$SERVPROVCODE$$", aa.getServiceProviderCode());

    var r = aa.db.select(q, new Array()).getOutput();
    if (r && r.size() > 0)
    {
        if (r.toArray()[0].get("UDF_DATE1"))
            return r.toArray()[0].get("UDF_DATE1");
        else return sysDateMMDDYYYY;
    }
    return sysDateMMDDYYYY;
}
function getLastUploadDate()
{
    var q = "SELECT TO_CHAR(UDF_DATE2, 'MM/DD/YYYY') UDF_DATE2 FROM BATCH_JOB WHERE BATCH_JOB_NAME = '$$BATCHJOBNAME$$' AND SERV_PROV_CODE = '$$SERVPROVCODE$$'";
    q = q.replace("$$BATCHJOBNAME$$", batchJobName).replace("$$SERVPROVCODE$$", aa.getServiceProviderCode());

    var r = aa.db.select(q, new Array()).getOutput();
    if (r && r.size() > 0)
    {
        if (r.toArray()[0].get("UDF_DATE2"))
            return r.toArray()[0].get("UDF_DATE2");
        else return sysDateMMDDYYYY;
    }
    return sysDateMMDDYYYY;
}
function updateLastUploadDate()
{
    var q = "UPDATE BATCH_JOB SET UDF_DATE2 = '$$DATE$$' WHERE BATCH_JOB_NAME = '$$BATCHJOBNAME$$' AND SERV_PROV_CODE = '$$SERVPROVCODE$$'";
    q = q.replace("$$DATE$$", sysDateMMDDYYYY).replace("$$BATCHJOBNAME$$", batchJobName).replace("$$SERVPROVCODE$$", aa.getServiceProviderCode());

    var r = aa.db.update(q, new Array());
    if (r.getSuccess())
    {
        logDebug("Successfully updated last upload date");
    }
    else
    {
        logDebug("Problem updating last upload date " + r.getErrorMessage());
    }
}
function updateLastDownloadDate()
{
    var q = "UPDATE BATCH_JOB SET UDF_DATE1 = '$$DATE$$' WHERE BATCH_JOB_NAME = '$$BATCHJOBNAME$$' AND SERV_PROV_CODE = '$$SERVPROVCODE$$'";
    q = q.replace("$$DATE$$", sysDateMMDDYYYY).replace("$$BATCHJOBNAME$$", batchJobName).replace("$$SERVPROVCODE$$", aa.getServiceProviderCode());

    var r = aa.db.update(q, new Array());
    if (r.getSuccess())
    {
        logDebug("Successfully updated last download date");
    }
    else
    {
        logDebug("Problem updating last download date " + r.getErrorMessage());
    }
}
function uploadToCME(uploadQueryFrom, uploadDays)
{
    var toDate = dateAdd(uploadQueryFrom, uploadDays);
    logDebug("Starting CERS Upload");
    logDebug("Getting Accela inspections records (New + Update) from date: " + uploadQueryFrom + " to date " + toDate);
    var newInsps = getCERSNewInspections(uploadQueryFrom, toDate);
    logDebug("Retrieved " + newInsps.length + " new inspections");

    var nestedInsps = nestSqlObject(newInsps);
    logDebug("Number of inspections after nesting: " + Object.keys(nestedInsps).length);

    var updatedInsps = getCERSUpdatedInspections(uploadQueryFrom, toDate);
    logDebug("Retrieved " + updatedInsps.length + " updated inspections");
    var newUpdatedInsps = nestSqlObject(updatedInsps);
    // for (var iii in updatedInsps)
    // {
    //     var inspSeqNbr = updatedInsps[iii].get("G6_ACT_NUM");
    //     if ("undefined".equals(typeof nestedInsps[inspSeqNbr]) && "undefined".equals(typeof newUpdatedInsps[inspSeqNbr]))
    //     {
    //         newUpdatedInsps[inspSeqNbr] = new Array();
    //         newUpdatedInsps[inspSeqNbr].push(updatedInsps[iii]);
    //     }
    //     else if ("undefined".equals(typeof nestedInsps[inspSeqNbr]))
    //         newUpdatedInsps[inspSeqNbr].push(updatedInsps[iii]);
    // }
    // logDebug("Number of updated inspections after nesting: " + Object.keys(newUpdatedInsps).length);
    // var insps2Process = nestedInsps.concat(newUpdatedInsps);
    // logDebug("Processing total number of inspections: " + Object.keys(insps2Process).length);

    var insps2Process = nestedInsps.concat(newUpdatedInsps);
    logDebug("Number of inspections to upload: " + Object.keys(insps2Process).length);

    for (var i in insps2Process)
    {

        var cmeSubmittal = new Object();
        cmeSubmittal.Inspections = new Array();
        cmeSubmittal.Violations = new Array();
        cmeSubmittal.RegulatorTransactionKey = newGuid();
        cmeSubmittal.Enforcements = new Array();
        cmeSubmittal.EnforcementViolations = new Array();
        var result = new Object();
        result.CMESubmittals = cmeSubmittal;
        var cmeHeader = new Object();
        cmeHeader.RegulatorCode = regulatorCode;
        cmeHeader.RegulatorActionDateTime = toCersDateTime(dateAdd(null, 0));

        try
        {
            var thisInsp = insps2Process[i][0];
            var thisRecSubType = String(thisInsp.recSubType);
            var thisTier = String(thisInsp.tier || "");
            var thisCersId = String(thisInsp.cersId || "");
            var thisAltId = String(thisInsp.altId || "");
            var thisInspId = String(thisInsp.inspId || "");
            var legacyInspectionId = String(thisInsp.legacyInspectionId || "");
            var legacyViolationId  =String(thisInsp.legacyViolationId || "");
            var thisInspResultDate = String(thisInsp.inspResultDate || "");
            var thisInspType = String(thisInsp.inspType || "");

            if (isBlank(thisCersId)){
                exceptionLogs.push(thisAltId + ": Has no CERS ID, skipping...");
                continue;
            }
            var cersInspection = new Object();
            cersInspection.Inspection = new Object();
            cersInspection.Inspection.InspectionHeader = cmeHeader;
            cersInspection.Inspection.InspectionRegulatorKey = String(legacyInspectionId || legacyViolationId || thisInspId);
           logDebug("cersInspection.Inspection.InspectionRegulatorKey is "+cersInspection.Inspection.InspectionRegulatorKey);
            if ("Routine".equalsIgnoreCase(thisInspType))
                cersInspection.Inspection.Type = "a";
            else
                cersInspection.Inspection.Type = "b";
            cersInspection.Inspection.CERSID = thisCersId;
            logDebug("thisRecSubType is " + thisRecSubType);
            !isBlank(thisInspResultDate) ? cersInspection.Inspection.OccurredOn =  toCersDate(thisInspResultDate) : true;
            thisInsp.resultComment ? cersInspection.Inspection.Comment = thisInsp.resultComment : true; //inspection result comment
           if (thisRecSubType.toUpperCase().substring(0,"APSA".length) =="APSA")
                cersInspection.Inspection.ProgramElement = "d";
           else if (thisRecSubType.toUpperCase().substring(0,"Business Plan".length)== "Business Plan".toUpperCase())
                cersInspection.Inspection.ProgramElement = "a";
           else if (thisRecSubType.toUpperCase().substring(0,"CalARP".length)== "CalARP".toUpperCase())
                cersInspection.Inspection.ProgramElement = "b";
           else if (thisRecSubType.toUpperCase().substring(0,"Hazwaste Consolidation".length)=="Hazwaste Consolidation".toUpperCase())
                cersInspection.Inspection.ProgramElement = "e";
           else if (thisRecSubType.toUpperCase().indexOf("Hazwaste Generator".toUpperCase())>-1)
                cersInspection.Inspection.ProgramElement = "e";
           else if (thisRecSubType.toUpperCase().substring(0,"HHW".length)== "HHW")
                cersInspection.Inspection.ProgramElement = "k";
           else if (thisRecSubType.toUpperCase().substring(0,"Large Quantity Generator".length)=="Large Quantity Generator".toUpperCase())
                cersInspection.Inspection.ProgramElement = "f";
           else if (thisRecSubType.toUpperCase().substring(0,"Recyclable Materials".length)=="Recyclable Materials".toUpperCase())
                cersInspection.Inspection.ProgramElement = "g";
            else if (thisRecSubType.toUpperCase().substring(0,"UST".length)== "UST")
                cersInspection.Inspection.ProgramElement = "c";
           else if (thisRecSubType.toUpperCase().substring(0,"Tiered Permitting".length)=="Tiered Permitting".toUpperCase() && "PBR".equals(thisTier))
                cersInspection.Inspection.ProgramElement = "h";
            else if (thisRecSubType.toUpperCase().substring(0,"Tiered Permitting".length)=="Tiered Permitting".toUpperCase() && ("CEL".equals(thisTier) || "CE".equals(thisTier)))
                cersInspection.Inspection.ProgramElement = "j";
            else if (thisRecSubType.toUpperCase().substring(0,"Tiered Permitting".length)=="Tiered Permitting".toUpperCase())
                cersInspection.Inspection.ProgramElement = "i";
            logDebug("ProgramElement value is " +cersInspection.Inspection.ProgramElement);
            var thisChecklistName = "";
            if (thisChecklistName.indexOf("#RD") >= 0)
                cersInspection.Inspection.SOCDetermination = "a";
            else if (thisChecklistName.indexOf("#RP") >= 0)
                cersInspection.Inspection.SOCDetermination = "b";
            else if (thisChecklistName.indexOf("#RP") >= 0 && thisChecklistName.indexOf("#RD") >= 0)
                cersInspection.Inspection.SOCDetermination = "c";
            else
                cersInspection.Inspection.SOCDetermination = "d";

            cersInspection.Inspection.SOCDeterminationSpecified = isBlank(cersInspection.SOCDetermination) ? false : true;
            //cersInspection.Inspection.ViolationsRTCOn = returnToComplianceDate || "";
            cersInspection.Inspection.ViolationsRTCOnSpecified = true;
            result.CMESubmittals.Inspections.push(cersInspection);

            for (var v in insps2Process[i][0].checkLists)
            {

                logDebug("Now looking at checklist " + v + " on inspection " + i);
                for (var iii in insps2Process[i][0].checkLists[v][0].checkListItems)
                {
                    logDebug("Now looking at checklistItem " + iii + " on inspection " + i);
                    var thisCheckListItem = insps2Process[i][0].checkLists[v][0].checkListItems[iii][0];
                    var thisCheckListItemStatus = String(thisCheckListItem.checkListItemStatus || "");
                    var thisChecklistId = String(insps2Process[i][0].checkLists[v][0].checklistId || "");
                    var thisChecklistComment = String(thisCheckListItem.checklistComment || "");
                    var thisChecklistName = String(thisCheckListItem.checklistName || "");
                    var returnToComplianceDate = String(thisCheckListItem.returnToComplianceDate || "");
                    var complyBy = String(thisCheckListItem.complyBy || "");
                    var vioDegree = String(thisCheckListItem.vioDegree || "");
                    var observDate = String(thisCheckListItem.observDate || "");
                    var returnToComplianceQual = String(thisCheckListItem.returnToComplianceQual || "");
                    var checkListNameArray = thisChecklistName.split("-") || new Array();
                    var thisCheckListItemId = thisCheckListItem.checkListItemId;
                    var cersChecklistId = "";
                    if (checkListNameArray.length > 0)
                        cersChecklistId = String(checkListNameArray[0] || "");

                    //if ("NEW".equals(thisInsp.updateType) && !"OUT".equals(thisCheckListItemStatus.toUpperCase()))
                    if (!"OUT".equals(thisCheckListItemStatus.toUpperCase()))
                    {
                        logDebug(thisAltId + " - " + thisInspId + " - " + thisCheckListItemId + ": this checklist item has a status of " + thisCheckListItemStatus + ", skipping...");
                        continue;
                    }

                    var cersViolation = new Object();
                    cersViolation.Violation = new Object();
                    cersViolation.Violation.ViolationHeader = cmeHeader;
                    logDebug("vioDegree is |" +vioDegree+"|")
                    if ("Class 1".equals(vioDegree))
                        cersViolation.Violation.Class = 1;
                    else if ("Class 2".equals(vioDegree))
                        cersViolation.Violation.Class = 2;
                    else if ("Minor".equals(vioDegree))
                        cersViolation.Violation.Class = 9;
                    logDebug("cersViolation.Violation.Class is " + cersViolation.Violation.Class)
                    cersViolation.Violation.InspectionRegulatorKey = String(legacyInspectionId || legacyViolationId || thisInspId);
                    logDebug("cersViolation.Violation.InspectionRegulatorKey is " + cersViolation.Violation.InspectionRegulatorKey);
                    cersViolation.Violation.ViolationRegulatorKey = thisInspId + "-" + thisChecklistId;
                    cersViolation.Violation.TypeID = cersChecklistId.trim();
                    logDebug("observDate is " + observDate);
                    !isBlank(observDate) ? cersViolation.Violation.OccurredOn = toCersDate(observDate) : true;
                    complyBy ? cersViolation.Violation.ScheduledRTCOn = toCersDate(complyBy) : true;
                    isBlank(cersViolation.Violation.ScheduledRTCOn) ? cersViolation.Violation.ScheduledRTCOnSpecified = false : cersViolation.Violation.ScheduledRTCOnSpecified = true;
                    !isBlank(returnToComplianceDate) ? cersViolation.Violation.ActualRTCOn = toCersDate(returnToComplianceDate) : true;
                    isBlank(cersViolation.Violation.ActualRTCOn) ? cersViolation.Violation.ActualRTCOnSpecified = false : cersViolation.Violation.ActualRTCOnSpecified = true;
                    if ("Documented".equals(returnToComplianceQual))
                        cersViolation.Violation.ActualRTCQualifier = "1";
                    else if ("Observed".equals(returnToComplianceQual))
                        cersViolation.Violation.ActualRTCQualifier = "2";
                    else if ("Not Resolvable".equals(returnToComplianceQual))
                        cersViolation.Violation.ActualRTCQualifier = "3";
                    else if ("Unobserved".equals(returnToComplianceQual))
                        cersViolation.Violation.ActualRTCQualifier = "4";
                    isBlank(cersViolation.Violation.ActualRTCQualifier) ? cersViolation.Violation.ActualRTCQualifierSpecified = false : cersViolation.Violation.ActualRTCQualifierSpecified = true;
                    cersViolation.Violation.Comment = thisChecklistComment.substr(0, 1000);

                    result.CMESubmittals.Violations.push(cersViolation);
                }
            }

            var uploadXML = getUploadXML(result);
            var url = baseURL;
            url += "CME/Submit?regulatorCode=" + regulatorCode;
            var auth = "user " + userName + ":" + password;
            logDebug("Now uploading date to CERS: ");
            logDebug(uploadXML);
            //uploadXML = '<ns2:CMESubmittals xmlns:ns2="http://cersservices.calepa.ca.gov/Schemas/RegulatorCMESubmit/1/05/"><RegulatorTransactionKey>a5760740-09d4-4a74-ad12-7901637cd8ec</RegulatorTransactionKey><Inspections><Inspection><InspectionHeader><RegulatorCode>1500</RegulatorCode><RegulatorActionDateTime>2021-09-15T06:35:34</RegulatorActionDateTime><CMEDataStatus>2</CMEDataStatus></InspectionHeader><CERSID>10244497</CERSID><InspectionRegulatorKey>16151</InspectionRegulatorKey><ProgramElement>a</ProgramElement><OccurredOn>2021-08-17</OccurredOn><Type>a</Type><SOCDetermination>d</SOCDetermination><Comment p4:nil="true" xmlns:p4="http://www.w3.org/2001/XMLSchema-instance" /></Inspection></Inspections><Enforcements p2:nil="true" xmlns:p2="http://www.w3.org/2001/XMLSchema-instance" /><Violations><Violation><ViolationHeader><RegulatorCode>1500</RegulatorCode><RegulatorActionDateTime>2021-09-15T06:35:34</RegulatorActionDateTime><CMEDataStatus>2</CMEDataStatus></ViolationHeader><InspectionRegulatorKey>16151</InspectionRegulatorKey><ViolationRegulatorKey>16151-67154</ViolationRegulatorKey><TypeID>1010001</TypeID><Class>9</Class><OccurredOn>2021-08-17</OccurredOn><ScheduledRTCOn>2021-09-21</ScheduledRTCOn><Comment>TEST</Comment></Violation></Violations><EnforcementViolations p2:nil="true" xmlns:p2="http://www.w3.org/2001/XMLSchema-instance" /></ns2:CMESubmittals>';
            var cersResponse = doRestPost(url, uploadXML, auth);
            logDebug("CERS Upload response: ");
            logDebug(cersResponse);
        }
        catch(e)
        {
            exceptionLogs.push(thisAltId + " - " + thisInspId + " problem on line " + e.lineNumber + ": " + e.message);
        }
    }
    updateLastUploadDate();

    if (insps2Process.length > 0) {
        inspectionsUploaded = insps2Process.length;
    }
}
function updateFacilityCustomFields(facilitycapId, facilityRecordsXML)
{
    var fInfo = getNode(facilityRecordsXML, "FacilityInformation");
    var hazardousInv = getNode(facilityRecordsXML, "HazardousMaterialsInventory");
    var ownerInfo = getNode(fInfo, "OwnerOperatorInformation");
    var chemicals = getNode(hazardousInv, "Chemicals");
    var chemical = getNode(chemicals, "Chemical");
    var bizActivity = getNode(fInfo, "BusinessActivities");

    var numEmployee = getNode(ownerInfo, "NumberOfEmployees");
    var hazWasteCollection = getNode(bizActivity, "HHWCollection");
    var hazMatOnSite = getNode(bizActivity, "HMOnSite");
    var calArpReg = getNode(bizActivity, "CalARPRegulatedSubstances");
    var ugTank = getNode(bizActivity, "OwnOrOperateUST");
    var hwGenerator = getNode(bizActivity, "HWGenerator");
    var recycle = getNode(bizActivity, "Recycle");
    var hwConsolidation = getNode(bizActivity, "RWConsolidationSite");
    var largeQuantityGen = getNode(bizActivity, "RCRALargeQuantityGenerator");
    var apn = getNode(ownerInfo, "AssessorParcelNumber");
    var bizName = getNode(bizActivity, "BusinessName");
    var apsa = getNode(bizActivity, "OwnOrOperateAPST");
    var tPermit = getNode(bizActivity, "OnsiteHWTreatment");

    if (!isBlank(numEmployee))
        editAppSpecific("Number of Employees", numEmployee, facilitycapId);
    if (!isBlank(hazWasteCollection))
        editAppSpecific("Hazardous Waste Collection", hazWasteCollection, facilitycapId);
    if (!isBlank(hazMatOnSite))
        editAppSpecific("Hazardous Materials Onsite", hazMatOnSite, facilitycapId);
    if (!isBlank(calArpReg))
        editAppSpecific("CalARP Regulated Substances", calArpReg, facilitycapId);
    if (!isBlank(ugTank))
        editAppSpecific("Underground Storage Tanks", ugTank, facilitycapId);
    if (!isBlank(hwGenerator))
        editAppSpecific("Hazardous Waste Generator", hwGenerator, facilitycapId);
    if (!isBlank(recycle))
        editAppSpecific("Recyclable Materials", recycle, facilitycapId);
    if (!isBlank(hwConsolidation))
        editAppSpecific("Hazardous Waste Consolidation", hwConsolidation, facilitycapId);
    if (!isBlank(largeQuantityGen))
        editAppSpecific("Large Quantity Generator", largeQuantityGen, facilitycapId);
    if (!isBlank(apn))
        editAppSpecific("APN", apn, facilitycapId);
    if (!isBlank(apsa))
        editAppSpecific("APSA", apsa, facilitycapId);
    if (!isBlank(tPermit))
        editAppSpecific("Tiered Permitting", tPermit, facilitycapId);
}
function updateFacilityContacts(facilitycapId, ownerInfo)
{
    var ownerName = getNode(ownerInfo, "OwnerName");
    var billingContactName = getNode(ownerInfo, "BillingContactName");
    var econtacntName = getNode(ownerInfo, "EContactName");
    var pecName = getNode(ownerInfo, "PECName");
    var secName  = getNode(ownerInfo, "SECName");
    var mailingContact = getNode(ownerInfo, "MailingAddress");
    var operatorName = getNode(ownerInfo, "OperatorName");

    if (!isBlank(ownerName))
    {
        var ownerPhone = getNode(ownerInfo, "OwnerPhone");
        var ownerMailingAdd = getNode(ownerInfo, "OwnerMailAddress");
        var ownerCity = getNode(ownerInfo,"OwnerCity");
        var ownerState = getNode(ownerInfo, "OwnerState");
        var ownerZip = getNode(ownerInfo, "OwnerZipCode");
        var ownerCountry = getNode(ownerInfo, "OwnerCountry");

        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Facility Owner");
        //capContact.setFirstName(firstName);
        //capContact.setMiddleName(middleName);
        //capContact.setLastName(lastName);
        capContact.setFullName(ownerName);
        capContact.setCity(ownerCity);
        capContact.setState(ownerState);
        capContact.setZip(ownerZip);
        capContact.setCountry(ownerCountry)
        capContact.setAddressLine1(ownerMailingAdd);
        capContact.setPhone1(ownerPhone);
        capContact.setCapID(facilitycapId);

        // var compactAddress = new com.accela.aa.aamain.address.CompactAddressModel();
        // compactAddress.setAddressLine1(contactInfoArray["Address"]);
        // compactAddress.setCity(contactInfoArray["City"]);
        // compactAddress.setState(contactInfoArray["State"]);
        // compactAddress.setZip(contactInfoArray["Zip"]);
        // capContact.getPeople().setCompactAddress(compactAddress);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(billingContactName))
    {
        var contactPhone = getNode(ownerInfo, "BillingContactPhone");
        var contactMailingAdd = getNode(ownerInfo, "BillingAddress");
        var contactCity = getNode(ownerInfo,"BillingAddressCity");
        var contactState = getNode(ownerInfo, "BillingAddressState");
        var contactZip = getNode(ownerInfo, "BillingAddressZipCode");
        var contactCountry = getNode(ownerInfo, "BillingAddressCountry");
        var billingContactEmail = getNode(ownerInfo,"BillingContactEmail");
        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Account Receivable");
        //capContact.setFirstName(firstName);
        //capContact.setMiddleName(middleName);
        //capContact.setLastName(lastName);
        capContact.setFullName(billingContactName);
        capContact.setCity(contactCity);
        capContact.setState(contactState);
        capContact.setZip(contactZip);
        capContact.setCountry(contactCountry)
        capContact.setAddressLine1(contactMailingAdd);
        capContact.setPhone1(contactPhone);
        capContact.setCapID(facilitycapId);
        capContact.setEmail(billingContactEmail);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(econtacntName))
    {
        var contactPhone = getNode(ownerInfo, "EContactPhone");
        var contactMailingAdd = getNode(ownerInfo, "EContactMailingAddress");
        var contactCity = getNode(ownerInfo,"EContactCity");
        var contactState = getNode(ownerInfo, "EContactState");
        var contactZip = getNode(ownerInfo, "EContactZipCode");
        var contactCountry = getNode(ownerInfo, "EContactCountry");
        var eContactEmailAddress= getNode(ownerInfo,"EContactEmailAddress");
        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Environmental Contact");
        //capContact.setFirstName(firstName);
        //capContact.setMiddleName(middleName);
        //capContact.setLastName(lastName);
        capContact.setFullName(econtacntName);
        capContact.setCity(contactCity);
        capContact.setState(contactState);
        capContact.setZip(contactZip);
        capContact.setCountry(contactCountry)
        capContact.setAddressLine1(contactMailingAdd);
        capContact.setPhone1(contactPhone);
        capContact.setCapID(facilitycapId);
        capContact.setEmail(eContactEmailAddress);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(pecName))
    {
        var contactPhone = getNode(ownerInfo, "PECBusinessPhone");

        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Primary Emergency Contact");
        capContact.setFullName(pecName)
        capContact.setPhone1(contactPhone);
        capContact.setCapID(facilitycapId);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(secName))
    {
        var contactPhone = getNode(ownerInfo, "BillingContactPhone");

        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Secondary Emergency Contact");
        capContact.setFullName(secName);
        capContact.setPhone1(contactPhone);
        capContact.setCapID(facilitycapId);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(mailingContact))
    {
        var phone = getNode(ownerInfo, "Phone");
        var mailingAddress = getNode(ownerInfo, "MailingAddress");
        var mailingAddressCity = getNode(ownerInfo,"MailingAddressCity");
        var mailingAddressState = getNode(ownerInfo, "MailingAddressState");
        var mailingAddressZipCode = getNode(ownerInfo, "MailingAddressZipCode");
        var ownerCountry = getNode(ownerInfo, "OwnerCountry");

        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Facility Contact");
        //capContact.setFullName(secName);
        capContact.setPhone1(phone);
        capContact.setCity(mailingAddressCity);
        capContact.setState(mailingAddressState);
        capContact.setZip(mailingAddressZipCode);
        capContact.setAddressLine1(mailingAddress);
        capContact.setCapID(facilitycapId);
        createSimpleCapContact(capContact, facilitycapId);
    }
    if (!isBlank(operatorName))
    {
        var operatorPhone = getNode(ownerInfo, "OperatorPhone");

        var capContact = new com.accela.aa.aamain.people.CapContactModel();
        capContact.setContactType("Operator");
        capContact.setFullName(operatorName);
        capContact.setPhone1(operatorPhone);
        capContact.setCapID(facilitycapId);

        createSimpleCapContact(capContact, facilitycapId);
    }
}
function updateFacilityAddress(facilitycapId, bizActivity)
{
    var siteAddressLine1 = getNode(bizActivity, "SiteAddress");
    if (!isBlank(siteAddressLine1))
    {
        removeCapAddresses(facilitycapId);
        var city = getNode(bizActivity, "City");
        var zip = getNode(bizActivity, "ZipCode");

        var addressModel = new com.accela.aa.aamain.address.AddressModel();
        addressModel.setZip(zip);
        addressModel.setCity(city);
        addressModel.setFullAddress(siteAddressLine1);
        addressModel.setAddressLine1(siteAddressLine1);
        var parseAddress = parseAddressString(siteAddressLine1);
        if (parseAddress && parseAddress.length > 0)
        {
            if (!isBlank(parseAddress[0].unit))
                addressModel.setUnitStart(parseAddress[0].unit);
            if (!isBlank(parseAddress[0].houseNum))
                addressModel.setHouseNumberStart(parseAddress[0].houseNum);
            if (!isBlank(parseAddress[0].postDir))
                addressModel.setStreetSuffixdirection(parseAddress[0].postDir);
            if (!isBlank(parseAddress[0].preDir))
                addressModel.setStreetDirection(parseAddress[0].preDir);
            if (!isBlank(parseAddress[0].streetType))
                addressModel.setStreetSuffix(parseAddress[0].streetType);
            if (!isBlank(parseAddress[0].streetName))
                addressModel.setStreetName(parseAddress[0].streetName);
        }

        createCapAddress(facilitycapId, addressModel);
    }
}
function downloadFacilityInfo()
{
    var newFromDate = new Date(downloadQueryFrom);
    var finalDateTo = dateAdd(downloadQueryFrom, downloadDays - 1);
    var finalDateToJS = new Date(finalDateTo);
    finalDateToJS.setHours(23, 59, 59);

    while (newFromDate.getTime() <= finalDateToJS.getTime())
    {
        var newFromDateString = dateAdd(newFromDate, 0) + " " + zeroPad(newFromDate.getHours(), 2) + ":" + zeroPad(newFromDate.getMinutes(), 2) + ":" + zeroPad(newFromDate.getSeconds(), 2);
        var dateToJS = new Date();
        if ("1".equals(cersOptions.payloadType))
            dateToJS = new Date(newFromDateString).addHours(cersOptions.payloadSize);
        else
        {
            dateToJS = new Date(newFromDateString).addDays(cersOptions.payloadSize - 1);
            dateToJS.setHours(23, 59, 59);
        }
        var dateToString = dateAdd(dateToJS, 0) + " " + zeroPad(dateToJS.getHours(), 2) + ":" + zeroPad(dateToJS.getMinutes(), 2) + ":" + zeroPad(dateToJS.getSeconds(), 2);

        if (new Date(dateToString).getTime() > finalDateToJS.getTime())
            dateToString = dateAdd(finalDateToJS, 0) + " " + zeroPad(finalDateToJS.getHours(), 2) + ":" + zeroPad(finalDateToJS.getMinutes(), 2) + ":" + zeroPad(finalDateToJS.getSeconds(), 2);
        var dateFrom = newFromDateString.replace("/", "-").replace("/", "-").replace(" ", "%20");
        var dateTo = dateToString.replace("/", "-").replace("/", "-").replace(" ", "%20");
        var queryParams = aa.util.newHashtable();
        queryParams.put("submittalActionOnStart", dateFrom);
        queryParams.put("submittalActionOnEnd", dateTo);
        queryParams.put("regulatorCode", regulatorCode);
        var url = baseURL;
        url += "FacilitySubmittal/Query";
        var auth = "user " + userName + ":" + password;

        var queryString = "?regulatorCode=" + regulatorCode + "&submittalActionOnStart=" + dateFrom + "&submittalActionOnEnd=" + dateTo;
        // if (cersOptions.facilityStatus)
        //     queryString += ("&status=" + cersOptions.facilityStatus) ;
        logDebug("Now downloading CERS data from " + dateFrom + " to " + dateTo);

        var cersXML = doRestGet(url, queryString, auth);
        aa.print("url is: " + url+queryString);
        cersXML = String(cersXML).replace(/<!\[CDATA\[/g, "").replace(/]]>/g, "");

        //logDebug("Got the following from CERS");
        //logDebug(cersXML);
        var facilityRecordsXML = getNodes(cersXML, "FacilitySubmittal");
        facilityRecordsXML = sortFacilities(facilityRecordsXML);

        if ("1".equals(cersOptions.payloadType))
            newFromDate = new Date(dateToJS);
        else
            newFromDate = new Date(dateToJS).addDays(1);
        newFromDate.setHours(0, 0, 0);
        for (var f in facilityRecordsXML)
        {
            try
            {
                var cersId = getNode(facilityRecordsXML[f], "CERSID");
                facilitiesInXML.push(cersId);
                var fInfo = getNode(facilityRecordsXML[f], "FacilityInformation");
                var hazardousInv = getNode(facilityRecordsXML[f], "HazardousMaterialsInventory");
                var ownerInfo = getNode(fInfo, "OwnerOperatorInformation");
                var chemicals = getNode(hazardousInv, "Chemicals");
                var chemical = getNode(chemicals, "Chemical");
                var bizActivity = getNode(fInfo, "BusinessActivities");
                var submittalElementHeader = getNode(fInfo, "SubmittalElementHeader");
                var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
                var bizName = getNode(bizActivity, "BusinessName");

                if (!exists(submittalStatus, allowedFacilityStatus))
                {
                    logDebug(cersId + ": has submittal status that is not allowed, skipping...");
                    continue;
                }

                logDebug("Processing CERS ID: " + cersId);
                var capIds = aa.cap.getCapIDsByAppSpecificInfoField("CERS_ID", cersId).getOutput() || new Array();

                if (capIds.length == 0)
                {
                    logDebug("CERS_ID: " + cersId + " not found in Accela. Creating new Facility record");

                    //update ASI fields
                    var  newcapId = createCap("EnvHealth/Facility/NA/NA", bizName);
                    logDebug("New record number is: " + newcapId.getCustomID());
                    updateAppStatus("Active", "Updated via CERS Batch", newcapId);
                    editAppSpecific("CERS_ID", cersId, newcapId);
                    updateFacilityCustomFields(newcapId, facilityRecordsXML[f]);
                    //update contacts
                    removeContactsFromCap(newcapId);
                    updateFacilityContacts(newcapId, ownerInfo)
                    //update Addresses
                    updateFacilityAddress(newcapId, bizActivity);
                    updateAddressFromParent();
                    updateContactsFromParent();
                    runASAForCapId(newcapId);
                    //Update biz activity ASI
                    var options = new Object();
                    options.itemCap = newcapId;
                    options.xml = facilityRecordsXML[f];
                    //if (exists(submittalStatus, allowedSubmittalStatusArray))
                    processChildPermits(options);
                    facilitiesCreated.push(String(newcapId.getCustomID()));

                }
                else
                {
                    logDebug("Retrieved " + capIds.length + " Accela records with CERS ID: " + cersId);
                    for (var c in capIds)
                    {
                        capId = aa.cap.getCapID(capIds[c].getID1(), capIds[c].getID2(), capIds[c].getID3()).getOutput();
                        altId = capId.getCustomID();
                        if (!appMatch("EnvHealth/Facility/NA/NA", capId)){
                            logDebug(altId + ": not a facility record, skipping update...");
                            continue;
                        }
                        logDebug("Updating Accela record: " + altId);
                        updateFacilityCustomFields(capId, facilityRecordsXML[f]);
                        //update contacts
                        removeContactsFromCap(capId);
                        updateFacilityContacts(capId, ownerInfo);
                        //update Addresses
                        updateFacilityAddress(capId, bizActivity)
                        updateAddressFromParent();
                        updateContactsFromParent();
                        editAppName(bizName,capId);
                        var options = new Object();
                        options.itemCap = capId;
                        options.xml = facilityRecordsXML[f];
                        //if (exists(submittalStatus, allowedSubmittalStatusArray))
                        processChildPermits(options);
                        facilitiesUpdated.push(String(capId.getCustomID()));
                    }
                }
            }
            catch(e)
            {
                logDebug(cersId + ": problem on line " + e.lineNumber + ": " + e.message);
                exceptionLogs.push(cersId + ": problem on line " + e.lineNumber + ": " + e.message);
                failedFcilities++;
            }
        }

    }

    updateLastDownloadDate();
}
function sortFacilities(facilityRecordsXML)
{

    return facilityRecordsXML.sort(
        function (a, b)
        {
            var submittalElementA = getNode(a, "SubmittalElementHeader");
            var submittalElementB = getNode(b, "SubmittalElementHeader");
            var submittalDetailsA = getNode(submittalElementA, "SubmittalActionDetails");
            var submittalDetailsB = getNode(submittalElementB, "SubmittalActionDetails");
            var dateA = getNode(submittalDetailsA, "SubmittalActionOn");
            var dateB = getNode(submittalDetailsB, "SubmittalActionOn");

            var dateAJS = new Date(dateA.replace(/-/g, "/").replace("T", " ").replace("Z", ""));
            var dateBJS = new Date(dateB.replace(/-/g, "/").replace("T", " ").replace("Z", ""));

            return dateAJS.getTime() - dateBJS.getTime();
        }
    );
}
function updatePermitCustomFields(childPermitcapId, xml)
{
    var fInfo = getNode(xml, "FacilityInformation");
    var hazardousInv = getNode(xml, "HazardousMaterialsInventory");
    var treatmentNotification = getNode(xml, "OnsiteHazardousWasteTreatmentNotification");
    var recyleMat = getNode(xml, "RecyclableMaterialsReport");
    var usTanksInfo = getNode(xml, "UndergroundStorageTanks");
    var hazWasteConsolidate = getNode(xml, "RemoteWasteConsolidationsAnnualNotification");
    var apsa = getNode(xml, "AbovegroundPetroleumStorageTanks");
    var cersId = getNode(xml, "CERSID");

    var ownerInfo = getNode(fInfo, "OwnerOperatorInformation");
    var chemicals = getNode(hazardousInv, "Chemicals");
    var chemical = getNodes(chemicals, "Chemical");
    var usTanks = getNode(usTanksInfo, "USTTanks");
    var usTank = getNodes(usTanks, "USTTank");
    var bizActivity = getNode(fInfo, "BusinessActivities");

    var hwFacility = getNode(treatmentNotification, "HWFacility");
    var hwUnits = getNode(hwFacility, "HWUnits");
    var hwUnit = getNode(hwUnits, "HWUnit");
    var hwUnitType = getNode(hwUnit, "UnitType");
    var tier = "";

    if (!isBlank(hwUnitType))
    {
        if ("a".equals(hwUnitType))
            tier = "CESQT";
        else if ("b".equals(hwUnitType))
            tier = "CESW";
        else if ("c".equals(hwUnitType))
            tier = "CA";
        else if ("d".equals(hwUnitType))
            tier = "PBR";
        else
            tier = "CEL";
    }
    editAppSpecific("CERS_ID", cersId, childPermitcapId);


    if (appMatch("EnvHealth/Hazmat/Business Plan/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(hazardousInv, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["HMOnSite"].allowedStatus || new Array());

        if (submittalApproved)
        {
        if (!isBlank(submittedOn))
        {
    submittedOn = submittedOn.split("T")[0];
    submittedOn = submittedOn.replace(/-/g, "/");
            editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
        }
        if (!isBlank(submittalActionOn))
        {
    submittalActionOn = submittalActionOn.split("T")[0];
    submittalActionOn = submittalActionOn.replace(/-/g, "/");
        }

        if (!isBlank(submittedOn))
    editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
        if (!isBlank(submittedFirstName))
    editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
        if (!isBlank(submittedLastName))
    editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
        if (!isBlank(submittalActionOn))
    editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
        if (!isBlank(submittalActionAgent))
    editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);


        var table = new Array();
        for (var c in chemical)
        {
            var thisRow = new Array();
            var thisChemical = chemical[c];
            thisRow["ChemicalName"] = getNode(thisChemical, "ChemicalName");
            thisRow["ChemicalLocation"] = getNode(thisChemical, "ChemicalLocation");
            thisRow["ChemicalLocationConfidential"] = getNode(thisChemical, "CLConfidential");
            thisRow["MapNumber"] = getNode(thisChemical, "MapNumber");
            thisRow["GridNumber"] = getNode(thisChemical, "GridNumber");
            thisRow["TradeSecret"] = getNode(thisChemical, "TradeSecret");
            thisRow["CommonName"] = getNode(thisChemical, "CommonName");
            thisRow["EHS"] = getNode(thisChemical, "EHS");
            thisRow["CAS"] = getNode(thisChemical, "CASNumber");
            var hmType = getNode(thisChemical, "HMType");
            if ("a".equals(hmType)) thisRow["HazardousMaterialType"] = "Pure";
            else if ("b".equals(hmType)) thisRow["HazardousMaterialType"] = "Mixture";
            else if ("c".equals(hmType)) thisRow["HazardousMaterialType"] = "Waste";
            else thisRow["HazardousMaterialType"] = getNode(thisChemical, "HMType");
            thisRow["Radioactive"] = getNode(thisChemical, "RadioActive");
            thisRow["Curies"] = getNode(thisChemical, "Curies");
            var pState = getNode(thisChemical, "PhysicalState");
            if ("a".equals(pState)) thisRow["PhysicalState"] = "Solid";
            else if ("b".equals(pState)) thisRow["PhysicalState"] = "Liquid";
            else if ("c".equals(pState)) thisRow["PhysicalState"] = "Gas";
            else thisRow["PhysicalState"] = getNode(thisChemical, "PhysicalState");
            thisRow["MaxDailyAmount"] = getNode(thisChemical, "MaximumDailyAmount");
            var units = getNode(thisChemical, "Units");
            if ("a".equals(units))
                units = "Gallons";
            else if ("b".equals(units))
                units = "Cubic Feet";
            else if ("c".equals(units))
                units = "Pounds";
            else if ("d".equals(units))
                units = "Tons";
            thisRow["Units"] = units;

            table.push(thisRow);
        }
            if (table.length > 0)
            {
                removeASITable("INVENTORY_INFORMATION", childPermitcapId);
                addASITable("INVENTORY_INFORMATION", table, childPermitcapId);
            }
        }
    }
    else if (appMatch("EnvHealth/Hazmat/UST/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(usTanksInfo, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["OwnOrOperateUST"].allowedStatus || new Array());


        if (submittalApproved)
        {
            if (!isBlank(submittedOn))
            {
                submittedOn = submittedOn.split("T")[0];
                submittedOn = submittedOn.replace(/-/g, "/");
                editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
            }
            if (!isBlank(submittalActionOn))
            {
                submittalActionOn = submittalActionOn.split("T")[0];
                submittalActionOn = submittalActionOn.replace(/-/g, "/");
            }

            if (!isBlank(submittedOn))
                editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
            if (!isBlank(submittedFirstName))
                editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
            if (!isBlank(submittedLastName))
                editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
            if (!isBlank(submittalActionOn))
                editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
            if (!isBlank(submittalActionAgent))
                editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);

            var table = new Array();
            for (var u in usTank)
            {
                var thisRow = new Array();
                var thisTank = usTank[u];
                thisRow["TankIDNumber"] = getNode(thisTank, "CERSTankIDNumber");
                thisRow["TankCapacityInGallons"] = getNode(thisTank, "TankCapacityInGallons");
                var tUse = getNode(thisTank, "TankUse");
                if ("1a".equals(tUse)) thisRow["TankUse"] = "Motor Vehicle Fueling";
                else if ("1b".equals(tUse)) thisRow["TankUse"] = "Marina Fueling";
                else if ("1c".equals(tUse)) thisRow["TankUse"] = "Aviation Fueling";
                else if ("03".equals(tUse)) thisRow["TankUse"] = "Chemical Product Storage";
                else if ("04".equals(tUse)) thisRow["TankUse"] = "Hazardous Waste (includes used oil)";
                else if ("05".equals(tUse)) thisRow["TankUse"] = "Emergency Generator Fuel";
                else if ("06".equals(tUse)) thisRow["TankUse"] = "Other Generator Fuel";
                else if ("07".equals(tUse)) thisRow["TankUse"] = "Airport Hydrant System";
                else if ("95".equals(tUse)) thisRow["TankUse"] = "Unknown";
                else if ("99".equals(tUse)) thisRow["TankUse"] = "Other";
                else thisRow["TankUse"] = getNode(thisTank, "TankUse");

                table.push(thisRow);
            }
            if (table.length > 0)
            {
                removeASITable("TANK_INFORMATION", childPermitcapId);
                addASITable("TANK_INFORMATION", table, childPermitcapId);
            }
        }
    }
    else if (appMatch("EnvHealth/Hazmat/Tiered Permitting/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(treatmentNotification, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["OnsiteHWTreatment"].allowedStatus || new Array());


        if (submittalApproved)
        {
            if (!isBlank(submittedOn))
            {
                submittedOn = submittedOn.split("T")[0];
                submittedOn = submittedOn.replace(/-/g, "/");
                editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
            }
            if (!isBlank(submittalActionOn))
            {
                submittalActionOn = submittalActionOn.split("T")[0];
                submittalActionOn = submittalActionOn.replace(/-/g, "/");
            }

            if (!isBlank(submittedOn))
                editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
            if (!isBlank(submittedFirstName))
                editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
            if (!isBlank(submittedLastName))
                editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
            if (!isBlank(submittalActionOn))
                editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
            if (!isBlank(submittalActionAgent))
                editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);

            editAppSpecific("Tier", tier, childPermitcapId);
        }
    }
    else if (appMatch("EnvHealth/Hazmat/Recyclable Materials/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(recyleMat, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["Recycle"].allowedStatus || new Array());

        if (submittalApproved)
        {
            if (!isBlank(submittedOn))
            {
                submittedOn = submittedOn.split("T")[0];
                submittedOn = submittedOn.replace(/-/g, "/");
                editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
            }
            if (!isBlank(submittalActionOn))
            {
                submittalActionOn = submittalActionOn.split("T")[0];
                submittalActionOn = submittalActionOn.replace(/-/g, "/");
            }

            if (!isBlank(submittedOn))
                editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
            if (!isBlank(submittedFirstName))
                editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
            if (!isBlank(submittedLastName))
                editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
            if (!isBlank(submittalActionOn))
                editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
            if (!isBlank(submittalActionAgent))
                editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);
        }
    }
    else if (appMatch("EnvHealth/Hazmat/Hazwaste Consolidation/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(hazWasteConsolidate, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["RWConsolidationSite"].allowedStatus || new Array());

        if (submittalApproved)
        {
            if (!isBlank(submittedOn))
            {
                submittedOn = submittedOn.split("T")[0];
                submittedOn = submittedOn.replace(/-/g, "/");
                editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
            }
            if (!isBlank(submittalActionOn))
            {
                submittalActionOn = submittalActionOn.split("T")[0];
                submittalActionOn = submittalActionOn.replace(/-/g, "/");
            }

            if (!isBlank(submittedOn))
                editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
            if (!isBlank(submittedFirstName))
                editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
            if (!isBlank(submittedLastName))
                editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
            if (!isBlank(submittalActionOn))
                editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
            if (!isBlank(submittalActionAgent))
                editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);
        }
    }
    else if (appMatch("EnvHealth/Hazmat/APSA/Permit", childPermitcapId))// && submittalApproved)
    {
        var submittalElementHeader = getNode(apsa, "SubmittalElementHeader");
        var submittalActionDetail = getNode(submittalElementHeader, "SubmittalActionDetails");
        var submittedFirstName = getNode(submittalElementHeader, "SubmittedByFirstName");
        var submittedLastName = getNode(submittalElementHeader, "SubmittedByLastName");
        var submittedOn = getNode(submittalElementHeader, "SubmittedOn");
        var submittalActionOn = getNode(submittalActionDetail, "SubmittalActionOn");
        var submittalActionAgent = getNode(submittalActionDetail, "SubmittalActionAgentName");
        var submittalStatus = getNode(submittalElementHeader, "SubmittalStatus");
        var submittalApproved = exists(submittalStatus, cersOptions["OwnOrOperateAPST"].allowedStatus || new Array());

        if (submittalApproved)
        {
            if (!isBlank(submittedOn))
            {
                submittedOn = submittedOn.split("T")[0];
                submittedOn = submittedOn.replace(/-/g, "/");
                editAppSpecific("DateDownloaded", sysDateMMDDYYYY, childPermitcapId);
            }
            if (!isBlank(submittalActionOn))
            {
                submittalActionOn = submittalActionOn.split("T")[0];
                submittalActionOn = submittalActionOn.replace(/-/g, "/");
            }

            if (!isBlank(submittedOn))
                editAppSpecific("SubmittedOn", submittedOn, childPermitcapId);
            if (!isBlank(submittedFirstName))
                editAppSpecific("SubmittedByFirstName", submittedFirstName, childPermitcapId);
            if (!isBlank(submittedLastName))
                editAppSpecific("SubmittedByLastName", submittedLastName, childPermitcapId);
            if (!isBlank(submittalActionOn))
                editAppSpecific("SubmittalActionOn", submittalActionOn, childPermitcapId);
            if (!isBlank(submittalActionAgent))
                editAppSpecific("SubmittalActionAgentName", submittalActionAgent, childPermitcapId);
        }
    }

}
function processChildPermits(options)
{
    var childPermits = ["CalARPRegulatedSubstances", "HHWCollection", "HMOnSite",
        "HWGenerator", "OnsiteHWTreatment", "OwnOrOperateUST", "RCRALargeQuantityGenerator",
        "RWConsolidationSite", "Recycle", "OwnOrOperateAPST"];

    var recordsMap = aa.util.newHashMap();
    recordsMap.put("CalARPRegulatedSubstances", "EnvHealth/Hazmat/CalARP/Permit");
    recordsMap.put("HHWCollection", "EnvHealth/Hazmat/HHW/Permit");
    recordsMap.put("HMOnSite", "EnvHealth/Hazmat/Business Plan/Permit");
    recordsMap.put("HWGenerator", "EnvHealth/Hazmat/Hazwaste Generator/Permit");
    recordsMap.put("OnsiteHWTreatment", "EnvHealth/Hazmat/Tiered Permitting/Permit");
    recordsMap.put("OwnOrOperateUST", "EnvHealth/Hazmat/UST/Permit");
    recordsMap.put("RCRALargeQuantityGenerator", "EnvHealth/Hazmat/Large Quantity Generator/Permit");
    recordsMap.put("Recycle", "EnvHealth/Hazmat/Recyclable Materials/Permit");
    recordsMap.put("RWConsolidationSite", "EnvHealth/Hazmat/Hazwaste Consolidation/Permit");
    recordsMap.put("OwnOrOperateAPST", "EnvHealth/Hazmat/APSA/Permit");

    var xml = options.xml;
    var fInfo = getNode(xml, "FacilityInformation");
    var hazardousInv = getNode(xml, "HazardousMaterialsInventory");
    var cersId = getNode(xml, "CERSID");
    var ownerInfo = getNode(fInfo, "OwnerOperatorInformation");
    var chemicals = getNode(hazardousInv, "Chemicals");
    var chemical = getNodes(chemicals, "Chemical");
    var bizActivity = getNode(fInfo, "BusinessActivities");
    var bizName = getNode(bizActivity, "BusinessName");

    var itemCap = options.itemCap;

    var facAppName = getAppName(itemCap)

    for (var c in childPermits)
    {
        try
        {
            var thisPermit = childPermits[c];
            var thisAccelaPermit = recordsMap.get(thisPermit);
            var thisAccelaPermitArray = thisAccelaPermit.split("/");
            var isReportedActivity = "Y".equals(getNode(bizActivity, thisPermit));
            if (isReportedActivity)
                submittalsInXML++;
            if (cersOptions[thisPermit] && !cersOptions[thisPermit].doProcess){
                logDebug(thisPermit + " is not allowed to process, skipping...");
                continue;
            }
            var existingChildren = getChildren(thisAccelaPermit, itemCap) || new Array();
            if (isReportedActivity && existingChildren.length > 0)
            {
                for (var e in existingChildren)
                {
                    var thisChild = existingChildren[e];
                    //update ASI for child
                    updatePermitCustomFields(thisChild, xml);
                    updateAppStatus("Active", "Updated via CERS Batch", thisChild);
                    editAppName(bizName, thisChild);
                    updateShortNotes(bizName, thisChild);
                    submittalsUpdated.push(String(thisChild.getCustomID()));
                }
            }
            else if (!isReportedActivity && existingChildren.length > 0)
            {
                for (var e in existingChildren)
                {
                    var thisChild = existingChildren[e];
                    //update ASI for child
                    updatePermitCustomFields(thisChild, xml);
                    updateAppStatus("Inactive", "Updated via CERS Batch", thisChild);
                    editAppName(bizName, thisChild);
                    updateShortNotes(bizName, thisChild);
                    //syncChildCERSRecord(itemCap, thisChild);
                }
            }
            else if (isReportedActivity && existingChildren.length == 0)
            {
                //var  newcapId = createCap(thisAccelaPermit, "bizName");
                var newcapId = createChild(thisAccelaPermitArray[0], thisAccelaPermitArray[1], thisAccelaPermitArray[2], thisAccelaPermitArray[3], "", itemCap);
                if (!newcapId)
                    throw new Error(thisAccelaPermitArray + " is not defined or disabled");
                updateAppStatus("Active", "Updated via CERS Batch", newcapId);
                updatePermitCustomFields(newcapId, xml);
                editAppName(bizName, newcapId);
                updateShortNotes(bizName, newcapId);
                newSubmittalsCreated.push(String(newcapId.getCustomID()));
            }
        }
        catch(e)
        {
            logDebug(cersId + ": problem processing child permit " + thisPermit + " on line " + e.lineNumber + ": " + e.message);
            exceptionLogs.push(cersId + ": problem processing child permit " + thisPermit + " on line " + e.lineNumber + ": " + e.message);
            failedPermits++;
        }
    }
}
function getUploadXML(result)
{
    var uploadXML = "";

    uploadXML += '<ns2:CMESubmittals xmlns:ns2="http://cersservices.calepa.ca.gov/Schemas/RegulatorCMESubmit/1/05/"> <RegulatorTransactionKey>';
    uploadXML += result.CMESubmittals.RegulatorTransactionKey;
    uploadXML += '</RegulatorTransactionKey>'
    uploadXML += '<Inspections>'
    for (var i in result.CMESubmittals.Inspections)
    {
        var xmlInsp = result.CMESubmittals.Inspections[i];
        uploadXML += '<Inspection>';
        uploadXML += '<InspectionHeader>';
        uploadXML += '<RegulatorCode>';
        uploadXML += xmlInsp.Inspection.InspectionHeader.RegulatorCode;
        uploadXML += '</RegulatorCode>';
        uploadXML += '<RegulatorActionDateTime>';
        uploadXML += toCersDateTime(dateAdd(null, 0)) || "";
        uploadXML += '</RegulatorActionDateTime>';
        uploadXML += '<CMEDataStatus>2</CMEDataStatus>';
        uploadXML += '</InspectionHeader>';
        uploadXML += '<CERSID>';
        uploadXML += xmlInsp.Inspection.CERSID;
        uploadXML += '</CERSID>';
        uploadXML += '<InspectionRegulatorKey>';
        uploadXML += xmlInsp.Inspection.InspectionRegulatorKey;
        uploadXML += '</InspectionRegulatorKey>';
        uploadXML += '<ProgramElement>';
        uploadXML += xmlInsp.Inspection.ProgramElement;
        uploadXML += '</ProgramElement>';
        uploadXML += '<OccurredOn>';
        uploadXML += xmlInsp.Inspection.OccurredOn;
        uploadXML += '</OccurredOn>';
        uploadXML += '<Type>';
        uploadXML += xmlInsp.Inspection.Type;
        uploadXML += '</Type>';
        uploadXML += '<SOCDetermination>';
        uploadXML += xmlInsp.Inspection.SOCDetermination;
        uploadXML += '</SOCDetermination>';
        uploadXML += '<Comment>';
        uploadXML += xmlInsp.Inspection.Comment;
        uploadXML += '</Comment>';
        uploadXML += '</Inspection>';

    }
    uploadXML += '</Inspections>';
    if (result.CMESubmittals.Violations.length > 0)
    {
        uploadXML += '<Violations>';
        for (var v in result.CMESubmittals.Violations)
        {
            var xmlViolation = result.CMESubmittals.Violations[v];
            uploadXML += '<Violation>';
            uploadXML += '<ViolationHeader>';
            uploadXML += '<RegulatorCode>';
            uploadXML += xmlViolation.Violation.ViolationHeader.RegulatorCode;
            uploadXML += '</RegulatorCode>';
            uploadXML +=  '<RegulatorActionDateTime>';
            uploadXML += toCersDateTime(dateAdd(null, 0)) || "";
            uploadXML += '</RegulatorActionDateTime>';
            uploadXML += '<CMEDataStatus>2</CMEDataStatus>';
            uploadXML += '</ViolationHeader>';
            uploadXML += '<InspectionRegulatorKey>';
            uploadXML += xmlViolation.Violation.InspectionRegulatorKey;
            uploadXML += '</InspectionRegulatorKey>';
            uploadXML += '<ViolationRegulatorKey>';
            uploadXML += xmlViolation.Violation.ViolationRegulatorKey;
            uploadXML+= '</ViolationRegulatorKey>';
            uploadXML += '<TypeID>';
            uploadXML += xmlViolation.Violation.TypeID;
            uploadXML += '</TypeID>';
            uploadXML += '<Class>';
            uploadXML += xmlViolation.Violation.Class;
            uploadXML += '</Class>';
            uploadXML += '<OccurredOn>';
            uploadXML += xmlViolation.Violation.OccurredOn;
            uploadXML += '</OccurredOn>';
            if (xmlViolation.Violation.ActualRTCOn)
            {
                uploadXML += '<ActualRTCOn>';
                uploadXML += xmlViolation.Violation.ActualRTCOn;
                uploadXML += '</ActualRTCOn>';
                // if (xmlViolation.Violation.ActualRTCQualifier)
                // {
                uploadXML += '<ActualRTCQualifier>';
                uploadXML += xmlViolation.Violation.ActualRTCQualifier;
                uploadXML += '</ActualRTCQualifier>';
                //}
            }
            else if (xmlViolation.Violation.ScheduledRTCOn)
            {
                uploadXML += '<ScheduledRTCOn>';
                uploadXML += xmlViolation.Violation.ScheduledRTCOn;
                uploadXML += '</ScheduledRTCOn>';
            }
            uploadXML += '<Comment>';
            uploadXML += xmlViolation.Violation.Comment;
            uploadXML += '</Comment>';
            uploadXML += '</Violation>'
        }
        uploadXML += '</Violations>';
    }
    uploadXML += '</ns2:CMESubmittals>';
    return uploadXML;
}
function nestSqlObject(sqlObject)
{
    var result = new Array();
    for (var n in sqlObject)
    {

        var inspSeqNbr = sqlObject[n].get("G6_ACT_NUM");
        if ("UPDATE".equals(sqlObject[n].get("UPDATE_TYPE")) && exists(inspSeqNbr, newInspectionIds))
            continue;
        if ("undefined".equals(typeof result[inspSeqNbr]))
        {
            result[inspSeqNbr] = new Array();
            var insp = new Object();
            var thisInsp = sqlObject[n];
            insp.recSubType = String(thisInsp.get("B1_PER_SUB_TYPE") || "");
            insp.tier = String(thisInsp.get("TIER") || "");
            insp.cersId = String(thisInsp.get("CERS_ID") || "");
            insp.altId = String(thisInsp.get("B1_ALT_ID") || "");
            insp.inspId = String(thisInsp.get("G6_ACT_NUM") || "");
            insp.legacyInspectionId = String(thisInsp.get("LEGACYINSPECTIONID") || "");
            insp.legacyViolationId  = String(thisInsp.get("LEGACYVIOLATIONID") || "");
            insp.inspResultDate = String(thisInsp.get("G6_COMPL_DD") || "");
            insp.inspType = String(thisInsp.get("G6_ACT_TYP") || "");
            insp.updateType = String(thisInsp.get("UPDATE_TYPE"));
            insp.resultComment = String(thisInsp.get("RESULT_COMMENT"));
            insp.checkLists = new Array();
            if ("NEW".equals(insp.updateType))
                newInspectionIds.push(insp.inspId);
            result[inspSeqNbr].push(insp);
        }
        var checkListId = sqlObject[n].get("GUIDESHEET_SEQ_NBR");
        if ("undefined".equals(typeof result[inspSeqNbr][0].checkLists[checkListId]))
        {
            var thisInsp = sqlObject[n];
            result[inspSeqNbr][0].checkLists[checkListId] = new Array();
            var checkList = new Object();
            checkList.checklistId = String(thisInsp.get("GUIDESHEET_SEQ_NBR") || "");
            checkList.checkListItems = new Array();

            result[inspSeqNbr][0].checkLists[checkListId].push(checkList);
        }
        var checkListItemId = sqlObject[n].get("GUIDE_ITEM_SEQ_NBR");
        if ("undefined".equals(typeof result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId]))
        {
            var thisInsp = sqlObject[n];
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId] = new Array();

            var checkListItem = new Object();
            checkListItem.checkListItemStatus = String(thisInsp.get("GUIDE_ITEM_STATUS") || "");
            checkListItem.checklistComment = String(thisInsp.get("GUIDE_ITEM_COMMENT") || "");
            checkListItem.checklistName = String(thisInsp.get("GUIDE_ITEM_TEXT") || "");
            checkListItem.returnToComplianceDate = String(thisInsp.get("RETURN_TO_COMPLIANCE_DATE") || "");
            checkListItem.complyBy = String(thisInsp.get("COMPLYBY") || "");
            checkListItem.vioDegree = String(thisInsp.get("VIODEGREE") || "");
            checkListItem.observDate = String(thisInsp.get("OBSERV_DATE") || "");
            checkListItem.returnToComplianceQual = String(thisInsp.get("RETCOMPQUALVALUE") || "");
            checkListItem.checkListItemId = checkListItemId;
            checkListItem.checkListNameArray = checkListItem.checklistName.split("-") || new Array();

            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId].push(checkListItem);
        }
        else
        {
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].checklistComment = thisInsp.get("GUIDE_ITEM_COMMENT") ? String(thisInsp.get("GUIDE_ITEM_COMMENT")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].checklistName = thisInsp.get("GUIDE_ITEM_TEXT") ? String(thisInsp.get("GUIDE_ITEM_TEXT")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].returnToComplianceDate = thisInsp.get("RETURN_TO_COMPLIANCE_DATE") ? String(thisInsp.get("RETURN_TO_COMPLIANCE_DATE")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].complyBy = thisInsp.get("COMPLYBY") ? String(thisInsp.get("COMPLYBY")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].vioDegree = thisInsp.get("VIODEGREE") ? String(thisInsp.get("VIODEGREE")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].observDate = thisInsp.get("OBSERV_DATE") ? String(thisInsp.get("OBSERV_DATE")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].returnToComplianceQual = thisInsp.get("RETCOMPQUALVALUE") ? String(thisInsp.get("RETCOMPQUALVALUE")) : true;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].checkListNameArray = checkListItem.checklistName.split("-") || new Array();
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].checkListItemId = checkListItemId;
            result[inspSeqNbr][0].checkLists[checkListId][0].checkListItems[checkListItemId][0].checkListItemStatus = String(thisInsp.get("GUIDE_ITEM_STATUS") || "");
        }
    }
    return result;

}
function newGuid()
{
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 0x3 | 0x8; return v.toString(16); });
}
function createCapAddress(targetCapID, addressModel)
{
    //prevent target CAP from having more than 1 primary address
    //addressModel = new com.accela.aa.aamain.address.AddressModel();

    var priAddrExists = hasPrimaryAddressInCap(targetCapID);
    if (priAddrExists)
    {
        addressModel.setPrimaryFlag("N");
    }
    addressModel.setCapID(targetCapID);
    addressModel.setServiceProviderCode(aa.getServiceProviderCode());
    addressModel.setAuditDate(new java.util.Date());
    addressModel.setAuditID(currentUserID);
    addressModel.setAuditStatus("A");
    //Create new address for cap.
    var createAddressResult = aa.address.createAddressWithAPOAttribute(targetCapID, addressModel);
    if(createAddressResult.getSuccess() && createAddressResult.getOutput() > 0)
    {
        logDebug("Successfully create address for cap(" + targetCapID + ")");
    }
    else
    {
        logDebug("ERROR: Failed create address for cap(" + targetCapID + "):" + createAddressResult.getErrorMessage());
    }
}
function validateParams()
{
    var exit = false;
    if (isBlank(downloadDays)){
        logDebug("DownloadDays is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    if (isBlank(uploadDays)){
        logDebug("UploadDays is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    if (isBlank(baseURL)){
        logDebug("BaseURL is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    if (isBlank(userName)){
        logDebug("UserName is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    if (isBlank(password)){
        logDebug("Password is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    if (isBlank(regulatorCode)){
        logDebug("RegulatorCode is a required batch parameter. Please configure before running batch job.");
        exit = true;
    }
    return !exit;
}
function toCersDateTime(dateTime)
{
    wait(1000);
    var result = "";
    var dTime = null;
    var now = new Date();
    if ("string".equals(typeof dateTime))
        dTime = new Date(new Date(dateTime).setHours(now.getHours(), now.getMinutes(), now.getSeconds()));
    else if ("object".equals(typeof dateTime))
        dTime = dateTime;
    result = dTime.getFullYear() + "-" + zeroPad(parseInt(dTime.getMonth()) + 1, 2) + "-" + zeroPad(dTime.getDate(), 2) + "T" + zeroPad(dTime.getHours(), 2) + ":" + zeroPad(dTime.getMinutes(), 2) + ":" + zeroPad(dTime.getSeconds(), 2);

    return result;
}
function toCersDate(dateTime)
{
    var result = "";
    var dTime = null;
    if ("string".equals(typeof dateTime))
        dTime = new Date(dateTime);
    else if ("object".equals(typeof dateTime))
        dTime = dateTime;
    result = dTime.getFullYear() + "-" + zeroPad(parseInt(dTime.getMonth()) + 1, 2) + "-" + zeroPad(dTime.getDate(), 2);
    return result;
}
function getCERSNewInspections(fromDate, toDate)
{
    var query = "SELECT 'NEW' AS UPDATE_TYPE, B.B1_ALT_ID, B.B1_APP_TYPE_ALIAS, B.B1_APPL_STATUS, B.B1_FILE_DD, B.B1_PER_GROUP, B.B1_PER_TYPE, B.B1_PER_SUB_TYPE, B.B1_PER_CATEGORY, ";
    query += "G.G6_ACT_DD, TO_CHAR(G.G6_COMPL_DD, 'MM/DD/YYYY') AS G6_COMPL_DD, G.G6_STATUS_DD, G.G6_REC_DD, G.G6_ACT_NUM, G.INSP_GROUP, G.G6_ACT_TYP, ";
    query += "GS.GUIDE_TYPE, GS.GUIDESHEET_ID, GS.GUIDESHEET_SEQ_NBR, GS.GUIDE_DESC, GS.GUIDE_GROUP, CMNT.TEXT AS RESULT_COMMENT, ";
    query += "GSITEM.GUIDE_ITEM_COMMENT, GSITEM.GUIDE_ITEM_SEQ_NBR, GSITEM.GUIDE_ITEM_STATUS, GSITEM.GUIDE_ITEM_TEXT, GSITEM.GUIDE_TYPE, ";
    query += "RETCOMPQUAL.ASI_COMMENT RETCOMPQUALVALUE, COMPLYBYASI.ASI_COMMENT COMPLYBY, DEGREEASI.ASI_COMMENT VIODEGREE, OBDATEASI.ASI_COMMENT OBSERV_DATE, RETCOMPDATEASI.ASI_COMMENT RETURN_TO_COMPLIANCE_DATE, LEGACYINSPECTIONASI.asi_comment AS LEGACYINSPECTIONID, LEGACYVIOLATIONASI.asi_comment AS LEGACYVIOLATIONID, CERS.B1_CHECKLIST_COMMENT AS CERS_ID, T.B1_CHECKLIST_COMMENT AS TIER ";
    query += "FROM G6ACTION G INNER JOIN B1PERMIT B ON G.B1_PER_ID1 = B.B1_PER_ID1 AND G.B1_PER_ID2 = B.B1_PER_ID2 AND G.B1_PER_ID3 = B.B1_PER_ID3 AND G.SERV_PROV_CODE = B.SERV_PROV_CODE ";
    query += "LEFT JOIN BCHCKBOX CERS ON CERS.SERV_PROV_CODE = B.SERV_PROV_CODE AND CERS.B1_PER_ID1 = B.B1_PER_ID1 AND CERS.B1_PER_ID2 = B.B1_PER_ID2 AND CERS.B1_PER_ID3 = B.B1_PER_ID3 AND CERS.B1_CHECKBOX_DESC = 'CERS_ID' ";
    query += "LEFT JOIN BCHCKBOX T ON T.SERV_PROV_CODE = B.SERV_PROV_CODE AND T.B1_PER_ID1 = B.B1_PER_ID1 AND T.B1_PER_ID2 = B.B1_PER_ID2 AND T.B1_PER_ID3 = B.B1_PER_ID3 AND T.B1_CHECKBOX_DESC = 'Tier' ";
    query += "LEFT JOIN GGUIDESHEET GS ON GS.B1_PER_ID1 = B.B1_PER_ID1 AND GS.B1_PER_ID2 = B.B1_PER_ID2 AND GS.B1_PER_ID3 = B.B1_PER_ID3 AND GS.G6_ACT_NUM = G.G6_ACT_NUM ";
    query += "LEFT JOIN GGUIDESHEET_ITEM GSITEM ON UPPER(GSITEM.GUIDE_ITEM_STATUS) = 'OUT' AND GSITEM.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND GSITEM.SERV_PROV_CODE = GS.SERV_PROV_CODE ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI COMPLYBYASI ON COMPLYBYASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND COMPLYBYASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND COMPLYBYASI.ASI_GRP_NAM = 'CUPA_LIST' AND COMPLYBYASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND COMPLYBYASI.ASI_NAME = 'Comply By' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI DEGREEASI ON DEGREEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND DEGREEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND DEGREEASI.ASI_GRP_NAM = 'CUPA_LIST' AND DEGREEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND DEGREEASI.ASI_NAME = 'Degree of Violation' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI OBDATEASI ON OBDATEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND OBDATEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND OBDATEASI.ASI_GRP_NAM = 'CUPA_LIST' AND OBDATEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND OBDATEASI.ASI_NAME = 'Observation Date' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI RETCOMPQUAL ON RETCOMPQUAL.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND RETCOMPQUAL.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND RETCOMPQUAL.ASI_GRP_NAM = 'CUPA_LIST' AND RETCOMPQUAL.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND RETCOMPQUAL.ASI_NAME = 'Return to Compliance Qualifier' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI RETCOMPDATEASI ON RETCOMPDATEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND RETCOMPDATEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND RETCOMPDATEASI.ASI_GRP_NAM = 'CUPA_LIST' AND RETCOMPDATEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND RETCOMPDATEASI.ASI_NAME = 'Return to Compliance Date' ";
    query += "LEFT JOIN ggdsheet_item_asi LEGACYINSPECTIONASI ON LEGACYINSPECTIONASI.guidesheet_seq_nbr = GS.guidesheet_seq_nbr AND LEGACYINSPECTIONASI.guideitem_seq_nbr = GSITEM.guide_item_seq_nbr AND LEGACYINSPECTIONASI.asi_grp_nam = 'CUPA_LIST' AND LEGACYINSPECTIONASI.asi_subgrp_nam = 'CUPA_CHECKLIST_ITEM' AND LEGACYINSPECTIONASI.asi_name = 'Legacy Inspection ID'";
    query += "LEFT JOIN ggdsheet_item_asi LEGACYVIOLATIONASI ON LEGACYVIOLATIONASI.guidesheet_seq_nbr = GS.guidesheet_seq_nbr  AND LEGACYVIOLATIONASI.guideitem_seq_nbr =  GSITEM.guide_item_seq_nbr   AND LEGACYVIOLATIONASI.asi_grp_nam = 'CUPA_LIST'  AND LEGACYVIOLATIONASI.asi_subgrp_nam = 'CUPA_CHECKLIST_ITEM' AND LEGACYVIOLATIONASI.asi_name = 'Legacy Violation ID'";
    query += "LEFT JOIN BACTIVITY_COMMENT CMNT ON CMNT.B1_PER_ID1 = B.B1_PER_ID1 AND CMNT.B1_PER_ID2 = B.B1_PER_ID2 AND CMNT.B1_PER_ID3 = B.B1_PER_ID3 AND G.G6_ACT_NUM = CMNT.G6_ACT_NUM AND CMNT.COMMENT_TYPE = 'Inspection Result Comment' ";
    query += "WHERE B.SERV_PROV_CODE = '$servprovcode$' ";
    query += "AND UPPER(G.G6_STATUS) <> 'SCHEDULED' ";
    //query += "AND UPPER(GSITEM.GUIDE_ITEM_STATUS) = 'OUT' ";
    query += "AND G.INSP_GROUP LIKE 'CUPA_%' AND UPPER(B.B1_PER_TYPE) = 'HAZMAT' AND G.G6_ACT_DD >= TO_DATE('$fromdate$', 'MM/DD/YYYY HH24:MI:SS') ";
    query += "AND G.G6_ACT_DD <= TO_DATE('$todate$', 'MM/DD/YYYY HH24:MI:SS') ";
    query += "AND B.REC_STATUS = 'A' AND G.REC_STATUS = 'A' AND GS.REC_STATUS = 'A'";
    query = query.replace("$servprovcode$", aa.getServiceProviderCode()).replace("$fromdate$", fromDate + " 00:00:00").replace("$todate$", toDate + " 23:59:59");
    var recordsResult = aa.db.select(query, new Array());
    var records = null;
    if (!recordsResult.getSuccess())
    {
        logDebug("Problem in selectRecords(): " + recordsResult.getErrorMessage());
        return false;
    }
    records = recordsResult.getOutput();
    if (records.size() > 0)
        return records.toArray();
    else
        return new Array();
}
function getCERSUpdatedInspections(fromDate, toDate)
{
    var query = "SELECT 'UPDATE' AS UPDATE_TYPE, B.B1_ALT_ID, B.B1_APP_TYPE_ALIAS, B.B1_APPL_STATUS, B.B1_FILE_DD, B.B1_PER_GROUP, B.B1_PER_TYPE, B.B1_PER_SUB_TYPE, B.B1_PER_CATEGORY, ";
    query += "G.G6_ACT_DD, TO_CHAR(G.G6_COMPL_DD, 'MM/DD/YYYY') AS G6_COMPL_DD, G.G6_STATUS_DD, G.G6_REC_DD, G.G6_ACT_NUM, G.INSP_GROUP, G.G6_ACT_TYP, ";
    query += "GS.GUIDE_TYPE, GS.GUIDESHEET_ID, GS.GUIDESHEET_SEQ_NBR, GS.GUIDE_DESC, GS.GUIDE_GROUP, CMNT.TEXT AS RESULT_COMMENT, ";
    query += "GSITEM.GUIDE_ITEM_COMMENT, GSITEM.GUIDE_ITEM_SEQ_NBR, GSITEM.GUIDE_ITEM_STATUS, GSITEM.GUIDE_ITEM_TEXT, GSITEM.GUIDE_TYPE, ";
    query += "RETCOMPQUAL.ASI_COMMENT RETCOMPQUALVALUE, COMPLYBYASI.ASI_COMMENT COMPLYBY, DEGREEASI.ASI_COMMENT VIODEGREE, OBDATEASI.ASI_COMMENT OBSERV_DATE, RETCOMPDATEASI.ASI_COMMENT RETURN_TO_COMPLIANCE_DATE, LEGACYINSPECTIONASI.asi_comment AS LEGACYINSPECTIONID, LEGACYVIOLATIONASI.asi_comment AS LEGACYVIOLATIONID, CERS.B1_CHECKLIST_COMMENT AS CERS_ID, T.B1_CHECKLIST_COMMENT AS TIER ";
    query += "FROM G6ACTION G INNER JOIN B1PERMIT B ON G.B1_PER_ID1 = B.B1_PER_ID1 AND G.B1_PER_ID2 = B.B1_PER_ID2 AND G.B1_PER_ID3 = B.B1_PER_ID3 AND G.SERV_PROV_CODE = B.SERV_PROV_CODE ";
    query += "LEFT JOIN BCHCKBOX CERS ON CERS.SERV_PROV_CODE = B.SERV_PROV_CODE AND CERS.B1_PER_ID1 = B.B1_PER_ID1 AND CERS.B1_PER_ID2 = B.B1_PER_ID2 AND CERS.B1_PER_ID3 = B.B1_PER_ID3 AND CERS.B1_CHECKBOX_DESC = 'CERS_ID' ";
    query += "LEFT JOIN BCHCKBOX T ON T.SERV_PROV_CODE = B.SERV_PROV_CODE AND T.B1_PER_ID1 = B.B1_PER_ID1 AND T.B1_PER_ID2 = B.B1_PER_ID2 AND T.B1_PER_ID3 = B.B1_PER_ID3 AND T.B1_CHECKBOX_DESC = 'Tier' ";
    query += "LEFT JOIN GGUIDESHEET GS ON GS.B1_PER_ID1 = B.B1_PER_ID1 AND GS.B1_PER_ID2 = B.B1_PER_ID2 AND GS.B1_PER_ID3 = B.B1_PER_ID3 AND GS.G6_ACT_NUM = G.G6_ACT_NUM ";
    query += "LEFT JOIN GGUIDESHEET_ITEM GSITEM ON UPPER(GSITEM.GUIDE_ITEM_STATUS) = 'OUT' AND GSITEM.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND GSITEM.SERV_PROV_CODE = GS.SERV_PROV_CODE ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI COMPLYBYASI ON COMPLYBYASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND COMPLYBYASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND COMPLYBYASI.ASI_GRP_NAM = 'CUPA_LIST' AND COMPLYBYASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND COMPLYBYASI.ASI_NAME = 'Comply By' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI DEGREEASI ON DEGREEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND DEGREEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND DEGREEASI.ASI_GRP_NAM = 'CUPA_LIST' AND DEGREEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND DEGREEASI.ASI_NAME = 'Degree of Violation' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI OBDATEASI ON OBDATEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND OBDATEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND OBDATEASI.ASI_GRP_NAM = 'CUPA_LIST' AND OBDATEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND OBDATEASI.ASI_NAME = 'Observation Date' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI RETCOMPQUAL ON RETCOMPQUAL.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND RETCOMPQUAL.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND RETCOMPQUAL.ASI_GRP_NAM = 'CUPA_LIST' AND RETCOMPQUAL.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND RETCOMPQUAL.ASI_NAME = 'Return to Compliance Qualifier' ";
    query += "LEFT JOIN GGDSHEET_ITEM_ASI RETCOMPDATEASI ON RETCOMPDATEASI.GUIDESHEET_SEQ_NBR = GS.GUIDESHEET_SEQ_NBR AND RETCOMPDATEASI.GUIDEITEM_SEQ_NBR = GSITEM.GUIDE_ITEM_SEQ_NBR AND RETCOMPDATEASI.ASI_GRP_NAM = 'CUPA_LIST' AND RETCOMPDATEASI.ASI_SUBGRP_NAM = 'CUPA_CHECKLIST_ITEM' AND RETCOMPDATEASI.ASI_NAME = 'Return to Compliance Date' ";
    query += "LEFT JOIN ggdsheet_item_asi LEGACYINSPECTIONASI ON LEGACYINSPECTIONASI.guidesheet_seq_nbr = GS.guidesheet_seq_nbr AND LEGACYINSPECTIONASI.guideitem_seq_nbr = GSITEM.guide_item_seq_nbr AND LEGACYINSPECTIONASI.asi_grp_nam = 'CUPA_LIST' AND LEGACYINSPECTIONASI.asi_subgrp_nam = 'CUPA_CHECKLIST_ITEM' AND LEGACYINSPECTIONASI.asi_name = 'Legacy Inspection ID'";
    query += "LEFT JOIN ggdsheet_item_asi LEGACYVIOLATIONASI ON LEGACYVIOLATIONASI.guidesheet_seq_nbr = GS.guidesheet_seq_nbr  AND LEGACYVIOLATIONASI.guideitem_seq_nbr =  GSITEM.guide_item_seq_nbr   AND LEGACYVIOLATIONASI.asi_grp_nam = 'CUPA_LIST'  AND LEGACYVIOLATIONASI.asi_subgrp_nam = 'CUPA_CHECKLIST_ITEM' AND LEGACYVIOLATIONASI.asi_name = 'Legacy Violation ID'";
    query += "LEFT JOIN BACTIVITY_COMMENT CMNT ON CMNT.B1_PER_ID1 = B.B1_PER_ID1 AND CMNT.B1_PER_ID2 = B.B1_PER_ID2 AND CMNT.B1_PER_ID3 = B.B1_PER_ID3 AND G.G6_ACT_NUM = CMNT.G6_ACT_NUM AND CMNT.COMMENT_TYPE = 'Inspection Result Comment' ";
    query += "WHERE B.SERV_PROV_CODE = '$servprovcode$' ";
    query += "AND UPPER(G.G6_STATUS) <> 'SCHEDULED' ";
    //query += "AND UPPER(GSITEM.GUIDE_ITEM_STATUS) = 'OUT' ";
    query += "AND G.INSP_GROUP LIKE 'CUPA_%' AND UPPER(B.B1_PER_TYPE) = 'HAZMAT' ";
    query += "AND G.G6_ACT_NUM IN (SELECT INSPECTION_ID FROM V_GUIDESHEET WHERE UPDATED_DATE >= TO_DATE('$fromdate$', 'MM/DD/YYYY HH24:MI:SS') AND UPDATED_DATE <= TO_DATE('$todate$', 'MM/DD/YYYY HH24:MI:SS')) ";
    query += "AND B.REC_STATUS = 'A' AND G.REC_STATUS = 'A' AND GS.REC_STATUS = 'A'";
    query = query.replace("$servprovcode$", aa.getServiceProviderCode()).replace("$fromdate$", fromDate + " 00:00:00").replace("$todate$", toDate + " 23:59:59");
    var recordsResult = aa.db.select(query, new Array());
    var records = null;
    if (!recordsResult.getSuccess())
    {
        logDebug("Problem in selectRecords(): " + recordsResult.getErrorMessage());
        return false;
    }
    records = recordsResult.getOutput();
    if (records.size() > 0)
        return records.toArray();
    else
        return new Array();
}
function removeCapAddresses(itemCap)
{
    try{
        capAddresses = null;
        var s_result = aa.address.getAddressByCapId(itemCap);
        if(s_result.getSuccess()) {
            capAddresses = s_result.getOutput();
            if (capAddresses == null || capAddresses.length == 0) {
                return false;
            }
            else {
                //process all cap addresses
                for (yy in capAddresses) {
                    aa.address.removeAddress(itemCap, capAddresses[yy].addressId);
                    logDebug("removing address: " + capAddresses[yy]);
                }
            }
        }
        else {
            //aa.print("ERROR: Failed to address: " + s_result.getErrorMessage());
        }
    }
    catch (err) {
        logDebug("A JavaScript Error occurred: function removeCapAddresses(): " + err.message);
    }
}
function doRestGet(url, queryString)
{
    var auth = null;
    if (arguments.length > 2)
        auth = arguments[2];

    var header = aa.httpClient.initPostParameters();
    header.put("Accept", "application/x-www-form-urlencoded");
    header.put("Content-Type", "application/x-www-form-urlencoded");
    header.put("Method", "GET");
    if (auth)
        header.put("Authorization", auth);
    var finalURL = url + queryString;
    //finalURL = encodeURIComponent(finalURL);

    // Send request
    //logDebug("Final URL is " + finalURL);
    var ws = aa.httpClient.get(finalURL, header);
    if (ws.getSuccess())
    {
        return ws.getOutput();
    }
    else
    {
        logDebug("doRestGet failed with error: " + ws.getErrorMessage());
        return null;
    }
}
function doRestPost(url, uploadXML, auth)
{
    //bodyParams = aa.util.newHashtable();
    //queryParams = aa.util.newHashtable();
    var result = null;
    var header = aa.httpClient.initPostParameters();
    header.put("Method", "POST");
    header.put("Content-Disposition", "form-data; name='xml'");
    header.put("Content-Type", "text/xml; charset=UTF-8");
    if (auth)
        header.put("Authorization", auth);

    // Send request
    logDebug("Now posting to " + url);
    var ws = aa.httpClient.post(url, header, uploadXML);
    if (ws.getSuccess())
    {
        var result = ws.getOutput();
        if (result)
        { return result; }
        else
        { logDebug("doRestPost returned empty"); return null; }
    }
    else
    {
        logDebug("doRestPost failed with error: " + ws.getErrorMessage());
        return null;
    }
}
function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}
function OBJtoXML(obj) {
    var xml = '';
    for (var prop in obj) {
        xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
        if (obj[prop] instanceof Array) {
            for (var array in obj[prop]) {
                xml += "<" + prop + ">";
                xml += OBJtoXML(new Object(obj[prop][array]));
                xml += "</" + prop + ">";
            }
        } else if (typeof obj[prop] == "object") {
            xml += OBJtoXML(new Object(obj[prop]));
        } else {
            xml += obj[prop];
        }
        xml += obj[prop] instanceof Array ? '' : "</" + prop + ">";
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
    return xml
}
function selectRecords()
{
    var query = "SELECT * FROM B1PERMIT WHERE B1_PER_GROUP = 'Licenses' AND B1_PER_TYPE = 'Real Estate' AND B1_PER_SUB_TYPE IN ('Broker Company', 'Broker Individual') AND B1_PER_CATEGORY = 'License' AND SERV_PROV_CODE = 'MILARA'";
    var recordsResult = aa.db.select(query, new Array());
    var records = null;
    if (!recordsResult.getSuccess())
    {
        logDebug("Problem in selectRecords(): " + recordsResult.getErrorMessage());
        return false;
    }
    records = recordsResult.getOutput();
    return records;
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
function removeContactsFromCap(recordCapId){
    var cons = aa.people.getCapContactByCapID(recordCapId).getOutput();
    for (x in cons){
        conSeqNum = cons[x].getPeople().getContactSeqNumber();
        if (conSeqNum){
            aa.people.removeCapContact(recordCapId, conSeqNum);
        }
    }
}
function createSimpleCapContact(capContact)
{
    var itemCap = capId;
    var templateName = ""
    if (arguments.length > 1 && arguments[1])
        itemCap = arguments[1];
    if (arguments.length > 2 && arguments[2])
        templateName = arguments[2];
    var template = aa.genericTemplate.getTemplateStructureByGroupName(templateName).getOutput();

    var r = aa.people.createCapContact(capContact);
    if (r.getSuccess())
    { logDebug(itemCap.getCustomID() + ": Successfully created capContact"); return true;}
    else
    { logDebug(itemCap.getCustomID() + ": Problem creating capContact: " + capContact.getErrorMessage()); return false; }
}
function getNodes(xml, nName)
{
    var result = new Array();
    var fValue = "";
    var startTag = "<"+nName+">";
    var endTag = "</"+nName+">";
    var startPos = 0;
    var endPos = 0;
    while (true)
    {
        startPos = xml.indexOf(startTag, startPos);
        if (startPos >= 0)
            startPos = startPos + startTag.length;
        else break;
        endPos = xml.indexOf(endTag, startPos);

        // make sure startPos and endPos are valid before using them
        if (startPos > 0 && startPos < endPos)
        {
            fValue = xml.substring(startPos,endPos);
            result.push(unescape(fValue));
            startPos = endPos;
        }
    }
    return result;
}
function updateAddressFromParent() {
    var pcapId = getParent();
    if (pcapId) {
        if (appTypeString == "EnvHealth/Hazmat/Business Plan/Permit" || appTypeString == "EnvHealth/Hazmat/APSA/Permit"
            || appTypeString == "EnvHealth/Hazmat/CalARP/Permit" || appTypeString == "EnvHealth/Hazmat/Hazwaste Generator/Permit"
            || appTypeString == "EnvHealth/Hazmat/Large Quantity Generator/Permit" || appTypeString == "EnvHealth/Hazmat/Recyclable Materials/Permit"
            || appTypeString == "EnvHealth/Hazmat/Tiered Permitting/Permit" || appTypeString == "EnvHealth/Hazmat/UST/Permit") {
            deleteCopyAddresses(pcapId, capId);
        }
    }
}
function updateContactsFromParent() {
    var pcapId = getParent();
    if (pcapId) {
        if (appTypeString == "EnvHealth/Hazmat/Business Plan/Permit" || appTypeString == "EnvHealth/Hazmat/APSA/Permit"
            || appTypeString == "EnvHealth/Hazmat/CalARP/Permit" || appTypeString == "EnvHealth/Hazmat/Hazwaste Generator/Permit"
            || appTypeString == "EnvHealth/Hazmat/Large Quantity Generator/Permit" || appTypeString == "EnvHealth/Hazmat/Recyclable Materials/Permit"
            || appTypeString == "EnvHealth/Hazmat/Tiered Permitting/Permit" || appTypeString == "EnvHealth/Hazmat/UST/Permit") {
            copyContactsWithRemove(pcapId, capId);
        }
    }
}
function removeContactsFromCap(recordCapId) {
    var cons = aa.people.getCapContactByCapID(recordCapId).getOutput();
    for (x in cons) {
        conSeqNum = cons[x].getPeople().getContactSeqNumber();
        if (conSeqNum) {
            aa.people.removeCapContact(recordCapId, conSeqNum);
        }
    }
}
function copyContactsWithRemove(pFromCapId, pToCapId) {
    //Copies all contacts from pFromCapId to pToCapId
    //07SSP-00037/SP5017
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    removeContactsFromCap(pToCapId);

    var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
    var copied = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var newContact = Contacts[yy].getCapContactModel();
            var fullname = "";
            newContact.setCapID(vToCapId);
            if (newContact.getFirstName() != null) {
                fullname += newContact.getFirstName();
                if (newContact.getLastName != null) { fullname += " " + newContact.getLastName(); }
            }
            else if (newContact.getLastName != null) { fullname = newContact.getLastName(); }
            newContact.setFullName(fullname);
            aa.people.createCapContact(newContact);
            copied++;
            logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
}
function deleteCopyAddresses(pFromCapId, pToCapId) {
    //Copies all property addresses from pFromCapId to pToCapId
    //If pToCapId is null, copies to current CAP
    //
    // modified original function to delete all of the addresses
    // on the target CAP first
    logDebug("Inside deletCopyAddress Function");
    if (pToCapId == null) {
        var vToCapId = capId;
        logDebug("PTOCAOD NULL" + vToCapId);
    } else {
        var vToCapId = pToCapId;
        logDebug("PTOCAOD NOT NULL" + vToCapId);
    }
    //check if target CAP has primary address
    var capAddressResult = aa.address.getAddressByCapId(vToCapId);
    logDebug("Cap Addresses" + capAddressResult.getSuccess());
    if (capAddressResult.getSuccess()) {
        Address = capAddressResult.getOutput();
        logDebug("Address" + Address);
        for (yy in Address) {
            addrOnTarget = Address[yy];
            logDebug("Address On Target" + addrOnTarget);
            delResult = aa.address.removeAddress(vToCapId, addrOnTarget.getAddressId());
            logDebug("Delete Result" + delResult.getSuccess());
            if (!delResult.getSuccess()) {
                logDebug("Error removing address on target CAP " + delResult.getErrorMessage());
                logDebug("Errors Out");
            }
        }
    } else {
        logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
        return false;
    };
    //logDebug("pFromCapId=" + pFromCapId + "pToCapId=" + pToCapId);
    //get addresses from originating CAP
    var capAddressResult = aa.address.getAddressWithAttributeByCapId(pFromCapId);
    var copied = 0;
    if (capAddressResult.getSuccess()) {
        Address = capAddressResult.getOutput();
        for (yy in Address) {
            logDebug("Address Info Test" + Address[yy]);
            newAddress = Address[yy];
            newAddress.setCapID(vToCapId);
            aa.address.createAddressWithAPOAttribute(vToCapId, newAddress);
            logDebug("Copied address from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
            copied++;
        }
    } else {
        logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
        return false;
    }
    return copied;
}
function runASAForCapId(vCapId) {

    //Set Variables
    //Save the existing system variables so that they can be reset after the function
    var pvScriptName = vScriptName;
    var pvEventName = vEventName;
    var pprefix = ((typeof prefix === 'undefined') ? null : prefix);
    var pcapId = capId;
    var pcap = cap;
    var pcapIDString = capIDString;
    var pappTypeResult = appTypeResult;
    var pappTypeString = appTypeString;
    var pappTypeArray = appTypeArray;
    var pcapName = capName;
    var pcapStatus = capStatus;
    var pfileDateObj = fileDateObj;
    var pfileDate = fileDate;
    var pfileDateYYYYMMDD = fileDateYYYYMMDD;
    var pparcelArea = parcelArea;
    var pestValue = estValue;
    var pbalanceDue = balanceDue;
    var phouseCount = houseCount;
    var pfeesInvoicedTotal = feesInvoicedTotal;
    var pcapDetail = capDetail;
    var pAInfo = AInfo;
    var ppartialCap;
    if (typeof(partialCap) !== "undefined") {
        ppartialCap = partialCap;
    } else {
        ppartialCap = null;
    }
    var pparentCapId;
    if (typeof(parentCapId) !== "undefined") {
        pparentCapId = parentCapId;
    } else {
        pparentCapId = null;
    }
    var pCreatedByACA;
    if (typeof(CreatedByACA) !== "undefined") {
        pCreatedByACA = CreatedByACA;
    } else {
        CreatedByACA = 'N';
    }

    //Run simulate the WTUA event for the child record
    logDebug("<br>***************************************")
    logDebug("***Begin ASA Sim");

    vScriptName = "function: runASAForCapId";
    vEventName = "ApplicationSubmitAfter";

    prefix = 'ASA';

    //Clear global variables so that they can be set with the supplied
    capId = null;
    cap = null;
    capIDString = "";
    appTypeResult = null;
    appTypeString = "";
    appTypeArray = [];
    capName = null;
    capStatus = null;
    fileDateObj = null;
    fileDate = null;
    fileDateYYYYMMDD = null;
    parcelArea = 0;
    estValue = 0;
    balanceDue = 0;
    houseCount = 0;
    feesInvoicedTotal = 0;
    capDetail = "";
    AInfo = [];
    partialCap = false;
    parentCapId = null;
    CreatedByACA = 'N';

    //Set capId to the vCapId variable provided
    var holdId = capId;
    capId = vCapId;
    //Update global variables based on child capId
    if (capId !== null) {
        parentCapId = pcapId;
        servProvCode = capId.getServiceProviderCode();
        capIDString = capId.getCustomID();
        cap = aa.cap.getCap(capId).getOutput();
        if (!cap)
            return false;
        appTypeResult = cap.getCapType();
        appTypeString = appTypeResult.toString();
        appTypeArray = appTypeString.split("/");
        if (appTypeArray[0].substr(0, 1) != "_") {
            var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput();
            if (currentUserGroupObj)
                currentUserGroup = currentUserGroupObj.getGroupName();
        }
        capName = cap.getSpecialText();
        capStatus = cap.getCapStatus();
        partialCap = !cap.isCompleteCap();
        fileDateObj = cap.getFileDate();
        fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
        fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(), fileDateObj.getDayOfMonth(), fileDateObj.getYear(), "YYYY-MM-DD");
        var valobj = aa.finance.getContractorSuppliedValuation(capId, null).getOutput();
        if (valobj.length) {
            estValue = valobj[0].getEstimatedValue();
            calcValue = valobj[0].getCalculatedValue();
            feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
        }

        var capDetailObjResult = aa.cap.getCapDetail(capId);
        if (capDetailObjResult.getSuccess()) {
            capDetail = capDetailObjResult.getOutput();
            houseCount = capDetail.getHouseCount();
            feesInvoicedTotal = capDetail.getTotalFee();
            balanceDue = capDetail.getBalance();
        }
        loadAppSpecific(AInfo);
        loadTaskSpecific(AInfo);
        loadParcelAttributes(AInfo);
        loadASITables();

        CreatedByACA = 'N';

        logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
        logDebug("capId = " + capId.getClass());
        logDebug("cap = " + cap.getClass());
        logDebug("currentUserID = " + currentUserID);
        logDebug("currentUserGroup = " + currentUserGroup);
        logDebug("systemUserObj = " + systemUserObj.getClass());
        logDebug("appTypeString = " + appTypeString);
        logDebug("capName = " + capName);
        logDebug("capStatus = " + capStatus);
        logDebug("fileDate = " + fileDate);
        logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
        logDebug("sysDate = " + sysDate.getClass());
        logDebug("parcelArea = " + parcelArea);
        logDebug("estValue = " + estValue);
        logDebug("calcValue = " + calcValue);
        logDebug("feeFactor = " + feeFactor);

        logDebug("houseCount = " + houseCount);
        logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
        logDebug("balanceDue = " + balanceDue);
    }

    //Run WTUA scripts for the variables provided
    doScriptActions();

    //Reset global variables to the original records
    vScriptName = pvScriptName;
    vEventName = pvEventName;
    prefix = pprefix;
    capId = pcapId;
    cap = pcap;
    capIDString = pcapIDString;
    appTypeResult = pappTypeResult;
    appTypeString = pappTypeString;
    appTypeArray = pappTypeArray;
    capName = pcapName;
    capStatus = pcapStatus;
    fileDateObj = pfileDateObj;
    fileDate = pfileDate;
    fileDateYYYYMMDD = pfileDateYYYYMMDD;
    parcelArea = pparcelArea;
    estValue = pestValue;
    feesInvoicedTotal = pfeesInvoicedTotal;
    balanceDue = pbalanceDue;
    houseCount = phouseCount;
    feesInvoicedTotal = pfeesInvoicedTotal;
    capDetail = pcapDetail;
    AInfo = pAInfo;
    partialCap = ppartialCap;
    parentCapId = pparentCapId;
    CreatedByACA = pCreatedByACA;

    logDebug("***End ASA Sim");
    logDebug("<br>***************************************")

}
function lookupActiveOnly(stdChoice,stdValue)
{
    var strControl = null;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

    if (bizDomScriptResult.getSuccess())
    {
        var bizDomScriptObj = bizDomScriptResult.getOutput();
        if ("A".equals(bizDomScriptObj.getAuditStatus()))
        {
            return strControl = "" + bizDomScriptObj.getDescription();
        }
    }
    else
    {
        logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
    }
    return null;
}
function syncChildCERSRecord(pCapId, cCapId) {
    copyMatchingCustomFields(pCapId, cCapId, false);
    copyContactsWithRemove(pCapId, cCapId);
    deleteCopyAddresses(pCapId, cCapId);

    var appName = getAppName(pCapId)

    editAppName(appName, cCapId);
    updateShortNotes(appName, cCapId);

    aa.cap.copyCapDetailInfo(pCapId, cCapId);
    aa.cap.copyCapWorkDesInfo(pCapId, cCapId);

    editAppSpecific("DateDownloaded", dateAdd(null, 0), cCapId);
    editAppSpecific("SubmittedOn", dateAdd(null, 0), cCapId);
}
function copyMatchingCustomFields(fcapId, tcapId, useSubgroupName) {
    //optional ignoreASI
    var ignoreASI = new Array();
    var mapArray = null;
    if (arguments.length > 3) {
        ignoreASI = arguments[3];
    }

    //optional ignoreASISubGroup
    var ignoreASISubGroup = new Array();
    if (arguments.length > 4) {
        ignoreASISubGroup = arguments[4];
    }

    //optional map
    if (arguments.length > 5) mapArray = arguments[5];

    // get cap ASIs
    var from_AppSpecInfoResult = aa.appSpecificInfo.getByCapID(fcapId);
    if (from_AppSpecInfoResult.getSuccess()) {
        var from_AppspecObj = from_AppSpecInfoResult.getOutput();
    } else {
        logDebug("**ERROR: getting app specific info for Cap : " + from_AppSpecInfoResult.getErrorMessage());
        return null;
    }

    for (i in from_AppspecObj) {
        var itemName = from_AppspecObj[i].getCheckboxDesc();
        var subGroup = from_AppspecObj[i].getCheckboxType();

        if (exists(itemName, ignoreASI) || exists(subGroup, ignoreASISubGroup)) {
            continue;
        }

        var itemValue = from_AppspecObj[i].getChecklistComment();
        var itemGroup = useSubgroupName ? from_AppspecObj[i].getCheckboxType() : null;

        //loop through the map first
        if (mapArray) {
            for (var m in mapArray) {
                var thisMap = mapArray[m];
                if (thisMap.fromField == itemName) {
                    var to_AppSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(tcapId, thisMap.toField, itemValue, itemGroup);
                    if (to_AppSpecInfoResult.getSuccess()) {
                        logDebug("INFO: " + (itemGroup ? itemGroup + "." : "") + thisMap.toField + " was updated.");
                    } else {
                        logDebug("WARNING: " + (itemGroup ? itemGroup + "." : "") + thisMap.toField + " was not updated: " + to_AppSpecInfoResult.getErrorMessage());
                    }
                }
            }
        }

        // Edit cap ASIs
        var to_AppSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(tcapId, itemName, itemValue, itemGroup);
        if (to_AppSpecInfoResult.getSuccess()) {
            logDebug("INFO: " + (itemGroup ? itemGroup + "." : "") + itemName + " was updated.");
        } else {
            logDebug("WARNING: " + (itemGroup ? itemGroup + "." : "") + itemName + " was not updated: " + to_AppSpecInfoResult.getErrorMessage());
        }
    }

    return true;
}
function getAppName()
{
    var itemCap = capId;
    if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

    capResult = aa.cap.getCap(itemCap)

    if (!capResult.getSuccess())
    { logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()); return false }

    capModel = capResult.getOutput().getCapModel()

    return capModel.getSpecialText()
}
function parseAddressString(addressString, rule) {
    var functTitle = "parseAddressString(): ";
    var addresses = [];

    var parsedAddress = {
        houseNum: 0,
        preDir: "",
        streetName: "",
        streetType: "",
        postDir: "",
        unit: "",
        cityName: "",
        state: "",
        zipCode: "",
        country: "",
        get fullString() {
            var unitStr = "";
            var preDirStr = "";
            var postDirStr = "";
            var strTypeStr = "";
            var counter = 0;

            if (this.unit != "") unitStr = " " + this.unit;
            if (this.preDir != "") preDirStr = " " + this.preDir;
            if (this.postDir != "") postDirStr = " " + this.postDir;
            if (this.streetType != "") strTypeStr = " " + this.streetType;

            var tmpString = this.houseNum + preDirStr + " " + this.streetName + strTypeStr + postDirStr + unitStr + ", " + this.cityName + ", " + this.state + " " + this.zipCode + ", " + this.country;
            tmpString = tmpString.trim();
            tmpString = tmpString.replace(', ,', ',');
            while (tmpString.lastIndexOf(',') == tmpString.length - 1) {
                tmpString = tmpString.slice(0, tmpString.length - 1);
                tmpString = tmpString.trim();
                counter++;
                if (counter > 10) break;
            }
            return tmpString;
        }
    };

    var parseStreetType = true;
    var typeArray = [];

    if (rule) {
        if (rule.Address_Parsing) {
            if (typeof rule.Address_Parsing.Street_Type != "undefined") {
                parseStreetType = rule.Address_Parsing.Street_Type;
            }
            if (typeof rule.Address_Parsing.AddressTypes != "undefined") {
                typeArray = rule.Address_Parsing.AddressTypes;
            } else {
                typeArray = ["ALY", "AVE", "BLVD", "BYP", "CIR", "CT", "CV", "DR", "FR", "HWY", "LN", "LOOP", "MALL", "PL", "PLZ", "RD", "SQ", "ST", "TER", "WAY"];
            }
        }

    }

    logDebug(functTitle + "input parameter: " + addressString);

    //split string on commas for different parts of address
    var addrParts = addressString.split(',');

    //split first address part on whitespace for street address parts
    var strAddrParts = addrParts[0].split(' ');

    //get house number
    if (!isNaN(strAddrParts[0])) {
        //logDebug(functTitle + "The first part of the address array is a number.");
        parsedAddress.houseNum = parseInt(strAddrParts[0]) || 0;
        strAddrParts = spliceFn(strAddrParts, 0);
    }
    logDebug(functTitle + " houseNum: " + parsedAddress.houseNum);

    //get unit number if it is the last number in the string array
    if (!isNaN(strAddrParts[strAddrParts.length - 1])) {
        //logDebug(functTitle + "The last part of the address array is a number. Assuming it is a unit number.");
        parsedAddress.unit = strAddrParts[strAddrParts.length - 1];
        strAddrParts = spliceFn(strAddrParts, strAddrParts.length - 1);
    }
    logDebug(functTitle + "unit: " + parsedAddress.unit);

    var arrayPos;
    //get postDirectional if it matches the list of values and is the last position
    var directionalArray = ["S", "N", "E", "W", "SE", "SW", "NE", "NW", "SSE", "SSW", "NNE", "NNW"];
    for (var j = 0; j < directionalArray.length; j++) {
        arrayPos = strAddrParts.length - 1;
        if (directionalArray[j] == strAddrParts[arrayPos]) {
            parsedAddress.postDir = directionalArray[j];
            strAddrParts = spliceFn(strAddrParts, arrayPos);
        }
    }
    logDebug(functTitle + "postDir: " + parsedAddress.postDir);

    //get preDirectional if it matches the list of values and is the first position
    for (var k = 0; k < directionalArray.length; k++) {
        arrayPos = 0;
        if (directionalArray[k] == strAddrParts[arrayPos]) {
            parsedAddress.preDir = directionalArray[k];
            strAddrParts = spliceFn(strAddrParts, arrayPos);
        }
    }
    logDebug(functTitle + "preDir: " + parsedAddress.preDir);

    if (parseStreetType) {
        //get street type if it matches list of street types
        var typeArrayLen = typeArray.length;
        var strAddrPartsLen = strAddrParts.length - 1;
        for (var i = 0; i < typeArrayLen; i++) {
            if (typeArray[i] == strAddrParts[strAddrPartsLen].toUpperCase()) {
                parsedAddress.streetType = typeArray[i];
                strAddrParts = spliceFn(strAddrParts, strAddrPartsLen);
                break;
            }
        }
    }
    logDebug(functTitle + "streetType: " + parsedAddress.streetType);

    //join the remaining street part values for the street name
    parsedAddress.streetName = strAddrParts.join(' ').toUpperCase().trim();
    logDebug(functTitle + "streetName: " + parsedAddress.streetName);

    //get city
    parsedAddress.cityName = addrParts[1] || "";
    parsedAddress.cityName = parsedAddress.cityName.toUpperCase().trim();
    logDebug(functTitle + " cityName: " + parsedAddress.cityName);

    //split the state position and check if the last is numeric. If so, add it as the zip code
    //then join the remaining as the state value
    if (typeof addrParts[2] !== "undefined") {
        var addrParts2 = addrParts[2].split(' ');

        if (!isNaN(addrParts2[addrParts2.length - 1])) {
            parsedAddress.zipCode = addrParts2[addrParts2.length - 1];
            addrParts2 = spliceFn(addrParts2, addrParts2.length - 1);
        }
        logDebug(functTitle + "zipCode: " + parsedAddress.zipCode);

        parsedAddress.state = addrParts2.join(' ').toUpperCase().trim();
        logDebug(functTitle + " state: " + parsedAddress.state);
    } else {
        parsedAddress.zipCode = "";
        parsedAddress.state = "";
    }

    var country = addrParts[3] || "";
    parsedAddress.country = country.toUpperCase().trim();
    logDebug(functTitle + " country: " + country);

    addresses.push(parsedAddress);

    //remove country
    var parsed1 = Object.create(parsedAddress);
    parsed1.country = "";
    addresses.push(parsed1);

    //remove zipCode
    var parsed2 = Object.create(parsed1);
    parsed2.zipCode = "";
    addresses.push(parsed2);

    //remove state
    var parsed3 = Object.create(parsed2);
    parsed3.state = "";
    addresses.push(parsed3);

    //remove city
    var parsed4 = Object.create(parsed3);
    parsed4.cityName = "";
    addresses.push(parsed4);

    //remove unit
    var parsed5 = Object.create(parsed4);
    parsed5.unit = "";
    addresses.push(parsed5);

    //remove postDir
    var parsed6 = Object.create(parsed5);
    parsed6.postDir = "";
    addresses.push(parsed6);

    //remove preDir
    var parsed7 = Object.create(parsed6);
    parsed7.preDir = "";
    addresses.push(parsed7);

    //remove streetType
    var parsed8 = Object.create(parsed7);
    parsed8.streetType = "";
    addresses.push(parsed8);

    return addresses;
}
function spliceFn(array, position) {
    var arrayCount = array.length;
    var newArray = [];
    for (var i = 0; i < arrayCount; i++) {
        if (i == position) {
            logDebug("spliceFn(): Removed " + array[i] + " from array.");
        } else {
            newArray.push(array[i]);
        }
    }
    return newArray;
}
//#endregion
function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
        end = new Date().getTime();
    }
}