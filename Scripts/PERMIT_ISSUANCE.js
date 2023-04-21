//License Issuance

 

var currDate = new Date();
var feeQty     = 0;

 

//logDebug("Date:"+currDate);
//logDebug("Month:"+currDate.getMonth());
//logDebug("Day:"+currDate.getDate());
//logDebug("Year:"+currDate.getFullYear());

 

if((currDate.getMonth()==5 && currDate.getDate()<=15) || currDate.getMonth()<=5)
{
    var dtSched = "06/30/"+currDate.getFullYear();    
}
if(currDate.getMonth()>5)
{
    dateAddMonths(currDate,12);
    var dtSched = "06/30/"+currDate.getFullYear();
}

 

    if(appMatch("EnvHealth/*/*/Renewal",capId))
    {
        var itemCapId = getParentCapID4Renewal();
    }
    else
    {
        var itemCapId = getParent();
    }

    var b1ExpResult = aa.expiration.getLicensesByCapID(itemCapId);
    if (b1ExpResult.getSuccess())
    {
        var b1Exp = b1ExpResult.getOutput();

 

        logDebug("dtSched:"+dtSched);
        //logDebug("dtSched:"+new Date(dtSched));
        //b1Exp.setExpStatus(newAppStatus);        
        b1Exp.setExpDate(aa.date.parseDate(dtSched));
        aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
    }