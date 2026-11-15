import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  addPassword,
  authMessage,
  hasPassword,
  logOut,
  resetPassword,
  signInEmail,
  signInGoogle,
  signUpEmail,
} from '../auth';
import type { SyncStatus } from '../cloud';
import { IconCheck } from '../icons';

interface Props {
  user: User | null | undefined;
  status: SyncStatus | 'local';
  onClose: () => void;
}

const STATUS_TEXT: Record<SyncStatus | 'local', string> = {
  synced: 'Tüm değişiklikler buluta kaydedildi.',
  pending: 'Değişiklikler gönderiliyor…',
  offline: 'İnternet yok. Değişiklikler bu cihazda bekliyor, bağlantı gelince gönderilecek.',
  local: 'Giriş yapmadın; kayıtlar yalnızca bu cihazda.',
};

export default function Account({ user, status, onClose }: Props) {
  return (
    <section className="page">
      <div className="cal-head">
        <h1 className="page-title">Hesap</h1>
        <button className="btn ghost" onClick={onClose}>
          Kapat
        </button>
      </div>
      {user === undefined ? <p className="muted">Yükleniyor…</p> : user ? <SignedIn user={user} status={status} /> : <SignIn />}
    </section>
  );
}

function SignedIn({ user, status }: { user: User; status: SyncStatus | 'local' }) {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const withPw = hasPassword(user);

  return (
    <>
      <div className="panel account-card">
        <p className="muted small">Giriş yapılan hesap</p>
        <p className="account-email">{user.email}</p>
        <p className={`sync-line sync-${status}`}>
          <span className="sync-dot" aria-hidden /> {STATUS_TEXT[status]}
        </p>
        <p className="muted small">
          Telefonda ve bilgisayarda aynı hesapla giriş yaptığında antrenmanların, programların ve ayarların otomatik eşitlenir.
        </p>
      </div>

      {!withPw && (
        <div className="panel">
          <h2 className="chart-title">Şifre ekle</h2>
          <p className="muted small">
            Google ile giriş bazı telefonlarda (özellikle iPhone'da ana ekrana eklenen uygulamada) açılmayabilir. Bir şifre
            eklersen aynı hesaba <b>{user.email}</b> ve bu şifreyle de girebilirsin.
          </p>
          <div className="auth-form">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Yeni şifre (en az 6 karakter)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              aria-label="Yeni şifre"
            />
            <button
              className="btn"
              disabled={busy || pw.length < 6}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  await addPassword(user, pw);
                  setPw('');
                  setMsg({ ok: true, text: 'Şifre eklendi. Artık e-posta ve şifreyle de girebilirsin.' });
                } catch (e) {
                  setMsg({ ok: false, text: authMessage(e) });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Şifreyi ekle
            </button>
          </div>
          {msg && <p className={msg.ok ? 'form-ok' : 'form-error'}>{msg.text}</p>}
        </div>
      )}

      <button className="btn secondary" onClick={() => logOut()}>
        Çıkış yap
      </button>
      <p className="muted small">
        Çıkış yapınca bu cihazda girişsiz kullandığın kayıtlara dönersin; hesabındaki kayıtlar bulutta kalır.
      </p>
    </>
  );
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (f: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await f();
      if (ok) setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: authMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="panel">
        <h2 className="chart-title">Cihazlar arasında eşitle</h2>
        <p className="muted small">
          Giriş yaptığında bu cihazdaki kayıtların hesabına taşınır. Telefonda ve bilgisayarda aynı hesapla girince her şey
          otomatik eşitlenir; internet yokken de çalışmaya devam eder.
        </p>
        <button className="btn full google-btn" disabled={busy} onClick={() => run(signInGoogle)}>
          <GoogleMark /> Google ile giriş yap
        </button>
      </div>

      <div className="panel">
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
            Giriş yap
          </button>
          <button role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
            Hesap oluştur
          </button>
        </div>
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => (mode === 'in' ? signInEmail(email, pw) : signUpEmail(email, pw)));
          }}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="E-posta"
          />
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            placeholder={mode === 'in' ? 'Şifre' : 'Şifre (en az 6 karakter)'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-label="Şifre"
          />
          <button className="btn" type="submit" disabled={busy || !email || !pw}>
            {mode === 'in' ? 'Giriş yap' : 'Hesap oluştur'}
          </button>
        </form>
        {mode === 'in' && (
          <button
            className="link-btn small"
            disabled={busy}
            onClick={() =>
              email
                ? run(() => resetPassword(email), 'Şifre sıfırlama bağlantısı e-postana gönderildi.')
                : setMsg({ ok: false, text: 'Önce e-posta adresini yaz.' })
            }
          >
            Şifremi unuttum
          </button>
        )}
        {msg && (
          <p className={msg.ok ? 'form-ok' : 'form-error'}>
            {msg.ok && <IconCheck width={16} height={16} />} {msg.text}
          </p>
        )}
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
