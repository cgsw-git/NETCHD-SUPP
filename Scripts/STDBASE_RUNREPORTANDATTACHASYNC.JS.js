/*------------------------------------------------------------------------------------------------------/
| Program : STDBASE_RUNREPORTANDATTACHASYNC.js
| Events  : ApplicatonSubmitAfter, WorkflowTaskUpdateAfter, InspectionScheduleAfter, InspectionResultSubmitAfter
|
| Usage   : Run report and attach async.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/

// ********************************************************************************************************************************
//	Env Paramters Below
// ********************************************************************************************************************************
var servProvCode = aa.env.getValue("ServProvCode");			// Service Provider Code
var capIDString = aa.env.getValue("CustomCapId");			// Custom CAP ID
var vCapId = aa.env.getValue("CapID");
var reportName = aa.env.getValue("ReportName"); 			// Report Name
var reportParameters = aa.env.getValue("ReportParameters");	// Report Paramters, it should be HashTable
var reportAttach = aa.env.getValue("ReportAttach");			// Attach the report to the inspection
var module = aa.env.getValue("Module");						// Module Name
var reportUser = aa.env.getValue("ReportUser"); 			// AA User
var waitTime = aa.env.getValue("WaitTime");
var vEventName = aa.env.getValue("EventName");
var controlString = vEventName;
var showMessage = false;
var showDebug = false;
var message = "";
var debug = "";
var error = "";
var br = "<BR/>";
var capStatus = "";
var wfTask = "";
var wfStatus = "";
var inspGroup = "";
var inspType = "";
var inspResult = "";

var testMode = false;


var currentUserID = aa.env.getValue("CurrentUserID");
if (matches(currentUserID, null, "")) {
    currentUserID = "ADMIN";
}

if (currentUserID.indexOf("PUBLICUSER") == 0) {
    publicUserID = currentUserID;
    currentUserID = "ADMIN";
    publicUser = true;
}

if (matches(servProvCode, null, "")) {
    servProvCode = aa.getServiceProviderCode();
}

var capId

var capIDArray = vCapId.toString().split("-");
if (capIDArray && capIDArray[0]) {
    var id1 = capIDArray[0];
    var id2 = capIDArray[1];
    var id3 = capIDArray[2];
    capId = aa.cap.getCapID(id1, id2, id3).getOutput();
}

if (capId == null) {
    capId = aa.cap.getCapID(capIDString).getOutput();
}

aa.env.setValue("PermitId1", capId.getID1());
aa.env.setValue("PermitId2", capId.getID2());
aa.env.setValue("PermitId3", capId.getID3());

handleEnvParamters();

if (matches(waitTime, null, undefined, "")) { waitTime = 10000; }
else { waitTime = parseInt(waitTime); }


var acaURLDefault = lookup("ACA_CONFIGS", "ACA_SITE");
if (!matches(acaURLDefault, null, undefined, "")) {
    acaURLDefault = acaURLDefault.substr(0, acaURLDefault.toUpperCase().indexOf("/ADMIN"));
}
else {
    acaURLDefault = null;
}

var acaURL = acaURLDefault;



var scriptSuffix = "INSPECTION_AUTOMATION";


function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode) servProvCode = aa.getServiceProviderCode();
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

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
eval(getScriptText("INCLUDES_CUSTOM", null, true));




//------------ to here




try {
    var rParams = aa.util.newHashMap();
    if (reportParameters && !reportParameters.getClass) {
        rParams = convertStringToHashMap(String(reportParamters));
    }
    else if (reportParameters && reportParameters.getClass().toString() == "class java.util.HashMap") {
        rParams = reportParameters;
    }

    var eParams = aa.util.newHashtable();


    capStatus = getHashTableParameter(eParams, "$$recordStatus$$");

    if (controlString.indexOf("InspectionSchedule") > -1) {
        inspGroup = getHashTableParameter(eParams, "$$inspGroup$$");
        inspType = getHashTableParameter(eParams, "$$inspType$$");
    }
    if (controlString.indexOf("InspectionResult") > -1) {
        inspResult = getHashTableParameter(eParams, "$$inspResult$$");
        inspGroup = getHashTableParameter(eParams, "$$inspGroup$$");
        inspType = getHashTableParameter(eParams, "$$inspType$$");
    }
    if (controlString.indexOf("Workflow") > -1) {
        wfTask = getHashTableParameter(eParams, "$$wfTask$$");
        wfStatus = getHashTableParameter(eParams, "$$wfStatus$$");
    }

    asyncDebug("Starting async script. Waiting " + waitTime + " milliseconds to execute...");
    wait(waitTime);  //7 seconds in milliseconds
    asyncDebug("Done waiting, it's been: " + waitTime + "milliseconds");

    // ********************************************************************
    printEnv();
    // ***********************************************************************


    // This should be included in all Configurable Scripts
    eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
    var settingsArray = [];
    var vIsConfigurableScript = isConfigurableScript(settingsArray, scriptSuffix);

    if (vIsConfigurableScript) {

        for (s in settingsArray) {

            var rules = settingsArray[s];

            //Execute PreScript
            if (!isEmptyOrNull(rules.preScript)) {
                eval(getScriptText(rules.preScript));
            }

            if (cancelCfgExecution) {
                asyncDebug("**WARN STDBASE Script [" + scriptSuffix + "] canceled by cancelCfgExecution");
                cancelCfgExecution = false;
                continue;
            }



            //Execute Post Script
            if (!isEmptyOrNull(rules.postScript)) {
                eval(getScriptText(rules.postScript));
            }
        }



    }

} catch (err) {
    asyncDebug("**ERROR: Exception while verification the rules for " + scriptSuffix + ". Error: " + err);
    asyncDebug("(RUNREPORTANDATTACHASYNC) A JavaScript Error occured: " + err.message + " at line " + err.lineNumber + " stack: " + err.stack);

}


// ======================================================================
//
//					Internal Function
//
// ======================================================================

//function asyncDebug(dstr) {
//	debug += dstr + br;	
//}

function getHashTableParameter(pamaremeters, key) {
    var value = "";
    if (key) {
        value = pamaremeters.get(key);
    }
    else {
        asyncDebug("(getHashTableParameter) No Key Provided")
    }
    return value;
}

function generateReportLocal(itemCap, reportName, module, parameters, eParamsHash, acaURL, saveToRecord) {

    //returns the report file which can be attached to an inspection.
    var user = "ADMIN";   // Setting the User Name

    var bSaveToRecord = true;

    if (matches(saveToRecord, false, "false", "N")) {
        bSaveToRecord = false;
    }
    var report
    var reportInfoModel = aa.reportManager.getReportInfoModelByName(reportName);

    if (reportInfoModel && reportInfoModel.getSuccess()) {
        report = reportInfoModel.getOutput();
    }

    if (report) {
        report.setModule(module);
        report.setReportParameters(parameters);

        if (bSaveToRecord) {
            report.setCapId(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());
            report.getEDMSEntityIdModel().setAltId(itemCap.getCustomID());
        }


        var permit = aa.reportManager.hasPermission(reportName, user);

        if (permit.getOutput().booleanValue()) {

            var reportResult = aa.reportManager.getReportResult(report);
            if (reportResult) {

                reportOutput = reportResult.getOutput();
                if (reportOutput) {

                    if (eParamsHash != null && acaURL != null) {

                        var reportFileName = reportOutput.getName();
                        getACADocumentNameURLParams4Notification(eParamsHash, reportFileName, acaURL);
                    }

                    var reportFile = aa.reportManager.storeReportToDisk(reportOutput);
                    reportFile = reportFile.getOutput();
                    return reportFile;
                } else {
                    asyncDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
                    return false;
                }
            } else {
                asyncDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
                return false;
            }
        } else {
            asyncDebug("You have no permission.");
            return false;
        }
    } else {
        asyncDebug("System failed get report: " + reportName);
        return false;
    }
}


function runReport4InspectionLocal(itemCap, reportName, rParams, eParams, module, acaURL, saveToRecord) {

    var reportSent = false;

    var rFile;
    var rFiles = new Array();
    rFile = generateReportLocal(itemCap, reportName, module, rParams, eParams, acaURL, saveToRecord);
    if (rFile) {
        rFiles.push(rFile);
        reportSent = true;
    } else {
        asyncDebug("(runReport4Inspection) Unable to generate report - sending email without report")
        reportSent = false;
    }
    return reportSent;
}

/**
 * Runs a report with any specified parameters and attaches it to the record
 *
 * @example
 *		runReportAttach(capId,"ReportName","altid",capId.getCustomID(),"months","12");
 *		runReportAttach(capId,"ReportName",paramHashtable);
 * @param capId
 *			itemCapId - capId object 
 * @param {report parameter pairs} or {hashtable}
 *			optional parameters are report parameter pairs or a parameters hashtable
 * @returns {boolean}
 *			if the report was generated and attached return true
 *
 */
