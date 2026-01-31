/**
 * SCENARIO 2: Drive -> Notion Database Link
 */
function runFileLinkScenario() {
  try {
    var sourceFolder = DriveApp.getFolderById(CONFIG.FOLDERS.FILE_LINKING_SOURCE);
    var processedFolder = DriveApp.getFolderById(CONFIG.FOLDERS.PROCESSED_DESTINATION);
    
    // Auto-detect Title Column Name
    var titleColumnName = getDatabaseTitleName(CONFIG.NOTION.DB_ID);
    
  } catch (e) {
    writeToLogSheet("Scenario 2 Setup", "Error", e.message);
    return;
  }
  
  const files = sourceFolder.getFiles();
  let processedCount = 0;

  while (files.hasNext() && processedCount < 10) {
    const file = files.next();
    const fileName = file.getName();
    
    try {
      const properties = {};
      
      // Use Auto-detected Title Column
      properties[titleColumnName] = { "title": [{ "text": { "content": fileName } }] };
      properties[CONFIG.NOTION.PROPS.FILE_COLUMN] = { "files": [ { "name": fileName, "external": { "url": file.getUrl() } } ] };

      postToNotion({
        "parent": { "database_id": CONFIG.NOTION.DB_ID },
        "properties": properties
      });

      file.moveTo(processedFolder);
      processedCount++;

    } catch (e) {
      Logger.log('Error: ' + e.message);
      writeToLogSheet("Scenario 2", "Error processing file: " + fileName, e.toString());
    }
  }
}


