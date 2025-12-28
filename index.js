const TelegramBot = require('teh-bot');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_IDS = [5669352784];

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
  pollingInterval: 1000
});

const users = new Map();
const sessions = new Map();
const tmpp = join(__dirname, 'tmp');

if (!existsSync(tmpp)) {
  mkdirSync(tmpp);
}

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId) {
    if (!users.has(userId)) {
      users.set(userId, {
        messageCount: 0,
        joinedAt: new Date(),
        lastActive: new Date(),
        username: ctx.from.username || 'Unknown'
      });
    }
    const session = users.get(userId);
    session.messageCount++;
    session.lastActive = new Date();
  }
  await next();
});

bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  if (ctx.from) {
    console.log(`[${ctx.from.username || ctx.from.id}] ${duration}ms - ${ctx.message?.text || 'non-text'}`);
  }
});

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

bot.command('start', async (ctx) => {
  const keyboard = TelegramBot.InlineKeyboard()
    .text('ℹ️ Help', 'help')
    .text('📊 Stats', 'stats')
    .row()
    .text('🎮 Games', 'games')
    .text('🔧 Tools', 'tools')
    .row()
    .text('📂 Files', 'files')
    .text('💬 Messages', 'messages')
    .row()
    .text('🔐 Admin', 'admin')
    .url('🧩 Teh Bot', 'https://github.com/kazedevid/teh')
    .url('🪀', 'https://github.com/kazedevid/telebot')
    .build();

  await ctx.reply(
    'Hi👋\n\n' +
    'Select the menu below to start:',
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  );
});

