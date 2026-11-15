import { useEffect, useState } from 'react';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

/** undefined: henüz bilinmiyor, null: giriş yok. */
export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(() => auth.currentUser ?? undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const signInEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const signUpEmail = (email: string, password: string) => createUserWithEmailAndPassword(auth, email.trim(), password);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const logOut = () => signOut(auth);

/** Google ile girilmiş hesaba şifre ekler: böylece aynı hesaba e-posta/şifreyle de girilebilir. */
export function addPassword(user: User, password: string) {
  return linkWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password));
}

export const hasPassword = (user: User) => user.providerData.some((p) => p.providerId === 'password');

/** Firebase hata kodlarını anlaşılır Türkçe mesaja çevirir. */
export function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'E-posta adresi geçersiz.';
    case 'auth/missing-password':
      return 'Şifre gir.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-postayla zaten bir hesap var. "Giriş yap" sekmesini kullan; hesap Google ile açıldıysa önce Google ile girip Hesap bölümünden şifre ekle.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta ya da şifre hatalı. Hesabını Google ile açtıysan Google ile giriş yap.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    case 'auth/popup-blocked':
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google giriş penceresi açılamadı. Bu cihazda e-posta ve şifreyle giriş yapabilirsin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok. Giriş için bağlantı gerekiyor.';
    case 'auth/credential-already-in-use':
    case 'auth/provider-already-linked':
      return 'Bu hesaba zaten şifre eklenmiş.';
    case 'auth/requires-recent-login':
      return 'Güvenlik için çıkış yapıp yeniden giriş yaptıktan sonra tekrar dene.';
    default:
      return 'Bir sorun oluştu. Tekrar dene.';
  }
}
