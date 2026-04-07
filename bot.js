// ============================================================
// 🤖 بوت تلغرام - Bio CV
// ============================================================
// تعليمات التثبيت:
// 1. npm install node-telegram-bot-api
// 2. غيّر TOKEN و ADMIN_ID بياناتك
// 3. node bot.js
// ============================================================

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// ===== الإعدادات =====
const TOKEN = 'ضع_توكن_البوت_هنا';        // من @BotFather
const ADMIN_ID = 123456789;                 // Chat ID الخاص بك
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== تحميل/حفظ البيانات =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = { cases: [], videos: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== تشغيل البوت =====
const bot = new TelegramBot(TOKEN, { polling: true });

// حالة المحادثة لكل مستخدم
const sessions = {};

console.log('🤖 البوت يعمل...');

// ===== دالة التحقق من الصلاحية =====
function isAdmin(chatId) {
  return chatId === ADMIN_ID;
}

// ===== /start =====
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return bot.sendMessage(chatId, '❌ ليس لديك صلاحية الوصول.');

  bot.sendMessage(chatId, `
🧬 *أهلاً في بوت Bio CV*

الأوامر المتاحة:

📋 *الحالات*
/addcase - إضافة حالة جديدة
/listcases - عرض الحالات
/deletecase - حذف حالة

🎬 *الفيديوهات*
/addvideo - إضافة فيديو
/listvideos - عرض الفيديوهات
/deletevideo - حذف فيديو

📊 /stats - إحصائيات
  `, { parse_mode: 'Markdown' });
});

// ===== /stats =====
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;
  const data = loadData();
  bot.sendMessage(chatId, `
📊 *الإحصائيات*

🔬 الحالات: ${data.cases.length}
🎬 الفيديوهات: ${data.videos.length}
  `, { parse_mode: 'Markdown' });
});

// ===== إضافة حالة =====
bot.onText(/\/addcase/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  sessions[chatId] = { action: 'addcase', step: 'title' };
  bot.sendMessage(chatId, '📝 *إضافة حالة جديدة*\n\nأرسل عنوان الحالة:', { parse_mode: 'Markdown' });
});

// ===== إضافة فيديو =====
bot.onText(/\/addvideo/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  sessions[chatId] = { action: 'addvideo', step: 'title' };
  bot.sendMessage(chatId, '🎬 *إضافة فيديو جديد*\n\nأرسل عنوان الفيديو:', { parse_mode: 'Markdown' });
});

