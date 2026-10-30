// Google Sheet / Webhook endpoint configuration for collecting Access Requests
// You can set VITE_SHEET_ENDPOINT in a .env file or update the default URL here.

export const CONFIG = {
  // Connected Google Apps Script Web App Endpoint:
  googleSheetEndpoint: import.meta.env.VITE_SHEET_ENDPOINT || 'https://script.google.com/macros/s/AKfycbwDTpXlqrtqaN5Wkp8IhxBdFB1auDPHKVc2EIbm9dNfeu6wqEFqD9YG90QUHUehivfe0A/exec',
  
  // Sheet column mappings
  columns: [
    'Timestamp',
    'Ticket_ID',
    'Full_Name',
    'Contact_Info',
    'Care_Role',
    'Corridor_Location',
    'Care_Needs_Notes'
  ]
};