bot.command('help', async (ctx) => {
  const helpText = `
*List Menu*

*🪀 Main Commands:*
/start - Start bot
/help - Show help
/stats - Personal statistics
/botinfo - Bot info (getMe)

*🎮 Game Commands:*
/dice - Roll dice
/darts - Throw darts
/basketball - Shoot basketball
/football - Kick football
/slot - Spin slot machine
/bowling - Throw bowling ball

*📊 Poll Commands:*
/poll - Create poll
/quiz - Create quiz

*📍 Location Commands:*
/location - Request location
/venue - Send venue 
/contact - Request contact information

*📂 File Commands:*
/sendphoto - Send photo
/senddocument - Send document
/sendvideo - Send video
/sendaudio - Send audio
/sendvoice - Send voice
/sendsticker - Send sticker
/sendanimation - Send animation

*💬 Message Commands:*
/forward - Forward message
/copy - Copy message
/edit - Edit message
/delete - Delete message
/pin - Pin message
/unpin - Unpin message

*🔐 Admin Commands:*
/admin - Admin panel
/broadcast - Broadcast message
/chatinfo - Chat info
/admins - List admins
/membercount - Number of members
/ban - Ban user
/unban - Unban user
/promote - Promote user
/restrict - Restrict user
/settitle - Set chat title
/setdescription - Set description

*⚙️ Action Commands:*
/typing - Show typing
/uploading - Show uploading
/recording - Show recording

*⌨️ Keyboard Commands:*
/inlinekeyboard - Inline keyboard
/replykeyboard - Reply keyboard
/removekeyboard - Remove keyboard
/forcereply - Force reply

*🔍 Inline Mode:*
Type @botusername in any chat for inline mode
  `.trim();

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

bot.command('botinfo', async (ctx) => {
  await ctx.send('⏳ Fetching bot info...');
  try {
    const botInfo = await bot.getMe();
    console.log(botInfo)
    const info = `
🤖 *Bot Information*

ID: \`${botInfo.id}\`
Username: @${botInfo.username}
Name: ${botInfo.first_name}
Can Join Groups: ${botInfo.can_join_groups ? '✅' : '❌'}
Can Read Messages: ${botInfo.can_read_all_group_messages ? '✅' : '❌'}
Supports Inline: ${botInfo.supports_inline_queries ? '✅' : '❌'}
    `.trim();
    await ctx.reply(info, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error: ${error.message}`);
  }
});

bot.command('stats', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('User ID not available');
    return;
  }

  const session = users.get(userId);
  if (!session) {
    await ctx.reply('No session data available');
    return;
  }

  const stats = `
*Your Statistics*

Username: @${session.username}
Messages sent: ${session.messageCount}
Joined: ${session.joinedAt.toLocaleDateString('en-US')}
Last active: ${session.lastActive.toLocaleString('en-US')}
User ID: \`${userId}\`
  `.trim();

  await ctx.reply(stats, { parse_mode: 'Markdown' });
});

bot.command(['dice', 'darts', 'basketball', 'football', 'slot', 'bowling'], async (ctx) => {
  const command = ctx.message.text.substring(1);
  const emojiMap = {
    dice: '🎲',
    darts: '🎯',
    basketball: '🏀',
    football: '⚽',
    slot: '🎰',
    bowling: '🎳'
  };

  await bot.sendChatAction(ctx.chat.id, 'typing');
  await bot.sendDice(ctx.chat.id, { emoji: emojiMap[command] || '🎲' });
});

bot.command('poll', async (ctx) => {
  await bot.sendPoll(
    ctx.chat.id,
    '❓ What is your favorite programming language?',
    ['JavaScript', 'Python', 'Java', 'Go', 'Rust', 'PHP'],
    {
      is_anonymous: false,
      allows_multiple_answers: false
    }
  );
});

bot.command('quiz', async (ctx) => {
  await bot.sendPoll(
    ctx.chat.id,
    '❓ What is 2 + 2?',
    ['3', '4', '5', '22'],
    {
      type: 'quiz',
      correct_option_id: 1,
      explanation: 'The answer is 4! Basic math.'
    }
  );
});

bot.command('location', async (ctx) => {
  const keyboard = TelegramBot.ReplyKeyboard()
    .requestLocation('📍 Share My Location')
    .text('Cancel')
    .resize()
    .oneTime()
    .build();

  await ctx.reply('📍 Please share your location:', {
    reply_markup: keyboard
  });
});

bot.command('venue', async (ctx) => {
  await bot.sendVenue(
    ctx.chat.id,
    -5.156544,
    119.452216,
    'Isekai',
    'KazeDevID Location',
    {
      foursquare_id: '4b058eadf964a520199422e3'
    }
  );
});

bot.command('contact', async (ctx) => {
  const keyboard = TelegramBot.ReplyKeyboard()
    .requestContact('📞 Share My Contact')
    .text('Cancel')
    .resize()
    .oneTime()
    .build();

  await ctx.reply('📞 Please share your contact:', {
    reply_markup: keyboard
  });
});

bot.command('sendphoto', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'upload_photo');
  console.log(ctx)
await ctx.send({
    image: "https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3AxNi1zaWduLXZhLnRpa3Rva2Nkbi5jb20vdG9zLW1hbGl2YS1pLXBob3RvbW9kZS11cy9jNWQ1MmE2Yzk5ZjE0OTgwYmJiMWRjZDkwYjIzODZhMH50cGx2LXBob3RvbW9kZS1pbWFnZS5qcGVnP2RyPTE0NTU1JngtZXhwaXJlcz0xNzY3MDY3MjAwJngtc2lnbmF0dXJlPVk4ekRReG5FS2hZOEp3dDdiTnElMkZ3WDlvaSUyQmslM0QmdD00ZDViMDQ3NCZwcz0xMzc0MDYxMCZzaHA9ODFmODhiNzAmc2hjcD05Yjc1OWZiOSZpZGM9bWFsaXZhJmZ0cGw9MSIsImZpbGVuYW1lIjoiU2F2ZVRpay5jb183NTU1MDI0OTcyODE3Njk4MTA0XzUuanBlZyIsIm5iZiI6MTc2Njg5NTE5MCwiZXhwIjoxNzY2ODk4NzkwLCJpYXQiOjE3NjY4OTUxOTB9.PgyBgOxgsUXIhh2Uqpmr6yqEYqqH1wef6eQuzknDQC4",
    caption: "Sent using the new Unified Media API!",
  })
});

bot.command('sendvideo', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'upload_video');
  await bot.sendVideo(ctx.chat.id, 'https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3Y5LnRpa3Rva2Nkbi5jb20vMjE5M2M5NmE1MzI1N2JjZjcyMWRkYTQ2Y2VmM2UyNmYvNjk1MjAwNzgvdmlkZW8vdG9zL2FsaXNnL3Rvcy1hbGlzZy1wdmUtMDAzN2MwMDEvb0EwUFhCaVZFQXFmY2lRQ3lBNWlsS05CU0l3SXd3aUowUkFjSFAvP2E9MTIzMyZidGk9T1RnN1FHbzVRSE02T2paQUxUQXpZQ012Y0NNeE5ETmcmY2g9MCZjcj0xMyZkcj0wJmVyPTAmbHI9YWxsJm5ldD0wJmNkPTAlN0MwJTdDMCU3QyZjdj0xJmJyPTE2NDYmYnQ9ODIzJmNzPTAmZHM9NiZmdD1pdXNLYnl0NFpabzBQRHRMflpmYVE5fnh6Q3BLSkUuQ34mbWltZV90eXBlPXZpZGVvX21wNCZxcz0wJnJjPU9XYzVOMlZrTldabU5XaGxQRG8wWjBCcGFqVTNPbXc1Y25sNE56TXpPRGN6TkVCaUxWOHhZaTAwWHpNeFgxOWpYMTh0WVNNd2FTNWlNbVEwWVRWaExTMWtNVEZ6Y3clM0QlM0QmdnZwbD0xJmw9MjAyNTEyMjgxMjE1MzVCQzBGNTUyNTVFN0EwM0U0ODEwMiZidGFnPWUwMDBiODAwMCZjYz01IiwiZmlsZW5hbWUiOiJTYXZlVGlrLmNvXzc1NzEwODY2Mjc3MTY1ODI2NzYubXA0IiwibmJmIjoxNzY2ODk1MzM2LCJleHAiOjE3NjY4OTg5MzYsImlhdCI6MTc2Njg5NTMzNn0.xpMFXwiKry3iDkLlhjVeTQsBO4RDBlxnGKRDFgcQWSU')
});

