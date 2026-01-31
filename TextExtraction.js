/**
 * SCENARIO 1: Universal Text Extraction -> Notion Database
 */
function runTextExtractionScenario() {
  const sourceId = CONFIG.FOLDERS.TEXT_EXTRACTION_SOURCE;
  const processedId = CONFIG.FOLDERS.PROCESSED_DESTINATION;

  try {
    var sourceFolder = DriveApp.getFolderById(sourceId);
    var processedFolder = DriveApp.getFolderById(processedId);
    
    // Auto-detect Title Column Name
    var titleColumnName = getDatabaseTitleName(CONFIG.NOTION.DB_ID);
    
  } catch (e) {
    writeToLogSheet("Scenario 1 Setup", "Error", e.message);
    return;
  }
  
  const files = sourceFolder.getFiles();
  let processedCount = 0;

  while (files.hasNext() && processedCount < 10) { 
    const file = files.next();
    const fileName = file.getName();
    if (file.getMimeType() === MimeType.FOLDER || file.getMimeType() === MimeType.SHORTCUT) continue;

    Logger.log('Processing: ' + fileName);

    try {
      const text = extractTextContent(file);
      if (!text) {
        Logger.log("Skipped: Unsupported file type");
        continue; 
      }

      // Use Auto-detected Title Column
      const properties = {};
      properties[titleColumnName] = { 
        "title": [ { "text": { "content": fileName } } ] 
      };

      postToNotion({
        "parent": { "database_id": CONFIG.NOTION.DB_ID },
        "properties": properties,
        "children": createNotionParagraphBlocks(text)
      });

      file.moveTo(processedFolder);
      processedCount++;
      Logger.log('Done: ' + fileName);

    } catch (e) {
      Logger.log('Error: ' + e.message);
      writeToLogSheet("Scenario 1", "Error processing file: " + fileName, e.toString());
    }
  }
}


