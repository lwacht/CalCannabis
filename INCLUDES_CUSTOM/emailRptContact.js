/*===========================================
Title: emailRptContact
Purpose: Email the  contact type provided
		 depending on their preferred channel
		Note: This is intended for a very 
		specific purpose and will not be able
		to be used outside of that
Author: Lynda Wacht		
Functional Area : Notifications
Description : 
Reviewed By: 
Script Type : (EMSE, EB, Pageflow, Batch): EMSE
General Purpose/Client Specific : General
Client developed for : CDFA_CalCannabis
Parameters:
	callingPgm: Text: Master script calling this function
	notName: Text: Name of the email template notification
	rptName: Text: Name of the report(s), seperated by commas
	emailRpt: true/false: whether or not the report should be attached to the email
	curStatus: Text: Status to use for general notification template
	acaCapId: capId: The capId to use for the ACA URL
	contactType: text: The type of contact to whom the email/report should be sent
	rptParams: Optional report parameter(s): "agencyid",servProvCode,"capid",myCapId
============================================== */
function emailRptContact(callingPgm, notName, rptName, emailRpt, curStatus, acaCapId, contactType) {
try{
	// create a hashmap for report parameters
	var rptParams = aa.util.newHashMap();
	for (var i = 7; i < arguments.length; i = i + 2) {
		rptParams.put(arguments[i], arguments[i + 1]);
	}
	//logDebug("rptParams: " + rptParams);
	var emailPriReport = false;
	//var emailDRPReport = false;
	var priContact = getContactObj(capId,contactType);
	if(priContact){
		var priChannel =  lookup("CONTACT_PREFERRED_CHANNEL",""+ priContact.capContact.getPreferredChannel());
		if(!matches(priChannel, "",null,"undefined", false)){
			if(priChannel.indexOf("Email") > -1 || priChannel.indexOf("E-mail") > -1){
				emailPriReport = true;
			}else{
				if(priChannel.indexOf("Postal") > -1){
					var addrString = "";
					var contAddr = priContact.addresses;
					for(ad in contAddr){
						var thisAddr = contAddr[ad];
						for (a in thisAddr){
							if(!matches(thisAddr[a], "undefined", "", null)){
								if(!matches(thisAddr[a].addressType, "undefined", "", null)){
									addrString += "Address Type: " + thisAddr[a].addressType + br + thisAddr[a].addressLine1 + br + thisAddr[a].city + ", " + thisAddr[a].state +  " " + thisAddr[a].zip + br;
								}
							}
						}
					}
					if(addrString==""){
						addrString = "No addresses found.";
					}
					if(callingPgm!="BATCH"){
						showMessage=true;
						comment("<font color='blue'>The " + contactType + " contact, " + priContact.capContact.getFirstName() + " " + priContact.capContact.getLastName() + ", has requested all correspondence be mailed.  Please mail the displayed report to : " + br + addrString + "</font>");
					}
				}
			}
		}
		if(emailPriReport){
			var eParams = aa.util.newHashtable(); 
			//logDebug("callingPgm: " + callingPgm);
			if(callingPgm=="WTUA"){
				addParameter(eParams, "$$fileDateYYYYMMDD$$", fileDateYYYYMMDD);
				var currCapId = capId;
				capId = acaCapId;
				//getACARecordParam4Notification(eParams,acaUrl);
				var acaUrlForAmend = "https://aca.supp.accela.com/CALCANNABIS/urlrouting.ashx?type=1008&Module=Licenses&capID1="+capId.ID1+"&capID2="+capId.ID2+"&capID3="+capId.ID3+"&agencyCode=CALCANNABIS&HideHeader=true";
				addParameter(eParams, "$$acaRecordUrl$$", acaUrlForAmend);
				capId = currCapId;
				var staffUser = new userObj(wfStaffUserID);
				staffUser.getEmailTemplateParams(eParams,"scientist")
				getWorkflowParams4Notification(eParams);
			}
			var contPhone = priContact.capContact.phone1;
			if(contPhone){
				var fmtPhone = contPhone.substr(0,3) + "-" + contPhone.substr(3,3) +"-" + contPhone.substr(6,4);
			}else{
				var fmtPhone = "";
			}
			addParameter(eParams, "$$altID$$", capId.getCustomID());
			addParameter(eParams, "$$contactPhone1$$", fmtPhone);
			addParameter(eParams, "$$contactFirstName$$", priContact.capContact.firstName);
			addParameter(eParams, "$$contactLastName$$", priContact.capContact.lastName);
			addParameter(eParams, "$$contactEmail$$", priContact.capContact.email);
			addParameter(eParams, "$$status$$", curStatus);
			drpAddresses = priContact.addresses;
			var addrType = false;
			for (x in drpAddresses){
				thisAddr = drpAddresses[x];
				if(thisAddr.getAddressType()=="Home"){
					addrType = "Home";
					addParameter(eParams, "$$priAddress1$$", thisAddr.addressLine1);
					addParameter(eParams, "$$priCity$$", thisAddr.city);
					addParameter(eParams, "$$priState$$", thisAddr.state);
					addParameter(eParams, "$$priZip$$", thisAddr.zip);
				}
				if(thisAddr.getAddressType()=="Business"){
					addrType = "Business";
					addParameter(eParams, "$$priAddress1$$", thisAddr.addressLine1);
					addParameter(eParams, "$$priCity$$", thisAddr.city);
					addParameter(eParams, "$$priState$$", thisAddr.state);
					addParameter(eParams, "$$priZip$$", thisAddr.zip);
				}
			}
			if(!addrType){
				addrType = "Mailing";
				for (x in drpAddresses){
					thisAddr = drpAddresses[x];
					if(thisAddr.getAddressType()==addrType){
						addParameter(eParams, "$$priAddress1$$", thisAddr.addressLine1);
						addParameter(eParams, "$$priCity$$", thisAddr.city);
						addParameter(eParams, "$$priState$$", thisAddr.state);
						addParameter(eParams, "$$priZip$$", thisAddr.zip);
					}
				}
			}
			//logDebug("eParams: " + eParams);
			//var drpEmail = ""+priContact.capContact.getEmail();
			var priEmail = ""+priContact.capContact.getEmail();
			//var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
			var rFiles = [];
			if(!matches(rptName, null, "", "undefined")){
				var rFile;
				rptArray = rptName.split(',');
				if (typeof(rptArray) == "object"){
					for (ii in rptArray){
					rFile = generateReport(capId,rptArray[ii],"Licenses",rptParams);
						if (rFile) {
							rFiles.push(rFile);
						}
					}
				}				
			}
			if(emailRpt){
				sendNotification(sysFromEmail,priEmail,"",notName,eParams, rFiles,capId);
			}else{
				rFiles = [];
				sendNotification(sysFromEmail,priEmail,"",notName,eParams, rFiles,capId);
			}
		}
	}else{
		logDebug("An error occurred retrieving the contactObj for " + contactType + ": " + priContact);
	}
}catch(err){
	logDebug("An error occurred in emailRptContact: " + err.message);
	logDebug(err.stack);
}}