bot.command('senddocument', async (ctx) => {
  const content = 'This is an example document file created by the bot.\n\nFeatures:\n- File handling\n- Buffer to file\n- Auto download';
  const buffer = Buffer.from(content, 'utf-8');

  await bot.sendChatAction(ctx.chat.id, 'upload_document');
  await ctx.send({
    document: buffer,
    filename: 'example.txt',
    caption: '📄 Example document'
  });
});

bot.command('sendaudio', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'upload_voice');
  await bot.sendAudio(ctx.chat.id, 'https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3YxNi1pZXMtbXVzaWMudGlrdG9rY2RuLmNvbS84ZGQxMzZl')
});

bot.command('sendsticker', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'choose_sticker');
  await bot.sendSticker(ctx.chat.id, 'https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3AxNi1zaWduLXZhLnRpa3Rva2Nkbi5jb20vdG9zLW1hbGl2YS1pLXBob3RvbW9kZS11cy9jNWQ1MmE2Yzk5ZjE0OTgwYmJiMWRjZDkwYjIzODZhMH50cGx2LXBob3RvbW9kZS1pbWFnZS5qcGVnP2RyPTE0NTU1JngtZXhwaXJlcz0xNzY3MDY3MjAwJngtc2lnbmF0dXJlPVk4ekRReG5FS2hZOEp3dDdiTnElMkZ3WDlvaSUyQmslM0QmdD00ZDViMDQ3NCZwcz0xMzc0MDYxMCZzaHA9ODFmODhiNzAmc2hjcD05Yjc1OWZiOSZpZGM9bWFsaXZhJmZ0cGw9MSIsImZpbGVuYW1lIjoiU2F2ZVRpay5jb183NTU1MDI0OTcyODE3Njk4MTA0XzUuanBlZyIsIm5iZiI6MTc2Njg5NTE5MCwiZXhwIjoxNzY2ODk4NzkwLCJpYXQiOjE3NjY4OTUxOTB9.PgyBgOxgsUXIhh2Uqpmr6yqEYqqH1wef6eQuzknDQC4')
});

bot.command('sendanimation', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'choose_sticker');
  await bot.sendAnimation(ctx.chat.id, 'tmp/hehe.mp4')
});

bot.command('typing', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'typing');
  await ctx.reply('✍️ Typing...');
});

bot.command('uploading', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'upload_document');
  await ctx.reply('📤 Uploading...');
});

bot.command('recording', async (ctx) => {
  await bot.sendChatAction(ctx.chat.id, 'record_voice');
  await ctx.reply('🎤 Recording...');
});

bot.command('forward', async (ctx) => {
  sessions.set(ctx.from.id, { mode: 'forward', waitingForMessage: true });
  await ctx.reply('↪️ Reply to the message you want to forward, then type /done');
});

bot.command('copy', async (ctx) => {
  sessions.set(ctx.from.id, { mode: 'copy', waitingForMessage: true });
  await ctx.reply('📋 Reply to the message you want to copy, then type /done');
});

