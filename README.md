# SPIMF — Sistem Pengurusan Identiti Membership FareezOnzz

## 🔧 Cara Deploy

1. **Google Sheet**:  
   - ID: `1tpV7H10l9O17Wm71_HPR3kPWb6r38JgnRs5EJT-6S6k`  
   - Sheet 2: `MEMBERSHIP FONZZ DATABASE`  
   - Sheet 5: `ADMIN CONTROL DATABASE`  
   - Tetapan: **"Anyone with the link can edit"**

2. **Google Apps Script**:  
   - Salin kandungan `code.gs` ke [script.google.com](https://script.google.com)  
   - Klik **Deploy > New Deployment > Web App**  
   - Akses: **"Anyone"**  
   - Salin **Web App URL** dan gantikan di `index.html` pada baris:  
     ```js
     const SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
     ```

3. **GitHub**:  
   - Commit hanya 4 fail: `index.html`, `code.gs`, `vercel.json`, `README.md`

4. **Vercel**:  
   - Import repo GitHub  
   - Deploy — siap!

## ⚠️ Nota Penting
- Semua data dari Google Sheet — tiada `localStorage`
- Waktu operasi: 6:00 pagi – 2:45 pagi
- Kata laluan luar waktu: `SPIMFONWER`
- Fungsi `doGet` wajib ada — jangan padam
- Semua rujukan kolum guna **index nombor** (A=0, B=1, ..., AI=34)

Hak Cipta © 22 November 2025