function runReportAttach(itemCapId, aaReportName) {

    var reportName = aaReportName;

    reportResult = aa.reportManager.getReportInfoModelByName(reportName);

    if (!reportResult.getSuccess()) { asyncDebug("**WARNING** couldn't load report " + reportName + " " + reportResult.getErrorMessage()); return false; }

    var report = reportResult.getOutput();

    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    itemAppTypeResult = itemCap.getCapType();
    itemAppTypeString = itemAppTypeResult.toString();
    itemAppTypeArray = itemAppTypeString.split("/");

    report.setModule(itemAppTypeArray[0]);
    report.setCapId(itemCapId.getID1() + "-" + itemCapId.getID2() + "-" + itemCapId.getID3());
    report.getEDMSEntityIdModel().setAltId(itemCapId.getCustomID());

    var parameters = aa.util.newHashMap();

    if (arguments.length > 2 && arguments[2].getClass().toString().equals("class java.lang.String")) {
        // optional parameters are report parameter pairs
        // for example: runReportAttach(capId,"ReportName","altid",capId.getCustomID(),"months","12");
        for (var i = 2; i < arguments.length; i = i + 2) {
            parameters.put(arguments[i], arguments[i + 1]);
            asyncDebug("Report parameter: " + arguments[i] + " = " + arguments[i + 1]);
        }
    }
    else if (arguments.length > 2 && arguments[2].getClass().toString().equals("class java.util.HashMap")) {
        // optional argument is a hashmap so assign it to parameters
        parameters = arguments[2]
    }

    report.setReportParameters(parameters);

    var permit = aa.reportManager.hasPermission(reportName, "ADMIN");
    if (permit.getOutput().booleanValue()) {
        var reportResult = aa.reportManager.getReportResult(report);
        if (reportResult) {
            asyncDebug("Report " + aaReportName + " has been run for " + itemCapId.getCustomID());
            return true;
        }
    }
    else {
        asyncDebug("No permission to report: " + reportName + " for user: " + currentUserID);
        return false;
    }
}