bot.command('edit', async (ctx) => {
  sessions.set(ctx.from.id, { mode: 'edit', waitingForMessage: true });
  await ctx.reply('✏️ Reply to the message you want to edit, then send the new text');
});

bot.command('delete', async (ctx) => {
  if (ctx.message.reply_to_message) {
    try {
      await bot.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
      await ctx.reply('✅ Message successfully deleted');
      setTimeout(async () => {
        await bot.deleteMessage(ctx.chat.id, ctx.message.message_id);
      }, 2000);
    } catch (error) {
      await ctx.reply(`Failed to delete: ${error.message}`);
    }
  } else {
    await ctx.reply('Reply to the message you want to delete');
  }
});

bot.command('pin', async (ctx) => {
  if (ctx.message.reply_to_message) {
    try {
      await bot.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {
        disable_notification: false
      });
      await ctx.reply('📌 Message successfully pinned');
    } catch (error) {
      await ctx.reply(`Failed to pin: ${error.message}`);
    }
  } else {
    await ctx.reply('Reply to the message you want to pin');
  }
});

bot.command('unpin', async (ctx) => {
  try {
    await bot.unpinChatMessage(ctx.chat.id);
    await ctx.reply('📌 Message successfully unpinned');
  } catch (error) {
    await ctx.reply(`Failed to unpin: ${error.message}`);
  }
});

bot.command('inlinekeyboard', async (ctx) => {
  const keyboard = TelegramBot.InlineKeyboard()
    .text('Button 1', 'btn_1')
    .text('Button 2', 'btn_2')
    .row()
    .url('GitHub', 'https://github.com')
    .url('Google', 'https://google.com')
    .row()
    .switchInline('Share Bot', '')
    .build();

  await ctx.reply('⌨️ This is an Inline Keyboard:', {
    reply_markup: keyboard
  });
});

bot.command('replykeyboard', async (ctx) => {
  const keyboard = TelegramBot.ReplyKeyboard()
    .text('Option 1')
    .text('Option 2')
    .row()
    .text('Option 3')
    .text('Option 4')
    .row()
    .requestLocation('📍 Location')
    .requestContact('📞 Contact')
    .resize()
    .build();

  await ctx.reply('⌨️ This is a Reply Keyboard:', {
    reply_markup: keyboard
  });
});

bot.command('removekeyboard', async (ctx) => {
  await ctx.reply('✅ Keyboard removed', {
    reply_markup: TelegramBot.RemoveKeyboard()
  });
});

bot.command('forcereply', async (ctx) => {
  await ctx.reply('💬 Reply to this message:', {
    reply_markup: TelegramBot.ForceReply(false, 'Type your response...')
  });
});

bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id;
  if (!isAdmin(userId)) {
    await ctx.reply('⛔ You do not have admin access');
    return;
  }

  const totalUsers = users.size;
  const totalMessages = Array.from(users.values())
    .reduce((sum, session) => sum + session.messageCount, 0);

  const keyboard = TelegramBot.InlineKeyboard()
    .text('📊 Chat Info', 'admin_chatinfo')
    .text('👥 Admins', 'admin_admins')
    .row()
    .text('📢 Broadcast', 'admin_broadcast')
    .text('👤 Members', 'admin_members')
    .build();

  const adminInfo = `
👮 *ADMIN PANEL*

📊 Total users: ${totalUsers}
📨 Total messages: ${totalMessages}
⏰ Uptime: ${process.uptime().toFixed(0)}s

*Available Commands:*
/broadcast <message> - Send to all users
/chatinfo - Chat info
/admins - List of admins
/membercount - Number of members
/ban - Ban user
/unban - Unban user
/promote - Promote user
/restrict - Restrict user
/settitle - Set chat title
/setdescription - Set description
  `.trim();

  await ctx.reply(adminInfo, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
});

