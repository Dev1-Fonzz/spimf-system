// code.gs — Sistem Pengurusan Identiti Membership FareezOnzz (SPIMF)
// Hak Cipta © 22 November 2025

const SHEET_ID = '1tpV7H10l9O17Wm71_HPR3kPWb6r38JgnRs5EJT-6S6k';
const MEMBERSHIP_SHEET_NAME = 'MEMBERSHIP FONZZ DATABASE';
const ADMIN_SHEET_NAME = 'ADMIN CONTROL DATABASE';

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return ContentService.createTextOutput().setHeaders(headers);
  }

  try {
    const action = e.parameter.action || '';
    const sheetType = e.parameter.sheetType || 'membership';
    const row = e.parameter.row ? parseInt(e.parameter.row) : null;
    const data = e.postData ? JSON.parse(e.postData.contents) : {};

    let response;

    if (action === 'login') {
      response = handleLogin(sheetType, data);
    } else if (action === 'fetchSheet') {
      response = fetchSheet(sheetType, row);
    } else if (action === 'updateCell') {
      response = updateCell(sheetType, row, data.columnIndex, data.value);
    } else if (action === 'searchByName') {
      response = searchByName(data.name);
    } else if (action === 'getStats') {
      response = getStats();
    } else if (action === 'getPremiumMembers') {
      response = getPremiumMembers();
    } else if (action === 'getAdminChart') {
      response = getAdminChart();
    } else {
      throw new Error('Invalid action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setHeaders(headers);

  } catch (error) {
    console.error('SPIMF AppScript Error:', error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setHeaders(headers);
  }
}

// --- HELPER: Ambil sheet berdasarkan jenis
function getSheet(sheetType) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  if (sheetType === 'admin') {
    return ss.getSheetByName(ADMIN_SHEET_NAME);
  }
  return ss.getSheetByName(MEMBERSHIP_SHEET_NAME);
}

// --- LOGIN
function handleLogin(sheetType, credentials) {
  const sheet = getSheet(sheetType);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const dataRows = rows.slice(1);

  let matchedRow = null;
  let rowIndex = -1;

  if (sheetType === 'membership') {
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const phone = (row[9] || '').toString().replace(/\D/g, '');
      const inputPhone = (credentials.phone || '').replace(/\D/g, '');

      if (
        (credentials.phone && phone === inputPhone) ||
        (credentials.idCard && row[14] === credentials.idCard) ||
        (credentials.kodeUser && row[15] === credentials.kodeUser) ||
        (credentials.account && row[16] === credentials.account && row[17] === credentials.password)
      ) {
        matchedRow = row;
        rowIndex = i + 2;
        break;
      }
    }

    if (!matchedRow && credentials.name) {
      const matches = dataRows.filter(r => (r[6] || '').toLowerCase().includes(credentials.name.toLowerCase()));
      return {
        success: true,
        found: matches.length,
        results: matches.map((r, idx) => ({ ...formatRow(r, headers), index: idx }))
      };
    }

  } else if (sheetType === 'admin') {
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row[1] === credentials.username && row[2] === credentials.password) {
        matchedRow = row;
        rowIndex = i + 2;
        break;
      }
    }
  }

  if (matchedRow) {
    const colLog = sheetType === 'membership' ? 37 : 11; // AL=37, L=11
    sheet.getRange(rowIndex, colLog).setValue(`Login: ${new Date().toLocaleString('ms-MY')}`);
    return {
      success: true,
      user: formatRow(matchedRow, headers),
      row: rowIndex
    };
  } else {
    return { success: false, error: 'Kelayakan tidak sah. Sila semak maklumat anda.' };
  }
}

// --- FETCH
function fetchSheet(sheetType, row = null) {
  const sheet = getSheet(sheetType);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  if (row && row <= rows.length) {
    return { success: true, data: formatRow(rows[row - 1], headers) };
  }
  return {
    success: true,
    data: rows.slice(1).map(r => formatRow(r, headers)),
    total: rows.length - 1
  };
}

// --- UPDATE
function updateCell(sheetType, row, colIndex, value) {
  const sheet = getSheet(sheetType);
  sheet.getRange(row, colIndex + 1).setValue(value);
  return { success: true, updated: { row, col: colIndex, value } };
}

// --- SEARCH
function searchByName(name) {
  const sheet = getSheet('membership');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const results = rows.slice(1).filter(r => (r[6] || '').toLowerCase().includes(name.toLowerCase()));
  return {
    success: true,
    results: results.map(r => formatRow(r, headers))
  };
}

// --- STATS
function getStats() {
  const memSheet = getSheet('membership');
  const adminSheet = getSheet('admin');
  const memData = memSheet.getDataRange().getValues();
  const adminData = adminSheet.getDataRange().getValues();

  const premiumCount = memData.filter(r => r[34] === '🟢PREMIUM').length; // AI = col 35 → index 34

  return {
    success: true,
    membershipCount: memData.length - 1,
    adminCount: adminData.length - 1,
    premiumCount: premiumCount
  };
}

// --- PREMIUM MEMBERS (🟢PREMIUM sahaja)
function getPremiumMembers() {
  const sheet = getSheet('membership');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const premium = rows.slice(1).filter(r => r[34] === '🟢PREMIUM'); // AI
  return {
    success: true,
    data: premium.map(r => ({
      name: r[6] || '',
      rank: r[34] || '',
      contribution: r[35] || '' // AJ = 36 → index 35
    }))
  };
}

// --- ADMIN CHART
function getAdminChart() {
  const sheet = getSheet('admin');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return {
    success: true,
    data: rows.slice(1).map(r => ({
      name: r[0] || '',
      rank: r[6] || '',
      mark: r[12] || '', // M = 13 → index 12
      committeeDate: r[9] || '' // J = 10 → index 9
    }))
  };
}

// --- Helper: format row jadi objek (tapi guna index, bukan nama kolum)
function formatRow(row, headers) {
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    obj[i] = row[i] || '';
  }
  return obj;
}
