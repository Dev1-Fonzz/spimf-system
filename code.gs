// code.gs
// 📑 Sistem Pengurusan Identiti Membership FareezOnzz (SPIMF)
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
      const value = e.parameter.value !== undefined ? e.parameter.value : (data.value !== undefined ? data.value : '');
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

    // Return JSON tanpa setHeader — biarkan Apps Script handle CORS
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('SPIMF AppScript Error:', error.toString());
    const errResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    return ContentService
      .createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Helper Functions (Sama seperti sebelumnya) ---

function getSheet(sheetType) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  if (sheetType === 'admin') {
    return ss.getSheetByName(ADMIN_SHEET_NAME);
  }
  return ss.getSheetByName(MEMBERSHIP_SHEET_NAME);
}

function handleLogin(sheetType, credentials) {
  const sheet = getSheet(sheetType);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const dataRows = allData.slice(1);

  if (sheetType === 'membership') {
    for (let i = 0; i < dataRows.length; i++) {
      const r = dataRows[i];
      const phone = (r[9] || '').toString().replace(/\D/g, '');
      const inputPhone = (credentials.phone || '').replace(/\D/g, '');
      if (
        (credentials.phone && phone === inputPhone) ||
        (credentials.idCard && r[14] === credentials.idCard) ||
        (credentials.kodeUser && r[15] === credentials.kodeUser) ||
        (credentials.account && r[16] === credentials.account && r[17] === credentials.password)
      ) {
        sheet.getRange(i + 2, 37).setValue('Login: ' + new Date().toLocaleString('ms-MY'));
        const user = {};
        for (let c = 0; c < headers.length; c++) {
          user[c] = r[c] || '';
        }
        return { success: true, user: user, row: i + 2 };
      }
    }

    if (credentials.name) {
      const matches = dataRows.filter(r => (r[6] || '').toLowerCase().includes(credentials.name.toLowerCase()));
      const results = [];
      for (let idx = 0; idx < matches.length; idx++) {
        const obj = {};
        for (let c = 0; c < headers.length; c++) {
          obj[c] = matches[idx][c] || '';
        }
        results.push({
          index: idx,
          user: obj
        });
      }
      return { success: true, found: matches.length, results: results };
    }

  } else if (sheetType === 'admin') {
    for (let i = 0; i < dataRows.length; i++) {
      const r = dataRows[i];
      if (r[1] === credentials.username && r[2] === credentials.password) {
        sheet.getRange(i + 2, 11).setValue('Login: ' + new Date().toLocaleString('ms-MY'));
        const user = {};
        for (let c = 0; c < headers.length; c++) {
          user[c] = r[c] || '';
        }
        return { success: true, user: user, row: i + 2 };
      }
    }
  }

  return { success: false, error: 'Kelayakan tidak sah. Sila semak maklumat anda.' };
}

function fetchSheet(sheetType, row) {
  const sheet = getSheet(sheetType);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (row && row <= data.length) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[c] = data[row - 1][c] || '';
    }
    return { success: true,  obj };
  }

  const list = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[c] = data[i][c] || '';
    }
    list.push(obj);
  }

  return { success: true,  list, total: data.length - 1 };
}

function updateCell(sheetType, row, colIndex, value) {
  if (row == null || colIndex == null) {
    throw new Error('Row or column index is missing');
  }
  const sheet = getSheet(sheetType);
  sheet.getRange(row, colIndex + 1).setValue(value);
  return { success: true, updated: { row: row, col: colIndex, value: value } };
}

function searchByName(name) {
  const sheet = getSheet('membership');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  for (let i = 1; i < data.length; i++) {
    if ((data[i][6] || '').toLowerCase().includes(name.toLowerCase())) {
      const obj = {};
      for (let c = 0; c < headers.length; c++) {
        obj[c] = data[i][c] || '';
      }
      results.push(obj);
    }
  }
  return { success: true, results: results };
}

function getStats() {
  const mem = getSheet('membership').getDataRange().getValues();
  const admin = getSheet('admin').getDataRange().getValues();
  let premium = 0;
  for (let i = 1; i < mem.length; i++) {
    if (mem[i][34] === '🟢PREMIUM') premium++;
  }
  return {
    success: true,
    membershipCount: mem.length - 1,
    adminCount: admin.length - 1,
    premiumCount: premium
  };
}

function getPremiumMembers() {
  const sheet = getSheet('membership');
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][34] === '🟢PREMIUM') {
      list.push({
        name: data[i][6] || '',
        rank: data[i][34] || '',
        contribution: data[i][35] || ''
      });
    }
  }
  return { success: true, premiumMembers: list };
}

function getAdminChart() {
  const sheet = getSheet('admin');
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.push({
      name: data[i][0] || '',
      rank: data[i][6] || '',
      totalMark: data[i][12] || '',
      committeeDate: data[i][9] || ''
    });
  }
  return { success: true, adminChart: list };
}