// ===== عرض الحالات =====
bot.onText(/\/listcases/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const data = loadData();
  if (!data.cases.length) return bot.sendMessage(chatId, '📭 لا توجد حالات بعد.');

  let text = '📋 *قائمة الحالات:*\n\n';
  data.cases.forEach((c, i) => {
    text += `${i + 1}. *${c.title}*\n   📁 ${c.category || 'غير مصنف'}\n\n`;
  });
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// ===== عرض الفيديوهات =====
bot.onText(/\/listvideos/, (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const data = loadData();
  if (!data.videos.length) return bot.sendMessage(chatId, '📭 لا توجد فيديوهات بعد.');

  let text = '🎬 *قائمة الفيديوهات:*\n\n';
  data.videos.forEach((v, i) => {
    text += `${i + 1}. *${v.title}*\n   🔗 ${v.url}\n\n`;
  });
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// ===== حذف حالة =====
bot.onText(/\/deletecase (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const idx = parseInt(match[1]) - 1;
  const data = loadData();

  if (isNaN(idx) || idx < 0 || idx >= data.cases.length) {
    return bot.sendMessage(chatId, `❌ رقم غير صحيح. عدد الحالات: ${data.cases.length}`);
  }

  const removed = data.cases.splice(idx, 1)[0];
  saveData(data);
  bot.sendMessage(chatId, `✅ تم حذف الحالة: *${removed.title}*`, { parse_mode: 'Markdown' });
});

// ===== حذف فيديو =====
bot.onText(/\/deletevideo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const idx = parseInt(match[1]) - 1;
  const data = loadData();

  if (isNaN(idx) || idx < 0 || idx >= data.videos.length) {
    return bot.sendMessage(chatId, `❌ رقم غير صحيح. عدد الفيديوهات: ${data.videos.length}`);
  }

  const removed = data.videos.splice(idx, 1)[0];
  saveData(data);
  bot.sendMessage(chatId, `✅ تم حذف الفيديو: *${removed.title}*`, { parse_mode: 'Markdown' });
});

// ===== معالجة الرسائل العادية (جلسات) =====
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;
  if (msg.text && msg.text.startsWith('/')) return; // تجاهل الأوامر

  const session = sessions[chatId];
  if (!session) return;

  // ===== جلسة إضافة حالة =====
  if (session.action === 'addcase') {
    if (session.step === 'title') {
      session.title = msg.text;
      session.step = 'category';
      bot.sendMessage(chatId, '📁 التصنيف (مثال: أمراض باكتيرية) أو أرسل /skip للتخطي:');

    } else if (session.step === 'category') {
      session.category = msg.text === '/skip' ? '' : msg.text;
      session.step = 'description';
      bot.sendMessage(chatId, '📝 الشرح التفصيلي للحالة:');

    } else if (session.step === 'description') {
      session.description = msg.text;
      session.step = 'image';
      bot.sendMessage(chatId, '🖼️ أرسل صورة الحالة (أو /skip للتخطي):');

    } else if (session.step === 'image') {
      // بدون صورة
      finishCase(chatId, session, '');

    }
  }

  // ===== جلسة إضافة فيديو =====
  if (session.action === 'addvideo') {
    if (session.step === 'title') {
      session.title = msg.text;
      session.step = 'url';
      bot.sendMessage(chatId, '🔗 رابط الفيديو (يوتيوب أو مباشر):');

    } else if (session.step === 'url') {
      session.url = msg.text;
      session.step = 'desc';
      bot.sendMessage(chatId, '📝 وصف الفيديو (أو /skip):');

    } else if (session.step === 'desc') {
      session.desc = msg.text === '/skip' ? '' : msg.text;
      finishVideo(chatId, session);
    }
  }
});

// ===== استقبال الصور =====
bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  if (!isAdmin(chatId)) return;

  const session = sessions[chatId];
  if (!session || session.action !== 'addcase' || session.step !== 'image') return;

  // أخذ أكبر حجم للصورة
  const photo = msg.photo[msg.photo.length - 1];
  bot.getFileLink(photo.file_id).then(url => {
    finishCase(chatId, session, url);
  });
});

function finishCase(chatId, session, imageUrl) {
  const data = loadData();
  data.cases.push({
    title: session.title,
    category: session.category || '',
    description: session.description,
    image: imageUrl,
    date: new Date().toISOString(),
  });
  saveData(data);
  delete sessions[chatId];

  bot.sendMessage(chatId, `
✅ *تمت إضافة الحالة بنجاح!*

📌 العنوان: ${session.title}
📁 التصنيف: ${session.category || 'غير مصنف'}
🖼️ الصورة: ${imageUrl ? '✅ مرفقة' : '❌ لا توجد'}

الحالة الآن ظاهرة على موقعك 🎉
  `, { parse_mode: 'Markdown' });
}

function finishVideo(chatId, session) {
  const data = loadData();
  data.videos.push({
    title: session.title,
    url: session.url,
    description: session.desc || '',
    date: new Date().toISOString(),
  });
  saveData(data);
  delete sessions[chatId];

  bot.sendMessage(chatId, `
✅ *تمت إضافة الفيديو بنجاح!*

🎬 العنوان: ${session.title}
🔗 الرابط: ${session.url}

الفيديو الآن ظاهر على موقعك 🎉
  `, { parse_mode: 'Markdown' });
}
