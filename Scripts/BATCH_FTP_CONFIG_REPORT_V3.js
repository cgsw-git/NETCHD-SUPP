/*------------------------------------------------------------------------------------------------------/
| Script: BATCH_FTP_CONFIG_REPORT_V3
| Program: FTP Reports  Trigger: Batch
| Version 2.0 - Written for single parameter config report - carla jove 12-3-2021
| Version 3.0 - Updated to include environment and timestamp in output filename - j chalk 1-5-2022
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

//aa.env.setValue("batchJobName","BATCH_FTP_CONFIG_REPORT");
//aa.env.setValue("reportName","Configuration Report");
//aa.env.setValue("emailAddress","somebody@accela.com");
//aa.env.setValue("group","Building");
//aa.env.setValue("type","");
//aa.env.setValue("subtype","");
//aa.env.setValue("category","");

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var disableTokens = false;
var showDebug = true; // Set to true to see debug messages in email confirmation
var maxSeconds = 30 * 60; // number of seconds allowed for batch processing, usually < 5*60
var currentUserID = "ADMIN";
var publicUser = null;
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var GLOBAL_VERSION = 2.0;
var cancel = false;

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");
var timeExpired = false;
var startDate = new Date();
var adjustedDate = new Date(aa.util.now().getTime());
var yy = adjustedDate.getFullYear().toString();
var mm = (adjustedDate.getMonth() + 1).toString();
if (mm.length < 2)
	mm = "0" + mm;
var dd = adjustedDate.getDate().toString();
if (dd.length < 2)
	dd = "0" + dd;
var hh = adjustedDate.getHours().toString();
if (hh.length < 2)
	hh = "0" + hh;
var mi = adjustedDate.getMinutes().toString();
if (mi.length < 2)
	mi = "0" + mi;
var fileTimestamp = "_" + mm + "_" + dd + "_" + yy + "_" + hh + mi;

var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag
var feeSeqList = new Array(); // invoicing fee list
var paymentPeriodList = new Array(); // invoicing pay periods
var AInfo = new Array();
var partialCap = false;
var SCRIPT_VERSION = 3.0;
var emailText = "";

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
	useSA = true;
	SA = bzr.getOutput().getDescription();
	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
	if (bzr.getSuccess()) {
		SAScript = bzr.getOutput().getDescription();
	}
}

if (SA) {
	eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
	eval(getMasterScriptText(SAScript, SA));
} else {
	eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
}

override = "function logDebug(dstr){ if(showDebug) { aa.print(dstr); emailText+= dstr + \"<br>\"; } }";
eval(override);

function getMasterScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

function getScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("batchJobName");

// load parms from Standard Choice
var ftpSite = lookup("FTP_PARAMETERS", "ftpSite");
var ftpUser = lookup("FTP_PARAMETERS", "ftpUser");
var ftpPass = lookup("FTP_PARAMETERS", "ftpPass");
var ftpDirectory = lookup("FTP_PARAMETERS", "ftpReportDirectory");
// generic value in the event that tenant fetch fails
var envName = "_AGENCY-ENV";

try {
	var jndiUtil = aa.proxyInvoker.newInstance("com.accela.util.MultiDBJNDIUtil").getOutput();
	envName = "_" + jndiUtil.getTenantName();
} catch (envNameErr) {
	logDebug("I failed to get the env name:  " + envNameErr.message);
}

logDebug("envName is: " + envName);
logDebug("fileTimestamp is: " + fileTimestamp);

var reportName = getParam("reportName");
var emailAddress = getParam("emailAddress");
var group = getParam("group");
var type = getParam("type");
var subtype = getParam("subtype");
var category = getParam("category");

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
try {
	logDebug("Start of Job");

	mainProcess();

	logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

	if (emailAddress.length)
		email(emailAddress, "noreply@accela.com", batchJobName + " Results", emailText);

} catch (err) {
	logDebug("ERROR: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
function mainProcess() {
	// get the file
	cs = aa.proxyInvoker.newInstance("com.accela.aa.util.FTPUtil").getOutput();
	FTPUtil = cs;
	try {
		ftpClient = new Packages.org.apache.commons.net.ftp.FTPClient;
		ftpClient.connect(ftpSite);
		ftpClient.login(ftpUser, ftpPass);
		ftpClient.changeWorkingDirectory(ftpDirectory);
		ftpClient.setFileType(2); //binary
		ftpClient.setFileTransferMode(2); //binary
		ftpClient.enterLocalPassiveMode();
		ftpClient.setBufferSize(1024);
	} catch (err) {
		logDebug("Error getting file from FTP site : " + err);
		return;
	}

	//Get list of CapTypes
	qf = aa.util.newQueryFormat();
	capList = aa.cap.getCapTypeList(qf).getOutput();

	for (c in capList) {
		runCap = false;

		capTypeModel = capList[c];
		capGroup = capTypeModel.getGroup();
		capType = capTypeModel.getType();
		capSubType = capTypeModel.getSubType();
		capCategory = capTypeModel.getCategory();

		//logDebug("Looking for: " + group + " " + type + " " + subtype + " " + category);
		logDebug("Comparing: " + capGroup + " " + capType + " " + capSubType + " " + capCategory);

		if ((capGroup == group) && ((capType == type) || (type == "")) && ((capSubType == subtype) || (subtype == "")) && ((capCategory == category) || (category == ""))) {
			runCap = true;
		}
		logDebug("runCap: " + runCap);
		if (runCap) {
			//logDebug("Found: " + capGroup + " " + capType + " " + capSubType + " " + capCategory);
			//Place 4 level report params
			var repParams = aa.util.newHashMap();

			var typeArray = [capGroup.trim(), capType.trim(), capSubType.trim(), capCategory.trim()];

			for (var i = 0; i < typeArray.length; i++) {
				if (typeArray[i] == "") {
					typeArray[i] = "*"
				}
			}

			var typeString = typeArray.join("/");
			//logDebug("typeString: " + typeString);
			repParams.put("p1value", typeString);

			var report = aa.reportManager.getReportInfoModelByName(reportName);
			report = report.getOutput();

			if (report != null) {
				report.setModule(capGroup);
				report.setReportParameters(repParams);

				var permit = aa.reportManager.hasPermission(reportName, currentUserID);
				if (permit.getOutput().booleanValue()) {
					var reportResult = aa.reportManager.getReportResult(report);
					if (reportResult.getSuccess()) {
						reportOutput = reportResult.getOutput();
						var reportFile = aa.reportManager.storeReportToDisk(reportOutput);
						reportFile = reportFile.getOutput();
						fIn = new java.io.FileInputStream(reportFile);
						ftpClient.storeFile(capGroup + capType + capSubType + capCategory + envName + fileTimestamp + ".pdf", fIn);
						fIn.close();
					}
				} else {
					logDebug("User does not have permission to execute the report");
				}
			} else {
				logDebug("Report does not exist.");
			}
		} else {
			logDebug("Skipping this record type.");
		}
	}

	ftpClient.logout();
	ftpClient.disconnect();

}

/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function getParam(pParamName) //gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	logDebug("Parameter : " + pParamName + " = " + ret);
	return ret;
}

function isNull(pTestValue, pNewValue) {
	if (pTestValue == null || pTestValue == "")
		return pNewValue;
	else
		return pTestValue;
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function openDocument(docFilePath) {
	try {
		var file = new java.io.File(docFilePath);
		var fin = new java.io.FileInputStream(file);
		var vstrin = new java.util.Scanner(fin);
		return (vstrin);
	} catch (err) {
		logDebug("Error reading CSV document: " + err.message);
		return null;
	}
} 

function logDebug(dstr) {
	aa.print(dstr + "\n")
	aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)
}