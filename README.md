**Google Drive to Notion Automation & Migration**

This Google Apps Script project automates the workflow between Google Drive folders and a Notion Database. It handles text extraction from documents, creates file links, and includes a migration tool to move legacy pages into a structured database.

🚀 Key Features

1. Text Extraction (TextExtraction.gs)
 * Source: Monitors a specific Google Drive folder.
 * Action: Extracts text content from PDFs, Google Docs, Word Documents (.docx), HTML, and Markdown files.
 * Destination: Creates a new entry in your Notion Database with the file name as the Title and the extracted text as the page content.
 * Cleanup: Moves processed files to a "Processed" folder.
 * Smart Feature: Automatically converts binary files (PDF/Docx) to temporary Google Docs to extract text accurately using the Drive API.
2. File Linking (FileLink.gs)
 * Source: Monitors a specific Google Drive folder.
 * Action: Takes any file type.
 * Destination: Creates a new entry in your Notion Database.
   * Title: File Name.
   * Files Property: A direct external link to the file in Google Drive.
 * Cleanup: Moves processed files to a "Processed" folder.
3. Legacy Migration (Migration.gs)
 * Action: Scans a specific "Old Parent Page" in Notion.
 * Logic: Identifies child pages located inside that parent page.
 * Migration: Moves them into the main Notion Database.
 * Safety: Automatically detects the correct "Title" column name in your database to prevent API errors during the move.
4. Smart Configuration
 * Auto-Detection: The script automatically queries your Notion Database to find the internal ID of your "Title" column (e.g., whether it's named "Name", "ID", or "Title"). This prevents Invalid property identifier errors.
   
🛠️ Prerequisites

 * Google Account with access to Google Drive.
 * Notion Integration Token:
   * Go to My Integrations.
   * Create a generic "Internal Integration".
   * Connect this integration to your target Database and Parent Page (Click "..." > "Connect to" in Notion).
 * Folder IDs: The IDs of your source and destination folders in Google Drive.
   
⚙️ Installation & Setup

 * Create Script: Open script.google.com and create a new project.
 * Copy Files: Copy the contents of the .gs files provided into the editor:
   * Config.gs
   * Utilities.gs
   * TextExtraction.gs
   * FileLink.gs
   * Migration.gs
   * Triggers.gs
 * Enable Drive API:
   * In the Script Editor, click Services (left sidebar).
   * Select Drive API.
   * Version: v3.
   * Click Add.
 * Set Script Properties:
   * Go to Project Settings (Gear icon).
   * Scroll to Script Properties.
   * Add a new property:
     * Property: NOTION_API_KEY
     * Value: secret_your_notion_integration_token_here
       
📝 Configuration (Config.gs)

Open Config.gs and update the IDs.

Note: You do not need to configure the 'Title' column name. The script detects it automatically.

🏃 Usage

Manual Run
 * Open Triggers.gs.
 * Select the function runAllJobs.
 * Click Run.
 * Check the Execution Log to see the progress.
   
Automated Trigger
To run the script automatically every 15 minutes:
 * Open Triggers.gs.
 * Run the function setupTrigger() once.
 * This will delete old triggers and create a new one for runAllJobs.
   
⚠️ Important Notes

 * Batch Limits: The scripts are configured to process 10 files/pages per execution. This prevents the script from timing out (Google Apps Script has a 6-minute limit). If you have 50 files, it will take 5 runs (75 minutes) to clear the queue.
 * File Support:
   * Text Extraction supports: PDF, DOCX, Google Docs, HTML, MD.
   * Images (JPG/PNG) inside these folders will be skipped (logged as unsupported) and remain in the source folder.
 * Migration Verification: The migration script performs a verification step. If the Notion API returns "Success" but the page didn't actually move, it will log a WARNING.
   
🐛 Troubleshooting

 * Error: "Invalid property identifier"
   * Ensure Utilities.gs is updated to the version containing getDatabaseTitleName. The script relies on this to handle column naming differences.
 * Error: "Drive API not enabled"
   * Make sure you added the Drive API service in the left sidebar of the script editor.
 * Script runs but nothing happens in Notion
   * Ensure your Notion Integration is connected to the specific Database and Parent Page. (Open Page -> ... -> Connect to -> Select your bot).
<!-- end list -->

