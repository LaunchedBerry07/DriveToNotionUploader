/**
 *  * SHARED UTILITIES
  * VERSION: Drive API v3 Compatible
   */

   /**
    * Writes an error message to the Google Sheet defined in CONFIG
     */
     function writeToLogSheet(scenario, message, details) {
       if (!CONFIG.LOG_SHEET_ID || CONFIG.LOG_SHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
           Logger.log("LOGGING SKIPPED: No Sheet ID provided in Config.gs");
               return;
                 }
                   
                     try {
                         const ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
                             const sheet = ss.getSheets()[0];
                                 sheet.appendRow([new Date(), scenario, message, details]);
                                   } catch (e) {
                                       Logger.log("CRITICAL: Could not write to log sheet. " + e.toString());
                                         }
                                         }

                                         /**
                                          * MAIN TEXT EXTRACTION DISPATCHER
                                           * Routes the file to the correct extraction method based on type
                                            */
                                            function extractTextContent(file) {
                                              const mime = file.getMimeType();
                                                const name = file.getName().toLowerCase();
                                                  
                                                    Logger.log("Extracting text for: " + name + " (" + mime + ")");

                                                      if (mime === MimeType.GOOGLE_DOCS) {
                                                          return DocumentApp.openById(file.getId()).getBody().getText();
                                                            }

                                                              if (name.endsWith('.md')) {
                                                                  return file.getBlob().getDataAsString();
                                                                    }

                                                                      if (mime === MimeType.PDF || 
                                                                            mime === MimeType.MICROSOFT_WORD || 
                                                                                  name.endsWith('.docx') || 
                                                                                        mime === MimeType.HTML || 
                                                                                              name.endsWith('.html')) {
                                                                                                  return convertCompatibleFileToText(file);
                                                                                                    }

                                                                                                      return null;
                                                                                                      }

                                                                                                      /**
                                                                                                       * Converts Compatible Files (PDF, DOCX, HTML) to Text using Drive API
                                                                                                        */
                                                                                                        function convertCompatibleFileToText(file) {
                                                                                                          const blob = file.getBlob();
                                                                                                            const filename = file.getName();
                                                                                                              
                                                                                                                const resource = {
                                                                                                                    name: "TEMP_CONVERT_" + filename,
                                                                                                                        mimeType: "application/vnd.google-apps.document"
                                                                                                                          };

                                                                                                                            let tempFile;

                                                                                                                              try {
                                                                                                                                  tempFile = Drive.Files.create(resource, blob);
                                                                                                                                    } catch (e) {
                                                                                                                                        throw new Error("Drive.Files.create failed. Ensure 'Drive API' service is enabled. Details: " + e.message);
                                                                                                                                          }

                                                                                                                                            try {
                                                                                                                                                const doc = DocumentApp.openById(tempFile.id);
                                                                                                                                                    const text = doc.getBody().getText();
                                                                                                                                                        try { Drive.Files.remove(tempFile.id); } catch(e) { Logger.log("Warning: Could not delete temp file " + tempFile.id); }
                                                                                                                                                            return text;
                                                                                                                                                              } catch (e) {
                                                                                                                                                                  if (tempFile) {
                                                                                                                                                                        try { Drive.Files.remove(tempFile.id); } catch(e2) {}
                                                                                                                                                                            }
                                                                                                                                                                                throw new Error("Error reading temp doc: " + e.message);
                                                                                                                                                                                  }
                                                                                                                                                                                  }

                                                                                                                                                                                  /**
                                                                                                                                                                                   * Splits text into 2000-char blocks for Notion
                                                                                                                                                                                    */
                                                                                                                                                                                    function createNotionParagraphBlocks(text) {
                                                                                                                                                                                      const MAX_LEN = 2000;
                                                                                                                                                                                        const blocks = [];
                                                                                                                                                                                          if (!text) return [];

                                                                                                                                                                                            for (let i = 0; i < text.length; i += MAX_LEN) {
                                                                                                                                                                                                blocks.push({
                                                                                                                                                                                                      "object": "block", 
                                                                                                                                                                                                            "type": "paragraph", 
                                                                                                                                                                                                                  "paragraph": { 
                                                                                                                                                                                                                          "rich_text": [{ "type": "text", "text": { "content": text.substring(i, i + MAX_LEN) } }] 
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                        return blocks;
                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                        /**
                                                                                                                                                                                                                                         * Sends NEW data to Notion API (Create Page)
                                                                                                                                                                                                                                          */
                                                                                                                                                                                                                                          function postToNotion(payload) {
                                                                                                                                                                                                                                            const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
                                                                                                                                                                                                                                              if (!apiKey) throw new Error("NOTION_API_KEY is missing in Script Properties");
                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                  const url = 'https://api.notion.com/v1/pages';
                                                                                                                                                                                                                                                    const options = {
                                                                                                                                                                                                                                                        'method': 'post',
                                                                                                                                                                                                                                                            'headers': { 
                                                                                                                                                                                                                                                                  'Authorization': 'Bearer ' + apiKey, 
                                                                                                                                                                                                                                                                        'Content-Type': 'application/json', 
                                                                                                                                                                                                                                                                              'Notion-Version': '2022-06-28' 
                                                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                                                      'payload': JSON.stringify(payload),
                                                                                                                                                                                                                                                                                          'muteHttpExceptions': true
                                                                                                                                                                                                                                                                                            };

                                                                                                                                                                                                                                                                                              const response = UrlFetchApp.fetch(url, options);
                                                                                                                                                                                                                                                                                                const json = JSON.parse(response.getContentText());
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                    if (json.object === 'error') {
                                                                                                                                                                                                                                                                                                        throw new Error('Notion API Error: ' + json.message + ' (' + json.code + ')');
                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                            return json;
                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                            
                         