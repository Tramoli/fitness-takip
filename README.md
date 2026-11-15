# Fitness Takip

Günlük antrenman kaydı ve ilerleme takibi için web uygulaması (Vite + React + TypeScript).

- **Kaydet**: tarih seç, hareket ekle, her set için kg × tekrar gir. Değişiklikler otomatik kaydedilir.
- **Geçmiş**: tüm antrenmanlar, düzenle/sil, JSON yedek al / geri yükle.
- **İlerleme**: hareket bazlı max kg ve tahmini 1RM grafiği, kişisel rekorlar, haftalık hacim.
- **Takvim**: antrenman yapılan günler; güne dokununca o günün kaydı açılır.

Veriler tarayıcının `localStorage`'ında tutulur (sunucu yok).

```bash
npm install
npm run dev      # http://localhost:5173 (aynı ağdaki telefondan da açılabilir)
npm test
npm run build
```