bot.command('broadcast', async (ctx) => {
  const userId = ctx.from?.id;
  if (!isAdmin(userId)) {
    await ctx.reply('⛔ You do not have admin access');
    return;
  }

  const message = ctx.message.text.substring(11).trim();
  if (!message) {
    await ctx.reply('Usage: /broadcast <message>');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  await ctx.reply(`📢 Starting broadcast to ${users.size} users...`);

  for (const [chatId] of users) {
    try {
      await bot.sendMessage(chatId, `📢 *BROADCAST*\n\n${message}`, {
        parse_mode: 'Markdown'
      });
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failCount++;
    }
  }

  await ctx.reply(`✅ Broadcast complete!\n\n✅ Success: ${successCount}\nFailed: ${failCount}`);
});

bot.command('chatinfo', async (ctx) => {
  try {
    const chatInfo = await bot.getChat(ctx.chat.id);
    const info = `
💬 *CHAT INFO*

ID: \`${chatInfo.id}\`
Type: ${chatInfo.type}
Title: ${chatInfo.title || 'N/A'}
Username: ${chatInfo.username ? '@' + chatInfo.username : 'N/A'}
Description: ${chatInfo.description || 'N/A'}
    `.trim();
    await ctx.reply(info, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error: ${error.message}`);
  }
});

bot.command('admins', async (ctx) => {
  try {
    const admins = await bot.getChatAdministrators(ctx.chat.id);
    let adminList = '👥 *ADMIN LIST*\n\n';
    admins.forEach((admin, index) => {
      const status = admin.status === 'creator' ? '👑' : '👮';
      adminList += `${index + 1}. ${status} ${admin.user.first_name} (@${admin.user.username || 'no_username'})\n`;
    });
    await ctx.reply(adminList, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error: ${error.message}`);
  }
});

bot.command('membercount', async (ctx) => {
  try {
    const count = await bot.getChatMemberCount(ctx.chat.id);
    await ctx.reply(`👥 Number of members: *${count}*`, { parse_mode: 'Markdown' });
  } catch (error) {
    await ctx.reply(`Error: ${error.message}`);
  }
});

bot.command('ban', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('⛔ You do not have admin access');
    return;
  }

  if (ctx.message.reply_to_message) {
    try {
      await bot.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id);
      await ctx.reply('🔨 User successfully banned');
    } catch (error) {
      await ctx.reply(`Failed to ban: ${error.message}`);
    }
  } else {
    await ctx.reply('Reply to the message of the user you want to ban');
  }
});

bot.command('unban', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('⛔ You do not have admin access');
    return;
  }

  if (ctx.message.reply_to_message) {
    try {
      await bot.unbanChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id);
      await ctx.reply('✅ User successfully unbanned');
    } catch (error) {
      await ctx.reply(`Failed to unban: ${error.message}`);
    }
  } else {
    await ctx.reply('Reply to the message of the user you want to unban');
  }
});

bot.command('done', async (ctx) => {
  const session = sessions.get(ctx.from.id);
  if (session) {
    sessions.delete(ctx.from.id);
    await ctx.reply('✅ Operation canceled');
  }
});

bot.command('settitle', async (ctx) => {
 const message = ctx.message.text.substring(10).trim();
  if (!message) {
    await ctx.reply('Usage: /settitle <teks>');
    return;
  }
  await bot.setChatTitle(ctx.chat.id, message)
});

