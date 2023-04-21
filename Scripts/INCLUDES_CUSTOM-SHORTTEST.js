/* By: Tony L.
 * Script ID: 20
 * TFS task: 2380
 * For the Residential and Commercial Permits: When the Workflow is statused as Issue Temporary Certificate of Occupancy,
 * create the new Temporary Certificate of Occupancy record and copy all Address, * Parcel, Owner and Contact records associated with the parent record
 *-----------------------------------------------------------------------
 |				          Change Log
|  ----------  ----------  	-------------------------------------------
|   |  Date  	| Name    |	|Modification|
|	----------  -----------  -------------
|	04/03/2019	Wadnerson 	Initial modification:
|	04/03/2019  Wadnerson	Addition of the Script wfTask == "Inspection"
|	04/03/2019  Wadnerson	Addition of the Script $70 fee once child TCO record is created
|   04/08/2019  Wadnerson	Change to Corrections Required for status
|	04/09/2019	Wadnerson	Per Sanford request, Status name changes 
|                           From status=="Issue Temporary Certificate of Occupancy" to "Create Temporary Certificate of Occupancy Application"
|	06/12/2019  nalbert		Added back changes to setExpDate4ContractorLicApp_WTUA, setExpDate4ContractorLicRen_WTUA, isLicenseActive
|-----------------------------------------------------------------------
*/
function bldScript20createTempCoO() {
    logDebug("========================================================================================================================================");
    logDebug("|WorkflowName:BLD_RESI_COM - bldScript20createTempCoO() Started...");
    try {
        var childAltId;
        var childCapId;
		if (wfTask == "Inspection" && wfStatus == "Create Temporary Certificate of Occupancy Application") {
				childCapId = createChild("Building", "Temporary Certificate of Occup", "NA", "NA", "Child of " + capId.getCustomID());
				if (childCapId) {
					childAltId = childCapId.getCustomID();
					copyOwner(capId, childCapId);
					copyLicensedProf(capId, childCapId);
					addFee('BLD_TOC_01', 'BLD_TOC', 'FINAL', 1, 'Y',childCapId);
                    logDebug("|Created child Temporary Certificate of Occupancy, with childCapId: " + childCapId + ", and customID: " + childAltId);
				}
				else {
					logDebug("|ERROR: Unable to create child Temporary Certificate of Occupancy record.");
				}
		}
		else if (wfTask == "Closure" && wfStatus == "Create Temporary Certificate of Occupancy Application") {
				childCapId = createChild("Building", "Temporary Certificate of Occup", "NA", "NA", "Child of " + capId.getCustomID());
				if (childCapId) {
					childAltId = childCapId.getCustomID();
					copyOwner(capId, childCapId);
					copyLicensedProf(capId, childCapId);
					addFee('BLD_TOC_01', 'BLD_TOC', 'FINAL', 1, 'Y',childCapId);
                    logDebug("|Created child Temporary Certificate of Occupancy record, with childCapId: " + childCapId + ", and customID: " + childAltId);
				}
				else {
				   logDebug("|ERROR: Unable to create child Temporary Certificate of Occupancy record.");
				}
		}
    }
    catch (err) {
        showMessage = true;
        comment("|Error on custom function bldScript20createTempCoO().<BR/>| Please contact administrator. Error: " + err);
    }
    logDebug("|Custom bldScript20createTempCoO() Ended...");
    logDebug("========================================================================================================================================");
}//End bldScript20createTempCoO() 

