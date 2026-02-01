/*******************************
 * Robust Migration Implementation
 *******************************/

/**
 * Helper: fetch JSON from Notion (GET)
 */
function notionGet(url) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  if (!apiKey) throw new Error('Missing NOTION_API_KEY in Script Properties');
  const opts = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Notion-Version': '2022-06-28'
    },
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, opts);
  const code = resp.getResponseCode();
  const body = resp.getContentText();
  try {
    return { code: code, json: JSON.parse(body), raw: body };
  } catch (e) {
    return { code: code, json: null, raw: body };
  }
}

/**
 * Helper: POST to Notion
 */
function notionPost(url, payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  if (!apiKey) throw new Error('Missing NOTION_API_KEY in Script Properties');
  const opts = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, opts);
  const code = resp.getResponseCode();
  const body = resp.getContentText();
  try { return { code: code, json: JSON.parse(body), raw: body }; }
  catch (e) { return { code: code, json: null, raw: body }; }
}

/**
 * Helper: PATCH to Notion
 */
function notionPatch(url, payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  if (!apiKey) throw new Error('Missing NOTION_API_KEY in Script Properties');
  const opts = {
    method: 'patch',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, opts);
  const code = resp.getResponseCode();
  const body = resp.getContentText();
  try { return { code: code, json: JSON.parse(body), raw: body }; }
  catch (e) { return { code: code, json: null, raw: body }; }
}

/**
 * Get children blocks for a block or page id (handles pagination)
 */
function getNotionBlockChildrenAll(blockId) {
  const pageSize = 100;
  let cursor = null;
  const all = [];
  do {
    const url = 'https://api.notion.com/v1/blocks/' + blockId + '/children?page_size=' + pageSize + (cursor ? '&start_cursor=' + encodeURIComponent(cursor) : '');
    const r = notionGet(url);
    Logger.log('getNotionBlockChildrenAll response code: ' + r.code);
    if (r.code !== 200) {
      throw new Error('Failed to get block children: ' + r.raw);
    }
    const results = r.json.results || [];
    all.push.apply(all, results);
    cursor = r.json.next_cursor;
  } while (cursor);
  return all;
}

/**
 * Get database title property name
 */
function getDatabaseTitleName(dbId) {
  const url = 'https://api.notion.com/v1/databases/' + dbId;
  const r = notionGet(url);
  if (r.code !== 200) throw new Error('Failed to get database schema: ' + r.raw);
  const props = r.json.properties;
  for (const key in props) {
    if (props[key].type === 'title') return key;
  }
  throw new Error('No title property found on database ' + dbId);
}

/**
 * Extract plain text from a Notion block (supports paragraph, headings, list items)
 */
function extractPlainTextFromBlock(block) {
  const types = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'quote', 'callout'];
  for (const t of types) {
    if (block[t] && block[t].rich_text) {
      return block[t].rich_text.map(rt => rt.plain_text || (rt.text && rt.text.content) || '').join('');
    }
  }
  // fallback: return empty string for unsupported types
  return '';
}

/**
 * Get combined plain text for a page (reads blocks and concatenates)
 */
function getPagePlainText(pageId) {
  const blocks = getNotionBlockChildrenAll(pageId);
  const pieces = blocks.map(extractPlainTextFromBlock).filter(s => s && s.trim().length > 0);
  return pieces.join('\n\n');
}

/**
 * Create a page in database with Title and content text appended as paragraph blocks
 */
function createPageInDbWithText(dbId, titlePropName, titleText, bodyText) {
  const payload = {
    parent: { database_id: dbId },
    properties: {}
  };
  payload.properties[titlePropName] = {
    title: [{ text: { content: titleText } }]
  };

  const createResp = notionPost('https://api.notion.com/v1/pages', payload);
  if (createResp.code !== 200) {
    throw new Error('Failed to create page in DB: ' + createResp.raw);
  }
  const newPageId = createResp.json.id;

  // Convert bodyText to 2k chunks
  const blocks = createNotionParagraphBlocks(bodyText);
  if (blocks.length > 0) {
    const appendPayload = { children: blocks };
    const appendResp = notionPatch('https://api.notion.com/v1/blocks/' + newPageId + '/children', appendPayload);
    if (appendResp.code !== 200) {
      // Not a blocker — log and continue
      Logger.log('Warning: failed to append children: ' + appendResp.raw);
      writeToLogSheet('Migration', 'AppendChildrenFailed', 'Page: ' + newPageId + ' Resp: ' + appendResp.raw);
    }
  }
  return createResp.json;
}

/**
 * Archive original page (safest cleanup)
 */
function archiveNotionPage(pageId) {
  const payload = { archived: true };
  const r = notionPatch('https://api.notion.com/v1/pages/' + pageId, payload);
  if (r.code !== 200) {
    Logger.log('Warning: failed to archive page ' + pageId + ': ' + r.raw);
    writeToLogSheet('Migration', 'ArchiveFailed', 'Page: ' + pageId + ' Resp: ' + r.raw);
  } else {
    Logger.log('Archived original page ' + pageId);
  }
}

/**
 * Main: robust migration
 */
function runMigrationScenario() {
  const oldParentId = CONFIG.NOTION.OLD_PARENT_PAGE_ID;
  const newDbId = CONFIG.NOTION.DB_ID;
  if (!oldParentId || !newDbId) {
    Logger.log('Migration skipped: missing OLD_PARENT_PAGE_ID or DB_ID');
    return;
  }

  try {
    const titleColumnName = getDatabaseTitleName(newDbId);
    Logger.log('Detected title column: ' + titleColumnName);

    // read children of old parent
    const children = getNotionBlockChildrenAll(oldParentId);
    Logger.log('Found ' + children.length + ' child blocks under old parent.');

    let processedCount = 0;
    for (const block of children) {
      // Notion returns many block types; target child_page blocks
      if (block.type === 'child_page' && !block.archived) {
        const pageTitle = block.child_page && block.child_page.title ? block.child_page.title : 'Untitled';
        const pageId = block.id;
        Logger.log('Migrating page: ' + pageTitle + ' (' + pageId + ')');

        try {
          // 1) Extract plain text of the original page
          const pageText = getPagePlainText(pageId);
          // 2) Create new page in DB with extracted text
          const created = createPageInDbWithText(newDbId, titleColumnName, pageTitle, pageText);
          Logger.log('Created new DB page: ' + (created.id || JSON.stringify(created)));

          // 3) Archive original page (optional but recommended)
          archiveNotionPage(pageId);

          processedCount++;
        } catch (moveError) {
          Logger.log('Failed migrating page ' + pageTitle + ': ' + moveError.message);
          writeToLogSheet('Scenario 3', 'Move Failed: ' + pageTitle, moveError.toString());
        }
      } else {
        Logger.log('Skipping block type=' + block.type + ' id=' + block.id);
      }
    }
    if (processedCount === 0) Logger.log('No migratable pages found.');
    else Logger.log('Migration complete. Processed count: ' + processedCount);

  } catch (e) {
    Logger.log('Migration Critical Error: ' + e.message);
    writeToLogSheet('Scenario 3', 'Error', e.toString());
    throw e;
  }
}

/**
 * Test helper: run with a single page
 */
function runMigrationScenario_test() {
  // override to test one specific parent id — change to a page that only has a couple child pages
  runMigrationScenario();
}