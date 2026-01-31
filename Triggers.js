/**
 *  * MASTER RUNNER
  * Executes all scenarios sequentially
   */
   function runAllJobs() {
     Logger.log("--- STARTING SCHEDULED JOBS ---");

       // JOB 1: Text Extraction (Drive -> Notion DB)
         try {
             Logger.log("Running: Text Extraction...");
                 runTextExtractionScenario();
                   } catch (e) {
                       Logger.log("FAILED: Text Extraction. Error: " + e.message);
                         }

                           // JOB 2: File Linking (Drive Link -> Notion DB)
                             try {
                                 Logger.log("Running: File Linking...");
                                     runFileLinkScenario();
                                       } catch (e) {
                                           Logger.log("FAILED: File Linking. Error: " + e.message);
                                             }

                                               // JOB 3: Migration (Old Pages -> Notion DB)
                                                 try {
                                                     Logger.log("Running: Migration (Page Cleanup)...");
                                                         runMigrationScenario();
                                                           } catch (e) {
                                                               Logger.log("FAILED: Migration. Error: " + e.message);
                                                                 }
                                                                   
                                                                     Logger.log("--- ALL JOBS COMPLETED ---");
                                                                     }

                                                                     /**
                                                                      * SETUP AUTOMATION
                                                                       * Run this function once manually to start the automation.
                                                                        */
                                                                        function setupTrigger() {
                                                                          const functionName = 'runAllJobs'; // Master Runner
                                                                            
                                                                              // 1. Delete existing triggers (Clean slate)
                                                                                const allTriggers = ScriptApp.getProjectTriggers();
                                                                                  for (const trigger of allTriggers) {
                                                                                      // We delete ANY time-based trigger to ensure we don't have duplicates
                                                                                          if (trigger.getHandlerFunction() === 'runTextExtractionScenario' || 
                                                                                                  trigger.getHandlerFunction() === 'runAllJobs') {
                                                                                                        ScriptApp.deleteTrigger(trigger);
                                                                                                            }
                                                                                                              }

                                                                                                                // 2. Create a new trigger (Every 15 minutes)
                                                                                                                  ScriptApp.newTrigger(functionName)
                                                                                                                      .timeBased()
                                                                                                                          .everyMinutes(15) 
                                                                                                                              .create();

                                                                                                                                Logger.log("SUCCESS: Automation updated. '" + functionName + "' will now run every 15 minutes.");
                                                                                                                                }

                                                                                                                                /**
                                                                                                                                 * STOP AUTOMATION
                                                                                                                                  */
                                                                                                                                  function stopAllTriggers() {
                                                                                                                                    const allTriggers = ScriptApp.getProjectTriggers();
                                                                                                                                      for (const trigger of allTriggers) {
                                                                                                                                          ScriptApp.deleteTrigger(trigger);
                                                                                                                                            }
                                                                                                                                              Logger.log("SUCCESS: All automation stopped.");
                                                                                                                                              }



 
