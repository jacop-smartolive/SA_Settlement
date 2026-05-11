require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

// 토큰 시크릿 (없으면 임의 생성 → 서버 재시작 시까지 유지)
const CONFIRM_SECRET = process.env.CONFIRM_SECRET || crypto.randomBytes(32).toString('hex');
function signConfirmToken(company, rowNo) {
	return crypto.createHmac('sha256', CONFIRM_SECRET)
		.update(String(company) + ':' + String(rowNo))
		.digest('hex')
		.slice(0, 16); // 16자리로 단축 (URL 길이 절약)
}
function verifyConfirmToken(company, rowNo, token) {
	if (!token) return false;
	var expected = signConfirmToken(company, rowNo);
	try {
		return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)));
	} catch(e) { return false; }
}

const app = express();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '5mb' }));

// ─── 수정본 파일 업로드 / 다운로드 (메일 발송 시 사용) ───
const REVISIONS_DIR = path.join(__dirname, 'revisions');
if (!fs.existsSync(REVISIONS_DIR)) {
	try { fs.mkdirSync(REVISIONS_DIR, { recursive: true }); } catch(e) {}
}
function revisionFilePath(company, rowNo) {
	var safeCompany = String(company).replace(/[^\w가-힣()\-_.]/g, '_');
	return path.join(REVISIONS_DIR, safeCompany + '_' + rowNo + '.xlsx');
}
app.post('/api/upload-revision', upload.single('file'), (req, res) => {
	try {
		const c = String(req.body.companyName || '');
		const rNum = parseInt(req.body.rowNo, 10);
		if (!c || isNaN(rNum) || !req.file) return res.status(400).json({ error: '잘못된 요청' });
		const dest = revisionFilePath(c, rNum);
		fs.writeFileSync(dest, req.file.buffer);
		console.log('[Revision uploaded]', c, rNum, '→', dest, req.file.size + 'B');
		res.json({ success: true, fileName: req.file.originalname, size: req.file.size });
	} catch(err) {
		console.error('upload-revision error:', err);
		res.status(500).json({ error: err.message });
	}
});
app.delete('/api/upload-revision', (req, res) => {
	try {
		const c = String(req.query.c || '');
		const rNum = parseInt(req.query.r, 10);
		if (!c || isNaN(rNum)) return res.status(400).json({ error: '잘못된 요청' });
		const dest = revisionFilePath(c, rNum);
		if (fs.existsSync(dest)) fs.unlinkSync(dest);
		res.json({ success: true });
	} catch(err) {
		res.status(500).json({ error: err.message });
	}
});
app.get('/api/revision-file', (req, res) => {
	const c = String(req.query.c || '');
	const rNum = parseInt(req.query.r, 10);
	if (!c || isNaN(rNum)) return res.status(400).send('잘못된 요청');
	const dest = revisionFilePath(c, rNum);
	if (!fs.existsSync(dest)) return res.status(404).send('파일 없음');
	res.sendFile(dest);
});

// ─── 정산서 확정 (메일 링크 클릭) ───
// 경로 ENV 지원 (멀티 인스턴스/Docker 운영 대비)
const CONFIRM_FILE = process.env.CONFIRMATIONS_PATH || path.join(__dirname, 'confirmations.json');
let confirmations = {};
try { if (fs.existsSync(CONFIRM_FILE)) confirmations = JSON.parse(fs.readFileSync(CONFIRM_FILE, 'utf8')); } catch(e) {}

function saveConfirmations() {
	try { fs.writeFileSync(CONFIRM_FILE, JSON.stringify(confirmations, null, 2)); } catch(e) {}
}

