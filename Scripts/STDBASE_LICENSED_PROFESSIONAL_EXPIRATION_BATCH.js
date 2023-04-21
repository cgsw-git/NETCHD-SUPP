var confScriptName = aa.env.getValue("confScriptName");
//var confScriptName = "CONF_LICENSED_PROFESSIONAL_EXPIRATION_BATCH";

var sysDate = aa.date.getCurrentDate();
var currentUserID = aa.getAuditID();
aa.env.setValue("CurrentUserID", "ADMIN");
var systemUserObj;
if (currentUserID != null) {
	systemUserObj = aa.person.getUser(currentUserID).getOutput(); // Current User Object
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

eval(getScriptText("INCLUDES_RECORD"));
eval(getScriptText("INCLUDES_BASEBATCH"));
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));

Batch.prototype.execute = function() {
	try {
		//execute main()
		if (!confScriptName) {
			logDebug("ERROR: Missing required batch parameter confScriptName: " + confScriptName);
			return false;
		}
		checkLP(confScriptName);

	} catch (e) {
		this.log("ERROR: ", e + "");
	}

}

run();

function checkLP(confSearchScriptName){
	
	var cfgJsonStr = getScriptText(confSearchScriptName);
	var searchRules = JSON.parse(cfgJsonStr)
	if (!searchRules) {
		logDebug("ERROR: Search rules not found. Script Name: " + confSearchScriptName);
		return false;
	}
	
	var thisSearchRule = searchRules["aboutToExpireSearchRules"];
	
	var searchByLicenseExpirationDate = thisSearchRule.searchCriteria.searchByDates.LicenseExpirationDate;
	var searchByBusinessLicExpDate = thisSearchRule.searchCriteria.searchByDates.BusinessLicExpDate;
	var searchByBusinessLicIssueDate = thisSearchRule.searchCriteria.searchByDates.BusinessLicIssueDate;
	var searchByInsuranceExpirationDate = thisSearchRule.searchCriteria.searchByDates.InsuranceExpirationDate;
	logDebug("searchByLicenseExpirationDate:" +searchByLicenseExpirationDate ) ;
	logDebug("searchByBusinessLicExpDate:" + searchByBusinessLicExpDate) ;
	logDebug("searchByBusinessLicIssueDate:" + searchByBusinessLicIssueDate) ;
	logDebug("searchByInsuranceExpirationDate:" + searchByInsuranceExpirationDate) ;
	var aboutToExpDays = thisSearchRule.searchCriteria.searchAboutToExpireDaysOut;

	
	var query= "Select LICENSE_NBR,LICENSE_REF_ID from V_REF_PROFESSIONAL  where STATUS ='A' AND agency_id = '"+aa.getServiceProviderCode()+"'"
	var result = runSQL(query , null  ) ;
	var data = result.toArray();
    for( index in data ) 
	{ 
			logDebug("LICENSE_NBR: "+data[index].LICENSE_NBR + " LICENSE_REF_ID:" + data[index].LICENSE_REF_ID );
            var licProf = aa.licenseScript.getRefLicenseProfBySeqNbr( aa.getServiceProviderCode(), parseInt( data[index].LICENSE_REF_ID ) ).getOutput();			
			//Disable out dated LP
			if (validateDate(licProf.getLicenseExpirationDate(),searchByLicenseExpirationDate)
					|| validateDate(licProf.getBusinessLicExpDate(), searchByBusinessLicExpDate)
					|| validateDate(licProf.getLicenseIssueDate(), searchByBusinessLicIssueDate)
					|| validateDate(licProf.getInsuranceExpDate(), searchByInsuranceExpirationDate)){		
													
				if(aa.genericTemplate.getTemplate(licProf.getLicenseModel().getEntityPK()).getSuccess())
				{
					var tmpl = aa.genericTemplate.getTemplate(licProf.getLicenseModel().getEntityPK()).getOutput();
					if (tmpl != null) {
						licProf.getLicenseModel().setTemplate(tmpl);
					}
				}
				licProf.setAuditStatus("I");					
				var c = aa.licenseScript.editRefLicenseProf(licProf);				
				logDebug("Disable LP: "+c.getSuccess())
				continue;
			}
			//Add condition if license is about to expire
			if (checkAboutToExpireDate(licProf.getLicenseExpirationDate(), aboutToExpDays,searchByLicenseExpirationDate)
					|| checkAboutToExpireDate(licProf.getBusinessLicExpDate(), aboutToExpDays, searchByBusinessLicExpDate)
					|| checkAboutToExpireDate(licProf.getLicenseIssueDate(), aboutToExpDays, searchByBusinessLicIssueDate)
					|| checkAboutToExpireDate(licProf.getInsuranceExpDate(), aboutToExpDays, searchByInsuranceExpirationDate)){
	
				var condName = thisSearchRule.addCondition.createCondition;
				var condGroup = thisSearchRule.addCondition.createConditionGroup;
				var condType = thisSearchRule.addCondition.createConditionType;
				var condSeverity = thisSearchRule.addCondition.createConditionSeverity;
				var condPriority = thisSearchRule.addCondition.createConditionPriority;
				var condStatus = thisSearchRule.addCondition.createConditionStatus;
	
				logDebug("Checking conditions...");
				var hasConditions = false;
				var conditionResult = aa.caeCondition.getCAEConditions(licProf.getLicSeqNbr());
				if(conditionResult.getSuccess())
				{
					var conditions = conditionResult.getOutput();
					for(cond in conditions)
					{
						if(conditions[cond].getConditionComment() == "Auto created")
						{
							hasConditions = true;
							break;
						}
					}
					
					if(!hasConditions){//no condition
						logDebug("Adding condition for about to expire LP")
						addLicenseCondition(condType,condStatus,condName,"Auto created", condPriority, licProf.getStateLicense())
					}
				}
				else
				{
					logDebug("**ERROR: getting LP conditions: " + conditionResult.getErrorMessage());
				}
			}
    
	}




}

