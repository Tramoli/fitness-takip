import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

/** Bir sayfa hata verirse tüm uygulama yerine yalnızca o sayfayı kapatır. */
export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="page">
        <h1 className="page-title">Bu sayfa açılamadı</h1>
        <div className="empty">
          <p>Kayıtların güvende; sadece bu sayfa gösterilirken bir hata oluştu.</p>
          <p className="muted small">{this.state.error.message}</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            this.setState({ error: null });
            this.props.onReset();
          }}
        >
          Kaydet sayfasına dön
        </button>
      </section>
    );
  }
}
