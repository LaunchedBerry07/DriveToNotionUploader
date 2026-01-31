/**
 *  * SCENARIO 1: Universal Text Extraction -> Notion Database
  * Supported: PDF, DOCX, HTML, Markdown, Google Docs
   */
   function runTextExtractionScenario() {
     const sourceId = CONFIG.FOLDERS.TEXT_EXTRACTION_SOURCE;
       const processedId = CONFIG.FOLDERS.PROCESSED_DESTINATION;

         try {
             var sourceFolder = DriveApp.getFolderById(sourceId);
                 var processedFolder = DriveApp.getFolderById(processedId);
                   } catch (e) {
                       writeToLogSheet("Scenario 1 Setup", "Folder Access Error", e.message);
                           return;
                             }
                               
                                 // We get ALL files
                                   const files = sourceFolder.getFiles();
                                     let processedCount = 0;

                                       // Process up to 10 files per execution
                                         while (files.hasNext() && processedCount < 10) { 
                                             const file = files.next();
                                                 const fileName = file.getName();
                                                     
                                                         // Skip if we accidentally picked up a folder or a shortcut
                                                             if (file.getMimeType() === MimeType.FOLDER || file.getMimeType() === MimeType.SHORTCUT) continue;

                                                                 Logger.log('Processing: ' + fileName);

                                                                     try {
                                                                           // 1. Universal Text Extraction
                                                                                 const text = extractTextContent(file);

                                                                                       if (!text) {
                                                                                               Logger.log("Skipped: Unsupported file type for " + fileName);
                                                                                                       continue; 
                                                                                                             }

                                                                                                                   // 2. Post to Notion DATABASE (Changed from Page)
                                                                                                                         const properties = {};
                                                                                                                               // Set the Title property of the database entry
                                                                                                                                     properties[CONFIG.NOTION.PROPS.TITLE_COLUMN] = { 
                                                                                                                                             "title": [ { "text": { "content": fileName } } ] 
                                                                                                                                                   };

                                                                                                                                                         postToNotion({
                                                                                                                                                                 "parent": { "database_id": CONFIG.NOTION.DB_ID }, // Points to DB now
                                                                                                                                                                         "properties": properties,
                                                                                                                                                                                 "children": createNotionParagraphBlocks(text)
                                                                                                                                                                                       });

                                                                                                                                                                                             // 3. Move to Processed Folder
                                                                                                                                                                                                   file.moveTo(processedFolder);
                                                                                                                                                                                                         processedCount++;
                                                                                                                                                                                                               Logger.log('Successfully processed and moved: ' + fileName);

                                                                                                                                                                                                                   } catch (e) {
                                                                                                                                                                                                                         Logger.log('Error: ' + e.message);
                                                                                                                                                                                                                               writeToLogSheet("Scenario 1", "Error processing file: " + fileName, e.toString());
                                                                                                                                                                                                                                   }
                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                     }



 