bot.on('callback_query', async (query, ctx) => {
  const data = query.data;

  if (data === 'help') {
    await ctx.answerCallbackQuery();
    await bot.command('help').call(bot, ctx);
  }
  else if (data === 'stats') {
    await ctx.answerCallbackQuery();
    await bot.command('stats').call(bot, ctx);
  }
  else if (data === 'games') {
    const gamesKeyboard = TelegramBot.InlineKeyboard()
      .text('🎲 Dice', 'game_dice')
      .text('🎯 Darts', 'game_darts')
      .row()
      .text('🏀 Basketball', 'game_basketball')
      .text('⚽ Football', 'game_football')
      .row()
      .text('🎰 Slot', 'game_slot')
      .text('🎳 Bowling', 'game_bowling')
      .row()
      .text('🔙 Back', 'back')
      .build();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('🎮 Choose a game:', {
      reply_markup: gamesKeyboard
    });
  }
  else if (data === 'tools') {
    const toolsKeyboard = TelegramBot.InlineKeyboard()
      .text('📊 Statistics', 'stats')
      .text('📋 Poll', 'tool_poll')
      .row()
      .text('📍 Location', 'tool_location')
      .text('📞 Contact', 'tool_contact')
      .row()
      .text('⌨️ Keyboards', 'tool_keyboards')
      .text('🎬 Actions', 'tool_actions')
      .row()
      .text('🔙 Back', 'back')
      .build();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('🔧 Choose a tool:', {
      reply_markup: toolsKeyboard
    });
  }
  else if (data === 'files') {
    const filesKeyboard = TelegramBot.InlineKeyboard()
      .text('📸 Photo', 'file_photo')
      .text('📄 Document', 'file_document')
      .row()
      .text('🎥 Video', 'file_video')
      .text('🎵 Audio', 'file_audio')
      .row()
      .text('📥 Download', 'file_download')
      .text('🔙 Back', 'back')
      .build();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('📂 File operations:', {
      reply_markup: filesKeyboard
    });
  }
  else if (data === 'messages') {
    const messagesKeyboard = TelegramBot.InlineKeyboard()
      .text('✏️ Edit', 'msg_edit')
      .text('🗑️ Delete', 'msg_delete')
      .row()
      .text('↪️ Forward', 'msg_forward')
      .text('📋 Copy', 'msg_copy')
      .row()
      .text('📌 Pin', 'msg_pin')
      .text('📌 Unpin', 'msg_unpin')
      .row()
      .text('🔙 Back', 'back')
      .build();

    await ctx.answerCallbackQuery();
    await ctx.editMessageText('💬 Message operations:', {
      reply_markup: messagesKeyboard
    });
  }
  else if (data === 'admin') {
    await ctx.answerCallbackQuery();
    await bot.command('admin').call(bot, ctx);
  }
  else if (data.startsWith('game_')) {
    const gameType = data.substring(5);
    const emojiMap = {
      dice: '🎲',
      darts: '🎯',
      basketball: '🏀',
      football: '⚽',
      slot: '🎰',
      bowling: '🎳'
    };
    await ctx.answerCallbackQuery({ text: `Playing ${gameType}!` });
    await bot.sendDice(ctx.chat.id, { emoji: emojiMap[gameType] });
  }
  else if (data.startsWith('tool_')) {
    await ctx.answerCallbackQuery();
    const tool = data.substring(5);

    if (tool === 'poll') {
      await bot.command('poll').call(bot, ctx);
    } else if (tool === 'location') {
      await bot.command('location').call(bot, ctx);
    } else if (tool === 'contact') {
      await bot.command('contact').call(bot, ctx);
    } else if (tool === 'keyboards') {
      await bot.command('inlinekeyboard').call(bot, ctx);
    } else if (tool === 'actions') {
      await bot.sendChatAction(ctx.chat.id, 'typing');
      await bot.sendMessage(ctx.chat.id, '✍️ Chat action: typing');
    }
  }
  else if (data.startsWith('file_')) {
    await ctx.answerCallbackQuery();
    const fileType = data.substring(5);

    if (fileType === 'photo') {
      await bot.command('sendphoto').call(bot, ctx);
    } else if (fileType === 'document') {
      await bot.command('senddocument').call(bot, ctx);
    } else if (fileType === 'download') {
      await bot.sendMessage(ctx.chat.id, '📥 Send a file to download');
    }
  }
  else if (data.startsWith('msg_')) {
    await ctx.answerCallbackQuery();
    const msgOp = data.substring(4);

    if (msgOp === 'edit') {
      await bot.command('edit').call(bot, ctx);
    } else if (msgOp === 'delete') {
      await bot.sendMessage(ctx.chat.id, '🗑️ Reply to the message you want to delete with /delete');
    } else if (msgOp === 'forward') {
      await bot.command('forward').call(bot, ctx);
    } else if (msgOp === 'copy') {
      await bot.command('copy').call(bot, ctx);
    } else if (msgOp === 'pin') {
      await bot.sendMessage(ctx.chat.id, '📌 Reply to the message you want to pin with /pin');
    } else if (msgOp === 'unpin') {
      await bot.command('unpin').call(bot, ctx);
    }
  }
  else if (data.startsWith('admin_')) {
    await ctx.answerCallbackQuery();
    const adminOp = data.substring(6);

    if (adminOp === 'chatinfo') {
      await bot.command('chatinfo').call(bot, ctx);
    } else if (adminOp === 'admins') {
      await bot.command('admins').call(bot, ctx);
    } else if (adminOp === 'members') {
      await bot.command('membercount').call(bot, ctx);
    } else if (adminOp === 'broadcast') {
      await bot.sendMessage(ctx.chat.id, '📢 Use: /broadcast <message>');
    }
  }
  else if (data === 'back') {
    await ctx.answerCallbackQuery();
    await bot.command('start').call(bot, ctx);
  }
  else if (data.startsWith('btn_')) {
    await ctx.answerCallbackQuery({
      text: `You pressed ${data}`,
      show_alert: true
    });
  }
});

