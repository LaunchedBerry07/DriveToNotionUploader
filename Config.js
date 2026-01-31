/**
 * CONFIGURATION
 * * Instructions:
 * 1. File > Project Properties > Script Properties
 * 2. Add properties: NOTION_API_KEY
 */
var CONFIG = {
  // *** LOGGING SETTINGS ***
  // Set this to a Google Sheet ID to log errors (e.g., '1xE...'). 
  // Set to null to disable logging.
  LOG_SHEET_ID: '1ybU8UtvC1yLx3UmprUsDidpr515g2h-8Q8B5Plk8mLo', 

  // *** NOTION CONFIGURATION ***
  NOTION: {
    // The Main Database where everything should go now
    DB_ID: '2eac8864-4424-805c-a875-f4bb2c27fc00', 
    
    // The Old Parent Page (Used only for the Migration Script)
    OLD_PARENT_PAGE_ID: '2eac88644424805b9dcdcd07bc9a8df0',
    
    // Database Column Names
    // Note: The 'Title' column name is now auto-detected by the script.
    PROPS: {
      FILE_COLUMN: 'Fichiers'  // The name of the 'Files & media' column
    }
  },

  // *** FOLDER IDs ***
  FOLDERS: {
    TEXT_EXTRACTION_SOURCE: '1RlWe1pFOyTZd65EHzzeT-iMpn1fmBLFi', 
    FILE_LINKING_SOURCE:    '1oVGEiS_u0U-CNtAx-xKMXaKwljGtkNP_',
    PROCESSED_DESTINATION:  '1N9T1RSOrdfu7pqaruwwqdKbLL_INoWXY'
  }
};


