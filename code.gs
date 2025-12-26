// code.gs — Sistem Pengurusan Identiti Membership FareezOnzz (SPIMF)
// © Hak Cipta Terpelihara Sejak 22 November 2025

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
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return output.setContent(JSON.stringify({ success: true }));
  }

  try {
    const action = e.parameter.action || '';
    const sheetType = e.parameter.sheetType || 'membership';
    const row = e.parameter.row ? parseInt(e.parameter.row) : null;
    const data = method === 'POST' && e.postData ? JSON.parse(e.postData.contents) : {};

    let response;

    if (action === 'login') {
      response = handleLogin(sheetType, data);
    } else if (action === 'fetchSheet') {
      response = fetchSheet(sheetType, row);
    } else if (action === 'updateCell') {
      const colIndex = parseInt(e.parameter.columnIndex);
      const value = e.parameter.value || (data.value !== undefined ? data.value : '');
      response = updateCell(sheetType, row, colIndex, value);
    } else if (action === 'searchByName') {
      response = searchByName(data.name || e.parameter.name);
    } else if (action === 'getStats') {
      response = getStats();
    } else if (action === 'getPremiumMembers') {
      response = getPremiumMembers();
    } else if (action === 'getAdminChart') {
      response = getAdminChart();
    } else {
      throw new Error('Invalid action: ' + action);
    }

    return output.setContent(JSON.stringify(response));

  } catch (error) {
    console.error('SPIMF AppScript Error:', error.toString());
    return output.setContent(JSON.stringify({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    }));
  }
}

function getSheet(sheetType) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  if (sheetType === 'admin') {
    return ss.getSheetByName(ADMIN_SHEET_NAME);
  }
  return ss.getSheetByName(MEMBERSHIP_SHEET_NAME);
}

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
      const results = dataRows.filter(r => (r[6] || '').toLowerCase().includes(credentials.name.toLowerCase()));
      return {
        success: true,
        found: results.length,
        results: results.map((r, idx) => ({ index: idx, user: formatRowToObject(r, headers) }))
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
    const logCol = sheetType === 'membership' ? 37 : 11;
    sheet.getRange(rowIndex, logCol).setValue(`Login: ${new Date().toLocaleString('ms-MY')}`);
    return {
      success: true,
      user: formatRowToObject(matchedRow, headers),
      row: rowIndex
    };
  } else {
    return { success: false, error: 'Kelayakan tidak sah. Sila semak maklumat anda.' };
  }
}

function fetchSheet(sheetType, row = null) {
  const sheet = getSheet(sheetType);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  if (row && row <= data.length) {
    return { success: true,  formatRowToObject(data[row - 1], headers) };
  }
  return {
    success: true,
     data.slice(1).map(r => formatRowToObject(r, headers)),
    total: data.length - 1
  };
}

function updateCell(sheetType, row, colIndex, value) {
  const sheet = getSheet(sheetType);
  sheet.getRange(row, colIndex + 1).setValue(value);
  return { success: true, updated: { row, col: colIndex, value } };
}

function searchByName(name) {
  const sheet = getSheet('membership');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const results = rows.filter(r => (r[6] || '').toLowerCase().includes(name.toLowerCase()));
  return {
    success: true,
    results: results.map(r => formatRowToObject(r, headers))
  };
}

function getStats() {
  const mem = getSheet('membership').getDataRange().getValues();
  const adm = getSheet('admin').getDataRange().getValues();
  const premium = mem.filter(r => r[34] === '🟢PREMIUM').length;
  return {
    success: true,
    membershipCount: mem.length - 1,
    adminCount: adm.length - 1,
    premiumCount: premium
  };
}

function getPremiumMembers() {
  const sheet = getSheet('membership');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const premium = rows.filter(r => r[34] === '🟢PREMIUM');
  return {
    success: true,
     premium.map(r => ({
      name: r[6] || '',
      rank: r[34] || '',
      contribution: r[35] || ''
    }))
  };
}

function getAdminChart() {
  const sheet = getSheet('admin');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  return {
    success: true,
     rows.map(r => ({
      name: r[0] || '',
      rank: r[6] || '',
      totalMark: r[12] || '',
      committeeDate: r[9] || ''
    }))
  };
}

function formatRowToObject(row, headers) {
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    obj[i] = row[i] === null || row[i] === undefined ? '' : row[i];
  }
  return obj;
}