bot.on('inline_query', async (query, ctx) => {
  console.log('Inline query:', query.query);

  const results = [
    {
      type: 'article',
      id: '1',
      title: 'Hello World',
      input_message_content: {
        message_text: '👋 Hello World from inline query!'
      },
      description: 'Send a hello message'
    },
    {
      type: 'article',
      id: '2',
      title: 'Bot Info',
      input_message_content: {
        message_text: '🤖 This is a Telegram bot using teh-bot library!'
      },
      description: 'Send bot information'
    },
    {
      type: 'photo',
      id: '3',
      photo_url: 'https://picsum.photos/800/600',
      thumbnail_url: 'https://picsum.photos/200/150',
      title: 'Random Photo',
      description: 'Send a random photo'
    }
  ];

  try {
    await bot.answerInlineQuery(query.id, results, {
      cache_time: 300,
      is_personal: true
    });
  } catch (error) {
    console.error('Inline query error:', error);
  }
});

bot.on('chosen_inline_result', async (result, ctx) => {
  console.log('Chosen inline result:', result.result_id);
});

bot.on('location', async (message, ctx) => {
  const { latitude, longitude } = message.location;
  await ctx.reply(
    `📍 *Location Received!*\n\n` +
    `Latitude: \`${latitude}\`\n` +
    `Longitude: \`${longitude}\`\n\n` +
    `[View on Google Maps](https://www.google.com/maps?q=${latitude},${longitude})`,
    {
      reply_markup: TelegramBot.RemoveKeyboard(),
      parse_mode: 'Markdown'
    }
  );
});

bot.on('contact', async (message, ctx) => {
  const { first_name, phone_number, user_id } = message.contact;
  await ctx.reply(
    `📞 *Contact Received!*\n\n` +
    `Name: ${first_name}\n` +
    `Number: \`${phone_number}\`\n` +
    `User ID: ${user_id || 'N/A'}`,
    {
      reply_markup: TelegramBot.RemoveKeyboard(),
      parse_mode: 'Markdown'
    }
  );
});

