// Check what dayIdx today maps to in WIB timezone
const now = new Date();
const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
const jsDay = wibNow.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

// App convention: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
const todayDayIdx = jsDay === 0 ? 6 : jsDay - 1;

console.log('Current UTC time:', now.toUTCString());
console.log('WIB time:', wibNow.toUTCString());
console.log('JS getUTCDay():', jsDay, '(0=Sun, 1=Mon...)');
console.log('App todayDayIdx:', todayDayIdx, '(0=Mon, 6=Sun)');
console.log('Today date string:', `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth()+1).padStart(2,'0')}-${String(wibNow.getUTCDate()).padStart(2,'0')}`);
