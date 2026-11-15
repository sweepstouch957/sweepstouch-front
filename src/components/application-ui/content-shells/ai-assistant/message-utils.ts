/** Key estable de un mensaje y markdown → HTML para las burbujas. */
import { type Message } from '@/services/ai.service';

export const getMessageKey = (message: Message, index: number) => {
  const timestamp = message.timestamp || '';
  const contentKey = message.content?.slice(0, 48) || '';
  return `${message.role}-${timestamp}-${index}-${contentKey}`;
};

export function renderMarkdown(text: string, linkColor: string) {
  const codeBlocks: string[] = [];
  let processed = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `%%CODE_BLOCK_${codeBlocks.length - 1}%%`;
  });

  processed = processed.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, (_, tableBlock: string) => {
    const rows = tableBlock
      .trim()
      .split('\n')
      .filter((r) => r.trim());
    if (rows.length < 2) return tableBlock;
    const isSep = /^\|[\s\-:|]+\|$/.test(rows[1].trim());
    const dataRows = isSep ? [rows[0], ...rows.slice(2)] : rows;
    const html = dataRows
      .map((row, ri) => {
        const cells = row.split('|').filter((c, i, a) => i > 0 && i < a.length - 1);
        const tag = ri === 0 && isSep ? 'th' : 'td';
        const cellsHtml = cells
          .map(
            (c) =>
              `<${tag} style="padding:6px 12px;border:1px solid rgba(128,128,128,0.2);font-size:12px">${c.trim()}</${tag}>`
          )
          .join('');
        return `<tr>${cellsHtml}</tr>`;
      })
      .join('');
    // Colapsable con <details> nativo: las tablas largas se pueden esconder
    // con un clic sin meter estado de React dentro del innerHTML.
    const bodyRows = isSep ? dataRows.length - 1 : dataRows.length;
    return (
      `\n<details open style="margin:8px 0">` +
      `<summary style="cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:6px;` +
      `font-size:11px;font-weight:700;padding:3px 10px;border-radius:14px;` +
      `border:1px solid rgba(128,128,128,0.35);background:rgba(128,128,128,0.08);margin-bottom:4px">` +
      `📊 Tabla · ${bodyRows} fila${
        bodyRows === 1 ? '' : 's'
      } — clic para mostrar/ocultar</summary>` +
      `<div style="overflow-x:auto"><table style="border-collapse:collapse;margin:4px 0;width:100%">${html}</table></div>` +
      `</details>\n`
    );
  });

  processed = processed.replace(
    /^-{3,}$/gm,
    '<hr style="border:none;border-top:1px solid rgba(128,128,128,0.2);margin:12px 0"/>'
  );
  processed = processed.replace(
    /^### (.+)$/gm,
    '<h4 style="margin:10px 0 4px;font-size:14px;font-weight:600">$1</h4>'
  );
  processed = processed.replace(
    /^## (Respuesta de: .+)$/gm,
    '<h3 style="margin:10px 0 8px;font-size:15px;font-weight:800;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;display:flex;align-items:center;gap:8px"><span style="font-size:13px;color:currentColor">✦</span><span>$1</span><span style="font-size:13px;color:currentColor">✦</span></h3>'
  );
  processed = processed.replace(
    /^## (.+)$/gm,
    '<h3 style="margin:10px 0 4px;font-size:15px;font-weight:600">$1</h3>'
  );
  processed = processed.replace(
    /^# (.+)$/gm,
    '<h2 style="margin:12px 0 4px;font-size:16px;font-weight:700">$1</h2>'
  );
  processed = processed.replace(
    /^- (.+)$/gm,
    '<li style="margin:1px 0;margin-left:16px;font-size:13px">$1</li>'
  );
  processed = processed.replace(
    /^\d+\. (.+)$/gm,
    '<li style="margin:1px 0;margin-left:16px;list-style-type:decimal;font-size:13px">$1</li>'
  );
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  processed = processed.replace(
    /`([^`]+)`/g,
    '<code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px;font-size:12px;font-family:monospace">$1</code>'
  );
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<div style="margin:8px 0"><img src="$2" alt="$1" style="max-width:100%;max-height:400px;border-radius:12px;border:1px solid rgba(128,128,128,0.2)" /><div style="font-size:10px;color:rgba(128,128,128,0.7);margin-top:4px">$1</div></div>'
  );
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" style="color:${linkColor};font-weight:600;text-decoration:underline">$1</a>`
  );
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.replace(/\n\n/g, '<br/>');
  processed = processed.replace(/\n/g, '<br/>');
  processed = processed.replace(/(<\/h[234]>|<\/table>|<\/pre>|<\/li>|<hr[^>]*\/>)<br\/>/g, '$1');
  processed = processed.replace(/<br\/>(<h[234]|<table|<pre|<hr|<li)/g, '$1');
  processed = processed.replace(
    /%%CODE_BLOCK_(\d+)%%/g,
    (_, i) =>
      `<pre style="background:rgba(0,0,0,0.05);padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;margin:8px 0;line-height:1.5"><code>${
        codeBlocks[Number(i)]
      }</code></pre>`
  );

  return processed;
}
