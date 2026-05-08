require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const app = express();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '5mb' }));

app.post('/api/send-email', upload.array('attachments'), async (req, res) => {
	try {
		const { recipients: recipientsRaw, subject, body, companyId } = req.body;

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

		await transporter.sendMail({
			from: `"올리브식권" <${smtpUser}>`,
			to: recipients.map(r => `"${r.name}" <${r.email}>`),
			subject,
			text: body || '',
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
