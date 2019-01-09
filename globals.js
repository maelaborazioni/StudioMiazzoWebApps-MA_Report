/**
 * @param {String} server the server to use as a datasource
 * @param params
 * @param {String} reportName
 * @param {Boolean} [printReport]
 *
 * @properties={typeid:24,uuid:"619C8D3C-6306-4709-B2A5-B8A7A5697226"}
 * @AllowToRunInFind
 */
function runReport(server, params, reportName, printReport)
{
	var arg = printReport == true && null;
	
	try
	{
		if(!params)
			throw new Error('createReport: No parameters provided');
		
		var report = plugins.jasperPluginRMI.runReport(globals.getSwitchedServer(server), reportName, arg, plugins.jasperPluginRMI.OUTPUT_FORMAT.PDF, params, null);
		if(!report)
			throw new Error('Errore durante la creazione della stampa');
		
		return report;
	}
	catch(ex)
	{
		application.output(ex.message, LOGGINGLEVEL.ERROR);
		return null;
	}
}

/**
 * @param {JSFoundset} fs
 * @param params
 * @param {String} reportName
 * @param {Boolean} [printReport]
 *
 * @properties={typeid:24,uuid:"D09C3709-757D-449C-AA1E-A211858DECD5"}
 */
function runReportWithFondset(fs, params, reportName, printReport)
{
    var arg = printReport == true && null;
	
	try
	{
		if(!params)
			throw new Error('createReport: No parameters provided');
		
		var report = plugins.jasperPluginRMI.runReport(fs,reportName, arg, plugins.jasperPluginRMI.OUTPUT_FORMAT.PDF, params, null);
		if(!report)
			throw new Error('Errore durante la creazione della stampa');
		
		return report;
	}
	catch(ex)
	{
		application.output(ex.message, LOGGINGLEVEL.ERROR);
		return null;
	}
}

/**
 * @param {String} server the server to use as a datasource
 * @param params
 * @param {String} reportName
 * @param {String} fileName
 * @param {JSRecord<db:/ma_log/operationlog>} operation
 * @param {Boolean} [printReport]
 *
 * @properties={typeid:24,uuid:"01AEFA96-CAE8-407A-A432-6F19391024C0"}
 */
function createReport(server, params, reportName, fileName, operation, printReport)
{
	try
	{
		if(!operation)
			throw new Error('createReport: No operation provided');
		
		databaseManager.startTransaction();
		
		var report = runReport(server, params, reportName, printReport);
		if(!report)
			throw new Error('Errore durante la creazione della stampa');
		
		/**
		 * Save the generated print
		 */
		if(!saveFile(operation, report, fileName, globals.MimeTypes.PDF))
			throw new Error('Errore durante il salvataggio del file');

		operation.op_message = operation.operationlog_to_operationtype.descrizione + ': esportazione completata con successo';
		operation.op_end = new Date();
		operation.op_status = globals.OpStatus.SUCCESS;
		operation.op_progress = 100;
		
		return true;
	}
	catch(ex)
	{
		application.output(ex.message, LOGGINGLEVEL.ERROR);
		
		if(operation)
		{
			operation.op_end = new Date();
			operation.op_status = globals.OpStatus.ERROR;
			operation.op_message = operation.operationlog_to_operationtype.descrizione + ': errore durante l\'esportazione dei dati';
			operation.op_progress = 100;
		}
		
		return false;
	}
	finally
	{	
		// always write in the log table
		databaseManager.commitTransaction();
		
		var retObj = {status : operation};
		forms.mao_history.checkStatusCallback(retObj);
		forms.mao_history.operationDone(retObj);
	}
}

/**
 * @param {JSFoundset} fs the foundset from get the datasource
 * @param reportParams
 * @param {String} reportName
 * @param {String} fileName
 * @param {JSRecord<db:/ma_log/operationlog>} operation
 *
 * @properties={typeid:24,uuid:"FC414434-E0E6-4521-A3FE-597BDD7A79C7"}
 */
function createReportWithFoundset(fs, reportParams, reportName, fileName, operation)
{
	try
	{
		if(!operation)
			throw new Error('createReport: No operation provided');
		
		databaseManager.startTransaction();
		var report = runReportWithFondset(fs,reportParams,reportName);//plugins.jasperPluginRMI.runReport(fs,reportName,null,plugins.jasperPluginRMI.OUTPUT_FORMAT.PDF,reportParams,null);
	
		if(!report)
			throw new Error('Errore durante la creazione della stampa');
		
		/**
		 * Save the generated print
		 */
		if(!globals.saveFile(operation, report, fileName, globals.MimeTypes.PDF))
			throw new Error('Errore durante il salvataggio del file');

		operation.op_message = operation.operationlog_to_operationtype.descrizione + ' : esportazione completata con successo';
		operation.op_end = new Date();
		operation.op_status = globals.OpStatus.SUCCESS;
		operation.op_progress = 100;
		
		return true;
	}
	catch(ex)
	{
		application.output(ex.message, LOGGINGLEVEL.ERROR);
		
		if(operation)
		{
			operation.op_end = new Date();
			operation.op_status = globals.OpStatus.ERROR;
			operation.op_message = operation.operationlog_to_operationtype.descrizione + ' : errore durante l\'esportazione dei dati';
			operation.op_progress = 0;
		}
		
		return false;
	}
	finally
	{	
		// always write in the log table
		databaseManager.commitTransaction();
		
		var retObj = {status : operation};
		forms.mao_history.checkStatusCallback(retObj);
		forms.mao_history.operationDone(retObj);
	}
}