function bldScrt90_blockSch110Insp() {
    logDebug("bldScrt91_InspectionRestrictionLintel() started");
    try {
        var $iTrc = bs.utils.debug.ifTracer,
            docSpotSurveyUploaded = (bs.utils, ""),
            floodZone = "",
            customFieldFloodZone = "",
            docSpotSurveyUploaded = checkSpotSurveyDoc(),
            docConstructionElevationUploaded = checkConstructionElevationDoc();
        $iTrc(useAppSpecificGroupName, "useAppSpecificGroupName") ? (useAppSpecificGroupName = !1, customFieldFloodZone = getAppSpecific("Flood Zone", capId), useAppSpecificGroupName = !0) : customFieldFloodZone = getAppSpecific("Flood Zone", capId), floodZone = $iTrc("" != customFieldFloodZone && null != customFieldFloodZone && void 0 != customFieldFloodZone, "customFieldFloodZone valid") ? customFieldFloodZone : AInfo["ParcelAttribute.FLOOD ZONE"],
            $iTrc(!docSpotSurveyUploaded, "!docSpotSurveyUploaded") && (cancel = !0, showMessage = !0,
                comment("Please attach Spot Survey document prior to Scheduling 105 Lintel Inspection."),
                comment("***This inspection is required Spot Survey to be uploaded.<BR>***Please log in to your Online Services Account and upload it")
            ),
            $iTrc(!floodZone.contains("X") && !floodZone.contains("X5"), "Flood Zone is not X or X5") &&
            (logDebug("customFieldFloodZone: " + customFieldFloodZone + ". floodZone: " + floodZone),
                $iTrc(!docConstructionElevationUploaded, "!docConstructionElevationUploaded") && (cancel = !0, showMessage = !0,
                    comment("Please attach UnderConstruction Elevation Certificate document prior to Scheduling 105 Lintel Inspection."),
                    comment("***Your project is in Flood Zone .<BR>***Please log in to your Online Services Account and upload your UnderConstruction Elevation Certificate")))
    } catch (err) {
        showMessage = !0,
            comment("Error on custom function bldScrt91_InspectionRestrictionLintel(). Please contact system administrator. Err: " + err)
    }
}
?/// <reference path="../Scripts/Master/INCLUDES_CUSTOM_GLOBALS.js" />
/// <reference path="../Scripts/Master/INCLUDES_ACCELA_FUNCTIONS.js" />

/*------------------------------------------------------------------------------------------------------/
| Byrne Software (2016)
|
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
| Usage   : Custom Script Include.  
| Client  : Manatee     
|
/------------------------------------------------------------------------------------------------------*/

//----------------------------------------------
// BPTs Initiallly Loaded 
//---------------------------------------------- -

function runReportTest(aaReportName) {
    s = 165; //for assembla git testing
    x = "test param for testing"
    currentUserID = "ADMIN";
    setCode = "X";
    var bReport = false;
    var reportName = aaReportName;
    report = aa.reportManager.getReportModelByName(reportName);
    report = report.getOutput();
    var permit = aa.reportManager.hasPermission(reportName, currentUserID);
    if (permit.getOutput().booleanValue()) {
        var parameters = aa.util.newHashMap();
        parameters.put("BatchNumber", setCode);
        //report.setReportParameters(parameters);
        var msg = aa.reportManager.runReport(parameters, report);
        aa.env.setValue("ScriptReturnCode", "0");
        aa.env.setValue("ScriptReturnMessage", msg.getOutput());
    }
}