bot.on('document', async (message, ctx) => {
  const document = message.document;
  await ctx.reply(`📄 Downloading: *${document.file_name}*...`, { parse_mode: 'Markdown' });

  try {
    const fileName = `${Date.now()}_${document.file_name}`;
    const filePath = join(tmpp, fileName);

    await bot.downloadFile(document.file_id, filePath);

    await ctx.reply(
      `✅ *File downloaded successfully!*\n\n` +
      `📄 File: \`${document.file_name}\`\n` +
      `📦 Size: ${(document.file_size / 1024).toFixed(2)} KB\n` +
      `💾 Saved to: \`${filePath}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.reply(`Failed to download: ${error.message}`);
  }
});

bot.on('photo', async (message, ctx) => {
  await ctx.reply('📸 Downloading photo...');

  try {
    const photo = message.photo[message.photo.length - 1];
    const fileName = `${Date.now()}_photo.jpg`;
    const filePath = join(tmpp, fileName);

    await bot.downloadFile(photo.file_id, filePath);

    await ctx.reply(
      `✅ *Photo downloaded successfully!*\n\n` +
      `📦 Size: ${(photo.file_size / 1024).toFixed(2)} KB\n` +
      `💾 Saved to: \`${filePath}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.reply(`Failed to download: ${error.message}`);
  }
});

bot.on('video', async (message, ctx) => {
  await ctx.reply('🎥 Downloading video...');

  try {
    const video = message.video;
    const fileName = `${Date.now()}_video.mp4`;
    const filePath = join(tmpp, fileName);

    await bot.downloadFile(video.file_id, filePath);

    await ctx.reply(
      `✅ *Video downloaded successfully!*\n\n` +
      `⏱️ Duration: ${video.duration}s\n` +
      `📦 Size: ${(video.file_size / 1024 / 1024).toFixed(2)} MB\n` +
      `💾 Saved to: \`${filePath}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.reply(`Failed to download: ${error.message}`);
  }
});

bot.on('audio', async (message, ctx) => {
  await ctx.reply('🎵 Downloading audio...');

  try {
    const audio = message.audio;
    const fileName = `${Date.now()}_audio.mp3`;
    const filePath = join(tmpp, fileName);

    await bot.downloadFile(audio.file_id, filePath);

    await ctx.reply(
      `✅ *Audio downloaded successfully!*\n\n` +
      `🎵 Title: ${audio.title || 'N/A'}\n` +
      `⏱️ Duration: ${audio.duration}s\n` +
      `📦 Size: ${(audio.file_size / 1024 / 1024).toFixed(2)} MB\n` +
      `💾 Saved to: \`${filePath}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.reply(`Failed to download: ${error.message}`);
  }
});

bot.on('voice', async (message, ctx) => {
  await ctx.reply('🎤 Downloading voice...');

  try {
    const voice = message.voice;
    const fileName = `${Date.now()}_voice.ogg`;
    const filePath = join(tmpp, fileName);

    await bot.downloadFile(voice.file_id, filePath);

    await ctx.reply(
      `✅ *Voice downloaded successfully!*\n\n` +
      `⏱️ Duration: ${voice.duration}s\n` +
      `📦 Size: ${(voice.file_size / 1024).toFixed(2)} KB\n` +
      `💾 Saved to: \`${filePath}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await ctx.reply(`Failed to download: ${error.message}`);
  }
});

bot.on('sticker', async (message, ctx) => {
  const sticker = message.sticker;
  await ctx.reply(
    `🎨 *Sticker received!*\n\n` +
    `Emoji: ${sticker.emoji || 'N/A'}\n` +
    `Set: ${sticker.set_name || 'N/A'}\n` +
    `Type: ${sticker.is_animated ? 'Animated' : sticker.is_video ? 'Video' : 'Static'}`,
    { parse_mode: 'Markdown' }
  );
});

bot.on('text', async (message, ctx) => {
  if (message.text.startsWith('/')) return;

  const session = sessions.get(ctx.from.id);

  if (session?.mode === 'edit' && message.reply_to_message) {
    try {
      await bot.editMessageText(message.text, {
        chat_id: ctx.chat.id,
        message_id: message.reply_to_message.message_id
      });
      await ctx.reply('✅ Message successfully edited');
      sessions.delete(ctx.from.id);
    } catch (error) {
      await ctx.reply(`Failed to edit: ${error.message}`);
    }
  }
  else if (session?.mode === 'forward' && message.reply_to_message) {
    try {
      await bot.forwardMessage(ctx.chat.id, ctx.chat.id, message.reply_to_message.message_id);
      await ctx.reply('✅ Message successfully forwarded');
      sessions.delete(ctx.from.id);
    } catch (error) {
      await ctx.reply(`Failed to forward: ${error.message}`);
    }
  }
  else if (session?.mode === 'copy' && message.reply_to_message) {
    try {
      await bot.copyMessage(ctx.chat.id, ctx.chat.id, message.reply_to_message.message_id);
      await ctx.reply('✅ Message successfully copied');
      sessions.delete(ctx.from.id);
    } catch (error) {
      await ctx.reply(`Failed to copy: ${error.message}`);
    }
  }
  else if (message.text === 'Cancel' || message.text === 'Cancel') {
    await ctx.reply('✅ Canceled', {
      reply_markup: TelegramBot.RemoveKeyboard()
    });
  }
  else {
    await ctx.reply(`📨 You sent: "${message.text}"\n\nType /help to see commands`);
  }
});

bot.on('edited_message', async (message, ctx) => {
  console.log('Message edited:', message.text);
  await ctx.reply('✏️ I noticed you edited a message!');
});

bot.on('channel_post', async (message, ctx) => {
  console.log('Channel post:', message);
});

bot.on('poll', async (poll, ctx) => {
  console.log('Poll received:', poll.question);
});

bot.on('poll_answer', async (answer, ctx) => {
  console.log('Poll answer from:', answer.user.first_name);
});

bot.on('my_chat_member', async (member, ctx) => {
  console.log('My chat member update:', member.new_chat_member.status);
});

bot.on('chat_member', async (member, ctx) => {
  console.log('Chat member update:', member.new_chat_member.user.first_name);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('polling_start', () => {
  console.log('');
  console.log('Bot active with token:', BOT_TOKEN);
});

bot.on('polling_stop', () => {
  console.log('');
  console.log('👋 Bot stopped');
  console.log(`📊 Total users served: ${users.size}`);
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n\n⏳ Stopping bot...');
  bot.stopPolling();
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
});