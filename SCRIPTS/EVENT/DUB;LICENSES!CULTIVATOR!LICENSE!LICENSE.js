try{
	//if(documentUploadedFrom == "ACA"){
		var cancelUpload = false;
		for(var index = 0; index < documentModelArray.size(); index++) {
			logDebug("Cat: " + String(documentModelArray.get(index).getDocCategory()));
			if (String(documentModelArray.get(index).getDocCategory()) =! "Delegate Contact"){
				logDebug("within");
				cancelUpload = true;
			}
		}
		if(cancelUpload){
			cancel = true;		
			showMessage = true;
			comment("To upload additional documents, please submit a new amendment. For further questions please contact CalCannabis at 1-833-CALGROW (225-4769) or by sending an email to calcannabis@cdfa.ca.gov.");
		}
	//}
}catch(err){
	logDebug("An error has occurred in DUB:LICENSES/CULTIVATOR/LICENSE/LICENSE: No Documents: " + err.message);
	logDebug(err.stack);
	aa.sendMail(sysFromEmail, debugEmail, "", "An error has occurred in DUB:LICENSES/CULTIVATOR/LICENSE/LICENSE: No Documents: "+ startDate, capId + br+ err.message+ br+ err.stack + br + "DOCUMENT ARRAY: " + documentModelArray);
}