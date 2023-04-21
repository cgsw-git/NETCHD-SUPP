var confScriptName = aa.env.getValue("confScriptName");
//var confScriptName = "CONF_BUILDING_SEND_REPORT_BY_EMAIL";

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

eval(getScriptText("INCLUDES_RECORD"));
eval(getScriptText("INCLUDES_BASEBATCH"));
	
Batch.prototype.execute = function() {
	try {
		//execute main()
		if (!confScriptName) {
			logDebug("ERROR: Missing required batch parameter confScriptName: " + confScriptName);
			return false;
		}
		sendReportByEmail(confScriptName);

	} catch (e) {
		this.log("ERROR: ", e + "");
	}

}

run();

function sendReportByEmail(confSearchScriptName){
	var cfgJsonStr = getScriptText(confSearchScriptName);
	var searchRules = JSON.parse(cfgJsonStr)
	if (!searchRules) {
		logDebug("ERROR: Search rules not found. Script Name: " + confSearchScriptName);
		return false;
	}
	
	var thisSearchRule = searchRules["criteria"];
	var fromEmail = thisSearchRule.fromEmail;
	var toEmail = thisSearchRule.toEmail;
	var notificationTemplate = thisSearchRule.notificationTemplate;
	var notificationReport = thisSearchRule.notificationReport;
	
	var rFile;
	var rFiles = new Array();
	var rptParams = aa.util.newHashtable();
	var result;
	
	for (e in notificationReport) {
		logDebug("Report name: "+notificationReport[e])
		rFile = generateReportLocal(capId, notificationReport[e].trim(), aa.util.newHashtable());
		logDebug("File path: "+rFile)

		if (rFile) {
			rFiles.push(rFile);
		}else{
			logDebug("(runReport4Email) Unable to generate report - sending email without report")
		}
	}
//		addParameter(rptParams, "$$altID$$", capId.getCustomID());
		
	for (e in toEmail) {
		logDebug("Send reports to "+toEmail[e])
//		result = aa.document.sendEmailAndSaveAsDocument(fromEmail, toEmail[e], "", notificationTemplate, rptParams, capIDScriptModel, rFiles);
		result = aa.document.sendEmailByTemplateName(fromEmail, toEmail[e], "", notificationTemplate, rptParams, rFiles);

		if (result.getSuccess()) {
			logDebug("Sent email successfully!");
		} else {
			logDebug("Failed to send mail. - " + result.getErrorType() + " : " + result.getErrorMessage());
		}			
	}
}

function generateReportLocal(itemCap, reportName, parameters) {

	logDebug("Report Name: " + reportName)
	logDebug("Report Params: " + parameters)

	// returns the report file which can be attached to an email.
	var user = "ADMIN"; // Setting the User Name

	var reportInfoModel = aa.reportManager.getReportInfoModelByName(reportName);
	var report = reportInfoModel.getOutput();
	if (report) {
		report.setModule("Building");
		report.setReportParameters(parameters);

		var permit = aa.reportManager.hasPermission(reportName, user);

		if (permit.getOutput().booleanValue()) {

			var reportResult = aa.reportManager.getReportResult(report);
			if (reportResult) {

				reportOutput = reportResult.getOutput();
				if (reportOutput) {

					var reportFile = aa.reportManager
							.storeReportToDisk(reportOutput);
					reportFile = reportFile.getOutput();
					return reportFile;
				} else {
					logDebug("System failed get report: "
							+ reportResult.getErrorType() + ":"
							+ reportResult.getErrorMessage());
					return false;
				}
			} else {
				logDebug("System failed get report: "
						+ reportResult.getErrorType() + ":"
						+ reportResult.getErrorMessage());
				return false;
			}
		} else {
			logDebug("You have no permission.");
			return false;
		}
	} else {
		logDebug("System failed get report: " + reportName);
		return false;
	}
}
