/*------------------------------------------------------------------------------------------------------/
| Program : GuidesheetUpdateBefore.js
| Event   : GuidesheetUpdateBefore
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
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

var GuidesheetModel = aa.env.getValue("GuidesheetModel"); 
if(GuidesheetModel != null && GuidesheetModel != undefined)
{
// this to find capId,PermitId1,PermitId2, PermitId3 before involve the main files   	
var capId=GuidesheetModel.getCapID(); 
aa.env.setValue("PermitId1",capId.getID1());
aa.env.setValue("PermitId2",capId.getID2());
aa.env.setValue("PermitId3",capId.getID3() );
var gsType = GuidesheetModel.getGuideType();
var gsSequence = GuidesheetModel.getGuidesheetSeqNbr();
var gsDescription = GuidesheetModel.getGuideDesc();
var gsIdentifier = GuidesheetModel.getIdentifier();
var inspId = GuidesheetModel.getActivityNumber();
}

var controlString = "GuidesheetUpdateBefore"; // Standard choice for control
var preExecute = "PreExecuteForAfterEvents"; // Standard choice to execute first (for globals, etc)
var documentOnly = false; // Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 9.0;
var useCustomScriptFile = true;  // if true, use Events->Custom Script and Master Scripts, else use Events->Scripts->INCLUDES_*
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

var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";
var doStdChoices = true; // compatibility default
var doScripts = false;
var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice).getOutput().size() > 0;
if (bzr) {
	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "STD_CHOICE");
	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "SCRIPT");
	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
	var bvr3 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice, "USE_MASTER_INCLUDES");
	if (bvr3.getSuccess()) {if(bvr3.getOutput().getDescription() == "No") useCustomScriptFile = false}; 
}

if (SA) {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA,useCustomScriptFile));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA,useCustomScriptFile));
	eval(getScriptText(SAScript, SA));
} else {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useCustomScriptFile));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useCustomScriptFile));
}

eval(getScriptText("INCLUDES_CUSTOM",null,useCustomScriptFile));  
 
if (documentOnly) {
	doStandardChoiceActions(controlString, false, 0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
}

var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX", vEventName);
/*
showMessage = true; 
showDebug = true;
*/
logDebug("prefix:"+prefix);


function getScriptText(vScriptName, servProvCode, useProductScripts) {
	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();
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

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var inspType = aa.env.getValue("InspectionType")
var inspResult = aa.env.getValue("InspectionResult")
var inspResultComment = aa.env.getValue("InspectionResultComment");
var inspComment = inspResultComment; // consistency with events
var inspResultDate = null;
var inspSchedDate = null;
logDebug("inspId " + inspId);
if (inspId > 0) // if we have fixed the parameter problem
	{
	inspObj = aa.inspection.getInspection(capId,inspId).getOutput();  // current inspection object
	inspGroup = inspObj.getInspection().getInspectionGroup();

	if (inspObj.getScheduledDate()) {
		inspSchedDate = inspObj.getScheduledDate().getMonth() + "/" + inspObj.getScheduledDate().getDayOfMonth() + "/" + inspObj.getScheduledDate().getYear();
	}
	if (inspObj.getInspectionStatusDate()) {
		inspResultDate = inspObj.getInspectionStatusDate().getMonth() + "/" + inspObj.getInspectionStatusDate().getDayOfMonth() + "/" + inspObj.getInspectionStatusDate().getYear();
	}
	logDebug("inspId " + inspId);
	logDebug("inspGroup = " + inspGroup);
	logDebug("inspSchedDate = " + inspSchedDate);
	logDebug("inspResultDate = " + inspResultDate);
	}

logDebug("capId=" +capId)
logDebug("gsType:"+gsType);
logDebug("gsSequence:"+gsSequence);
logDebug("gsDescription:"+gsDescription);
logDebug("gsIdentifier:"+gsIdentifier);
logDebug("PermitId1:" + capId.getID1());
logDebug("PermitId2:" + capId.getID2());
logDebug("PermitId3:" +capId.getID3() );
logDebug("inspType = " + inspType);
logDebug("inspResult = " + inspResult);
logDebug("inspResultComment = " + inspResultComment);
logDebug("inspComment = " + inspComment);



//This to print list of session values
/*
var values = aa.env.getParamValues();
var keys = values.keySet();
keys = keys.iterator();
while (keys.hasMoreElements()) {
    var next = keys.nextElement();
    aa.print("SESSION -- " + next + " = " + aa.env.getValue(next));
}
*/


/*------------------------------------------------------------------------------------------------------/
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length)
	doStandardChoiceActions(preExecute, true, 0); // run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

if (doStdChoices)
	doStandardChoiceActions(controlString, true, 0);

if (doScripts)
	doScriptActions();


// this controller replaces lookups for STANDARD_SOLUTIONS and CONFIGURABLE_RULESETS
doConfigurableScriptActions();


/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
} else {
	if (cancel) {
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage)
			aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug)
			aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
	} else {
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage)
			aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug)
			aa.env.setValue("ScriptReturnMessage", debug);
	}
}