// 메일에서 클릭 → 정산서 확정 처리
app.get('/api/confirm-settlement', (req, res) => {
	const c = String(req.query.c || '');
	// rowNo는 항상 정수 문자열로 정규화 (문자열/숫자 혼동 방지)
	const rNum = parseInt(req.query.r, 10);
	const t = String(req.query.t || '');
	if (!c || isNaN(rNum)) return res.status(400).send('잘못된 요청입니다.');
	const r = String(rNum);
	// HMAC 토큰 검증 (없거나 위조면 거부)
	if (!verifyConfirmToken(c, r, t)) {
		return res.status(403).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'맑은 고딕',sans-serif;text-align:center;padding:80px;color:#dc2626;">
			<h1>인증 실패</h1><p>유효하지 않은 링크입니다. 관리자에게 문의하세요.</p></body></html>`);
	}
	const key = c + ':' + r;
	const now = new Date();
	if (!confirmations[key]) {
		confirmations[key] = {
			datetime: now.toISOString(),
			ip: req.ip,
			userAgent: req.headers['user-agent'] || ''
		};
		saveConfirmations();
		console.log('[Confirm] ' + key + ' at ' + now.toISOString());
	}
	const ts = now.toLocaleString('ko-KR');
	res.send(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>정산서 확정 완료</title>
		<style>
			body { font-family:'Nanum Gothic','맑은 고딕',sans-serif; background:#f9fafb; margin:0; padding:60px 24px; color:#111827; }
			.card { max-width:480px; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,.08); padding:48px 36px; text-align:center; }
			.icon { width:72px; height:72px; border-radius:50%; background:#d1fae5; margin:0 auto 24px; display:flex; align-items:center; justify-content:center; }
			h1 { font-size:24px; font-weight:700; color:#059669; margin:0 0 12px; }
			.sub { color:#6b7280; font-size:14px; line-height:1.6; margin-bottom:32px; }
			.info { background:#f9fafb; border-radius:10px; padding:16px 20px; font-size:13px; color:#374151; text-align:left; }
			.info dt { color:#9ca3af; font-size:12px; margin-bottom:2px; }
			.info dd { margin:0 0 12px; font-weight:600; }
			.info dd:last-child { margin-bottom:0; }
		</style></head><body>
		<div class="card">
			<div class="icon"><svg width="40" height="40" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
			<h1>정산서 확정 완료</h1>
			<p class="sub">정상적으로 확정 처리되었습니다.<br>관리자 시스템에 자동 반영됩니다.</p>
			<dl class="info">
				<dt>기업</dt><dd>${c}</dd>
				<dt>정산 번호</dt><dd>${r}</dd>
				<dt>확정 일시</dt><dd>${ts}</dd>
			</dl>
		</div></body></html>`);
});

// 클라이언트(상세 페이지)에서 폴링 → 회사별 확정 목록 조회
app.get('/api/settlement-confirmations', (req, res) => {
	const c = req.query.company || '';
	if (!c) return res.json({ confirmations: {} });
	const result = {};
	Object.keys(confirmations).forEach(key => {
		const idx = key.indexOf(':');
		if (idx < 0) return;
		const comp = key.slice(0, idx);
		const row = key.slice(idx + 1);
		if (comp === c) result[row] = confirmations[key];
	});
	res.json({ confirmations: result });
});