function createRefLicProf(rlpId, rlpType, pContactType) {
    //Creates/updates a reference licensed prof from a Contact
    //06SSP-00074, modified for 06SSP-00238
    var updating = false;
    var capContResult = aa.people.getCapContactByCapID(capId);
    if (capContResult.getSuccess()) { conArr = capContResult.getOutput(); }
    else {
        logDebug("**ERROR: getting cap contact: " + capContResult.getErrorMessage());
        return false;
    }

    if (!conArr.length) {
        logDebug("**WARNING: No contact available");
        return false;
    }


    var newLic = getRefLicenseProf(rlpId)

    if (newLic) {
        updating = true;
        logDebug("Updating existing Ref Lic Prof : " + rlpId);
    }
    else
        var newLic = aa.licenseScript.createLicenseScriptModel();

    //get contact record
    if (pContactType == null)
        var cont = conArr[0]; //if no contact type specified, use first contact
    else {
        var contFound = false;
        for (yy in conArr) {
            if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType())) {
                cont = conArr[yy];
                contFound = true;
                break;
            }
        }
        if (!contFound) {
            logDebug("**WARNING: No Contact found of type: " + pContactType);
            return false;
        }
    }

    peop = cont.getPeople();
    //addr = peop.getCompactAddress();
    addr = getCapContactAddressByType(cont, "Mailing");

    newLic.setContactFirstName(cont.getFirstName());
    //newLic.setContactMiddleName(cont.getMiddleName());  //method not available
    newLic.setContactLastName(cont.getLastName());
    newLic.setBusinessName(peop.getBusinessName());

    newLic.setAddress1(addr.getAddressLine1());
    newLic.setAddress2(addr.getAddressLine2());
    newLic.setAddress3(addr.getAddressLine3());
    newLic.setCity(addr.getCity());
    newLic.setState(addr.getState());
    newLic.setZip(addr.getZip());
    newLic.setPhone1(peop.getPhone1());
    newLic.setPhone2(peop.getPhone2());
    newLic.setEMailAddress(peop.getEmail());
    newLic.setFax(peop.getFax());

    newLic.setAgencyCode(aa.getServiceProviderCode());
    newLic.setAuditDate(sysDate);
    newLic.setAuditID(currentUserID);
    newLic.setAuditStatus("A");

    if (AInfo["General Liability Policy Provider Name"]) newLic.setInsuranceCo(AInfo["General Liability Policy Provider Name"]);
    if (AInfo["General Liability Expiration Date"]) newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["General Liability Expiration Date"]));
    if (AInfo["General Liability Policy Number"]) newLic.setPolicy(AInfo["General Liability Policy Number"]);

    if (appMatch("Licenses/Contractor/State Certified Contractor/Application") ||
        appMatch("Licenses/Local Contractor/Fence & Tent/Application")) {
        if (AInfo["Workman's Comp Policy Number"]) newLic.setWcPolicyNo(AInfo["Workman's Comp Policy Number"]);
        if (AInfo["Workman's Comp Policy Expiration"]) newLic.setWcExpDate(aa.date.parseDate(AInfo["Workman's Comp Policy Expiration"]));
        if (AInfo["Do you have Employees?"] == "Yes") newLic.setWcExempt("N"); else { newLic.setWcExempt("Y"); newLic.setComment(AInfo["FEIN Number or Exemption Number"]); }
    }
    else {
        if (AInfo["Workers' Comp Policy Number"]) newLic.setWcPolicyNo(AInfo["Workers' Comp Policy Number"]);
        if (AInfo["Workers' Comp Policy Expriation"]) newLic.setWcExpDate(aa.date.parseDate(AInfo["Workers' Comp Policy Expriation"]));
        if (AInfo["Do you have Employees?"] == "Yes") newLic.setWcExempt("N"); else { newLic.setWcExempt("Y"); newLic.setComment(AInfo["FEIN Number or Exemption Number"]); }
    }

    newLic.setLicenseType(rlpType);

    //commented this out and defaulted state to Florida.
    /*if (addr.getState() != null)
        newLic.setLicState(addr.getState());
    else
        newLic.setLicState("AK"); //default the state if none was provided*/

    newLic.setLicState("FL");

    newLic.setStateLicense(rlpId);
    newLic.setBusinessLicense(rlpId);

    if (updating)
        myResult = aa.licenseScript.editRefLicenseProf(newLic);
    else
        myResult = aa.licenseScript.createRefLicenseProf(newLic);

    if (myResult.getSuccess()) {
        logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
        logMessage("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
        return true;
    }
    else {
        logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
        logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
        return false;
    }
}