function validateDate(date, isDateSearchable){
	
	if(!isDateSearchable) return false;
	
	if(date != null){

		var dateValue = date.getYear()+'-'+date.getMonth()+'-'+date.getDayOfMonth();
		date = aa.util.parseDate(dateValue);
		var currDate = aa.util.now();
		
		logDebug("Current date: "+currDate);
		logDebug("Param date: "+date);
		if(currDate.getTime() >= date.getTime()){
			return true;
		}else{
			return false;
		}
	}else{
		return false;
	}
}

function checkAboutToExpireDate(date, days, isDateSearchable ){
	
	if(!isDateSearchable) return false;
	
	if(date != null){

		var dateValue = date.getYear()+'-'+date.getMonth()+'-'+date.getDayOfMonth();
		date = aa.util.parseDate(dateValue);
		var currDate = aa.util.now();
		
		var expectedDate = aa.util.now();
		expectedDate.setDate(expectedDate.getDate()+days)

		logDebug("Current Date "+currDate);
		logDebug("Expected Date "+expectedDate);
		logDebug("Param Date "+date);

		logDebug(date.getTime() <= expectedDate.getTime())
		if(date.getTime() > currDate.getTime() && date.getTime() <= expectedDate.getTime()){
			return true;
		}else{
			return false;
		}
	}else{
		return false;
	}
}
function runSQL(sqlCMD, parameters) {
	var params = [];
	if(arguments.length == 2)
		params = parameters;
	
    var dba = com.accela.aa.datautil.AADBAccessor.getInstance();
    var utilProcessor = new JavaAdapter(com.accela.aa.datautil.DBResultSetProcessor, {
        processResultSetRow: function (rs) {
            var meta = rs.getMetaData();
            var numcols = meta.getColumnCount();
            var record = {}
            var result = null;

            for (var i = 0; i < numcols; i++) {
                var columnName = meta.getColumnName(i + 1);
                columnName = columnName.toUpperCase()
                result = rs.getObject(i + 1);
                if (result == null) {
                    record[columnName] = String("");
                } else {
                    if (result.getClass && result.getClass().getName() == "java.sql.Timestamp") {
                        record[columnName] = String(new Date(rs.getTimestamp(i + 1).getTime()).toString("MM/dd/yyyy"));
                    } else {
                        record[columnName] = String(rs.getObject(i + 1));
                    }
                }
            }
            return record;
        }
    });

    var result = dba.select(sqlCMD, params, utilProcessor, null);
	
	
	return result ; 
}