function getLicensedProfessionalObjectsByRecord(pCapId, licenseTypeArray) {
    var itemCap = capId;
    if (pCapId != null)
        itemCap = pCapId; // use cap ID specified in args

    var licenseProfObjArray = new Array();
    var licenseProfResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(itemCap);
    if (licenseProfResult.getSuccess()) {
        var licenseProfList = licenseProfResult.getOutput();
        var licenseProfObjArray = new Array();
        if (licenseProfList) {
            for (thisLP in licenseProfList) {
                if (licenseProfList[thisLP].getLicenseNbr() != null) {
                    if (!licenseTypeArray || exists(licenseProfList[thisLP].getLicenseType(), licenseTypeArray))
                        var vLPObj = new licenseProfObject(licenseProfList[thisLP].getLicenseNbr());
                    licenseProfObjArray.push(vLPObj);
                }
            }
        }
    }

    return licenseProfObjArray;
}

function convertContactAddressModelArr(contactAddressScriptModelArr) {
    var contactAddressModelArr = null;
    if (contactAddressScriptModelArr != null && contactAddressScriptModelArr.length > 0) {
        contactAddressModelArr = aa.util.newArrayList();
        for (loopk in contactAddressScriptModelArr) {
            contactAddressModelArr.add(contactAddressScriptModelArr[loopk].getContactAddressModel());
        }
    }
    return contactAddressModelArr;
}