function createRefContactsFromCapContactsAndLink(pCapId, contactTypeArray, ignoreAttributeArray, replaceCapContact, overwriteRefContact, refContactExists) {

    // contactTypeArray is either null (all), or an array or contact types to process
    //
    // ignoreAttributeArray is either null (none), or an array of attributes to ignore when creating a REF contact
    //
    // replaceCapContact not implemented yet
    //
    // overwriteRefContact -- if true, will refresh linked ref contact with CAP contact data
    //
    // refContactExists is a function for REF contact comparisons.
    //
    // Version 2.0 Update:   This function will now check for the presence of a standard choice "REF_CONTACT_CREATION_RULES". 
    // This setting will determine if the reference contact will be created, as well as the contact type that the reference contact will 
    // be created with.  If this setting is configured, the contactTypeArray parameter will be ignored.   The "Default" in this standard
    // choice determines the default action of all contact types.   Other types can be configured separately.   
    // Each contact type can be set to "I" (create ref as individual), "O" (create ref as organization), 
    // "F" (follow the indiv/org flag on the cap contact), "D" (Do not create a ref contact), and "U" (create ref using transaction contact type).

    var standardChoiceForBusinessRules = "REF_CONTACT_CREATION_RULES";


    var ingoreArray = new Array();
    if (arguments.length > 1) ignoreArray = arguments[1];

    var defaultContactFlag = lookup(standardChoiceForBusinessRules, "Default");

    var c = aa.people.getCapContactByCapID(pCapId).getOutput()
    var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput()  // must have two working datasets

    for (var i in c) {
        var ruleForRefContactType = "U"; // default behavior is create the ref contact using transaction contact type
        var con = c[i];

        var p = con.getPeople();

        var contactFlagForType = lookup(standardChoiceForBusinessRules, p.getContactType());

        if (!defaultContactFlag && !contactFlagForType) // standard choice not used for rules, check the array passed
        {
            if (contactTypeArray && !exists(p.getContactType(), contactTypeArray))
                continue;  // not in the contact type list.  Move along.
        }

        if (!contactFlagForType && defaultContactFlag) // explicit contact type not used, use the default
        {
            ruleForRefContactType = defaultContactFlag;
        }

        if (contactFlagForType) // explicit contact type is indicated
        {
            ruleForRefContactType = contactFlagForType;
        }

        if (ruleForRefContactType.equals("D"))
            continue;

        var refContactType = "";

        switch (ruleForRefContactType) {
            case "U":
                refContactType = p.getContactType();
                break;
            case "I":
                refContactType = "Individual";
                break;
            case "O":
                refContactType = "Organization";
                break;
            case "F":
                if (p.getContactTypeFlag() && p.getContactTypeFlag().equals("organization"))
                    refContactType = "Organization";
                else
                    refContactType = "Individual";
                break;
        }

        var refContactNum = con.getCapContactModel().getRefContactNumber();

        if (refContactNum)  // This is a reference contact.   Let's refresh or overwrite as requested in parms.
        {
            if (overwriteRefContact) {
                p.setContactSeqNumber(refContactNum);  // set the ref seq# to refresh
                p.setContactType(refContactType);

                var a = p.getAttributes();

                if (a) {
                    var ai = a.iterator();
                    while (ai.hasNext()) {
                        var xx = ai.next();
                        xx.setContactNo(refContactNum);
                    }
                }

                var r = aa.people.editPeopleWithAttribute(p, p.getAttributes());

                if (!r.getSuccess())
                    logDebug("WARNING: couldn't refresh reference people : " + r.getErrorMessage());
                else
                    logDebug("Successfully refreshed ref contact #" + refContactNum + " with CAP contact data");
            }

            if (replaceCapContact) {
                // To Be Implemented later.   Is there a use case?
            }

        }
        else  // user entered the contact freehand.   Let's create or link to ref contact.
        {
            var ccmSeq = p.getContactSeqNumber();

            var existingContact = refContactExists(p);  // Call the custom function to see if the REF contact exists

            var p = cCopy[i].getPeople();  // get a fresh version, had to mangle the first for the search

            if (existingContact)  // we found a match with our custom function.  Use this one.
            {
                refPeopleId = existingContact;
            }
            else  // did not find a match, let's create one
            {

                var a = p.getAttributes();

                if (a) {
                    //
                    // Clear unwanted attributes
                    var ai = a.iterator();
                    while (ai.hasNext()) {
                        var xx = ai.next();
                        if (ignoreAttributeArray && exists(xx.getAttributeName().toUpperCase(), ignoreAttributeArray))
                            ai.remove();
                    }
                }

                p.setContactType(refContactType);
                var r = aa.people.createPeopleWithAttribute(p, a);

                if (!r.getSuccess()) { logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage()); continue; }

                //
                // createPeople is nice and updates the sequence number to the ref seq
                //

                var p = cCopy[i].getPeople();
                var refPeopleId = p.getContactSeqNumber();

                logDebug("Successfully created reference contact #" + refPeopleId);

                // Need to link to an existing public user.

                var getUserResult = aa.publicUser.getPublicUserByEmail(con.getEmail())
                if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                    var userModel = getUserResult.getOutput();
                    logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: " + userModel.getUserID());

                    if (refPeopleId) {
                        logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : " + refPeopleId);
                        aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refPeopleId);
                    }
                }
            }

            //
            // now that we have the reference Id, we can link back to reference
            //

            var ccm = aa.people.getCapContactByPK(pCapId, ccmSeq).getOutput().getCapContactModel();

            ccm.setRefContactNumber(refPeopleId);
            r = aa.people.editCapContact(ccm);

            if (!r.getSuccess()) { logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage()); }
            else { logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq); }


        }  // end if user hand entered contact 
    }  // end for each CAP contact
} // end function

function reversePayment() { logDebug("hello") }