app.post('/api/send-email', upload.array('attachments'), async (req, res) => {
	try {
		const { recipients: recipientsRaw, subject, body, companyId, companyName, rowNo } = req.body;

		if (!recipientsRaw) return res.status(400).json({ error: '수신자가 없습니다.' });

		let recipients;
		try { recipients = JSON.parse(recipientsRaw); }
		catch { return res.status(400).json({ error: '수신자 데이터 형식이 올바르지 않습니다.' }); }

		if (!Array.isArray(recipients) || recipients.length === 0) {
			return res.status(400).json({ error: '수신자가 없습니다.' });
		}
		if (!subject || !subject.trim()) {
			return res.status(400).json({ error: '제목을 입력해 주세요.' });
		}

		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;
		if (!smtpUser || !smtpPass) {
			return res.status(500).json({ error: '메일 서버 설정이 되어있지 않습니다.' });
		}

		const attachments = (req.files || []).map(f => ({ filename: f.originalname, content: f.buffer }));
		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com', port: 465, secure: true,
			auth: { user: smtpUser, pass: smtpPass },
		});

		// 정산서 확정 링크 (companyName + rowNo가 있을 때만 추가)
		const host = req.headers.host || `localhost:${PORT}`;
		const proto = req.headers['x-forwarded-proto'] || 'http';
		let confirmHtml = '', confirmText = '';
		if (companyName && rowNo) {
			// HMAC 토큰 자동 생성 (URL 위조 방지)
			const token = signConfirmToken(companyName, rowNo);
			const confirmUrl = `${proto}://${host}/api/confirm-settlement?c=${encodeURIComponent(companyName)}&r=${encodeURIComponent(rowNo)}&t=${token}`;
			confirmText = `\n\n────────────────────────────────────\n정산서 내용을 확인하셨다면 아래 링크를 클릭해주세요.\n[정산서 확정 처리] ${confirmUrl}\n────────────────────────────────────`;
			confirmHtml = `
				<hr style="margin:32px 0 24px;border:none;border-top:1px solid #e5e7eb;">
				<div style="text-align:center;">
					<p style="font-size:13px;color:#374151;margin:0 0 18px;text-align:center;">정산서 내용을 확인하셨다면 아래 버튼을 클릭해주세요.</p>
					<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
						<tr><td align="center" bgcolor="#059669" style="border-radius:8px;">
							<a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:8px;background:#059669;">✓ 정산서 확정 처리</a>
						</td></tr>
					</table>
					<p style="font-size:11px;color:#9ca3af;margin:14px 0 0;text-align:center;">클릭 시 관리자 시스템에 자동으로 확정 상태가 반영됩니다.</p>
				</div>`;
		}

		const textBody = (body || '') + confirmText;
		// 중앙 정렬 + 좌우 여백 (이메일 클라이언트 호환 위해 table 기반)
		const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
			<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Apple SD Gothic Neo','맑은 고딕',sans-serif;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;">
					<tr><td align="center" style="padding:32px 16px;">
						<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
							<tr><td style="padding:40px 48px;color:#111827;line-height:1.7;font-size:14px;">
								${(body || '').replace(/\n/g, '<br>')}
								${confirmHtml}
							</td></tr>
						</table>
					</td></tr>
				</table>
			</body></html>`;

		await transporter.sendMail({
			from: `"올리브식권" <${smtpUser}>`,
			to: recipients.map(r => `"${r.name}" <${r.email}>`),
			subject,
			text: textBody,
			html: htmlBody,
			attachments,
		});

		res.json({
			success: true,
			message: `${recipients.length}명에게 메일이 발송되었습니다.`,
			sentRecipients: recipients.map(r => ({ name: r.name, email: r.email })),
			companyId: companyId || null,
			sentAt: new Date().toISOString(),
		});
	} catch (err) {
		console.error('Email send error:', err);
		res.status(500).json({ error: err.message || '메일 발송 중 오류가 발생했습니다.' });
	}
});

// ----- Gmail IMAP: 회신메일 확인 -----
function parseFromAddresses(query) {
	var matches = String(query || '').match(/from:([^\s)]+)/gi);
	if (!matches) return [];
	return matches.map(function(m){ return m.replace(/^from:/i, ''); });
}
function checkAttachment(structure) {
	if (!structure) return false;
	if (structure.disposition === 'attachment') return true;
	if (Array.isArray(structure.childNodes)) return structure.childNodes.some(checkAttachment);
	return false;
}
function formatKoDateTime(d) {
	if (!d) return '';
	return new Date(d).toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}

app.post('/api/gmail-search', async (req, res) => {
	let client = null;
	try {
		const query = (req.body && req.body.query) || '';
		if (!query.trim()) return res.json({ results: [] });
		const imapUser = process.env.SMTP_USER;
		const imapPass = process.env.SMTP_PASS;
		if (!imapUser || !imapPass) return res.status(500).json({ error: '메일 서버 설정이 되어있지 않습니다.' });
		client = new ImapFlow({ host:'imap.gmail.com', port:993, secure:true, auth:{ user:imapUser, pass:imapPass }, logger:false });
		await client.connect();
		const results = [];
		const lock = await client.getMailboxLock('INBOX');
		try {
			const fromAddrs = parseFromAddresses(query);
			let allUids = [];
			if (fromAddrs.length > 0) {
				for (const addr of fromAddrs) {
					const found = await client.search({ from: addr }, { uid: true });
					allUids.push(...Array.from(found));
				}
				allUids = [...new Set(allUids)];
			} else {
				const found = await client.search({ 'X-GM-RAW': query }, { uid: true });
				allUids = Array.from(found);
			}
			if (allUids.length === 0) { lock.release(); await client.logout(); return res.json({ results: [] }); }
			allUids.sort((a,b) => a - b);
			const recentUids = allUids.slice(-50).reverse();
			for await (const msg of client.fetch({ uid: recentUids.join(',') }, { uid:true, envelope:true, bodyStructure:true })) {
				const env = msg.envelope; if (!env) continue;
				const fromAddr = env.from && env.from[0] ? `${env.from[0].name || ''} <${env.from[0].address || ''}>`.trim() : '';
				results.push({
					uid: msg.uid,
					subject: env.subject || '(제목 없음)',
					from: fromAddr,
					date: formatKoDateTime(env.date),
					snippet: '',
					hasAttachment: checkAttachment(msg.bodyStructure),
				});
			}
			results.sort((a,b) => b.uid - a.uid);
		} finally { lock.release(); }
		await client.logout();
		res.json({ results });
	} catch (err) {
		console.error('Gmail search error:', err);
		if (client) { try { await client.logout(); } catch{} }
		res.status(500).json({ error: err.message || '메일 검색 중 오류가 발생했습니다.' });
	}
});

app.post('/api/gmail-detail', async (req, res) => {
	let client = null;
	try {
		const uid = req.body && req.body.uid;
		if (!uid) return res.status(400).json({ error: '메일 UID가 필요합니다.' });
		const imapUser = process.env.SMTP_USER;
		const imapPass = process.env.SMTP_PASS;
		if (!imapUser || !imapPass) return res.status(500).json({ error: '메일 서버 설정이 되어있지 않습니다.' });
		client = new ImapFlow({ host:'imap.gmail.com', port:993, secure:true, auth:{ user:imapUser, pass:imapPass }, logger:false });
		await client.connect();
		let detail = null;
		const lock = await client.getMailboxLock('INBOX');
		try {
			const raw = await client.download(String(uid), undefined, { uid: true });
			if (raw && raw.content) {
				const chunks = [];
				for await (const chunk of raw.content) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
				const parsed = await simpleParser(Buffer.concat(chunks));
				const toAddr = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map(t=>t.text).join(', ') : parsed.to.text) : '';
				detail = {
					subject: parsed.subject || '(제목 없음)',
					from: (parsed.from && parsed.from.text) || '',
					to: toAddr,
					date: formatKoDateTime(parsed.date),
					body: parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]*>/g,'') : '') || '',
					attachments: (parsed.attachments || []).map(a => a.filename || '첨부파일'),
				};
			}
		} finally { lock.release(); }
		await client.logout();
		if (!detail) return res.status(404).json({ error: '메일을 찾을 수 없습니다.' });
		res.json({ detail });
	} catch (err) {
		console.error('Gmail detail error:', err);
		if (client) { try { await client.logout(); } catch{} }
		res.status(500).json({ error: err.message || '메일 상세 조회 중 오류가 발생했습니다.' });
	}
});

app.listen(PORT, () => {
	console.log(`SA_Settlement server running → http://localhost:${PORT}/src/index.html`);
});
