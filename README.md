# SPIMF — Sistem Pengurusan Identiti Membership FareezOnzz

## 🔧 Cara Deploy

### 1. Google Sheet
- **ID**: `1tpV7H10l9O17Wm71_HPR3kPWb6r38JgnRs5EJT-6S6k`
- **Sheet 2**: `MEMBERSHIP FONZZ DATABASE`
- **Sheet 5**: `ADMIN CONTROL DATABASE`
- **Kongsi**: "Anyone with the link" → **Editor**

### 2. Google Apps Script
1. Buka [script.google.com](https://script.google.com)
2. Salin kandungan `code.gs`
3. Klik **Deploy > New Deployment > Web App**
   - **Execute as**: Me
   - **Who has access**: **Anyone**
4. Salin **Web App URL** dan gantikan dalam `index.html` pada:
   ```js
   const SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
