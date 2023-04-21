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
var capId = aa.env.getValue("CapID");
var reportName = aa.env.getValue("ReportName"); 			// Report Name
var documentType = aa.env.getValue("DocumentType");         // Document Type
var documentName = aa.env.getValue("DocumentName");         // Document Name
var documentGroup = aa.env.getValue("DocumentGroup");       // Document Group
var documentCategory = aa.env.getValue("DocumentCategory"); // Document Category
var inspectionId = aa.env.getValue("InspectionID");
var inspectionType = aa.env.getValue("InspectionType");     // Inspection Type
var module = aa.env.getValue("Module");						// Module Name
var reportUser = aa.env.getValue("ReportUser"); 			// AA User
var waitTime = aa.env.getValue("WaitTime");
var vEventName = aa.env.getValue("EventName");
var controlString = vEventName;
var showMessage = true;//okofahi update to false when finish
var showDebug = true;//okofahi update to false when finish
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
var testMode = true;


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



handleEnvParamters();

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


if (matches(waitTime, null, undefined, "")) { waitTime = 10000; }
else { waitTime = parseInt(waitTime); }




try {
    asyncDebug("Starting async script. Waiting " + waitTime + " milliseconds to execute...");
    //wait(waitTime);
    asyncDebug("Done waiting, it's been: " + waitTime + "milliseconds");

    var reportFileScriptResult = generateAndSaveReport(capId, inspectionId, reportName);
    if (!reportFileScriptResult.getSuccess()) {
        asyncDebug("ERROR : " + reportFileScriptResult.getErrorMessage());
       // return false;
    }
    var reportPath = reportFileScriptResult.getOutput();

    saveReportAsDocument(reportPath, documentName, documentGroup, documentCategory, inspectionId, inspectionType);



    asyncDebug("**CALLING generateReportLocal");



    // This should be included in all Configurable Scripts
    eval(getScriptText("CONFIGURABLE_SCRIPTS_COMMON"));
} catch (err) {
    asyncDebug("(RUNREPORTANDATTACHASYNC) A JavaScript Error occured: " + err.message + " at line " + err.lineNumber + " stack: " + err.stack);
}



/**
 * Returns ScriptResult with the report file pathin the getOutput() if succeed.
 *
 * @param {capId} reportPath The generated report path to be attached to the inspection.
 * @param {string} reportName The Name of the report to be generated as defined in report manager
 * @param {long} inspectionId the Inspection Id wich the report is generated for
 * @return {ScriptResult} contains the file path of the report generated as string in output.
 */

 function generateAndSaveReport(capId, inspectionId, reportName) {

    
    var altId = capId.getCustomID();
    var itemCap = aa.cap.getCap(capId).getOutput();

    var reportInfoScriptResult = aa.reportManager.getReportInfoModelByName(reportName);
    if (!reportInfoScriptResult.getSuccess()) {
        asyncDebug("*ERROR: " + reportInfoScriptResult.getErrorMessage());

        return new com.accela.aa.emse.dom.ScriptResult(false,
            "generateAndSaveReport",
            reportInfoScriptResult.getErrorMessage(),
            null);
    }

    var reportInfoScriptModel = reportInfoScriptResult.getOutput();
    //populating report parameters
    var reportParams = aa.util.newHashMap();
    reportParams.put("p1Value", inspectionId);
    //reportParams.put("p2Value", inspectionId);
    reportInfoScriptModel.setReportParameters(reportParams);
    reportInfoScriptModel.setModule(itemCap.getCapModel().getModuleName());
    var reportResult = aa.reportManager.getReportResult(reportInfoScriptModel);
    if (!reportResult.getSuccess()) {
        asyncDebug("*ERROR: " + reportResult.getErrorMessage());
        return new com.accela.aa.emse.dom.ScriptResult(false,
            "generateAndSaveReport",
            reportResult.getErrorMessage(),
            null);

    }

    var reportModel = reportResult.getOutput();
    var reportFileScriptResult = aa.reportManager.storeReportToDisk(reportModel);
    if (!reportFileScriptResult.getSuccess()) {
        asyncDebug("*ERROR: " + reportFileScriptResult.getErrorMessage());
        return new com.accela.aa.emse.dom.ScriptResult(false,
            "generateAndSaveReport",
            reportFileScriptResult.getErrorMessage(),
            null);
    }

    var reportFilePath = reportFileScriptResult.getOutput();

    return new com.accela.aa.emse.dom.ScriptResult(true,
        "",
        "",
        reportFilePath);

    pm(reportFileScriptResult);

}


