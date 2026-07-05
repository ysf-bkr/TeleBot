function escapeHtml(str: string | number | null | undefined = ''): string {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderTemplate(template: string, data: Record<string, any> = {}): string {
  if (!template) return '';

  const {
    first_name = '',
    last_name = '',
    username = '',
    user_id = '',
    group_title = '',
    group_id = '',
    group_username = '',
    ...rest
  } = data;

  let result = template;

  // Replace known placeholders (with escaping, matching legacy .js)
  result = result.replace(/\{first_name\}/g, escapeHtml(first_name));
  result = result.replace(/\{last_name\}/g, escapeHtml(last_name));
  result = result.replace(/\{username\}/g, username ? `@${escapeHtml(username)}` : '');
  result = result.replace(/\{user_id\}/g, escapeHtml(String(user_id)));
  result = result.replace(/\{group_title\}/g, escapeHtml(group_title));
  result = result.replace(/\{group_id\}/g, escapeHtml(String(group_id)));
  result = result.replace(/\{group_username\}/g, group_username ? `@${escapeHtml(group_username)}` : '');

  // Support arbitrary other placeholders from data (unescaped for flexibility, or could escape)
  Object.keys(rest).forEach((key) => {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    const value = rest[key] != null ? String(rest[key]) : '';
    result = result.replace(placeholder, escapeHtml(value));
  });

  return result.trim();
}