function getDocumentList() {
    // Returns an array of documentmodels if any
    // returns an empty array if no documents
    itemCapId = (arguments.length == 1) ? arguments[0] : capId;
    var docListArray = new Array();

    docListResult = aa.document.getCapDocumentList(itemCapId, "ADMIN");

    if (docListResult.getSuccess()) {
        docListArray = docListResult.getOutput();
    }
    return docListArray;
}

function addParameter(pamaremeters, key, value) {
    if (key != null) {
        if (value == null) {
            value = "";
        }
        pamaremeters.put(key, value);
    }
}

function getACADocumentDownloadUrl(acaUrl, documentModel) {
    //returns the ACA URL for supplied document model
    var acaUrlResult = aa.document.getACADocumentUrl(acaUrl, documentModel);

    if (acaUrlResult.getSuccess()) {
        acaDocUrl = acaUrlResult.getOutput();
        return acaDocUrl;
    }
    else {
        asyncDebug("Error retrieving ACA Document URL: " + acaUrlResult.getErrorType());
        return false;
    }
}

function getACADocumentNameURLParams4Notification(params, pDocName, acaURL) {
    itemCapId = (arguments.length == 4) ? arguments[3] : capId;
    // pass in a hashtable and it will add the additional parameters to the table

    var vDocListArray = getDocumentList(itemCapId);
    var vDocName = "";
    var vDocDownloadURL = "";

    for (iDoc in vDocListArray) {
        var docModel = vDocListArray[iDoc];
        var docNo = docModel.getDocumentNo();
        var docCategory = docModel.getDocCategory();
        var docName = docModel.getDocName();
        var docStatus = docModel.getDocStatus();

        if (docName == pDocName) {
            // Find the most current version of the document type
            vDocName = docName;
            vDocDownloadURL = getACADocumentDownloadUrl(acaURL, docModel);
            addParameter(params, "$$acaDocName$$", pDocName);
            addParameter(params, "$$acaDocDownloadURL$$", vDocDownloadURL);
            asyncDebug("(getACADocumentNameURLParams4Notification) $$acaDocName$$ - " + pDocName + " $$acaDocDownloadURL$$ - https:\\" + vDocDownloadURL);
        }
    }

    return params;
}

function lookup(stdChoice, stdValue) {
    var strControl;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);

    if (bizDomScriptResult.getSuccess()) {
        var bizDomScriptObj = bizDomScriptResult.getOutput();
        strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
        asyncDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
    }
    else {
        asyncDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
    }
    return strControl;
}

function handleEnvParamters() {
    if (servProvCode == null) servProvCode = "";
    if (capIDString == null) capIDString = "";
    if (capId == null) capId = "";
    if (reportName == null) reportName = "";
    if (reportAttach == null) reportAttach = true;
    if (module == null) module = "";
    if (reportUser == null) reportUser = "";
}

function logError(dstr) {
    error += dstr + br;
    asyncDebug(dstr);
}

function printEnv() {
    //Log All Environmental Variables as  globals
    var params = aa.env.getParamValues();
    var keys = params.keys();
    var key = null;
    while (keys.hasMoreElements()) {
        key = keys.nextElement();
        eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
        asyncDebug(key + " = " + aa.env.getValue(key));
    }
}

function convertStringToHashMap(theString) {
    var retObj = aa.util.newHashMap();
    theString = theString.replace(/^\{|\}$/g, '').split(',');
    for (var i = 0, cur, pair; cur = theString[i]; i++) {
        pair = cur.split('=');
        var key = pair[0].trim().toString()
        if (pair[1]) var val = pair[1].toString(); else val = "";
        retObj.put(key, val);
    }
    return retObj;
}

function convertStringToHashTable(theString) {
    var retObj = aa.util.newHashtable();
    theString = theString.replace(/^\{|\}$/g, '').split(',');
    for (var i = 0, cur, pair; cur = theString[i]; i++) {
        pair = cur.split('=');
        var key = pair[0].trim().toString()
        if (pair[1]) var val = pair[1].toString(); else val = "";
        retObj.put(key, val);
    }
    return retObj;
}

function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
            return true;

}

function asyncDebug(dstr) {
    aa.debug(aa.getServiceProviderCode() + " : " + " : " + capId.getCustomID() + " -- ", dstr);
    debug += dstr + br;
}

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

// end user code
if (testMode) {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}