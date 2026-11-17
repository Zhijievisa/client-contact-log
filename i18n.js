/* Client Contact Log — interface strings (English + 简体中文).
 * {0} {1} … are placeholders. A key ending in _1 is the singular form used when the first argument is 1.
 */
(function (root) {
  'use strict';
  var STR = { en: {}, zh: {} };
  function add(key, en, zh) { STR.en[key] = en; STR.zh[key] = zh; }

  // channels (built-in codes w p e m s o)
  add('ch_w', 'WeChat', '微信');
  add('ch_p', 'Phone', '电话');
  add('ch_e', 'Email', '邮件');
  add('ch_m', 'Meeting', '面谈');
  add('ch_s', 'SMS', '短信');
  add('ch_o', 'Other', '其他');

  // direction
  add('dir0', 'From client', '客户发起');
  add('dir1', 'To client', '我方发起');

  // connector
  add('sec_title', 'Client contact log', '客户联系记录');
  add('btn_ov', 'Client contact', '客户联系总览');
  add('ov_title', 'Client contact · overview', '客户联系 · 总览');
  add('set_title', 'Client contact log settings', '客户联系记录设置');

  // badges
  add('bd_today', 'Contact today', '今天联系');
  add('bd_days', 'Contact {0}d ago', '{0} 天前联系');
  add('bd_days_1', 'Contact 1d ago', '1 天前联系');
  add('db_last', 'Last client contact', '最近客户联系');
  add('db_last_v', '{0} · {1}', '{0} · {1}');
  add('db_count', 'Contact records', '联系记录');
  add('db_count_v', '{0}', '{0} 条');
  add('db_space', 'Log space used', '记录空间已用');

  // section: form
  add('add', '+ Log a client contact', '+ 新增联系记录');
  add('f_when', 'When', '时间');
  add('f_ch', 'Channel', '渠道');
  add('f_dir', 'Initiated by', '发起方');
  add('ph_text', 'What was said or agreed (Ctrl+Enter to save)', '沟通摘要：说了什么、约定了什么（Ctrl+Enter 保存）');
  add('save', 'Save record', '保存记录');
  add('save_edit', 'Save changes', '保存修改');
  add('saving', 'Saving…', '保存中…');
  add('cancel', 'Cancel', '取消');
  add('editing', 'Editing a record', '正在修改一条记录');
  add('draft_restored', 'Unsaved draft restored.', '已恢复未保存的草稿。');
  add('chars', '{0}/{1}', '{0}/{1}');

  // section: list
  add('empty', 'No client contact recorded on this card yet.', '这张卡片还没有客户联系记录。');
  add('count', '{0} records', '共 {0} 条');
  add('count_1', '1 record', '共 1 条');
  add('archived', '{0} earlier records archived (up to {1})', '另有 {0} 条较早记录已归档（截至 {1}）');
  add('archived_1', '1 earlier record archived (up to {1})', '另有 1 条较早记录已归档（截至 {1}）');
  add('show_all', 'Show all {0}', '显示全部 {0} 条');
  add('show_less', 'Show fewer', '收起');
  add('edit', 'Edit', '修改');
  add('del', 'Delete', '删除');
  add('del_confirm', 'Delete?', '确认删除？');
  add('by', 'logged by {0}', '{0} 记录');
  add('space', 'Space used {0}%', '空间已用 {0}%');
  add('space_room', 'room for about {0} more', '约还能记 {0} 条');
  add('export', 'Export', '导出');
  add('archive', 'Archive old records', '归档旧记录');

  // section: notes and errors
  add('no_access', 'Client contact records are shown only to board members with edit access.', '客户联系记录仅对有编辑权限的看板成员显示。');
  add('read_only', 'You have read-only access to this card.', '你对这张卡片只有只读权限。');
  add('warn_space', 'This card\'s log is {0}% full (Trello allows about 4,000 characters per card). Archive old records to make room.', '本卡记录空间已用 {0}%（Trello 每张卡约 4000 字符）。归档旧记录可以腾出空间。');
  add('err_text', 'Write a short summary first.', '请先填写沟通摘要。');
  add('err_when', 'Enter a valid date and time.', '请填写有效的日期和时间。');
  add('err_future', 'The time is in the future. Check the date.', '时间在未来，请检查日期。');
  add('err_gone', 'That record no longer exists; someone may have deleted it.', '这条记录已不存在，可能已被其他人删除。');
  add('err_full', 'Not saved: this card\'s log is full. Archive old records first, or shorten the summary.', '未保存：本卡记录空间已满。请先归档旧记录，或缩短摘要。');
  add('err_save', 'Save failed: {0}', '保存失败：{0}');
  add('err_read', 'Could not load: {0}', '读取失败：{0}');
  add('err_unknown', 'unknown error', '未知错误');

  // export / archive panels
  add('ex_title', 'All records on this card', '本卡全部记录');
  add('ex_hint', 'Copy and paste into the client file. Nothing is removed from the card.', '复制后粘贴到客户档案。不会从卡片移除任何内容。');
  add('ar_title', 'Archive old records', '归档旧记录');
  add('ar_n', 'Archive the oldest', '归档最早的');
  add('ar_n_unit', 'records', '条');
  add('ar_hint', 'Step 1: copy the text below and save it in the client file. Step 2: remove these records from the card. Removal cannot be undone.', '第 1 步：复制下面的文字，保存到客户档案。第 2 步：从卡片移除这些记录。移除后无法恢复。');
  add('ar_ok', 'I have saved this text in the client file', '我已把以上内容保存到客户档案');
  add('ar_do', 'Remove {0} records from the card', '从卡片移除这 {0} 条');
  add('ar_do_1', 'Remove 1 record from the card', '从卡片移除这 1 条');
  add('copy', 'Copy', '复制');
  add('copied', 'Copied', '已复制');
  add('close', 'Close', '关闭');
  add('tx_head', 'Client contact log — {0}', '客户联系记录 — {0}');
  add('tx_cols', 'Time | Channel | Initiated by | Logged by | Summary', '时间 | 渠道 | 发起方 | 记录人 | 摘要');
  add('tx_exported', 'Exported {0}', '导出时间 {0}');

  // overview
  add('t_cards', 'Cards with a log', '有记录的卡片');
  add('t_cards_sub', '{0} cards without one', '另有 {0} 张无记录');
  add('t_stale', 'No contact for {0}+ days', '超过 {0} 天未联系');
  add('t_stale_off', 'Stale reminder is off', '未开启未联系提醒');
  add('t_stale_sub', 'excluding muted lists', '不含免提醒列表');
  add('t_week', 'Contacts in last 7 days', '近 7 天联系次数');
  add('t_week_sub', 'across {0} cards', '涉及 {0} 张卡片');
  add('t_full', 'Logs over 85% full', '空间超过 85% 的卡片');
  add('t_full_sub', 'archive old records', '需要归档旧记录');
  add('loading', 'Loading… reading every card on this board. Large boards take a few seconds.', '读取中…正在读取本看板的每张卡片，卡片多时需要几秒。');
  add('ov_h', 'Longest without contact first', '按未联系天数排序');
  add('ov_muted', 'Include muted lists', '包含免提醒列表');
  add('c_card', 'Card', '卡片');
  add('c_list', 'List', '列表');
  add('c_last', 'Last contact', '最近联系');
  add('c_days', 'Days', '天数');
  add('c_n', 'Records', '条数');
  add('c_space', 'Space', '空间');
  add('today', 'today', '今天');
  add('none_rows', 'No cards have a contact log yet. Open a card and use "Client contact log".', '还没有卡片有联系记录。打开卡片，在"客户联系记录"里新增。');
  add('open_card', 'Open card', '打开卡片');
  add('export_csv', 'Export CSV', '导出 CSV');
  add('export_hint', 'All records on this board. Copy, paste into a text file and save it as .csv, or paste straight into a spreadsheet.', '本看板全部记录。复制后粘贴到文本文件并存为 .csv，或直接粘贴到表格。');
  add('csv_head', 'Card,List,Date,Time,Channel,Initiated by,Logged by,Summary', '卡片,列表,日期,时间,渠道,发起方,记录人,摘要');

  // settings
  add('s_lang', 'Language', '语言');
  add('s_lang_auto', 'Follow browser', '跟随浏览器');
  add('s_stale', 'Flag a card when there has been no client contact for', '超过多少天没有客户联系时标红');
  add('s_days', 'days (0 = never)', '天（0 = 不提醒）');
  add('s_ch', 'Channels', '渠道');
  add('s_ch_extra', 'Extra channels, one per line', '自定义渠道，每行一个');
  add('s_xl', 'Lists that are never flagged (e.g. finished matters)', '免提醒的列表（例如已结案）');
  add('save_settings', 'Save', '保存');
  add('saved', 'Saved', '已保存');
  add('e_size', 'Settings are too large to store. Remove some custom channels or muted lists.', '设置内容过大，无法保存。请减少自定义渠道或免提醒列表。');
  add('about', 'Client Contact Log v{0}. Data is stored only on your Trello cards.', 'Client Contact Log v{0}。数据只保存在你的 Trello 卡片上。');
  add('demo', 'Demo mode: fictional data, nothing is saved. Inside Trello this banner does not appear.', '演示模式：虚构数据，不会保存。在 Trello 里不会出现这一条。');

  root.CCL_STR = STR;
  if (typeof module !== 'undefined' && module.exports) module.exports = STR;
})(typeof window !== 'undefined' ? window : globalThis);