function addToASITable(tableName, tableValues) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValues is an associative array of values.  All elements must be either a string or asiTableVal object
    itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess()) { logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()); return false }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField();
    var col = tsm.getColumns();
    var fld_readonly = tsm.getReadonlyField(); //get ReadOnly property
    var coli = col.iterator();

    while (coli.hasNext()) {
        colname = coli.next();

        if (!tableValues[colname.getColumnName()]) {
            logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
            tableValues[colname.getColumnName()] = "";
        }

        if (typeof (tableValues[colname.getColumnName()].fieldValue) != "undefined") {
            fld.add(tableValues[colname.getColumnName()].fieldValue);
            fld_readonly.add(tableValues[colname.getColumnName()].readOnly);
        }
        else // we are passed a string
        {
            fld.add(tableValues[colname.getColumnName()]);
            fld_readonly.add(null);
        }
    }

    tsm.setTableField(fld);
    tsm.setReadonlyField(fld_readonly); // set readonly field

    addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
    if (!addResult.getSuccess()) { logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()); return false }
    else
        logDebug("Successfully added record to ASI Table: " + tableName);
}

function addASITable(tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    var itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess()) {
        logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage());
        return false
    }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField();
    var fld_readonly = tsm.getReadonlyField(); // get Readonly field

    for (thisrow in tableValueArray) {

        var col = tsm.getColumns()
        var coli = col.iterator();
        while (coli.hasNext()) {
            var colname = coli.next();

            if (!tableValueArray[thisrow][colname.getColumnName()]) {
                logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
                tableValueArray[thisrow][colname.getColumnName()] = "";
            }

            if (typeof (tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") // we are passed an asiTablVal Obj
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
                fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
                //fld_readonly.add(null);
            } else // we are passed a string
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()]);
                fld_readonly.add(null);
            }
        }

        tsm.setTableField(fld);

        tsm.setReadonlyField(fld_readonly);

    }

    var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

    if (!addResult.getSuccess()) {
        logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage());
        return false
    } else
        logDebug("Successfully added record to ASI Table: " + tableName);

}

function getLatestScheduledDate() {
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        inspList = inspResultObj.getOutput();
        var array = new Array();
        var j = 0;
        for (i in inspList) {
            if (inspList[i].getInspectionStatus().equals("Scheduled")) {
                array[j++] = aa.util.parseDate(inspList[i].getInspection().getScheduledDate());
            }
        }

        var latestScheduledDate = array[0];
        for (k = 0; k < array.length; k++) {
            temp = array[k];
            logDebug("----------array.k---------->" + array[k]);
            if (temp.after(latestScheduledDate)) {
                latestScheduledDate = temp;
            }
        }
        return latestScheduledDate;
    }
    return false;
}

function cntAssocGarageSales(strnum, strname, city, state, zip, cfname, clname) {

    /***

    Searches for Garage-Yard Sale License records 
    - Created in the current year 
    - Matches address parameters provided
    - Matches the contact first and last name provided
    - Returns the count of records

    ***/

    // Create a cap model for search
    var searchCapModel = aa.cap.getCapModel().getOutput();

    // Set cap model for search. Set search criteria for record type DCA/*/*/*
    var searchCapModelType = searchCapModel.getCapType();
    searchCapModelType.setGroup("Licenses");
    searchCapModelType.setType("Garage-Yard Sale");
    searchCapModelType.setSubType("License");
    searchCapModelType.setCategory("NA");
    searchCapModel.setCapType(searchCapModelType);

    searchAddressModel = searchCapModel.getAddressModel();
    searchAddressModel.setStreetName(strname);

    gisObject = new com.accela.aa.xml.model.gis.GISObjects;
    qf = new com.accela.aa.util.QueryFormat;

    var toDate = aa.date.getCurrentDate();
    var fromDate = aa.date.parseDate("01/01/" + toDate.getYear());

    var recordCnt = 0;
    message = "The applicant has reached the Garage-Sale License limit of 3 per calendar year.<br>"

    capList = aa.cap.getCapListByCollection(searchCapModel, searchAddressModel, "", fromDate, toDate, qf, gisObject).getOutput();
    for (x in capList) {
        resultCap = capList[x];
        resultCapId = resultCap.getCapID();
        altId = resultCapId.getCustomID();
        //aa.print("Record ID: " + altId);
        resultCapIdScript = aa.cap.createCapIDScriptModel(resultCapId.getID1(), resultCapId.getID2(), resultCapId.getID3());
        contact = aa.cap.getCapPrimaryContact(resultCapIdScript).getOutput();

        contactFname = contact.getFirstName();
        contactLname = contact.getLastName();

        if (contactFname == cfname && contactLname == clname) {
            recordCnt++;
            message = message + recordCnt + ": " + altId + " - " + contactFname + " " + contactLname + " @ " + strnum + " " + strname + "<br>";
        }
    }

    return recordCnt;

}