/**
 * Returns ScriptResult with the document model in the getOutput() if succeed.
 *
 * @param {string} reportPath The generated report path to be attached to the inspection.
 * @param {string} documentName The Name of the document attached to the inspection.
 * @param {string} documentGroup The Document Group of the document
 * @param {string} documentCategory The Document Category of the document
 * @param {string} inspectionType The inspection type
 * @param {number} inspectionId The inspection Id
 * @return {ScriptResult} generated document script result.
 */

function saveReportAsDocument(reportPath, documentName, documentGroup, documentCategory, inspectionId, inspectionType) {
    try {
        var itemCap = aa.cap.getCap(capId).getOutput();
        var newContentModel = aa.document.newDocumentContentModel().getOutput();
        var inputstream = new java.io.FileInputStream(reportPath);
        newContentModel.setDocInputStream(inputstream);
        var documentObject = aa.document.newDocumentModel().getOutput();
        documentObject.setDocumentContent(newContentModel);
        documentObject.setFileName(documentName + ".pdf");
        documentObject.setDocName(documentName);
        documentObject.setDocType("application/pdf");
        documentObject.setDocGroup(documentGroup);
        documentObject.setCapID(capId);
        //documentObject.setInspectionID(inspectionId);
        documentObject.setAutoDownloadStatus("NO");
        documentObject.setDocCategory(documentCategory);
        //documentObject.setActionNo(inspectionId);
        documentObject.setModuleName(itemCap.getCapModel().getModuleName());
        documentObject.setSource("ADS");
        documentObject.setSourceName("ADS");
        documentObject.setServiceProviderCode(capId.getServiceProviderCode());
        var entityId = capId.getID1() + "-" + capId.getID2() + "-" + capId.getID3();
        documentObject.setEntityID(entityId + "-" + inspectionId);
        documentObject.setEntityType("INSPECTION");
        documentObject.setInspectionType(inspectionType);

        documentObject.setFileUpLoadBy("ADMIN");
        documentObject.setDocStatusDate(new Date(aa.util.now()));
        documentObject.setFileUpLoadDate(new Date(aa.util.now()));
        documentObject.setRecDate(new Date(itemCap.getFileDate().getEpochMilliseconds()));
        documentObject.setSourceEntityType("INSPECTION");

        var newDocResult = aa.document.createDocument(documentObject);
        if (newDocResult.getSuccess()) {
            var created = newDocResult.getOutput();
    
        }
    } catch (e) {
        asyncDebug("*ERROR: " + e.message);
        return new com.accela.aa.emse.dom.ScriptResult(false,
            "saveReportAsDocument",
            e.message,
            null);
    }


}


// ======================================================================
//
//					Internal Function
//
// ======================================================================

//function asyncDebug(dstr) {
//	debug += dstr + br;	
//}


function handleEnvParamters() {
    if (servProvCode == null) servProvCode = "";
    if (capIDString == null) capIDString = "";
    if (capId == null) capId = "";
    if (reportName == null) reportName = "";
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



function matches(eVal, argList) {
    for (var i = 1; i < arguments.length; i++)
        if (arguments[i] == eVal)
            return true;

}


function asyncDebug(dstr) {
    logDebug(dstr);
    //aa.debug(aa.getServiceProviderCode() + " : " + " : " + capId.getCustomID() + " -- ", dstr);
    //debug += dstr + br;


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