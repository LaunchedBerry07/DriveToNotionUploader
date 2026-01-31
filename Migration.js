/**
 * SCENARIO 3: Migration (Move Pages to Database)
 * Moves pages from the Old Parent Page -> Notion Database
 */
function runMigrationScenario() {
  const oldParentId = CONFIG.NOTION.OLD_PARENT_PAGE_ID;
  const newDbId = CONFIG.NOTION.DB_ID;

  if (!oldParentId || !newDbId) return;

  try {
    // 0. Auto-detect the Title Column Name
    // This solves the "Invalid property identifier" error
    const titleColumnName = getDatabaseTitleName(newDbId);

    // 1. Get Children of the Old Parent Page
    const children = getNotionBlockChildren(oldParentId);
    let processedCount = 0;

    for (const block of children) {
      if (block.type === 'child_page' && !block.archived) {
        
        const pageTitle = block.child_page.title;
        const pageId = block.id;
        
        Logger.log("Migrating: '" + pageTitle + "'");

        // 2. Prepare Payload with AUTO-DETECTED title name
        const properties = {};
        properties[titleColumnName] = {
          "title": [ { "text": { "content": pageTitle } } ] 
        };

        const payload = {
          "parent": { "database_id": newDbId },
          "properties": properties
        };

        try {
          // 3. Send Update
          const response = patchNotionPage(pageId, payload);
          
          // 4. Verify
          const newParentId = response.parent.database_id || response.parent.page_id;
          const normNewParent = newParentId ? newParentId.replace(/-/g, '') : '';
          const normTargetDb = newDbId.replace(/-/g, '');

          if (normNewParent === normTargetDb) {
             Logger.log("SUCCESS: Moved.");
             processedCount++;
          } else {
             Logger.log("WARNING: Move technically succeeded but parent didn't change.");
          }

        } catch (moveError) {
          Logger.log("Failed to move: " + moveError.message);
          writeToLogSheet("Scenario 3", "Move Failed", moveError.toString());
        }
      }
    }
    
    if (processedCount === 0) Logger.log("No migratable pages found in this batch.");

  } catch (e) {
    Logger.log('Migration Critical Error: ' + e.message);
    writeToLogSheet("Scenario 3", "Error", e.toString());
  }
}


