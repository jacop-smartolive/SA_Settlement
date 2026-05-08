/**
 * Mail Send Modal (vanilla JS port of ADMIN-SITE-UI/src/web/sa/settlement-statement/components/MailSendModal.tsx)
 *
 * Usage:
 *   MailSendModal.open({
 *     companyName: "두산에너빌리티 (주)",
 *     bizNo: "609-81-04684",
 *     rowInfo: "2025-03-01 ~ 2025-03-31",
 *     attachmentName: "두산에너빌리티_정산서_20260417.xlsx",
 *     fetchAttachment: async () => fetch('../../resources/samples/settlement_per_person.xlsx').then(r => r.blob()),
 *     onShowPreview: () => openRowPreview(rowNo, false),
 *   });
 */
(function(global) {
	'use strict';

	var MAIL_DEFAULT_SUBJ = '[올리브식권] 정산서 발송';
	var MAIL_DEFAULT_BODY = '안녕하세요.\n\n정산서를 발송드립니다.\n첨부파일을 확인해 주시기 바랍니다.\n\n감사합니다.';
	var MAIL_RECENT_SUBJ = '[올리브식권] 2월 정산서 발송';
	var MAIL_RECENT_BODY = '안녕하세요.\n\n2025년 2월 정산서를 송부드립니다.\n금액 및 내역 확인 후 이상 없으시면 회신 부탁드립니다.\n\n감사합니다.';

	var state = null;
	var root = null;
	var extraFileSeq = 1;
	var nextRecipientId = 1;

	function $(sel, scope) { return (scope || document).querySelector(sel); }
	function recipStorageKey(companyName, bizNo) { return 'settlement-recipients-' + companyName + '-' + (bizNo || ''); }

	function loadRecipients(companyName, bizNo) {
		try {
			var raw = localStorage.getItem(recipStorageKey(companyName, bizNo));
			if (!raw) return [];
			var arr = JSON.parse(raw);
			return arr.map(function(r) { return { id: r.id, name: r.name || '수신자', person: r.person || r.name, phone: r.phone || '', email: r.email || '', checked: r.checked !== false }; });
		} catch (e) { return []; }
	}
	function saveRecipients(companyName, bizNo, list) {
		try {
			var mapped = list.map(function(r) { return { id: r.id, name: r.name, person: r.person, phone: r.phone, email: r.email, checked: r.checked !== false }; });
			localStorage.setItem(recipStorageKey(companyName, bizNo), JSON.stringify(mapped));
		} catch (e) { console.error('saveRecipients error', e); }
	}

	function escapeHtml(s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
			return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
		});
	}

	function toast(msg, kind) {
		var wrap = $('.msm-toast-wrap');
		if (!wrap) { wrap = document.createElement('div'); wrap.className = 'msm-toast-wrap'; document.body.appendChild(wrap); }
		var el = document.createElement('div');
		el.className = 'msm-toast ' + (kind || '');
		el.textContent = msg;
		wrap.appendChild(el);
		setTimeout(function() { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function(){ el.remove(); }, 300); }, 2500);
	}

	function buildRoot() {
		if (root) return root;
		root = document.createElement('div');
		root.className = 'msm-overlay';
		root.innerHTML = [
			'<div class="msm-backdrop" data-close></div>',
			'<div class="msm-modal">',
				'<div class="msm-header">',
					'<h2 class="msm-title">메일 발송</h2>',
					'<button class="msm-close" data-close type="button">&times;</button>',
				'</div>',
				'<div class="msm-body">',
					'<div class="msm-section white">',
						'<div style="margin-bottom:16px;">',
							'<label class="msm-label" for="msm-subj">제목</label>',
							'<input id="msm-subj" class="msm-input" type="text" />',
						'</div>',
						'<div>',
							'<label class="msm-label" for="msm-body">본문</label>',
							'<textarea id="msm-body" class="msm-textarea" rows="6"></textarea>',
						'</div>',
						'<div class="msm-tpl-row">',
							'<div class="msm-tpl-item" data-tpl="recent"><span class="msm-chk" id="msm-chk-recent"></span><span>최근 메시지 <span style="color:#d1d5db;">(2025-02-28 14:32)</span></span></div>',
							'<div class="msm-tpl-item" data-tpl="default"><span class="msm-chk on" id="msm-chk-default"></span><span>기본 메시지</span><button class="msm-edit-link" id="msm-edit-def" type="button">(<u>내용수정</u>)</button></div>',
						'</div>',
					'</div>',

					'<div class="msm-section">',
						'<div class="msm-sec-head">',
							'<div><h3>첨부파일</h3><span class="msm-count" id="msm-file-count">1개</span></div>',
							'<input type="file" id="msm-extra-input" style="display:none" />',
							'<button class="msm-btn-sm" id="msm-add-file" type="button">+ 파일추가</button>',
						'</div>',
						'<div class="msm-file-list" id="msm-file-list"></div>',
					'</div>',

					'<div class="msm-section">',
						'<div class="msm-sec-head">',
							'<div><h3>수신자</h3><span class="msm-count" id="msm-recip-count">0명 선택</span></div>',
							'<button class="msm-btn-sm" id="msm-manage-recip" type="button">+ 수신자 등록</button>',
						'</div>',
						'<div id="msm-recip-box"></div>',
					'</div>',
				'</div>',
				'<div class="msm-footer">',
					'<button class="msm-btn msm-btn-secondary" data-close type="button">취소</button>',
					'<button class="msm-btn msm-btn-primary" id="msm-send-btn" type="button">',
						'<span id="msm-send-label">발송</span>',
					'</button>',
				'</div>',
			'</div>',

			// 기본 메시지 수정 서브 모달
			'<div class="msm-submodal" id="msm-def-edit">',
				'<div class="msm-backdrop" data-close-sub="def-edit"></div>',
				'<div class="msm-submodal-box">',
					'<div class="msm-header"><h2 class="msm-title">기본 메시지 수정</h2><button class="msm-close" data-close-sub="def-edit" type="button">&times;</button></div>',
					'<div class="msm-submodal-body">',
						'<label class="msm-label" for="msm-def-subj">제목</label>',
						'<input id="msm-def-subj" class="msm-input" type="text" style="margin-bottom:12px;" />',
						'<label class="msm-label" for="msm-def-body">본문</label>',
						'<textarea id="msm-def-body" class="msm-textarea" rows="5"></textarea>',
					'</div>',
					'<div class="msm-submodal-footer">',
						'<button class="msm-btn msm-btn-secondary" data-close-sub="def-edit" type="button">취소</button>',
						'<button class="msm-btn msm-btn-primary" id="msm-def-save" type="button">저장</button>',
					'</div>',
				'</div>',
			'</div>',

			// 수신자 관리 서브 모달
			'<div class="msm-submodal msm-submodal-lg" id="msm-recip-modal">',
				'<div class="msm-backdrop" data-close-sub="recip-modal"></div>',
				'<div class="msm-submodal-box">',
					'<div class="msm-header"><h2 class="msm-title">수신자 관리</h2><button class="msm-close" data-close-sub="recip-modal" type="button">&times;</button></div>',
					'<div class="msm-rm-form">',
						'<div class="field"><small>이름</small><input id="msm-rm-name" placeholder="홍길동" /></div>',
						'<div class="field"><small>이메일</small><input id="msm-rm-email" placeholder="example@company.com" /></div>',
						'<div class="field"><small>연락처</small><input id="msm-rm-phone" placeholder="000-0000-0000" /></div>',
						'<button id="msm-rm-add" type="button">추가</button>',
					'</div>',
					'<div style="padding:0 24px 8px; font-size:12px; color:#6b7280;">총 <b id="msm-rm-total">0</b>명</div>',
					'<div class="msm-rm-table-wrap">',
						'<table class="msm-rm-table"><thead><tr><th style="width:56px; text-align:center;">순서</th><th>이름</th><th>이메일</th><th style="width:140px;">연락처</th><th style="width:80px; text-align:center;">삭제</th></tr></thead><tbody id="msm-rm-tbody"></tbody></table>',
					'</div>',
					'<div class="msm-submodal-footer"><button class="msm-btn msm-btn-secondary" data-close-sub="recip-modal" type="button">닫기</button></div>',
				'</div>',
			'</div>',

			// 수신자 삭제 확인 서브 모달
			'<div class="msm-submodal" id="msm-recip-delconfirm">',
				'<div class="msm-backdrop" data-close-sub="recip-delconfirm"></div>',
				'<div class="msm-submodal-box" style="max-width:400px;">',
					'<div class="msm-submodal-body">',
						'<h3 style="margin:0 0 8px; font-size:15px; font-weight:600;">수신자 삭제</h3>',
						'<p style="margin:0; font-size:13px; color:#6b7280;"><b id="msm-del-name"></b>님을 수신자 목록에서 삭제하시겠습니까?</p>',
					'</div>',
					'<div class="msm-submodal-footer">',
						'<button class="msm-btn msm-btn-secondary" data-close-sub="recip-delconfirm" type="button">취소</button>',
						'<button class="msm-btn msm-btn-danger" id="msm-del-confirm" type="button">삭제</button>',
					'</div>',
				'</div>',
			'</div>',
		].join('');
		document.body.appendChild(root);
		bindEvents();
		return root;
	}

	function bindEvents() {
		root.addEventListener('click', function(e) {
			var t = e.target;
			if (t.hasAttribute('data-close')) { close(); return; }
			var subClose = t.getAttribute('data-close-sub') || (t.closest('[data-close-sub]') && t.closest('[data-close-sub]').getAttribute('data-close-sub'));
			if (subClose) { closeSub(subClose); return; }
			var tpl = t.closest('.msm-tpl-item');
			if (tpl) { pickTemplate(tpl.getAttribute('data-tpl')); return; }
		});
		$('#msm-subj', root).addEventListener('input', function() { state.subj = this.value; refreshTplChks(); });
		$('#msm-body', root).addEventListener('input', function() { state.body = this.value; refreshTplChks(); });
		$('#msm-edit-def', root).addEventListener('click', function(e) { e.stopPropagation(); openSub('def-edit'); $('#msm-def-subj').value = state.defSubj; $('#msm-def-body').value = state.defBody; });
		$('#msm-def-save', root).addEventListener('click', function() {
			state.defSubj = $('#msm-def-subj').value;
			state.defBody = $('#msm-def-body').value;
			if (state.isDefault) { state.subj = state.defSubj; state.body = state.defBody; $('#msm-subj', root).value = state.subj; $('#msm-body', root).value = state.body; }
			closeSub('def-edit');
		});
		$('#msm-add-file', root).addEventListener('click', function() { $('#msm-extra-input', root).click(); });
		$('#msm-extra-input', root).addEventListener('change', function() {
			var f = this.files && this.files[0]; if (!f) return;
			state.extraFiles.push({ id: extraFileSeq++, name: f.name, file: f });
			this.value = '';
			renderFiles();
		});
		$('#msm-manage-recip', root).addEventListener('click', function() { openSub('recip-modal'); renderRecipientManage(); });
		$('#msm-rm-add', root).addEventListener('click', addRecipient);
		$('#msm-rm-phone', root).addEventListener('input', function() {
			var digits = this.value.replace(/\D/g, '').slice(0, 11);
			if (digits.length > 7) this.value = digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
			else if (digits.length > 3) this.value = digits.slice(0,3) + '-' + digits.slice(3);
			else this.value = digits;
		});
		$('#msm-del-confirm', root).addEventListener('click', function() {
			if (!state.pendingDelete) return;
			var id = state.pendingDelete.id;
			var removedName = state.pendingDelete.name;
			state.recipients = state.recipients.filter(function(r) { return r.id !== id; });
			saveRecipients(state.companyName, state.bizNo, state.recipients);
			state.pendingDelete = null;
			renderRecipients(); renderRecipientManage();
			closeSub('recip-delconfirm');
			toast(removedName + '님이 삭제되었습니다');
		});
		$('#msm-send-btn', root).addEventListener('click', send);
	}

	function addRecipient() {
		var n = $('#msm-rm-name'), e = $('#msm-rm-email'), p = $('#msm-rm-phone');
		[n,e,p].forEach(function(el){ el.classList.remove('err'); });
		var errors = [];
		if (!n.value.trim()) { n.classList.add('err'); errors.push('이름'); }
		if (!e.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim())) { e.classList.add('err'); errors.push('이메일'); }
		if (!p.value.trim()) { p.classList.add('err'); errors.push('연락처'); }
		if (errors.length) { toast(errors.join(', ') + ' 입력을 확인해 주세요', 'error'); return; }
		var newId = nextRecipientId++;
		var recip = { id: newId, name: '수신자' + newId, person: n.value.trim(), email: e.value.trim(), phone: p.value.trim(), checked: true };
		state.recipients.push(recip);
		saveRecipients(state.companyName, state.bizNo, state.recipients);
		toast(recip.person + '님이 등록되었습니다', 'success');
		n.value = ''; e.value = ''; p.value = '';
		renderRecipients(); renderRecipientManage();
	}

	function renderFiles() {
		var list = $('#msm-file-list', root);
		var html = '';
		html += '<div class="msm-file-item"><div class="msm-file-name"><span>📎</span><span>' + escapeHtml(state.attachmentName) + '</span><span class="msm-file-tag">정산서</span></div>';
		html += state.onShowPreview ? '<button class="msm-edit-link" id="msm-preview-btn" type="button"><u>미리보기</u></button></div>' : '<span style="font-size:11px;color:#9ca3af;">자동첨부</span></div>';
		state.extraFiles.forEach(function(ef) {
			html += '<div class="msm-file-item"><div class="msm-file-name"><span>📎</span><span>' + escapeHtml(ef.name) + '</span></div><button class="msm-file-remove" data-extra="' + ef.id + '" type="button">&times;</button></div>';
		});
		list.innerHTML = html;
		$('#msm-file-count', root).textContent = (1 + state.extraFiles.length) + '개';
		if (state.onShowPreview) { var pb = $('#msm-preview-btn', root); if (pb) pb.onclick = function(){ state.onShowPreview(); }; }
		list.querySelectorAll('[data-extra]').forEach(function(b) {
			b.onclick = function() {
				var id = parseInt(b.getAttribute('data-extra'));
				state.extraFiles = state.extraFiles.filter(function(f) { return f.id !== id; });
				renderFiles();
			};
		});
	}

	function renderRecipients() {
		var box = $('#msm-recip-box', root);
		if (!state.recipients.length) {
			box.innerHTML = '<div class="msm-empty">등록된 수신자가 없습니다. 상단 "수신자 등록" 버튼으로 추가해 주세요.</div>';
		} else {
			var rows = state.recipients.map(function(r) {
				return '<div class="msm-recipient-row" data-id="' + r.id + '">'
					+ '<span class="msm-chk ' + (r.checked ? 'on' : '') + '"></span>'
					+ '<span>' + escapeHtml(r.name) + '</span>'
					+ '<span style="font-weight:500;">' + escapeHtml(r.person) + '</span>'
					+ '<span style="color:#6b7280;">' + escapeHtml(r.phone) + '</span>'
					+ '<span class="email">' + escapeHtml(r.email) + '</span>'
					+ '</div>';
			}).join('');
			box.innerHTML = '<div class="msm-recipient-table"><div class="msm-recipient-head"><span></span><span>구분</span><span>이름</span><span>연락처</span><span>이메일</span></div>' + rows + '</div>';
			box.querySelectorAll('.msm-recipient-row').forEach(function(row) {
				row.onclick = function() {
					var id = parseInt(row.getAttribute('data-id'));
					var r = state.recipients.find(function(x) { return x.id === id; });
					if (r) { r.checked = !r.checked; saveRecipients(state.companyName, state.bizNo, state.recipients); renderRecipients(); }
				};
			});
		}
		var checked = state.recipients.filter(function(r) { return r.checked; }).length;
		$('#msm-recip-count', root).textContent = checked + '명 선택';
		var btn = $('#msm-send-btn', root);
		if (checked === 0) btn.classList.add('disabled'); else btn.classList.remove('disabled');
	}

	function renderRecipientManage() {
		$('#msm-rm-total', root).textContent = state.recipients.length;
		var tbody = $('#msm-rm-tbody', root);
		if (!state.recipients.length) {
			tbody.innerHTML = '<tr><td colspan="5" style="padding:28px; text-align:center; color:#9ca3af; font-size:13px;">등록된 수신자가 없습니다.</td></tr>';
			return;
		}
		tbody.innerHTML = state.recipients.map(function(r, i) {
			return '<tr><td style="text-align:center; color:#9ca3af;">' + (i+1) + '</td>'
				+ '<td>' + escapeHtml(r.person) + '</td>'
				+ '<td>' + escapeHtml(r.email) + '</td>'
				+ '<td>' + escapeHtml(r.phone) + '</td>'
				+ '<td style="text-align:center;"><button class="msm-rm-del" data-del="' + r.id + '" type="button">삭제</button></td></tr>';
		}).join('');
		tbody.querySelectorAll('[data-del]').forEach(function(b) {
			b.onclick = function() {
				var id = parseInt(b.getAttribute('data-del'));
				var r = state.recipients.find(function(x) { return x.id === id; });
				if (!r) return;
				state.pendingDelete = { id: id, name: r.person };
				$('#msm-del-name', root).textContent = r.person;
				openSub('recip-delconfirm');
			};
		});
	}

	function pickTemplate(which) {
		if (which === 'recent') { state.subj = MAIL_RECENT_SUBJ; state.body = MAIL_RECENT_BODY; state.isRecent = true; state.isDefault = false; }
		else { state.subj = state.defSubj; state.body = state.defBody; state.isDefault = true; state.isRecent = false; }
		$('#msm-subj', root).value = state.subj;
		$('#msm-body', root).value = state.body;
		refreshTplChks();
	}
	function refreshTplChks() {
		state.isDefault = (state.subj === state.defSubj && state.body === state.defBody);
		state.isRecent = (state.subj === MAIL_RECENT_SUBJ && state.body === MAIL_RECENT_BODY);
		$('#msm-chk-default', root).classList.toggle('on', state.isDefault);
		$('#msm-chk-recent', root).classList.toggle('on', state.isRecent);
	}
	function openSub(id) { $('#msm-' + id, root).classList.add('open'); }
	function closeSub(id) { $('#msm-' + id, root).classList.remove('open'); }

	async function send() {
		var checked = state.recipients.filter(function(r) { return r.checked; });
		if (!checked.length) return;
		var btn = $('#msm-send-btn', root);
		if (btn.dataset.sending === '1') return;
		btn.dataset.sending = '1';
		$('#msm-send-label', root).textContent = '발송 중...';
		btn.classList.add('disabled');
		try {
			var fd = new FormData();
			fd.append('recipients', JSON.stringify(checked.map(function(r) { return { name: r.person, email: r.email }; })));
			fd.append('subject', state.subj);
			fd.append('body', state.body);
			// 정산서 파일 자동 첨부
			if (state.fetchAttachment) {
				try {
					var blob = await state.fetchAttachment();
					fd.append('attachments', blob, state.attachmentName);
				} catch (e) { console.warn('정산서 첨부 실패:', e); }
			}
			state.extraFiles.forEach(function(ef) { fd.append('attachments', ef.file, ef.name); });
			var res = await fetch('/api/send-email', { method: 'POST', body: fd });
			var data = await res.json();
			if (!res.ok) throw new Error(data.error || '메일 발송에 실패했습니다.');
			toast(data.message || '메일이 발송되었습니다.', 'success');
			if (typeof state.onSuccess === 'function') {
				try {
					state.onSuccess({
						sentAt: data.sentAt || new Date().toISOString(),
						recipients: checked.map(function(r){ return { name: r.person, email: r.email, phone: r.phone }; }),
						subject: state.subj,
						body: state.body,
						files: (state.fetchAttachment ? 1 : 0) + state.extraFiles.length,
						status: '성공'
					});
				} catch (cbErr) { console.error('onSuccess callback error:', cbErr); }
			}
			close();
		} catch (err) {
			toast(err.message || '메일 발송 중 오류가 발생했습니다.', 'error');
		} finally {
			btn.dataset.sending = '0';
			$('#msm-send-label', root).textContent = '발송';
			btn.classList.remove('disabled');
			renderRecipients();
		}
	}

	function open(opts) {
		buildRoot();
		state = {
			companyName: opts.companyName || '',
			bizNo: opts.bizNo || '',
			attachmentName: opts.attachmentName || ('정산서_' + (opts.companyName || '기업') + '.xlsx'),
			fetchAttachment: opts.fetchAttachment || null,
			onShowPreview: opts.onShowPreview || null,
			onSuccess: opts.onSuccess || null,
			recipients: loadRecipients(opts.companyName, opts.bizNo),
			extraFiles: [],
			pendingDelete: null,
			defSubj: MAIL_DEFAULT_SUBJ,
			defBody: MAIL_DEFAULT_BODY,
			subj: MAIL_DEFAULT_SUBJ,
			body: MAIL_DEFAULT_BODY,
			isDefault: true,
			isRecent: false,
		};
		nextRecipientId = (state.recipients.reduce(function(m, r) { return Math.max(m, r.id); }, 0) || 0) + 1;
		$('#msm-subj', root).value = state.subj;
		$('#msm-body', root).value = state.body;
		refreshTplChks();
		renderFiles();
		renderRecipients();
		root.classList.add('open');
	}

	function close() {
		if (!root) return;
		root.classList.remove('open');
		root.querySelectorAll('.msm-submodal').forEach(function(s) { s.classList.remove('open'); });
	}

	global.MailSendModal = { open: open, close: close };

	// ============================================
	// 발송 내역 모달
	// ============================================
	var historyRoot = null;
	function buildHistoryRoot() {
		if (historyRoot) return historyRoot;
		historyRoot = document.createElement('div');
		historyRoot.className = 'msm-overlay';
		historyRoot.innerHTML = [
			'<div class="msm-backdrop" data-close-hist></div>',
			'<div class="msm-modal">',
				'<div class="msm-header">',
					'<h2 class="msm-title">발송내역</h2>',
					'<button class="msm-close" data-close-hist type="button">&times;</button>',
				'</div>',
				'<div class="msm-body" id="msm-hist-body" style="background:#fff;padding:0;"></div>',
				'<div class="msm-footer"><button class="msm-btn msm-btn-secondary" data-close-hist type="button">닫기</button></div>',
			'</div>',
		].join('');
		document.body.appendChild(historyRoot);
		historyRoot.addEventListener('click', function(e) {
			if (e.target.hasAttribute('data-close-hist') || (e.target.closest && e.target.closest('[data-close-hist]'))) {
				historyRoot.classList.remove('open');
			}
		});
		return historyRoot;
	}
	function renderHistory(list) {
		var body = historyRoot.querySelector('#msm-hist-body');
		if (!list || !list.length) {
			body.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#9ca3af;font-size:14px;">발송내역이 없습니다.</div>';
			return;
		}
		body.innerHTML = list.map(function(h) {
			var statusClass = h.status === '성공' ? 'status-ok' : 'status-fail';
			return '<div class="msm-hist-item">'
				+ '<div class="msm-hist-top">'
					+ '<p class="msm-hist-subject">' + escapeHtml(h.subject || '(제목 없음)') + '</p>'
					+ '<span class="msm-hist-badge ' + statusClass + '">' + escapeHtml(h.status || '성공') + '</span>'
				+ '</div>'
				+ '<div class="msm-hist-meta">'
					+ '<span>' + escapeHtml(h.date || '') + '</span>'
					+ '<span>수신자 ' + (h.to ? h.to.length : 0) + '명' + (h.to && h.to.length ? ' (' + h.to.map(escapeHtml).join(', ') + ')' : '') + '</span>'
					+ '<span>첨부 ' + (h.files || 0) + '개</span>'
				+ '</div>'
			+ '</div>';
		}).join('');
	}
	function openHistory(opts) {
		buildHistoryRoot();
		renderHistory(opts && opts.history ? opts.history : []);
		historyRoot.classList.add('open');
	}
	global.SendHistoryModal = { open: openHistory };
})(window);
